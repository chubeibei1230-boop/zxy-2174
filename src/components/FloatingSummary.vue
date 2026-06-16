<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlantRecordsStore } from '@/stores/plantRecords'
import { useActivityStore } from '@/stores/activity'
import { usePrintBatchStore } from '@/stores/printBatch'
import { useAutoCheck } from '@/composables/useAutoCheck'
import { useExport } from '@/composables/useExport'
import { PROOFREAD_STATUSES } from '@/types'
import type { ProofreadStatus } from '@/types'
import {
  FileDown,
  Printer,
  ClipboardList,
  CheckSquare,
  Square,
  AlertTriangle,
  AlertCircle,
  Info,
  Leaf,
  Package,
  FileCheck,
  Users,
  Handshake,
  FileText,
  ChevronRight,
  CheckCircle,
  Clock,
} from 'lucide-vue-next'

const recordStore = usePlantRecordsStore()
const activityStore = useActivityStore()
const printBatchStore = usePrintBatchStore()
const router = useRouter()
const { issues, highRiskIssues, mediumRiskIssues, lowRiskIssues } = useAutoCheck()
const { exportCSV, exportPrintHTML, exportChecklist } = useExport()

const printableNotHandedOver = computed(() => {
  return recordStore.records.filter((r) => r.status === '可打印' && !r.isHandedOver).length
})

const overloadedPersons = computed(() => {
  return recordStore.personTaskSummaries.filter((p) => p.notHandedOverCount > 0)
})

const atRiskPersons = computed(() => {
  return recordStore.personTaskSummaries.filter((p) => p.riskCount > 0)
})

function handleCreatePrintBatch() {
  printBatchStore.createPreviewBatch(
    activityStore.activity,
    recordStore.records,
    issues.value,
  )
}

function handleViewHistory() {
  printBatchStore.openHistoryListView()
}

function handleViewDeliveryConfirmation() {
  printBatchStore.createAndOpenDeliverySummary(
    activityStore.activity,
    recordStore.records,
    issues.value,
  )
}

const hasSelection = computed(() => recordStore.selectedIds.size > 0)

async function batchMark(status: ProofreadStatus) {
  if (!hasSelection.value) return
  await recordStore.batchUpdateStatus(Array.from(recordStore.selectedIds), status)
}

function handleExportCSV() {
  exportCSV(recordStore.records, activityStore.activity)
}

function handleExportPrint() {
  exportPrintHTML(recordStore.records, activityStore.activity)
}

function handleExportChecklist() {
  exportChecklist(recordStore.records, activityStore.activity, issues.value)
}

function goToResponsibleDashboard() {
  router.push({ name: 'responsible-dashboard' })
}
</script>

<template>
  <div class="floating-summary">
    <div class="summary-header">
      <Leaf :size="18" class="text-emerald-600" />
      <h3 class="summary-title">校对摘要</h3>
    </div>

    <div class="summary-stats">
      <div class="stat-big">
        <span class="stat-number">{{ recordStore.records.length }}</span>
        <span class="stat-label">总记录</span>
      </div>
    </div>

    <div class="status-grid">
      <div v-for="s in PROOFREAD_STATUSES" :key="s" class="status-row">
        <span class="status-dot" :class="'dot-' + s"></span>
        <span class="status-name">{{ s }}</span>
        <span class="status-count">{{ recordStore.statusCounts[s] }}</span>
      </div>
    </div>

    <div class="risk-section" v-if="issues.length > 0">
      <div class="risk-header">
        <AlertTriangle :size="14" class="text-amber-500" />
        <span>风险检查 ({{ issues.length }})</span>
      </div>
      <div class="risk-list">
        <div v-if="highRiskIssues.length > 0" class="risk-group">
          <span class="risk-badge risk-high">高风险 {{ highRiskIssues.length }}</span>
        </div>
        <div v-if="mediumRiskIssues.length > 0" class="risk-group">
          <span class="risk-badge risk-medium">中风险 {{ mediumRiskIssues.length }}</span>
        </div>
        <div v-if="lowRiskIssues.length > 0" class="risk-group">
          <span class="risk-badge risk-low">低风险 {{ lowRiskIssues.length }}</span>
        </div>
        <div class="risk-details">
          <div
            v-for="(issue, idx) in issues.slice(0, 5)"
            :key="idx"
            class="risk-item"
          >
            <AlertCircle v-if="issue.level >= 2" :size="12" class="shrink-0" :class="issue.level >= 3 ? 'text-red-500' : 'text-amber-500'" />
            <Info v-else :size="12" class="shrink-0 text-orange-400" />
            <span class="risk-msg">{{ issue.message }}</span>
          </div>
          <div v-if="issues.length > 5" class="more-risks">
            还有 {{ issues.length - 5 }} 项...
          </div>
        </div>
      </div>
    </div>

    <div class="handover-section">
      <div class="handover-header">
        <Handshake :size="14" class="text-emerald-500" />
        <span>责任人交付确认</span>
      </div>
      <div class="handover-stats">
        <div class="handover-stat-item">
          <span class="handover-stat-number">{{ recordStore.handoverSummary.handedOverCount }}</span>
          <span class="handover-stat-label">已交付</span>
        </div>
        <div class="handover-stat-divider">/</div>
        <div class="handover-stat-item">
          <span class="handover-stat-number text-stone-400">{{ recordStore.handoverSummary.totalCount }}</span>
          <span class="handover-stat-label">总计</span>
        </div>
      </div>
      <div class="handover-progress-mini">
        <div
          class="handover-progress-fill-mini"
          :style="{ width: recordStore.handoverSummary.progress + '%' }"
        ></div>
      </div>
      <div class="handover-progress-text">
        <span class="progress-percent">{{ recordStore.handoverSummary.progress.toFixed(1) }}%</span>
        <span class="progress-text-sep">·</span>
        <span :class="printableNotHandedOver > 0 ? 'text-amber-600' : 'text-emerald-600'">
          {{ printableNotHandedOver > 0 ? `${printableNotHandedOver} 条可打印待交付` : '全部已交付' }}
        </span>
      </div>

      <div v-if="overloadedPersons.length > 0" class="pending-persons-section">
        <div class="pending-persons-header">
          <Clock :size="12" class="text-amber-500" />
          <span>待交付责任人 ({{ overloadedPersons.length }})</span>
        </div>
        <div class="pending-persons-list">
          <div
            v-for="person in overloadedPersons.slice(0, 3)"
            :key="person.personName"
            class="pending-person-item"
          >
            <span class="pending-person-name">{{ person.personName }}</span>
            <span class="pending-person-count">{{ person.notHandedOverCount }} 条</span>
          </div>
          <div v-if="overloadedPersons.length > 3" class="pending-person-more">
            还有 {{ overloadedPersons.length - 3 }} 人...
          </div>
        </div>
      </div>

      <div v-if="atRiskPersons.length > 0" class="risk-persons-section">
        <div class="risk-persons-header">
          <AlertTriangle :size="12" class="text-amber-500" />
          <span>风险责任人 ({{ atRiskPersons.length }})</span>
        </div>
        <div class="risk-persons-list">
          <div
            v-for="person in atRiskPersons.slice(0, 3)"
            :key="person.personName"
            class="risk-person-item"
          >
            <span class="risk-person-name">{{ person.personName }}</span>
            <span class="risk-person-count">{{ person.riskCount }} 项</span>
          </div>
        </div>
      </div>

      <div class="handover-actions">
        <button class="btn-go-dashboard" @click="goToResponsibleDashboard">
          <Users :size="14" />
          <span>责任人看板</span>
        </button>
        <button
          class="btn-delivery-summary"
          :class="{ 'all-delivered': printableNotHandedOver === 0 }"
          @click="handleViewDeliveryConfirmation"
        >
          <FileText :size="14" />
          <span>交付确认摘要</span>
          <ChevronRight :size="14" />
        </button>
      </div>
    </div>

    <div class="selection-section" v-if="hasSelection">
      <div class="selection-info">
        已选择 {{ recordStore.selectedIds.size }} 条
      </div>
      <div class="batch-buttons">
        <button
          v-for="s in PROOFREAD_STATUSES"
          :key="s"
          class="btn-batch"
          :class="'batch-' + s"
          @click="batchMark(s)"
        >
          {{ s }}
        </button>
      </div>
      <div class="selection-actions">
        <button class="btn-select-all" @click="recordStore.selectAll()">
          <CheckSquare :size="12" />
          全选
        </button>
        <button class="btn-select-clear" @click="recordStore.clearSelection()">
          <Square :size="12" />
          清空
        </button>
      </div>
    </div>

    <div class="select-all-section" v-else>
      <button class="btn-select-all" @click="recordStore.selectAll()">
        <CheckSquare :size="12" />
        全选当前列表
      </button>
    </div>

    <div class="print-batch-section">
      <h4 class="export-title">打印批次与交付</h4>
      <div class="export-buttons">
        <button class="btn-export btn-print-batch" @click="handleCreatePrintBatch">
          <Package :size="14" />
          <span>生成交付批次</span>
        </button>
        <button
          v-if="printBatchStore.batches.length > 0"
          class="btn-export"
          @click="handleViewHistory"
        >
          <FileCheck :size="14" />
          <span>查看历史交付</span>
        </button>
      </div>
      <div v-if="printBatchStore.batches.length > 0" class="batch-history-info">
        <span class="history-count">已确认 {{ printBatchStore.batches.length }} 个批次</span>
      </div>
    </div>

    <div class="export-section">
      <h4 class="export-title">导出</h4>
      <div class="export-buttons">
        <button class="btn-export" @click="handleExportCSV">
          <FileDown :size="14" />
          <span>CSV</span>
        </button>
        <button class="btn-export" @click="handleExportPrint">
          <Printer :size="14" />
          <span>打印版</span>
        </button>
        <button class="btn-export btn-checklist" @click="handleExportChecklist">
          <ClipboardList :size="14" />
          <span>校对清单</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.floating-summary {
  @apply bg-white rounded-2xl border border-stone-200 shadow-sm p-5
    space-y-4 w-full md:w-auto md:sticky md:top-4;
  min-width: 240px;
  max-width: 100%;
}

@media (min-width: 768px) {
  .floating-summary {
    max-width: 280px;
  }
}

.summary-header {
  @apply flex items-center gap-2;
}

.summary-title {
  @apply text-base font-bold text-stone-800;
  font-family: 'Playfair Display', serif;
}

.summary-stats {
  @apply flex justify-center py-2;
}

.stat-big {
  @apply flex flex-col items-center;
}

.stat-number {
  @apply text-3xl font-bold text-emerald-700;
  font-family: 'Playfair Display', serif;
}

.stat-label {
  @apply text-xs text-stone-400 mt-0.5;
}

.status-grid {
  @apply space-y-2;
}

.status-row {
  @apply flex items-center gap-2;
}

.status-dot {
  @apply w-2.5 h-2.5 rounded-full shrink-0;
}

.dot-待补充 {
  @apply bg-stone-300;
}

.dot-待校对 {
  @apply bg-amber-400;
}

.dot-可打印 {
  @apply bg-emerald-500;
}

.dot-暂不展示 {
  @apply bg-red-400;
}

.status-name {
  @apply text-sm text-stone-600 flex-1;
}

.status-count {
  @apply text-sm font-bold text-stone-800;
}

.risk-section {
  @apply pt-3 border-t border-stone-100;
}

.risk-header {
  @apply flex items-center gap-1.5 text-sm font-medium text-stone-700 mb-2;
}

.risk-group {
  @apply flex gap-1.5 mb-1;
}

.risk-badge {
  @apply text-xs px-2 py-0.5 rounded-full font-medium;
}

.risk-high {
  @apply bg-red-100 text-red-600;
}

.risk-medium {
  @apply bg-amber-100 text-amber-600;
}

.risk-low {
  @apply bg-orange-100 text-orange-500;
}

.risk-details {
  @apply space-y-1 mt-2;
}

.risk-item {
  @apply flex items-start gap-1.5 text-xs text-stone-500;
}

.risk-msg {
  @apply leading-relaxed;
}

.more-risks {
  @apply text-xs text-stone-400 italic pl-4;
}

.handover-section {
  @apply pt-3 border-t border-stone-100 space-y-2;
}

.handover-header {
  @apply flex items-center gap-1.5 text-sm font-medium text-stone-700;
}

.handover-stats {
  @apply flex items-center justify-center gap-2 py-1;
}

.handover-stat-item {
  @apply flex flex-col items-center;
}

.handover-stat-number {
  @apply text-lg font-bold text-emerald-600;
  font-family: 'Playfair Display', serif;
}

.handover-stat-label {
  @apply text-xs text-stone-400;
}

.handover-stat-divider {
  @apply text-stone-300 text-sm;
}

.handover-progress-mini {
  @apply h-1.5 bg-stone-100 rounded-full overflow-hidden;
}

.handover-progress-fill-mini {
  @apply h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full
    transition-all duration-300;
}

.handover-progress-text {
  @apply flex items-center justify-center gap-1 mt-2 text-xs;
}

.progress-percent {
  @apply font-bold text-emerald-600;
}

.progress-text-sep {
  @apply text-stone-300;
}

.pending-persons-section,
.risk-persons-section {
  @apply mt-3 pt-3 border-t border-stone-100 space-y-2;
}

.pending-persons-header,
.risk-persons-header {
  @apply flex items-center gap-1.5 text-xs font-medium text-stone-600;
}

.pending-persons-list,
.risk-persons-list {
  @apply space-y-1;
}

.pending-person-item,
.risk-person-item {
  @apply flex items-center justify-between text-xs px-2 py-1.5 rounded-md;
}

.pending-person-item {
  @apply bg-amber-50 text-amber-700;
}

.risk-person-item {
  @apply bg-red-50 text-red-600;
}

.pending-person-name,
.risk-person-name {
  @apply truncate font-medium;
}

.pending-person-count,
.risk-person-count {
  @apply font-bold shrink-0 ml-2;
}

.pending-person-more {
  @apply text-xs text-stone-400 text-center py-1;
}

.handover-actions {
  @apply mt-3 pt-3 border-t border-stone-100 space-y-2;
}

.btn-go-dashboard {
  @apply w-full inline-flex items-center justify-center gap-1.5 px-3 py-2
    rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50
    hover:bg-emerald-100 transition-all cursor-pointer border border-emerald-200;
}

.btn-delivery-summary {
  @apply w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5
    rounded-lg text-xs font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500
    hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer
    border border-amber-400 shadow-sm;
}

.btn-delivery-summary.all-delivered {
  @apply from-emerald-500 to-teal-500 border-emerald-400;
}

.selection-section {
  @apply pt-3 border-t border-stone-100;
}

.selection-info {
  @apply text-xs text-stone-500 mb-2;
}

.batch-buttons {
  @apply flex flex-wrap gap-1.5 mb-2;
}

.btn-batch {
  @apply text-xs px-2 py-1 rounded-md cursor-pointer border-0 transition-all;
}

.batch-待补充 {
  @apply bg-stone-100 text-stone-600 hover:bg-stone-200;
}

.batch-待校对 {
  @apply bg-amber-50 text-amber-600 hover:bg-amber-100;
}

.batch-可打印 {
  @apply bg-emerald-50 text-emerald-600 hover:bg-emerald-100;
}

.batch-暂不展示 {
  @apply bg-red-50 text-red-500 hover:bg-red-100;
}

.selection-actions {
  @apply flex gap-3;
}

.btn-select-all,
.btn-select-clear {
  @apply inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700
    cursor-pointer border-0 bg-transparent;
}

.select-all-section {
  @apply pt-3 border-t border-stone-100;
}

.btn-select-all {
  @apply inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700
    cursor-pointer border-0 bg-transparent;
}

.export-section {
  @apply pt-3 border-t border-stone-100;
}

.export-title {
  @apply text-xs font-medium text-stone-500 mb-2;
}

.export-buttons {
  @apply flex flex-col gap-1.5;
}

.btn-export {
  @apply inline-flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm
    bg-stone-50 hover:bg-stone-100 text-stone-600 transition-all
    cursor-pointer border border-stone-200;
}

.btn-checklist {
  @apply bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100;
}

.print-batch-section {
  @apply pt-3 border-t border-stone-100;
}

.btn-print-batch {
  @apply bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400
    hover:from-emerald-600 hover:to-teal-600 shadow-sm;
}

.batch-history-info {
  @apply mt-2 text-xs text-stone-400 text-center;
}

.history-count {
  @apply px-2 py-0.5 bg-stone-100 rounded-full;
}
</style>
