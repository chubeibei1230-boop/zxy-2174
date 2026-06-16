export type LightType = '全日照' | '半日照' | '耐阴' | '喜散射光'

export type ProofreadStatus = '待补充' | '待校对' | '可打印' | '暂不展示'

export type RiskLevel = 0 | 1 | 2 | 3

export type RiskType = 'name_duplicate' | 'order_gap' | 'watering_missing' | 'person_overloaded'

export interface Activity {
  id: string
  name: string
  date: string
  location: string
  participantCount: number
  createdAt: number
  updatedAt: number
}

export interface PlantRecord {
  id: string
  activityId: string
  plantName: string
  latinName: string
  lightType: LightType | ''
  wateringReminder: string
  displayOrder: number
  responsiblePerson: string
  proofreadNote: string
  status: ProofreadStatus
  riskLevel: RiskLevel
  createdAt: number
  updatedAt: number
}

export interface RiskIssue {
  type: RiskType
  recordIds: string[]
  message: string
  level: RiskLevel
}

export interface FilterState {
  lightType: LightType | ''
  responsiblePerson: string
  status: ProofreadStatus | ''
  riskLevel: RiskLevel | ''
  search: string
}

export interface PrintBatchSummary {
  totalRecords: number
  printableCount: number
  pendingCount: number
  toBeSupplementedCount: number
  notDisplayedCount: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
}

export interface PrintBatch {
  id: string
  activityId: string
  activitySnapshot: Activity
  recordsSnapshot: PlantRecord[]
  issuesSnapshot: RiskIssue[]
  summary: PrintBatchSummary
  printableRecords: PlantRecord[]
  notDisplayedRecords: PlantRecord[]
  deliveryNote: string
  confirmedAt: number
  confirmedBy: string
  version: string
}

export const LIGHT_TYPES: LightType[] = ['全日照', '半日照', '耐阴', '喜散射光']

export const PROOFREAD_STATUSES: ProofreadStatus[] = ['待补充', '待校对', '可打印', '暂不展示']

export const RISK_LABELS: Record<RiskLevel, string> = {
  0: '无风险',
  1: '低风险',
  2: '中风险',
  3: '高风险',
}

export function createEmptyRecord(activityId: string, displayOrder: number): PlantRecord {
  return {
    id: crypto.randomUUID(),
    activityId,
    plantName: '',
    latinName: '',
    lightType: '',
    wateringReminder: '',
    displayOrder,
    responsiblePerson: '',
    proofreadNote: '',
    status: '待补充',
    riskLevel: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createDefaultActivity(): Activity {
  return {
    id: crypto.randomUUID(),
    name: '',
    date: '',
    location: '',
    participantCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
