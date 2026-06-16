<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePrintBatchStore } from '@/stores/printBatch'
import { usePlantRecordsStore } from '@/stores/plantRecords'
import { PROOFREAD_STATUSES } from '@/types'
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Printer,
  EyeOff,
  FileText,
  Package,
  Calendar,
  MapPin,
  Users,
  Clock,
  User,
} from 'lucide-vue-next'

const printBatchStore = usePrintBatchStore()
const recordStore = usePlantRecordsStore()
const confirmedByName = ref('')
const showAllPrintable = ref(false)
const showAllNotDisplayed = ref(false)

const batch = computed(() => printBatchStore.previewBatch)

const highRiskIssues = computed(() => {
  if (!batch.value) return []
  return batch.value.issuesSnapshot.filter((i) => i.level >= 3)
})

const mediumRiskIssues = computed(() => {
  if (!batch.value) return []
  return batch.value.issuesSnapshot.filter((i) => i.level === 2)
})

const lowRiskIssues = computed(() => {
  if (!batch.value) return []
  return batch.value.issuesSnapshot.filter((i) => i.level === 1)
})

const incompleteRecords = computed(() => {
  if (!batch.value) return []
  return batch.value.recordsSnapshot.filter((r) => r.status === '待补充' || r.status === '待校对')
})

const visiblePrintableRecords = computed(() => {
  if (!batch.value) return []
  const records = batch.value.printableRecords
  return showAllPrintable.value ? records : records.slice(0, 10)
})

const visibleNotDisplayedRecords = computed(() => {
  if (!batch.value) return []
  const records = batch.value.notDisplayedRecords
  return showAllNotDisplayed.value ? records : records.slice(0, 5)
})

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRiskColor(level: number): string {
  if (level >= 3) return 'text-red-500'
  if (level === 2) return 'text-amber-500'
  if (level === 1) return 'text-orange-400'
  return 'text-emerald-500'
}

function getRiskBgColor(level: number): string {
  if (level >= 3) return 'bg-red-50'
  if (level === 2) return 'bg-amber-50'
  if (level === 1) return 'bg-orange-50'
  return 'bg-emerald-50'
}

async function handleConfirm() {
  await printBatchStore.confirmBatch(confirmedByName.value || '负责人')
}

function handleCancel() {
  printBatchStore.closeConfirmDialog()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="printBatchStore.showConfirmDialog && batch" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-container">
        <div class="dialog-header">
          <div class="header-left">
            <Package :size="20" class="text-emerald-600" />
            <h2 class="dialog-title">打印批次确认与交付包</h2>
            <span class="version-badge">{{ batch.version }}</span>
          </div>
          <button class="btn-close" @click="handleCancel">
            <X :size="18" />
          </button>
        </div>

        <div class="dialog-content">
          <div class="section activity-section">
            <h3 class="section-title">
              <Calendar :size="16" />
              活动信息
            </h3>
            <div class="activity-card">
              <div class="activity-name">{{ batch.activitySnapshot.name || '未命名活动' }}</div>
              <div class="activity-meta">
                <span v-if="batch.activitySnapshot.date" class="meta-item">
                  <Calendar :size="14" />
                  {{ batch.activitySnapshot.date }}
                </span>
                <span v-if="batch.activitySnapshot.location" class="meta-item">
                  <MapPin :size="14" />
                  {{ batch.activitySnapshot.location }}
                </span>
                <span v-if="batch.activitySnapshot.participantCount" class="meta-item">
                  <Users :size="14" />
                  {{ batch.activitySnapshot.participantCount }} 人参与
                </span>
                <span class="meta-item">
                  <Clock :size="14" />
                  生成时间：{{ formatDate(Date.now()) }}
                </span>
              </div>
            </div>
          </div>

          <div class="section summary-section">
            <h3 class="section-title">
              <FileText :size="16" />
              记录总览
            </h3>
            <div class="summary-grid">
              <div class="summary-card total">
                <span class="summary-number">{{ batch.summary.totalRecords }}</span>
                <span class="summary-label">总记录数</span>
              </div>
              <div class="summary-card printable">
                <span class="summary-number">{{ batch.summary.printableCount }}</span>
                <span class="summary-label">可打印</span>
              </div>
              <div class="summary-card pending">
                <span class="summary-number">{{ batch.summary.pendingCount }}</span>
                <span class="summary-label">待校对</span>
              </div>
              <div class="summary-card supplement">
                <span class="summary-number">{{ batch.summary.toBeSupplementedCount }}</span>
                <span class="summary-label">待补充</span>
              </div>
              <div class="summary-card not-displayed">
                <span class="summary-number">{{ batch.summary.notDisplayedCount }}</span>
                <span class="summary-label">暂不展示</span>
              </div>
              <div class="summary-card risk">
                <div class="risk-numbers">
                  <span class="risk-high" v-if="batch.summary.highRiskCount > 0">{{ batch.summary.highRiskCount }}高</span>
                  <span class="risk-medium" v-if="batch.summary.mediumRiskCount > 0">{{ batch.summary.mediumRiskCount }}中</span>
                  <span class="risk-low" v-if="batch.summary.lowRiskCount > 0">{{ batch.summary.lowRiskCount }}低</span>
                  <span class="risk-none" v-if="batch.summary.highRiskCount + batch.summary.mediumRiskCount + batch.summary.lowRiskCount === 0">无风险</span>
                </div>
                <span class="summary-label">风险问题</span>
              </div>
            </div>
          </div>

          <div v-if="batch.issuesSnapshot.length > 0" class="section alerts-section">
            <h3 class="section-title">
              <AlertTriangle :size="16" class="text-amber-500" />
              异常提醒
              <span class="alert-count">{{ batch.issuesSnapshot.length }}</span>
            </h3>
            <div class="alerts-list">
              <div v-if="highRiskIssues.length > 0" class="alert-group">
                <div class="alert-group-title high-risk">
                  <AlertCircle :size="14" />
                  高风险 ({{ highRiskIssues.length }})
                </div>
                <div
                  v-for="(issue, idx) in highRiskIssues"
                  :key="'high-' + idx"
                  class="alert-item"
                  :class="getRiskBgColor(issue.level)"
                >
                  <AlertCircle :size="14" :class="getRiskColor(issue.level)" />
                  <span>{{ issue.message }}</span>
                </div>
              </div>

              <div v-if="mediumRiskIssues.length > 0" class="alert-group">
                <div class="alert-group-title medium-risk">
                  <AlertCircle :size="14" />
                  中风险 ({{ mediumRiskIssues.length }})
                </div>
                <div
                  v-for="(issue, idx) in mediumRiskIssues"
                  :key="'medium-' + idx"
                  class="alert-item"
                  :class="getRiskBgColor(issue.level)"
                >
                  <AlertCircle :size="14" :class="getRiskColor(issue.level)" />
                  <span>{{ issue.message }}</span>
                </div>
              </div>

              <div v-if="lowRiskIssues.length > 0" class="alert-group">
                <div class="alert-group-title low-risk">
                  <Info :size="14" />
                  低风险 ({{ lowRiskIssues.length }})
                </div>
                <div
                  v-for="(issue, idx) in lowRiskIssues"
                  :key="'low-' + idx"
                  class="alert-item"
                  :class="getRiskBgColor(issue.level)"
                >
                  <Info :size="14" :class="getRiskColor(issue.level)" />
                  <span>{{ issue.message }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="incompleteRecords.length > 0" class="section incomplete-section">
            <h3 class="section-title">
              <AlertCircle :size="16" class="text-amber-500" />
              未完成记录（{{ incompleteRecords.length }}）
            </h3>
            <div class="incomplete-list">
              <div
                v-for="(record, idx) in incompleteRecords.slice(0, 5)"
                :key="idx"
                class="incomplete-item"
              >
                <span class="order">#{{ record.displayOrder }}</span>
                <span class="name">{{ record.plantName || '未命名' }}</span>
                <span class="status-tag" :class="'status-' + record.status">{{ record.status }}</span>
              </div>
              <div v-if="incompleteRecords.length > 5" class="more-items">
                还有 {{ incompleteRecords.length - 5 }} 条未完成记录...
              </div>
            </div>
          </div>

          <div class="section printable-section">
            <h3 class="section-title">
              <Printer :size="16" class="text-emerald-600" />
              可打印清单 ({{ batch.printableRecords.length }})
            </h3>
            <div class="records-table">
              <div class="table-header">
                <span class="col-order">序号</span>
                <span class="col-name">植物名</span>
                <span class="col-latin">拉丁名</span>
                <span class="col-light">光照</span>
                <span class="col-person">责任人</span>
              </div>
              <div class="table-body">
                <div
                  v-for="(record, idx) in visiblePrintableRecords"
                  :key="idx"
                  class="table-row"
                >
                  <span class="col-order">{{ record.displayOrder }}</span>
                  <span class="col-name">{{ record.plantName || '-' }}</span>
                  <span class="col-latin">{{ record.latinName || '-' }}</span>
                  <span class="col-light">{{ record.lightType || '-' }}</span>
                  <span class="col-person">{{ record.responsiblePerson || '-' }}</span>
                </div>
              </div>
            </div>
            <button
              v-if="batch.printableRecords.length > 10"
              class="btn-expand"
              @click="showAllPrintable = !showAllPrintable"
            >
              {{ showAllPrintable ? '收起' : `展开全部 ${batch.printableRecords.length} 条` }}
            </button>
          </div>

          <div v-if="batch.notDisplayedRecords.length > 0" class="section not-displayed-section">
            <h3 class="section-title">
              <EyeOff :size="16" class="text-red-500" />
              暂不展示清单 ({{ batch.notDisplayedRecords.length }})
            </h3>
            <div class="records-table not-displayed">
              <div class="table-header">
                <span class="col-order">序号</span>
                <span class="col-name">植物名</span>
                <span class="col-note">校对备注</span>
              </div>
              <div class="table-body">
                <div
                  v-for="(record, idx) in visibleNotDisplayedRecords"
                  :key="idx"
                  class="table-row"
                >
                  <span class="col-order">{{ record.displayOrder }}</span>
                  <span class="col-name">{{ record.plantName || '-' }}</span>
                  <span class="col-note">{{ record.proofreadNote || '无备注' }}</span>
                </div>
              </div>
            </div>
            <button
              v-if="batch.notDisplayedRecords.length > 5"
              class="btn-expand"
              @click="showAllNotDisplayed = !showAllNotDisplayed"
            >
              {{ showAllNotDisplayed ? '收起' : `展开全部 ${batch.notDisplayedRecords.length} 条` }}
            </button>
          </div>

          <div class="section delivery-note-section">
            <h3 class="section-title">
              <FileText :size="16" />
              交付备注
            </h3>
            <textarea
              v-model="printBatchStore.draftDeliveryNote"
              class="delivery-note-input"
              placeholder="请输入交付备注说明，如：本次打印需注意XX植物的特殊排版要求..."
              rows="3"
            ></textarea>
          </div>

          <div class="section confirm-by-section">
            <h3 class="section-title">
              <User :size="16" />
              确认人
            </h3>
            <input
              v-model="confirmedByName"
              type="text"
              class="confirm-by-input"
              placeholder="请输入确认人姓名（可选，默认：负责人）"
            />
          </div>

          <div v-if="printBatchStore.hasUnconfirmedRisks || printBatchStore.hasIncompleteRecords" class="warning-box">
            <AlertTriangle :size="18" class="text-amber-500" />
            <div class="warning-content">
              <p v-if="printBatchStore.hasUnconfirmedRisks">
                <strong>注意：</strong>当前批次存在
                <span v-if="batch.summary.highRiskCount > 0" class="text-red-600">{{ batch.summary.highRiskCount }} 个高风险</span>
                <span v-if="batch.summary.highRiskCount > 0 && batch.summary.mediumRiskCount > 0">、</span>
                <span v-if="batch.summary.mediumRiskCount > 0" class="text-amber-600">{{ batch.summary.mediumRiskCount }} 个中风险</span>
                问题，确认后将保留此风险记录。
              </p>
              <p v-if="printBatchStore.hasIncompleteRecords">
                <strong>注意：</strong>当前批次存在
                <span class="text-amber-600">{{ batch.summary.pendingCount + batch.summary.toBeSupplementedCount }} 条未完成记录</span>
                （待校对或待补充），这些记录将不会被打印。
              </p>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="handleCancel">
            取消
          </button>
          <button class="btn-confirm" @click="handleConfirm">
            <Check :size="16" />
            确认并生成交付包
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
  backdrop-filter: blur(2px);
}

.dialog-container {
  @apply bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden;
}

.dialog-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50;
}

.header-left {
  @apply flex items-center gap-2;
}

.dialog-title {
  @apply text-lg font-bold text-stone-800;
  font-family: 'Playfair Display', serif;
}

.version-badge {
  @apply text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-mono;
}

.btn-close {
  @apply p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-all cursor-pointer border-0;
}

.dialog-content {
  @apply flex-1 overflow-y-auto p-6 space-y-6;
}

.section {
  @apply space-y-3;
}

.section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-stone-700;
}

.alert-count {
  @apply text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full;
}

.activity-card {
  @apply bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100;
}

.activity-name {
  @apply text-lg font-bold text-emerald-800 mb-2;
}

.activity-meta {
  @apply flex flex-wrap gap-3 text-sm text-stone-600;
}

.meta-item {
  @apply flex items-center gap-1;
}

.summary-grid {
  @apply grid grid-cols-3 sm:grid-cols-6 gap-3;
}

.summary-card {
  @apply rounded-xl p-3 text-center border border-stone-200;
}

.summary-card.total {
  @apply bg-stone-50;
}

.summary-card.printable {
  @apply bg-emerald-50 border-emerald-200;
}

.summary-card.pending {
  @apply bg-amber-50 border-amber-200;
}

.summary-card.supplement {
  @apply bg-stone-50 border-stone-200;
}

.summary-card.not-displayed {
  @apply bg-red-50 border-red-200;
}

.summary-card.risk {
  @apply bg-stone-50;
}

.summary-number {
  @apply block text-2xl font-bold text-stone-800;
}

.summary-label {
  @apply block text-xs text-stone-500 mt-1;
}

.risk-numbers {
  @apply flex items-center justify-center gap-1 text-sm font-bold;
}

.risk-high {
  @apply text-red-600;
}

.risk-medium {
  @apply text-amber-600;
}

.risk-low {
  @apply text-orange-500;
}

.risk-none {
  @apply text-emerald-600;
}

.alerts-list {
  @apply space-y-3;
}

.alert-group {
  @apply space-y-1.5;
}

.alert-group-title {
  @apply flex items-center gap-1.5 text-xs font-semibold;
}

.alert-group-title.high-risk {
  @apply text-red-600;
}

.alert-group-title.medium-risk {
  @apply text-amber-600;
}

.alert-group-title.low-risk {
  @apply text-orange-500;
}

.alert-item {
  @apply flex items-start gap-2 p-2.5 rounded-lg text-sm;
}

.incomplete-list {
  @apply space-y-1.5;
}

.incomplete-item {
  @apply flex items-center gap-3 p-2 bg-amber-50 rounded-lg text-sm;
}

.incomplete-item .order {
  @apply font-bold text-amber-700;
}

.incomplete-item .name {
  @apply flex-1 text-stone-700;
}

.incomplete-item .status-tag {
  @apply text-xs px-2 py-0.5 rounded-full;
}

.status-待补充 {
  @apply bg-stone-200 text-stone-600;
}

.status-待校对 {
  @apply bg-amber-100 text-amber-700;
}

.status-可打印 {
  @apply bg-emerald-100 text-emerald-700;
}

.status-暂不展示 {
  @apply bg-red-100 text-red-600;
}

.more-items {
  @apply text-xs text-stone-400 italic pl-4;
}

.records-table {
  @apply border border-stone-200 rounded-xl overflow-hidden;
}

.records-table.not-displayed {
  @apply border-red-200;
}

.table-header {
  @apply flex bg-stone-100 text-xs font-semibold text-stone-600;
}

.table-header > span,
.table-row > span {
  @apply px-3 py-2;
}

.col-order {
  @apply w-16 shrink-0 text-center;
}

.col-name {
  @apply flex-1 min-w-0 truncate;
}

.col-latin {
  @apply flex-1 min-w-0 truncate italic text-stone-500 hidden sm:table-cell;
}

.col-light {
  @apply w-24 shrink-0 text-center hidden sm:table-cell;
}

.col-person {
  @apply w-24 shrink-0 text-center hidden md:table-cell;
}

.col-note {
  @apply flex-1 min-w-0 truncate text-stone-500;
}

.records-table .col-latin,
.records-table .col-light,
.records-table .col-person {
  display: table-cell;
}

.table-body {
  @apply max-h-60 overflow-y-auto;
}

.table-row {
  @apply flex text-sm border-t border-stone-100 hover:bg-stone-50 transition-colors;
}

.records-table.not-displayed .table-row {
  @apply bg-red-50/30;
}

.btn-expand {
  @apply w-full mt-2 py-1.5 text-xs text-stone-500 hover:text-stone-700 bg-transparent border-0 cursor-pointer;
}

.delivery-note-input {
  @apply w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50
    text-stone-700 outline-none resize-none transition-colors;
}

.delivery-note-input:focus {
  @apply border-emerald-400 ring-1 ring-emerald-400/30 bg-white;
}

.confirm-by-input {
  @apply w-full px-3 py-2 rounded-xl border border-stone-200 text-sm bg-stone-50
    text-stone-700 outline-none transition-colors;
}

.confirm-by-input:focus {
  @apply border-emerald-400 ring-1 ring-emerald-400/30 bg-white;
}

.warning-box {
  @apply flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200;
}

.warning-content {
  @apply flex-1 text-sm text-stone-700 space-y-1;
}

.dialog-footer {
  @apply flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 bg-stone-50;
}

.btn-cancel {
  @apply px-4 py-2.5 rounded-lg text-sm text-stone-600 bg-stone-100
    hover:bg-stone-200 transition-colors cursor-pointer border-0;
}

.btn-confirm {
  @apply flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
    text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer border-0;
}
</style>
