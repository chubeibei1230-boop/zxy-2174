import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlantRecord, Activity, RiskIssue, PrintBatch, PrintBatchSummary } from '@/types'
import { dbSavePrintBatch, dbGetPrintBatchesByActivity, dbGetLatestPrintBatch } from '@/utils/idb'

export const usePrintBatchStore = defineStore('printBatch', () => {
  const batches = ref<PrintBatch[]>([])
  const currentBatch = ref<PrintBatch | null>(null)
  const showConfirmDialog = ref(false)
  const showSummaryView = ref(false)
  const showHistoryList = ref(false)
  const draftDeliveryNote = ref('')
  const batchGeneratedAt = ref(0)
  const isEditingConfirmed = ref(false)

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

  return {
    batches,
    currentBatch,
    showConfirmDialog,
    showSummaryView,
    showHistoryList,
    draftDeliveryNote,
    batchGeneratedAt,
    isEditingConfirmed,
    previewBatch,
    hasUnconfirmedRisks,
    hasIncompleteRecords,
    createPreviewBatch,
    openHistoryBatchForEdit,
    openHistoryListView,
    closeHistoryListView,
    viewBatchFromHistory,
    confirmBatch,
    loadBatches,
    loadLatestBatch,
    openSummaryView,
    closeSummaryView,
    closeConfirmDialog,
    updateDeliveryNote,
  }
})
