import { computed } from 'vue'
import { usePlantRecordsStore } from '@/stores/plantRecords'
import type { RiskIssue } from '@/types'

export function useAutoCheck() {
  const store = usePlantRecordsStore()

  const issues = computed(() => store.riskIssues)

  const highRiskIssues = computed(() => issues.value.filter((i) => i.level >= 3))
  const mediumRiskIssues = computed(() => issues.value.filter((i) => i.level === 2))
  const lowRiskIssues = computed(() => issues.value.filter((i) => i.level === 1))

  const getRecordIssues = (recordId: string): RiskIssue[] => {
    return issues.value.filter((i) => i.recordIds.includes(recordId))
  }

  const getRecordRiskLevel = (recordId: string): number => {
    const recordIssues = getRecordIssues(recordId)
    if (recordIssues.length === 0) return 0
    return Math.max(...recordIssues.map((i) => i.level))
  }

  return {
    issues,
    highRiskIssues,
    mediumRiskIssues,
    lowRiskIssues,
    getRecordIssues,
    getRecordRiskLevel,
  }
}
