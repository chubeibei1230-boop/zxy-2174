<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePrintBatchStore } from '@/stores/printBatch'
import { PROOFREAD_STATUSES } from '@/types'
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Printer,
  EyeOff,
  FileText,
  Package,
  Calendar,
  MapPin,
  Users,
  Clock,
  User,
  Check,
  Download,
  ArrowLeft,
  FileCheck,
  ListChecks,
  Edit3,
} from 'lucide-vue-next'
import { useExport } from '@/composables/useExport'

const printBatchStore = usePrintBatchStore()
const { exportPrintHTML, exportChecklist } = useExport()
const activeTab = ref<'overview' | 'printable' | 'missing' | 'risks'>('overview')
const showAllPrintable = ref(false)
const showAllMissing = ref(false)

const batch = computed(() => printBatchStore.currentBatch)

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

const missingRecords = computed(() => {
  if (!batch.value) return []
  return batch.value.recordsSnapshot.filter((r) => r.status === '待补充' || r.status === '待校对')
})

const visiblePrintableRecords = computed(() => {
  if (!batch.value) return []
  const records = batch.value.printableRecords
  return showAllPrintable.value ? records : records.slice(0, 20)
})

const visibleMissingRecords = computed(() => {
  if (!batch.value) return []
  const records = missingRecords.value
  return showAllMissing.value ? records : records.slice(0, 10)
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

function handleClose() {
  printBatchStore.closeSummaryView()
}

function handleBackToConfirm() {
  if (batch.value) {
    printBatchStore.openHistoryBatchForEdit(batch.value)
  }
}

function handleExportPrint() {
  if (!batch.value) return
  exportPrintHTML(batch.value.printableRecords, batch.value.activitySnapshot)
}

function handleExportChecklist() {
  if (!batch.value) return
  exportChecklist(batch.value.recordsSnapshot, batch.value.activitySnapshot, batch.value.issuesSnapshot)
}

const tabs = [
  { key: 'overview', label: '总览', icon: FileCheck },
  { key: 'printable', label: '打印清单', icon: Printer },
  { key: 'missing', label: '遗漏项', icon: ListChecks },
  { key: 'risks', label: '风险项', icon: AlertTriangle },
] as const
</script>

<template>
  <Teleport to="body">
    <div v-if="printBatchStore.showSummaryView && batch" class="summary-overlay">
      <div class="summary-container">
        <div class="summary-header">
          <div class="header-left">
            <button class="btn-back" @click="handleBackToConfirm">
              <ArrowLeft :size="18" />
            </button>
            <div class="header-title-group">
              <div class="header-title-row">
                <Package :size="22" class="text-emerald-600" />
                <h2 class="summary-title">交付包汇总视图</h2>
                <span class="version-badge">{{ batch.version }}</span>
                <span class="status-badge confirmed">
                  <Check :size="12" />
                  已确认
                </span>
              </div>
              <div class="header-subtitle">
                确认时间：{{ formatDate(batch.confirmedAt) }} | 确认人：{{ batch.confirmedBy || '负责人' }}
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-action secondary" @click="handleBackToConfirm">
              <Edit3 :size="16" />
              修改备注
            </button>
            <button class="btn-action" @click="handleExportChecklist">
              <FileText :size="16" />
              导出校对清单
            </button>
            <button class="btn-action primary" @click="handleExportPrint">
              <Printer :size="16" />
              打印插牌
            </button>
            <button class="btn-close" @click="handleClose">
              <X :size="18" />
            </button>
          </div>
        </div>

        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" :size="16" />
            <span>{{ tab.label }}</span>
            <span v-if="tab.key === 'printable'" class="tab-count printable">{{ batch.summary.printableCount }}</span>
            <span v-if="tab.key === 'missing'" class="tab-count missing">{{ missingRecords.length }}</span>
            <span v-if="tab.key === 'risks'" class="tab-count risks">{{ batch.issuesSnapshot.length }}</span>
          </button>
        </div>

        <div class="summary-content">
          <div v-if="activeTab === 'overview'" class="tab-content overview-tab">
            <div class="overview-section">
              <div class="info-card activity-info">
                <h3 class="info-card-title">
                  <Calendar :size="16" class="text-emerald-600" />
                  活动信息
                </h3>
                <div class="info-card-content">
                  <div class="activity-name">{{ batch.activitySnapshot.name || '未命名活动' }}</div>
                  <div class="activity-details">
                    <div class="detail-item" v-if="batch.activitySnapshot.date">
                      <Calendar :size="14" class="text-stone-400" />
                      <span>{{ batch.activitySnapshot.date }}</span>
                    </div>
                    <div class="detail-item" v-if="batch.activitySnapshot.location">
                      <MapPin :size="14" class="text-stone-400" />
                      <span>{{ batch.activitySnapshot.location }}</span>
                    </div>
                    <div class="detail-item" v-if="batch.activitySnapshot.participantCount">
                      <Users :size="14" class="text-stone-400" />
                      <span>{{ batch.activitySnapshot.participantCount }} 人参与</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="info-card confirmation-info">
                <h3 class="info-card-title">
                  <FileCheck :size="16" class="text-emerald-600" />
                  确认信息
                </h3>
                <div class="info-card-content">
                  <div class="confirmation-details">
                    <div class="detail-item">
                      <Clock :size="14" class="text-stone-400" />
                      <span>确认时间：{{ formatDate(batch.confirmedAt) }}</span>
                    </div>
                    <div class="detail-item">
                      <User :size="14" class="text-stone-400" />
                      <span>确认人：{{ batch.confirmedBy || '负责人' }}</span>
                    </div>
                    <div class="detail-item">
                      <Package :size="14" class="text-stone-400" />
                      <span>版本：{{ batch.version }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="stats-section">
              <h3 class="section-heading">数据统计</h3>
              <div class="stats-grid">
                <div class="stat-card total">
                  <div class="stat-icon">
                    <FileText :size="24" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-number">{{ batch.summary.totalRecords }}</span>
                    <span class="stat-label">总记录数</span>
                  </div>
                </div>
                <div class="stat-card printable">
                  <div class="stat-icon">
                    <Printer :size="24" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-number">{{ batch.summary.printableCount }}</span>
                    <span class="stat-label">可打印</span>
                  </div>
                  <div class="stat-percentage">
                    {{ batch.summary.totalRecords > 0 ? Math.round(batch.summary.printableCount / batch.summary.totalRecords * 100) : 0 }}%
                  </div>
                </div>
                <div class="stat-card missing">
                  <div class="stat-icon">
                    <ListChecks :size="24" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-number">{{ batch.summary.pendingCount + batch.summary.toBeSupplementedCount }}</span>
                    <span class="stat-label">遗漏（未完成）</span>
                  </div>
                </div>
                <div class="stat-card not-displayed">
                  <div class="stat-icon">
                    <EyeOff :size="24" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-number">{{ batch.summary.notDisplayedCount }}</span>
                    <span class="stat-label">暂不展示</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="risk-summary-section" v-if="batch.issuesSnapshot.length > 0">
              <h3 class="section-heading">风险摘要</h3>
              <div class="risk-summary-cards">
                <div v-if="highRiskIssues.length > 0" class="risk-card high">
                  <AlertCircle :size="20" />
                  <span class="risk-count">{{ highRiskIssues.length }}</span>
                  <span class="risk-label">高风险</span>
                </div>
                <div v-if="mediumRiskIssues.length > 0" class="risk-card medium">
                  <AlertCircle :size="20" />
                  <span class="risk-count">{{ mediumRiskIssues.length }}</span>
                  <span class="risk-label">中风险</span>
                </div>
                <div v-if="lowRiskIssues.length > 0" class="risk-card low">
                  <Info :size="20" />
                  <span class="risk-count">{{ lowRiskIssues.length }}</span>
                  <span class="risk-label">低风险</span>
                </div>
              </div>
            </div>

            <div class="delivery-note-section" v-if="batch.deliveryNote">
              <h3 class="section-heading">
                <FileText :size="16" />
                交付备注
              </h3>
              <div class="delivery-note-card">
                {{ batch.deliveryNote }}
              </div>
            </div>

            <div class="quick-actions-section">
              <h3 class="section-heading">快捷操作</h3>
              <div class="quick-actions">
                <button class="quick-action-btn" @click="activeTab = 'printable'">
                  <Printer :size="18" />
                  <span>查看打印清单</span>
                </button>
                <button class="quick-action-btn" @click="activeTab = 'missing'">
                  <ListChecks :size="18" />
                  <span>查看遗漏项 ({{ missingRecords.length }})</span>
                </button>
                <button class="quick-action-btn" @click="activeTab = 'risks'">
                  <AlertTriangle :size="18" />
                  <span>查看风险项 ({{ batch.issuesSnapshot.length }})</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'printable'" class="tab-content">
            <div class="tab-header-info">
              <div class="tab-title-info">
                <Printer :size="20" class="text-emerald-600" />
                <h3>可打印清单</h3>
                <span class="count-badge printable">{{ batch.summary.printableCount }} 条记录</span>
              </div>
              <button class="btn-export-small" @click="handleExportPrint">
                <Download :size="14" />
                打印
              </button>
            </div>

            <div class="records-table full">
              <div class="table-header">
                <span class="col-order">序号</span>
                <span class="col-name">植物名</span>
                <span class="col-latin">拉丁名</span>
                <span class="col-light">光照</span>
                <span class="col-water">浇水提醒</span>
                <span class="col-person">责任人</span>
                <span class="col-note">校对备注</span>
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
                  <span class="col-water">{{ record.wateringReminder || '-' }}</span>
                  <span class="col-person">{{ record.responsiblePerson || '-' }}</span>
                  <span class="col-note">{{ record.proofreadNote || '-' }}</span>
                </div>
              </div>
            </div>
            <button
              v-if="batch.printableRecords.length > 20"
              class="btn-expand"
              @click="showAllPrintable = !showAllPrintable"
            >
              {{ showAllPrintable ? '收起' : `展开全部 ${batch.printableRecords.length} 条` }}
            </button>
          </div>

          <div v-if="activeTab === 'missing'" class="tab-content">
            <div class="tab-header-info">
              <div class="tab-title-info">
                <ListChecks :size="20" class="text-amber-600" />
                <h3>遗漏项（未完成记录）</h3>
                <span class="count-badge missing">{{ missingRecords.length }} 条记录</span>
              </div>
            </div>

            <div v-if="missingRecords.length === 0" class="empty-state">
              <Check :size="48" class="text-emerald-500 mb-3" />
              <p class="empty-title">太棒了！</p>
              <p class="empty-desc">所有记录都已完成校对，没有遗漏项</p>
            </div>

            <div v-else class="missing-categories">
              <div v-if="batch.summary.toBeSupplementedCount > 0" class="missing-category">
                <h4 class="category-title">
                  <span class="category-dot supplement"></span>
                  待补充 ({{ batch.summary.toBeSupplementedCount }})
                </h4>
                <div class="missing-list">
                  <div
                    v-for="(record, idx) in visibleMissingRecords.filter(r => r.status === '待补充').slice(0, 10)"
                    :key="'supp-' + idx"
                    class="missing-item"
                  >
                    <span class="order">#{{ record.displayOrder }}</span>
                    <span class="name">{{ record.plantName || '未命名' }}</span>
                    <span class="reason">缺少必要信息</span>
                  </div>
                </div>
              </div>

              <div v-if="batch.summary.pendingCount > 0" class="missing-category">
                <h4 class="category-title">
                  <span class="category-dot pending"></span>
                  待校对 ({{ batch.summary.pendingCount }})
                </h4>
                <div class="missing-list">
                  <div
                    v-for="(record, idx) in visibleMissingRecords.filter(r => r.status === '待校对').slice(0, 10)"
                    :key="'pend-' + idx"
                    class="missing-item"
                  >
                    <span class="order">#{{ record.displayOrder }}</span>
                    <span class="name">{{ record.plantName || '未命名' }}</span>
                    <span class="reason">需人工校对确认</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              v-if="missingRecords.length > 10"
              class="btn-expand"
              @click="showAllMissing = !showAllMissing"
            >
              {{ showAllMissing ? '收起' : `展开全部 ${missingRecords.length} 条` }}
            </button>
          </div>

          <div v-if="activeTab === 'risks'" class="tab-content">
            <div class="tab-header-info">
              <div class="tab-title-info">
                <AlertTriangle :size="20" class="text-amber-600" />
                <h3>风险项</h3>
                <span class="count-badge risks">{{ batch.issuesSnapshot.length }} 项</span>
              </div>
            </div>

            <div v-if="batch.issuesSnapshot.length === 0" class="empty-state">
              <Check :size="48" class="text-emerald-500 mb-3" />
              <p class="empty-title">零风险！</p>
              <p class="empty-desc">未检测到任何风险问题</p>
            </div>

            <div v-else class="risks-list">
              <div v-if="highRiskIssues.length > 0" class="risk-group">
                <h4 class="risk-group-title high">
                  <AlertCircle :size="16" />
                  高风险问题 ({{ highRiskIssues.length }})
                </h4>
                <div class="risk-items">
                  <div
                    v-for="(issue, idx) in highRiskIssues"
                    :key="'high-' + idx"
                    class="risk-item"
                    :class="getRiskBgColor(issue.level)"
                  >
                    <AlertCircle :size="18" :class="getRiskColor(issue.level)" />
                    <div class="risk-content">
                      <p class="risk-message">{{ issue.message }}</p>
                      <p class="risk-affected">
                        影响 {{ issue.recordIds.length }} 条记录
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="mediumRiskIssues.length > 0" class="risk-group">
                <h4 class="risk-group-title medium">
                  <AlertCircle :size="16" />
                  中风险问题 ({{ mediumRiskIssues.length }})
                </h4>
                <div class="risk-items">
                  <div
                    v-for="(issue, idx) in mediumRiskIssues"
                    :key="'medium-' + idx"
                    class="risk-item"
                    :class="getRiskBgColor(issue.level)"
                  >
                    <AlertCircle :size="18" :class="getRiskColor(issue.level)" />
                    <div class="risk-content">
                      <p class="risk-message">{{ issue.message }}</p>
                      <p class="risk-affected">
                        影响 {{ issue.recordIds.length }} 条记录
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="lowRiskIssues.length > 0" class="risk-group">
                <h4 class="risk-group-title low">
                  <Info :size="16" />
                  低风险问题 ({{ lowRiskIssues.length }})
                </h4>
                <div class="risk-items">
                  <div
                    v-for="(issue, idx) in lowRiskIssues"
                    :key="'low-' + idx"
                    class="risk-item"
                    :class="getRiskBgColor(issue.level)"
                  >
                    <Info :size="18" :class="getRiskColor(issue.level)" />
                    <div class="risk-content">
                      <p class="risk-message">{{ issue.message }}</p>
                      <p class="risk-affected">
                        影响 {{ issue.recordIds.length }} 条记录
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.summary-overlay {
  @apply fixed inset-0 bg-stone-900/70 flex items-center justify-center z-50 p-4;
  backdrop-filter: blur(4px);
}

.summary-container {
  @apply bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden;
}

.summary-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-teal-50;
}

.header-left {
  @apply flex items-center gap-3;
}

.btn-back {
  @apply p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-white/60 transition-all cursor-pointer border-0;
}

.header-title-group {
  @apply flex flex-col;
}

.header-title-row {
  @apply flex items-center gap-2;
}

.summary-title {
  @apply text-xl font-bold text-stone-800;
  font-family: 'Playfair Display', serif;
}

.version-badge {
  @apply text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-mono;
}

.status-badge {
  @apply inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium;
}

.status-badge.confirmed {
  @apply bg-emerald-100 text-emerald-700;
}

.header-subtitle {
  @apply text-xs text-stone-500 mt-0.5;
}

.header-actions {
  @apply flex items-center gap-2;
}

.btn-action {
  @apply inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
    text-stone-600 bg-white hover:bg-stone-50 border border-stone-200
    transition-all cursor-pointer;
}

.btn-action.primary {
  @apply text-white bg-emerald-600 border-emerald-600 hover:bg-emerald-700;
}

.btn-action.secondary {
  @apply text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100;
}

.btn-close {
  @apply p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-white/60 transition-all cursor-pointer border-0 ml-1;
}

.tabs-nav {
  @apply flex gap-1 px-6 py-2 border-b border-stone-200 bg-stone-50;
}

.tab-btn {
  @apply inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm
    text-stone-600 hover:bg-white/80 transition-all cursor-pointer border-0;
}

.tab-btn.active {
  @apply bg-white text-emerald-700 shadow-sm font-medium;
}

.tab-count {
  @apply text-xs px-1.5 py-0.5 rounded-full font-medium;
}

.tab-count.printable {
  @apply bg-emerald-100 text-emerald-700;
}

.tab-count.missing {
  @apply bg-amber-100 text-amber-700;
}

.tab-count.risks {
  @apply bg-red-100 text-red-600;
}

.summary-content {
  @apply flex-1 overflow-y-auto;
}

.tab-content {
  @apply p-6 space-y-6;
}

.overview-tab {
  @apply space-y-6;
}

.overview-section {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.info-card {
  @apply rounded-xl border border-stone-200 overflow-hidden;
}

.info-card-title {
  @apply flex items-center gap-2 px-4 py-3 bg-stone-50 text-sm font-semibold text-stone-700 border-b border-stone-200;
}

.info-card-content {
  @apply p-4;
}

.activity-name {
  @apply text-lg font-bold text-stone-800 mb-2;
}

.activity-details,
.confirmation-details {
  @apply space-y-1.5;
}

.detail-item {
  @apply flex items-center gap-2 text-sm text-stone-600;
}

.stats-section {
  @apply space-y-3;
}

.section-heading {
  @apply text-sm font-semibold text-stone-700 flex items-center gap-2;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.stat-card {
  @apply flex items-center gap-3 p-4 rounded-xl border border-stone-200 relative overflow-hidden;
}

.stat-card.total {
  @apply bg-stone-50;
}

.stat-card.printable {
  @apply bg-emerald-50 border-emerald-200;
}

.stat-card.missing {
  @apply bg-amber-50 border-amber-200;
}

.stat-card.not-displayed {
  @apply bg-red-50 border-red-200;
}

.stat-icon {
  @apply p-2.5 rounded-lg bg-white text-stone-600 shadow-sm;
}

.stat-card.printable .stat-icon {
  @apply text-emerald-600;
}

.stat-card.missing .stat-icon {
  @apply text-amber-600;
}

.stat-card.not-displayed .stat-icon {
  @apply text-red-500;
}

.stat-info {
  @apply flex flex-col;
}

.stat-number {
  @apply text-2xl font-bold text-stone-800;
}

.stat-card.printable .stat-number {
  @apply text-emerald-700;
}

.stat-card.missing .stat-number {
  @apply text-amber-700;
}

.stat-card.not-displayed .stat-number {
  @apply text-red-600;
}

.stat-label {
  @apply text-xs text-stone-500;
}

.stat-percentage {
  @apply absolute top-2 right-3 text-2xl font-bold text-emerald-600/30;
}

.risk-summary-section {
  @apply space-y-3;
}

.risk-summary-cards {
  @apply flex gap-3;
}

.risk-card {
  @apply flex items-center gap-2 px-4 py-3 rounded-xl font-medium;
}

.risk-card.high {
  @apply bg-red-50 text-red-600 border border-red-200;
}

.risk-card.medium {
  @apply bg-amber-50 text-amber-600 border border-amber-200;
}

.risk-card.low {
  @apply bg-orange-50 text-orange-500 border border-orange-200;
}

.risk-count {
  @apply text-xl font-bold;
}

.risk-label {
  @apply text-sm;
}

.delivery-note-section {
  @apply space-y-3;
}

.delivery-note-card {
  @apply p-4 bg-stone-50 rounded-xl border border-stone-200 text-stone-700 text-sm leading-relaxed;
}

.quick-actions-section {
  @apply space-y-3;
}

.quick-actions {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-3;
}

.quick-action-btn {
  @apply flex items-center gap-2 px-4 py-3 rounded-xl border border-stone-200
    text-sm text-stone-700 bg-white hover:bg-stone-50 hover:border-emerald-300
    transition-all cursor-pointer text-left;
}

.tab-header-info {
  @apply flex items-center justify-between mb-4;
}

.tab-title-info {
  @apply flex items-center gap-2;
}

.tab-title-info h3 {
  @apply text-lg font-semibold text-stone-800;
}

.count-badge {
  @apply text-xs px-2.5 py-1 rounded-full font-medium;
}

.count-badge.printable {
  @apply bg-emerald-100 text-emerald-700;
}

.count-badge.missing {
  @apply bg-amber-100 text-amber-700;
}

.count-badge.risks {
  @apply bg-red-100 text-red-600;
}

.btn-export-small {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
    text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer border-0;
}

.records-table.full {
  @apply border border-stone-200 rounded-xl overflow-hidden;
}

.records-table.full .table-header {
  @apply flex bg-emerald-50 text-xs font-semibold text-emerald-800;
}

.records-table.full .table-header > span,
.records-table.full .table-row > span {
  @apply px-3 py-2.5;
}

.records-table.full .col-water {
  @apply flex-1 min-w-0 truncate hidden md:table-cell;
}

.records-table.full .col-note {
  @apply flex-1 min-w-0 truncate hidden lg:table-cell;
}

.records-table.full .table-body {
  @apply max-h-96 overflow-y-auto;
}

.records-table.full .table-row {
  @apply flex text-sm border-t border-stone-100 hover:bg-emerald-50/30 transition-colors;
}

.records-table.full .col-latin,
.records-table.full .col-light,
.records-table.full .col-person,
.records-table.full .col-water,
.records-table.full .col-note {
  display: table-cell;
}

.btn-expand {
  @apply w-full mt-2 py-1.5 text-xs text-stone-500 hover:text-stone-700 bg-transparent border-0 cursor-pointer;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-title {
  @apply text-lg font-semibold text-emerald-700 mb-1;
}

.empty-desc {
  @apply text-sm text-stone-500;
}

.missing-categories {
  @apply space-y-4;
}

.missing-category {
  @apply rounded-xl border border-stone-200 overflow-hidden;
}

.category-title {
  @apply flex items-center gap-2 px-4 py-3 bg-stone-50 text-sm font-semibold text-stone-700 border-b border-stone-200;
}

.category-dot {
  @apply w-2.5 h-2.5 rounded-full;
}

.category-dot.supplement {
  @apply bg-stone-400;
}

.category-dot.pending {
  @apply bg-amber-400;
}

.missing-list {
  @apply divide-y divide-stone-100;
}

.missing-item {
  @apply flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-stone-50;
}

.missing-item .order {
  @apply font-bold text-stone-500 w-12;
}

.missing-item .name {
  @apply flex-1 text-stone-700;
}

.missing-item .reason {
  @apply text-xs text-stone-400;
}

.risks-list {
  @apply space-y-4;
}

.risk-group {
  @apply space-y-2;
}

.risk-group-title {
  @apply flex items-center gap-2 text-sm font-semibold;
}

.risk-group-title.high {
  @apply text-red-600;
}

.risk-group-title.medium {
  @apply text-amber-600;
}

.risk-group-title.low {
  @apply text-orange-500;
}

.risk-items {
  @apply space-y-2;
}

.risk-item {
  @apply flex items-start gap-3 p-3.5 rounded-xl;
}

.risk-content {
  @apply flex-1;
}

.risk-message {
  @apply text-sm text-stone-700 mb-0.5;
}

.risk-affected {
  @apply text-xs text-stone-400;
}
</style>
