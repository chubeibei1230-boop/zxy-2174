import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlantRecord, Activity, RiskIssue, PrintBatch, PrintBatchSummary, DeliveryConfirmationSummary, PersonDeliverySummary, DeliveryConfirmationItem } from '@/types'
import { dbSavePrintBatch, dbGetPrintBatchesByActivity, dbGetLatestPrintBatch } from '@/utils/idb'

export const usePrintBatchStore = defineStore('printBatch', () => {
  const batches = ref<PrintBatch[]>([])
  const currentBatch = ref<PrintBatch | null>(null)
  const showConfirmDialog = ref(false)
  const showSummaryView = ref(false)
  const showHistoryList = ref(false)
  const showDeliveryConfirmationView = ref(false)
  const draftDeliveryNote = ref('')
  const batchGeneratedAt = ref(0)
  const isEditingConfirmed = ref(false)
  const currentDeliverySummary = ref<DeliveryConfirmationSummary | null>(null)

  function generateBatchSummary(records: PlantRecord[], issues: RiskIssue[]): PrintBatchSummary {
    const totalRecords = records.length
    const printableCount = records.filter((r) => r.status === '可打印').length
    const pendingCount = records.filter((r) => r.status === '待校对').length
    const toBeSupplementedCount = records.filter((r) => r.status === '待补充').length
    const notDisplayedCount = records.filter((r) => r.status === '暂不展示').length
    const highRiskCount = issues.filter((i) => i.level >= 3).length
    const mediumRiskCount = issues.filter((i) => i.level === 2).length
    const lowRiskCount = issues.filter((i) => i.level === 1).length

    return {
      totalRecords,
      printableCount,
      pendingCount,
      toBeSupplementedCount,
      notDisplayedCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
    }
  }

  function generateVersion(): string {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '')
    return `v${dateStr}-${timeStr}`
  }

  function getUnhandedReason(record: PlantRecord): string {
    if (record.status !== '可打印') {
      return `记录状态为"${record.status}"，尚未完成校对`
    }
    if (!record.maintenanceInfo.trim()) {
      return '缺少养护说明'
    }
    if (!record.handoverNote.trim()) {
      return '缺少交接备注'
    }
    return '责任人尚未确认交接'
  }

  function generatePrintReminders(records: PlantRecord[], issues: RiskIssue[]): string[] {
    const reminders: string[] = []

    const highRiskIssues = issues.filter((i) => i.level >= 3)
    if (highRiskIssues.length > 0) {
      reminders.push(`存在 ${highRiskIssues.length} 项高风险问题，打印前请务必确认`)
    }

    const mediumRiskIssues = issues.filter((i) => i.level === 2)
    if (mediumRiskIssues.length > 0) {
      reminders.push(`存在 ${mediumRiskIssues.length} 项中风险问题，建议打印前复核`)
    }

    const missingWatering = records.filter((r) => r.status === '可打印' && !r.wateringReminder.trim())
    if (missingWatering.length > 0) {
      reminders.push(`${missingWatering.length} 条可打印记录缺少浇水提醒`)
    }

    const missingLight = records.filter((r) => r.status === '可打印' && !r.lightType)
    if (missingLight.length > 0) {
      reminders.push(`${missingLight.length} 条可打印记录缺少光照需求设置`)
    }

    const notDisplayedCount = records.filter((r) => r.status === '暂不展示').length
    if (notDisplayedCount > 0) {
      reminders.push(`${notDisplayedCount} 条记录标记为"暂不展示"，不会被打印`)
    }

    const pendingCount = records.filter((r) => r.status === '待校对' || r.status === '待补充').length
    if (pendingCount > 0) {
      reminders.push(`${pendingCount} 条记录尚未完成校对，不会被打印`)
    }

    if (reminders.length === 0) {
      reminders.push('所有检查项已通过，可放心打印')
    }

    return reminders
  }

  function generateDeliveryConfirmationSummary(
    activity: Activity,
    records: PlantRecord[],
    issues: RiskIssue[],
    generatedBy: string = '校对员'
  ): DeliveryConfirmationSummary {
    const printableRecords = records.filter((r) => r.status === '可打印')
    const personMap = new Map<string, DeliveryConfirmationItem[]>()

    printableRecords.forEach((record) => {
      const personName = record.responsiblePerson || '未分配'
      if (!personMap.has(personName)) {
        personMap.set(personName, [])
      }
      const item: DeliveryConfirmationItem = {
        recordId: record.id,
        plantName: record.plantName || '未命名',
        displayOrder: record.displayOrder,
        responsiblePerson: personName,
        status: record.status,
        maintenanceInfo: record.maintenanceInfo,
        handoverNote: record.handoverNote,
        isHandedOver: record.isHandedOver,
        handedOverAt: record.handedOverAt,
      }
      if (!record.isHandedOver) {
        item.unhandedReason = getUnhandedReason(record)
      }
      personMap.get(personName)!.push(item)
    })

    const personSummaries: PersonDeliverySummary[] = []
    let totalHandedOver = 0
    let totalNotHandedOver = 0

    personMap.forEach((items, personName) => {
      const printableCount = items.length
      const handedOverCount = items.filter((i) => i.isHandedOver).length
      const notHandedOverCount = printableCount - handedOverCount

      totalHandedOver += handedOverCount
      totalNotHandedOver += notHandedOverCount

      personSummaries.push({
        personName,
        totalCount: records.filter((r) => r.responsiblePerson === personName).length,
        printableCount,
        handedOverCount,
        notHandedOverCount,
        completionRate: printableCount > 0 ? (handedOverCount / printableCount) * 100 : 0,
        items,
      })
    })

    personSummaries.sort((a, b) => b.printableCount - a.printableCount)

    const unhandedReasons: Array<{ recordId: string; plantName: string; personName: string; reason: string }> = []
    personSummaries.forEach((ps) => {
      ps.items.forEach((item) => {
        if (!item.isHandedOver && item.unhandedReason) {
          unhandedReasons.push({
            recordId: item.recordId,
            plantName: item.plantName,
            personName: ps.personName,
            reason: item.unhandedReason,
          })
        }
      })
    })

    const totalPrintable = printableRecords.length
    const allPrintableDelivered = totalPrintable > 0 && totalNotHandedOver === 0

    return {
      generatedAt: Date.now(),
      generatedBy,
      activityInfo: { ...activity },
      personSummaries,
      overallCompletionRate: totalPrintable > 0 ? (totalHandedOver / totalPrintable) * 100 : 0,
      totalPrintableCount: totalPrintable,
      totalHandedOverCount: totalHandedOver,
      totalNotHandedOverCount: totalNotHandedOver,
      unhandedReasons,
      printReminders: generatePrintReminders(records, issues),
      allPrintableDelivered,
    }
  }

  const previewBatch = computed(() => {
    if (!currentBatch.value) return null
    return currentBatch.value
  })

  const hasUnconfirmedRisks = computed(() => {
    if (!currentBatch.value) return false
    return currentBatch.value.summary.highRiskCount > 0 || currentBatch.value.summary.mediumRiskCount > 0
  })

  const hasIncompleteRecords = computed(() => {
    if (!currentBatch.value) return false
    return currentBatch.value.summary.pendingCount > 0 || currentBatch.value.summary.toBeSupplementedCount > 0
  })

  const allPrintableRecordsDelivered = computed(() => {
    if (!currentBatch.value) return false
    const printableRecords = currentBatch.value.recordsSnapshot.filter((r) => r.status === '可打印')
    return printableRecords.length > 0 && printableRecords.every((r) => r.isHandedOver)
  })

  function createPreviewBatch(activity: Activity, records: PlantRecord[], issues: RiskIssue[]) {
    const sortedRecords = records.slice().sort((a, b) => a.displayOrder - b.displayOrder)
    const printableRecords = sortedRecords.filter((r) => r.status === '可打印')
    const notDisplayedRecords = sortedRecords.filter((r) => r.status === '暂不展示')
    const now = Date.now()

    currentBatch.value = {
      id: crypto.randomUUID(),
      activityId: activity.id,
      activitySnapshot: { ...activity },
      recordsSnapshot: sortedRecords.map((r) => ({ ...r })),
      issuesSnapshot: issues.map((i) => ({ ...i })),
      summary: generateBatchSummary(sortedRecords, issues),
      printableRecords,
      notDisplayedRecords,
      deliveryNote: '',
      confirmedAt: 0,
      confirmedBy: '',
      version: generateVersion(),
    }
    draftDeliveryNote.value = ''
    batchGeneratedAt.value = now
    isEditingConfirmed.value = false
    showConfirmDialog.value = true
  }

  function openHistoryBatchForEdit(batch: PrintBatch) {
    currentBatch.value = { ...batch }
    draftDeliveryNote.value = batch.deliveryNote
    batchGeneratedAt.value = batch.confirmedAt
    isEditingConfirmed.value = true
    showSummaryView.value = false
    showConfirmDialog.value = true
  }

  function openHistoryListView() {
    showHistoryList.value = true
  }

  function closeHistoryListView() {
    showHistoryList.value = false
  }

  function viewBatchFromHistory(batch: PrintBatch) {
    currentBatch.value = batch
    showHistoryList.value = false
    showSummaryView.value = true
  }

  async function confirmBatch(confirmedBy: string = '负责人') {
    if (!currentBatch.value) return null

    const now = Date.now()
    const batchData = JSON.parse(JSON.stringify({
      ...currentBatch.value,
      deliveryNote: draftDeliveryNote.value,
      confirmedAt: now,
      confirmedBy,
      id: isEditingConfirmed.value ? crypto.randomUUID() : currentBatch.value.id,
      version: isEditingConfirmed.value ? generateVersion() : currentBatch.value.version,
    }))

    await dbSavePrintBatch(batchData)
    if (isEditingConfirmed.value) {
      batches.value.unshift(batchData)
    } else {
      batches.value.push(batchData)
    }
    currentBatch.value = batchData
    isEditingConfirmed.value = false
    showConfirmDialog.value = false
    showSummaryView.value = true

    return batchData
  }

  async function loadBatches(activityId: string) {
    batches.value = await dbGetPrintBatchesByActivity(activityId)
  }

  async function loadLatestBatch(activityId: string) {
    const latest = await dbGetLatestPrintBatch(activityId)
    if (latest) {
      currentBatch.value = latest
    }
    return latest
  }

  function openSummaryView(batch?: PrintBatch) {
    if (batch) {
      currentBatch.value = batch
    }
    if (currentBatch.value) {
      showSummaryView.value = true
    }
  }

  function closeSummaryView() {
    showSummaryView.value = false
  }

  function closeConfirmDialog() {
    showConfirmDialog.value = false
    currentBatch.value = null
    draftDeliveryNote.value = ''
  }

  function updateDeliveryNote(note: string) {
    draftDeliveryNote.value = note
  }

  function createAndOpenDeliverySummary(activity: Activity, records: PlantRecord[], issues: RiskIssue[]) {
    currentDeliverySummary.value = generateDeliveryConfirmationSummary(activity, records, issues)
    showDeliveryConfirmationView.value = true
  }

  function openDeliveryConfirmationView(summary?: DeliveryConfirmationSummary) {
    if (summary) {
      currentDeliverySummary.value = summary
    }
    showDeliveryConfirmationView.value = true
  }

  function closeDeliveryConfirmationView() {
    showDeliveryConfirmationView.value = false
  }

  async function confirmBatchWithDeliverySummary(confirmedBy: string = '负责人') {
    if (!currentBatch.value) return null

    const deliverySummary = generateDeliveryConfirmationSummary(
      currentBatch.value.activitySnapshot,
      currentBatch.value.recordsSnapshot,
      currentBatch.value.issuesSnapshot,
      confirmedBy
    )

    const now = Date.now()
    const batchData = JSON.parse(JSON.stringify({
      ...currentBatch.value,
      deliveryNote: draftDeliveryNote.value,
      confirmedAt: now,
      confirmedBy,
      deliveryConfirmationSummary: deliverySummary,
      id: isEditingConfirmed.value ? crypto.randomUUID() : currentBatch.value.id,
      version: isEditingConfirmed.value ? generateVersion() : currentBatch.value.version,
    }))

    await dbSavePrintBatch(batchData)
    if (isEditingConfirmed.value) {
      batches.value.unshift(batchData)
    } else {
      batches.value.push(batchData)
    }
    currentBatch.value = batchData
    currentDeliverySummary.value = deliverySummary
    isEditingConfirmed.value = false
    showConfirmDialog.value = false
    showSummaryView.value = true

    return batchData
  }

  return {
    batches,
    currentBatch,
    showConfirmDialog,
    showSummaryView,
    showHistoryList,
    showDeliveryConfirmationView,
    draftDeliveryNote,
    batchGeneratedAt,
    isEditingConfirmed,
    currentDeliverySummary,
    previewBatch,
    hasUnconfirmedRisks,
    hasIncompleteRecords,
    allPrintableRecordsDelivered,
    createPreviewBatch,
    openHistoryBatchForEdit,
    openHistoryListView,
    closeHistoryListView,
    viewBatchFromHistory,
    confirmBatch,
    confirmBatchWithDeliverySummary,
    loadBatches,
    loadLatestBatch,
    openSummaryView,
    closeSummaryView,
    closeConfirmDialog,
    updateDeliveryNote,
    generateDeliveryConfirmationSummary,
    createAndOpenDeliverySummary,
    openDeliveryConfirmationView,
    closeDeliveryConfirmationView,
  }
})
