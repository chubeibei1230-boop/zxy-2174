import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlantRecord, ProofreadStatus, RiskIssue, FilterState } from '@/types'
import { createEmptyRecord, PROOFREAD_STATUSES } from '@/types'
import {
  dbGetRecordsByActivity,
  dbSaveRecord,
  dbSaveRecords,
  dbDeleteRecord,
} from '@/utils/idb'

export const usePlantRecordsStore = defineStore('plantRecords', () => {
  const records = ref<PlantRecord[]>([])
  const currentActivityId = ref('')
  const selectedIds = ref<Set<string>>(new Set())
  const filter = ref<FilterState>({
    lightType: '',
    responsiblePerson: '',
    status: '',
    riskLevel: '',
    search: '',
  })

  const filteredRecords = computed(() => {
    return records.value
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((r) => {
        if (filter.value.lightType && r.lightType !== filter.value.lightType) return false
        if (filter.value.responsiblePerson && r.responsiblePerson !== filter.value.responsiblePerson)
          return false
        if (filter.value.status && r.status !== filter.value.status) return false
        if (filter.value.riskLevel !== '' && r.riskLevel !== filter.value.riskLevel) return false
        if (filter.value.search) {
          const q = filter.value.search.toLowerCase()
          return (
            r.plantName.toLowerCase().includes(q) ||
            r.latinName.toLowerCase().includes(q) ||
            r.responsiblePerson.toLowerCase().includes(q)
          )
        }
        return true
      })
  })

  const responsiblePersons = computed(() => {
    const persons = new Set<string>()
    records.value.forEach((r) => {
      if (r.responsiblePerson) persons.add(r.responsiblePerson)
    })
    return Array.from(persons).sort()
  })

  const statusCounts = computed(() => {
    const counts: Record<ProofreadStatus, number> = { '待补充': 0, '待校对': 0, '可打印': 0, '暂不展示': 0 }
    records.value.forEach((r) => { counts[r.status]++ })
    return counts
  })

  const riskIssues = computed((): RiskIssue[] => {
    const issues: RiskIssue[] = []

    const nameMap = new Map<string, string[]>()
    records.value.forEach((r) => {
      if (!r.plantName) return
      const ids = nameMap.get(r.plantName) || []
      ids.push(r.id)
      nameMap.set(r.plantName, ids)
    })
    for (const [name, ids] of nameMap) {
      if (ids.length > 1) {
        issues.push({
          type: 'name_duplicate',
          recordIds: ids,
          message: `植物名"${name}"重复出现 ${ids.length} 次`,
          level: 3,
        })
      }
    }

    const sorted = records.value.slice().sort((a, b) => a.displayOrder - b.displayOrder)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].displayOrder - sorted[i - 1].displayOrder > 1) {
        const gapStart = sorted[i - 1].displayOrder
        const gapEnd = sorted[i].displayOrder
        issues.push({
          type: 'order_gap',
          recordIds: [sorted[i - 1].id, sorted[i].id],
          message: `序号 ${gapStart} 与 ${gapEnd} 之间存在断档`,
          level: 2,
        })
      }
    }

    records.value.forEach((r) => {
      if (!r.wateringReminder.trim()) {
        issues.push({
          type: 'watering_missing',
          recordIds: [r.id],
          message: `"${r.plantName || '未命名'}" 缺少浇水提醒`,
          level: 2,
        })
      }
    })

    const personCount = new Map<string, number>()
    records.value.forEach((r) => {
      if (!r.responsiblePerson) return
      personCount.set(r.responsiblePerson, (personCount.get(r.responsiblePerson) || 0) + 1)
    })
    const THRESHOLD = 5
    for (const [person, count] of personCount) {
      if (count > THRESHOLD) {
        issues.push({
          type: 'person_overloaded',
          recordIds: records.value.filter((r) => r.responsiblePerson === person).map((r) => r.id),
          message: `"${person}" 负责了 ${count} 条记录（超过 ${THRESHOLD} 条阈值）`,
          level: 1,
        })
      }
    }

    return issues
  })

  const totalRiskCount = computed(() => riskIssues.value.length)

  async function loadRecords(activityId: string) {
    currentActivityId.value = activityId
    records.value = await dbGetRecordsByActivity(activityId)
  }

  async function addRecord() {
    if (!currentActivityId.value) return null
    const maxOrder = records.value.reduce((max, r) => Math.max(max, r.displayOrder), 0)
    const record = createEmptyRecord(currentActivityId.value, maxOrder + 1)
    records.value.push(record)
    await dbSaveRecord(record)
    return record
  }

  async function copyFromRecord(sourceId: string, beforeId?: string) {
    const sourceIdx = records.value.findIndex((r) => r.id === sourceId)
    if (sourceIdx < 0) return null

    const source = records.value[sourceIdx]
    const newRecord: PlantRecord = {
      ...source,
      id: crypto.randomUUID(),
      plantName: '',
      latinName: '',
      proofreadNote: '',
      status: '待补充',
      riskLevel: 0,
      activityId: currentActivityId.value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    let insertIndex: number
    if (beforeId) {
      const beforeIdx = records.value.findIndex((r) => r.id === beforeId)
      insertIndex = beforeIdx >= 0 ? beforeIdx : records.value.length
      newRecord.displayOrder = records.value[insertIndex]?.displayOrder || (records.value.length + 1)
    } else {
      insertIndex = sourceIdx + 1
      newRecord.displayOrder = source.displayOrder + 1
    }

    for (let i = insertIndex; i < records.value.length; i++) {
      records.value[i].displayOrder++
    }

    records.value.splice(insertIndex, 0, newRecord)
    await dbSaveRecords(records.value)
    return newRecord
  }

  async function updateRecord(id: string, data: Partial<PlantRecord>) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx < 0) return
    records.value[idx] = { ...records.value[idx], ...data, updatedAt: Date.now() }
    await dbSaveRecord(records.value[idx])
  }

  async function deleteRecord(id: string) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx < 0) return
    records.value.splice(idx, 1)
    for (let i = 0; i < records.value.length; i++) {
      records.value[i].displayOrder = i + 1
    }
    await dbDeleteRecord(id)
    await dbSaveRecords(records.value)
    selectedIds.value.delete(id)
  }

  async function reorderFiltered(filteredList: PlantRecord[]) {
    const filteredIds = filteredList.map((r) => r.id)
    const filteredSet = new Set(filteredIds)

    const nonFiltered = records.value
      .filter((r) => !filteredSet.has(r.id))
      .sort((a, b) => a.displayOrder - b.displayOrder)

    const result: PlantRecord[] = []

    for (const r of filteredList) {
      const record = records.value.find((x) => x.id === r.id)
      if (record) {
        result.push(record)
      }
    }

    for (const r of nonFiltered) {
      result.push(r)
    }

    result.forEach((r, i) => {
      r.displayOrder = i + 1
    })

    records.value = result.sort((a, b) => a.displayOrder - b.displayOrder)
    await dbSaveRecords(records.value)
  }

  async function batchUpdateStatus(ids: string[], status: ProofreadStatus) {
    for (const id of ids) {
      const idx = records.value.findIndex((r) => r.id === id)
      if (idx >= 0) {
        records.value[idx].status = status
        records.value[idx].updatedAt = Date.now()
      }
    }
    await dbSaveRecords(records.value)
    selectedIds.value.clear()
  }

  function toggleSelect(id: string) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
    selectedIds.value = new Set(selectedIds.value)
  }

  function selectAll() {
    const ids = filteredRecords.value.map((r) => r.id)
    selectedIds.value = new Set(ids)
  }

  function clearSelection() {
    selectedIds.value = new Set()
  }

  function setFilter(key: keyof FilterState, value: string | number) {
    ;(filter.value as any)[key] = value
  }

  function resetFilter() {
    filter.value = {
      lightType: '',
      responsiblePerson: '',
      status: '',
      riskLevel: '',
      search: '',
    }
  }

  return {
    records,
    currentActivityId,
    selectedIds,
    filter,
    filteredRecords,
    responsiblePersons,
    statusCounts,
    riskIssues,
    totalRiskCount,
    loadRecords,
    addRecord,
    copyFromRecord,
    updateRecord,
    deleteRecord,
    reorderFiltered,
    batchUpdateStatus,
    toggleSelect,
    selectAll,
    clearSelection,
    setFilter,
    resetFilter,
  }
})
