<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePrintBatchStore } from '@/stores/printBatch'
import { usePlantRecordsStore } from '@/stores/plantRecords'
import {
  X,
  Calendar,
  MapPin,
  Users,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  FileCheck,
  Download,
  Printer,
  ArrowRight,
  Handshake,
  Package,
  ListChecks,
  Leaf,
} from 'lucide-vue-next'
import { useExport } from '@/composables/useExport'

const router = useRouter()
const printBatchStore = usePrintBatchStore()
const recordStore = usePlantRecordsStore()
const { exportDeliveryConfirmation } = useExport()

const activeTab = ref<'overview' | 'persons' | 'unhanded' | 'reminders'>('overview')
const expandedPersons = ref<Set<string>>(new Set())

const summary = computed(() => printBatchStore.currentDeliverySummary)

const tabs = [
  { key: 'overview', label: '总览', icon: FileCheck },
  { key: 'persons', label: '责任人详情', icon: Users },
  { key: 'unhanded', label: '未交付项', icon: ListChecks },
  { key: 'reminders', label: '打印提醒', icon: AlertTriangle },
] as const

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function togglePersonExpand(personName: string) {
  if (expandedPersons.value.has(personName)) {
    expandedPersons.value.delete(personName)
  } else {
    expandedPersons.value.add(personName)
  }
  expandedPersons.value = new Set(expandedPersons.value)
}

function isPersonExpanded(personName: string): boolean {
  return expandedPersons.value.has(personName)
}

function handleClose() {
  printBatchStore.closeDeliveryConfirmationView()
}

function goToPersonDetail(personName: string) {
  if (personName === '未分配') return
  printBatchStore.closeDeliveryConfirmationView()
  router.push({ name: 'person-detail', params: { personName } })
}

function goToResponsibleDashboard() {
  printBatchStore.closeDeliveryConfirmationView()
  router.push({ name: 'responsible-dashboard' })
}

function handleExport() {
  if (!summary.value) return
  exportDeliveryConfirmation(summary.value)
}

function handlePrint() {
  window.print()
}

function getCompletionColor(rate: number): string {
  if (rate >= 100) return 'text-emerald-600'
  if (rate >= 80) return 'text-teal-600'
  if (rate >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function getCompletionBgColor(rate: number): string {
  if (rate >= 100) return 'bg-emerald-500'
  if (rate >= 80) return 'bg-teal-500'
  if (rate >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}
</script>

<template>
  <Teleport to="body">
    <div v-if="printBatchStore.showDeliveryConfirmationView && summary" class="delivery-overlay">
      <div class="delivery-container print-content">
        <div class="delivery-header no-print">
          <div class="header-left">
            <div class="header-title-group">
              <div class="header-title-row">
                <Handshake :size="22" class="text-emerald-600" />
                <h2 class="delivery-title">交付确认闭环摘要</h2>
                <span
                  class="status-badge"
                  :class="summary.allPrintableDelivered ? 'all-delivered' : 'pending'"
                >
                  <CheckCircle v-if="summary.allPrintableDelivered" :size="12" />
                  <AlertTriangle v-else :size="12" />
                  {{ summary.allPrintableDelivered ? '全部已交付' : '待交付' }}
                </span>
              </div>
              <div class="header-subtitle">
                生成时间：{{ formatDate(summary.generatedAt) }} | 生成人：{{ summary.generatedBy }}
              </div>
            </div>
          </div>
          <div class="header-actions no-print">
            <button class="btn-action secondary" @click="goToResponsibleDashboard">
              <Users :size="16" />
              责任人看板
            </button>
            <button class="btn-action" @click="handleExport">
              <Download :size="16" />
              导出摘要
            </button>
            <button class="btn-action" @click="handlePrint">
              <Printer :size="16" />
              打印
            </button>
            <button class="btn-close" @click="handleClose">
              <X :size="18" />
            </button>
          </div>
        </div>

        <div class="tabs-nav no-print">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" :size="16" />
            <span>{{ tab.label }}</span>
            <span v-if="tab.key === 'persons'" class="tab-count">
              {{ summary.personSummaries.length }}
            </span>
            <span v-if="tab.key === 'unhanded'" class="tab-count warning">
              {{ summary.unhandedReasons.length }}
            </span>
            <span v-if="tab.key === 'reminders'" class="tab-count info">
              {{ summary.printReminders.length }}
            </span>
          </button>
        </div>

        <div class="delivery-content">
          <div v-if="activeTab === 'overview'" class="tab-content">
            <div class="activity-section">
              <div class="section-card">
                <h3 class="section-title">
                  <Calendar :size="16" class="text-emerald-600" />
                  活动信息
                </h3>
                <div class="activity-details">
                  <div class="activity-name">{{ summary.activityInfo.name || '未命名活动' }}</div>
                  <div class="activity-meta">
                    <span class="meta-item" v-if="summary.activityInfo.date">
                      <Calendar :size="14" class="text-stone-400" />
                      {{ summary.activityInfo.date }}
                    </span>
                    <span class="meta-item" v-if="summary.activityInfo.location">
                      <MapPin :size="14" class="text-stone-400" />
                      {{ summary.activityInfo.location }}
                    </span>
                    <span class="meta-item" v-if="summary.activityInfo.participantCount">
                      <Users :size="14" class="text-stone-400" />
                      {{ summary.activityInfo.participantCount }} 人参与
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="overall-stats-section">
              <h3 class="section-heading">整体交付进度</h3>
              <div class="overall-progress-card">
                <div class="progress-main">
                  <div class="progress-circle">
                    <svg class="progress-ring" viewBox="0 0 100 100">
                      <circle class="progress-ring-bg" cx="50" cy="50" r="40" />
                      <circle
                        class="progress-ring-fill"
                        :class="getCompletionBgColor(summary.overallCompletionRate)"
                        cx="50"
                        cy="50"
                        r="40"
                        :style="{
                          strokeDasharray: `${2 * Math.PI * 40}`,
                          strokeDashoffset: `${2 * Math.PI * 40 * (1 - summary.overallCompletionRate / 100)}`,
                        }"
                      />
                    </svg>
                    <div class="progress-text">
                      <span class="progress-percent" :class="getCompletionColor(summary.overallCompletionRate)">
                        {{ summary.overallCompletionRate.toFixed(1) }}%
                      </span>
                      <span class="progress-label">完成率</span>
                    </div>
                  </div>
                  <div class="progress-stats">
                    <div class="progress-stat-item">
                      <span class="stat-icon printable">
                        <CheckCircle :size="18" />
                      </span>
                      <div class="stat-info">
                        <span class="stat-number">{{ summary.totalPrintableCount }}</span>
                        <span class="stat-label">可打印总数</span>
                      </div>
                    </div>
                    <div class="progress-stat-item">
                      <span class="stat-icon handed">
                        <Check :size="18" />
                      </span>
                      <div class="stat-info">
                        <span class="stat-number text-emerald-600">{{ summary.totalHandedOverCount }}</span>
                        <span class="stat-label">已交付</span>
                      </div>
                    </div>
                    <div class="progress-stat-item">
                      <span class="stat-icon pending">
                        <Clock :size="18" />
                      </span>
                      <div class="stat-info">
                        <span class="stat-number text-amber-600">{{ summary.totalNotHandedOverCount }}</span>
                        <span class="stat-label">待交付</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="persons-summary-section">
              <h3 class="section-heading">责任人完成情况</h3>
              <div class="persons-cards">
                <div
                  v-for="ps in summary.personSummaries"
                  :key="ps.personName"
                  class="person-mini-card"
                  @click="activeTab = 'persons'"
                >
                  <div class="person-mini-header">
                    <div class="person-avatar-small">
                      <User :size="14" />
                    </div>
                    <span class="person-name-small">{{ ps.personName }}</span>
                    <span
                      class="person-status-badge"
                      :class="ps.notHandedOverCount === 0 ? 'done' : 'pending'"
                    >
                      {{ ps.notHandedOverCount === 0 ? '已完成' : '进行中' }}
                    </span>
                  </div>
                  <div class="person-mini-progress">
                    <div class="progress-bar-small">
                      <div
                        class="progress-fill-small"
                        :class="getCompletionBgColor(ps.completionRate)"
                        :style="{ width: ps.completionRate + '%' }"
                      ></div>
                    </div>
                    <span class="progress-text-small" :class="getCompletionColor(ps.completionRate)">
                      {{ ps.completionRate.toFixed(0) }}%
                    </span>
                  </div>
                  <div class="person-mini-stats">
                    <span>{{ ps.handedOverCount }}/{{ ps.printableCount }} 已交付</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="quick-alerts-section">
              <div v-if="summary.unhandedReasons.length > 0" class="alert-card warning">
                <AlertTriangle :size="20" />
                <div class="alert-content">
                  <h4 class="alert-title">存在未交付项</h4>
                  <p class="alert-desc">
                    还有 {{ summary.unhandedReasons.length }} 条记录未完成交付确认
                  </p>
                </div>
                <button class="alert-btn" @click="activeTab = 'unhanded'">
                  查看详情
                  <ArrowRight :size="14" />
                </button>
              </div>

              <div v-if="summary.printReminders.length > 0" class="alert-card info">
                <Info :size="20" />
                <div class="alert-content">
                  <h4 class="alert-title">打印前提醒</h4>
                  <p class="alert-desc">
                    有 {{ summary.printReminders.length }} 项注意事项需要关注
                  </p>
                </div>
                <button class="alert-btn" @click="activeTab = 'reminders'">
                  查看详情
                  <ArrowRight :size="14" />
                </button>
              </div>

              <div v-if="summary.allPrintableDelivered" class="alert-card success">
                <CheckCircle :size="20" />
                <div class="alert-content">
                  <h4 class="alert-title">全部已交付</h4>
                  <p class="alert-desc">
                    所有可打印记录均已完成责任人交付确认，可以进行打印
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'persons'" class="tab-content">
            <div class="persons-detail-section">
              <div
                v-for="ps in summary.personSummaries"
                :key="ps.personName"
                class="person-detail-card"
              >
                <div class="person-detail-header" @click="togglePersonExpand(ps.personName)">
                  <div class="person-detail-info">
                    <div class="person-avatar-medium">
                      <User :size="18" />
                    </div>
                    <div class="person-detail-text">
                      <h4 class="person-detail-name">{{ ps.personName }}</h4>
                      <span class="person-detail-meta">
                        负责 {{ ps.totalCount }} 条记录 · 可打印 {{ ps.printableCount }} 条
                      </span>
                    </div>
                  </div>
                  <div class="person-detail-status">
                    <div class="person-completion-rate" :class="getCompletionColor(ps.completionRate)">
                      {{ ps.completionRate.toFixed(1) }}%
                    </div>
                    <span
                      class="chevron-icon"
                      :class="{ rotated: isPersonExpanded(ps.personName) }"
                    >
                      ▼
                    </span>
                  </div>
                </div>

                <div class="person-detail-progress">
                  <div class="progress-bar-medium">
                    <div
                      class="progress-fill-medium"
                      :class="getCompletionBgColor(ps.completionRate)"
                      :style="{ width: ps.completionRate + '%' }"
                    ></div>
                  </div>
                  <div class="person-progress-stats">
                    <span class="stat-badge success">
                      <Check :size="12" />
                      {{ ps.handedOverCount }} 已交付
                    </span>
                    <span class="stat-badge warning" v-if="ps.notHandedOverCount > 0">
                      <Clock :size="12" />
                      {{ ps.notHandedOverCount }} 待交付
                    </span>
                  </div>
                </div>

                <Transition name="expand">
                  <div v-if="isPersonExpanded(ps.personName)" class="person-items-list">
                    <div class="items-table">
                      <div class="items-table-header">
                        <span class="col-order">序号</span>
                        <span class="col-name">植物名</span>
                        <span class="col-status">状态</span>
                        <span class="col-maintenance">养护说明</span>
                        <span class="col-handover">交接备注</span>
                        <span class="col-time">交付时间</span>
                      </div>
                      <div class="items-table-body">
                        <div
                          v-for="item in ps.items"
                          :key="item.recordId"
                          class="items-table-row"
                          :class="{ 'row-handed': item.isHandedOver, 'row-unhanded': !item.isHandedOver }"
                        >
                          <span class="col-order">#{{ item.displayOrder }}</span>
                          <span class="col-name">{{ item.plantName }}</span>
                          <span class="col-status">
                            <span
                              class="status-indicator"
                              :class="item.isHandedOver ? 'status-handed' : 'status-unhanded'"
                            >
                              {{ item.isHandedOver ? '已交付' : '待交付' }}
                            </span>
                          </span>
                          <span class="col-maintenance">
                            {{ item.maintenanceInfo || '—' }}
                          </span>
                          <span class="col-handover">
                            {{ item.handoverNote || '—' }}
                          </span>
                          <span class="col-time">
                            {{ item.handedOverAt ? formatDate(item.handedOverAt) : '—' }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="person-card-actions no-print">
                      <button
                        v-if="ps.personName !== '未分配'"
                        class="btn-go-detail"
                        @click.stop="goToPersonDetail(ps.personName)"
                      >
                        <User :size="14" />
                        查看责任人详情
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'unhanded'" class="tab-content">
            <div class="unhanded-section">
              <div class="section-header-info">
                <div class="section-title-info">
                  <ListChecks :size="20" class="text-amber-600" />
                  <h3>未交付项清单</h3>
                  <span class="count-badge warning">{{ summary.unhandedReasons.length }} 项</span>
                </div>
              </div>

              <div v-if="summary.unhandedReasons.length === 0" class="empty-state">
                <CheckCircle :size="48" class="text-emerald-500 mb-3" />
                <p class="empty-title">太棒了！</p>
                <p class="empty-desc">所有可打印记录均已完成交付确认</p>
              </div>

              <div v-else class="unhanded-list">
                <div
                  v-for="(item, idx) in summary.unhandedReasons"
                  :key="idx"
                  class="unhanded-item"
                >
                  <div class="unhanded-item-header">
                    <AlertCircle :size="16" class="text-amber-500" />
                    <span class="unhanded-plant">{{ item.plantName }}</span>
                    <span class="unhanded-person">{{ item.personName }}</span>
                  </div>
                  <div class="unhanded-reason">
                    <span class="reason-label">未交付原因：</span>
                    <span class="reason-text">{{ item.reason }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'reminders'" class="tab-content">
            <div class="reminders-section">
              <div class="section-header-info">
                <div class="section-title-info">
                  <AlertTriangle :size="20" class="text-amber-600" />
                  <h3>打印前提醒</h3>
                  <span class="count-badge info">{{ summary.printReminders.length }} 项</span>
                </div>
              </div>

              <div class="reminders-list">
                <div
                  v-for="(reminder, idx) in summary.printReminders"
                  :key="idx"
                  class="reminder-item"
                  :class="{
                    'reminder-high': reminder.includes('高风险'),
                    'reminder-medium': reminder.includes('中风险') && !reminder.includes('高风险'),
                    'reminder-success': reminder.includes('已通过'),
                  }"
                >
                  <AlertCircle
                    v-if="reminder.includes('高风险')"
                    :size="18"
                    class="text-red-500"
                  />
                  <AlertTriangle
                    v-else-if="reminder.includes('中风险') || reminder.includes('缺少')"
                    :size="18"
                    class="text-amber-500"
                  />
                  <Info v-else-if="reminder.includes('暂不展示') || reminder.includes('尚未完成')" :size="18" class="text-stone-500" />
                  <CheckCircle v-else :size="18" class="text-emerald-500" />
                  <span class="reminder-text">{{ reminder }}</span>
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
.delivery-overlay {
  @apply fixed inset-0 bg-stone-900/70 flex items-center justify-center z-50 p-4;
  backdrop-filter: blur(4px);
}

.delivery-container {
  @apply bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden;
}

.delivery-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-teal-50;
}

.header-left {
  @apply flex items-center gap-3;
}

.header-title-group {
  @apply flex flex-col;
}

.header-title-row {
  @apply flex items-center gap-2;
}

.delivery-title {
  @apply text-xl font-bold text-stone-800;
  font-family: 'Playfair Display', serif;
}

.status-badge {
  @apply inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium;
}

.status-badge.all-delivered {
  @apply bg-emerald-100 text-emerald-700;
}

.status-badge.pending {
  @apply bg-amber-100 text-amber-700;
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

.btn-action.secondary {
  @apply text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100;
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
  @apply text-xs px-1.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-600;
}

.tab-count.warning {
  @apply bg-amber-100 text-amber-700;
}

.tab-count.info {
  @apply bg-blue-100 text-blue-700;
}

.delivery-content {
  @apply flex-1 overflow-y-auto;
}

.tab-content {
  @apply p-6 space-y-6;
}

.section-card {
  @apply rounded-xl border border-stone-200 overflow-hidden;
}

.section-title {
  @apply flex items-center gap-2 px-4 py-3 bg-stone-50 text-sm font-semibold text-stone-700 border-b border-stone-200;
}

.activity-details {
  @apply p-4;
}

.activity-name {
  @apply text-lg font-bold text-stone-800 mb-2;
}

.activity-meta {
  @apply flex flex-wrap gap-4;
}

.meta-item {
  @apply flex items-center gap-1.5 text-sm text-stone-600;
}

.section-heading {
  @apply text-sm font-semibold text-stone-700 flex items-center gap-2 mb-3;
}

.overall-progress-card {
  @apply bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-6;
}

.progress-main {
  @apply flex flex-col md:flex-row items-center gap-8;
}

.progress-circle {
  @apply relative w-32 h-32 shrink-0;
}

.progress-ring {
  @apply w-full h-full -rotate-90;
}

.progress-ring-bg {
  @apply fill-none stroke-stone-200 stroke-[8];
}

.progress-ring-fill {
  @apply fill-none stroke-[8] transition-all duration-700 ease-out;
  stroke-linecap: round;
}

.progress-text {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.progress-percent {
  @apply text-2xl font-bold;
  font-family: 'Playfair Display', serif;
}

.progress-label {
  @apply text-xs text-stone-500;
}

.progress-stats {
  @apply flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full;
}

.progress-stat-item {
  @apply flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm;
}

.stat-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center text-white;
}

.stat-icon.printable {
  @apply bg-emerald-500;
}

.stat-icon.handed {
  @apply bg-teal-500;
}

.stat-icon.pending {
  @apply bg-amber-500;
}

.stat-info {
  @apply flex flex-col;
}

.stat-number {
  @apply text-xl font-bold text-stone-800;
  font-family: 'Playfair Display', serif;
}

.stat-label {
  @apply text-xs text-stone-500;
}

.persons-cards {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

.person-mini-card {
  @apply bg-white rounded-xl border border-stone-200 p-4 cursor-pointer
    hover:border-emerald-300 hover:shadow-md transition-all;
}

.person-mini-header {
  @apply flex items-center gap-2 mb-3;
}

.person-avatar-small {
  @apply w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center;
}

.person-name-small {
  @apply flex-1 text-sm font-semibold text-stone-800 truncate;
}

.person-status-badge {
  @apply text-xs px-2 py-0.5 rounded-full font-medium;
}

.person-status-badge.done {
  @apply bg-emerald-100 text-emerald-700;
}

.person-status-badge.pending {
  @apply bg-amber-100 text-amber-700;
}

.person-mini-progress {
  @apply flex items-center gap-2 mb-2;
}

.progress-bar-small {
  @apply flex-1 h-2 bg-stone-100 rounded-full overflow-hidden;
}

.progress-fill-small {
  @apply h-full rounded-full transition-all duration-500;
}

.progress-text-small {
  @apply text-sm font-bold w-12 text-right;
}

.person-mini-stats {
  @apply text-xs text-stone-500;
}

.quick-alerts-section {
  @apply space-y-3;
}

.alert-card {
  @apply flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all;
}

.alert-card.warning {
  @apply bg-amber-50 border-amber-200 text-amber-800;
}

.alert-card.info {
  @apply bg-blue-50 border-blue-200 text-blue-800;
}

.alert-card.success {
  @apply bg-emerald-50 border-emerald-200 text-emerald-800;
}

.alert-content {
  @apply flex-1;
}

.alert-title {
  @apply text-sm font-semibold m-0 mb-1;
}

.alert-desc {
  @apply text-xs m-0 opacity-80;
}

.alert-btn {
  @apply inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
    bg-white/80 hover:bg-white transition-all border-0 cursor-pointer;
}

.section-header-info {
  @apply flex items-center justify-between mb-4;
}

.section-title-info {
  @apply flex items-center gap-2;
}

.section-title-info h3 {
  @apply text-lg font-semibold text-stone-800 m-0;
}

.count-badge {
  @apply text-xs px-2.5 py-1 rounded-full font-medium;
}

.count-badge.warning {
  @apply bg-amber-100 text-amber-700;
}

.count-badge.info {
  @apply bg-blue-100 text-blue-700;
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

.persons-detail-section {
  @apply space-y-4;
}

.person-detail-card {
  @apply bg-white rounded-xl border border-stone-200 overflow-hidden;
}

.person-detail-header {
  @apply flex items-center justify-between px-5 py-4 cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors;
}

.person-detail-info {
  @apply flex items-center gap-3;
}

.person-avatar-medium {
  @apply w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center;
}

.person-detail-text {
  @apply flex flex-col;
}

.person-detail-name {
  @apply text-base font-semibold text-stone-800 m-0;
}

.person-detail-meta {
  @apply text-xs text-stone-500;
}

.person-detail-status {
  @apply flex items-center gap-3;
}

.person-completion-rate {
  @apply text-lg font-bold;
  font-family: 'Playfair Display', serif;
}

.chevron-icon {
  @apply text-xs text-stone-400 transition-transform duration-200;
}

.chevron-icon.rotated {
  @apply rotate-180;
}

.person-detail-progress {
  @apply px-5 py-3 border-y border-stone-100;
}

.progress-bar-medium {
  @apply h-2.5 bg-stone-100 rounded-full overflow-hidden mb-2;
}

.progress-fill-medium {
  @apply h-full rounded-full transition-all duration-500;
}

.person-progress-stats {
  @apply flex gap-3;
}

.stat-badge {
  @apply inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium;
}

.stat-badge.success {
  @apply bg-emerald-100 text-emerald-700;
}

.stat-badge.warning {
  @apply bg-amber-100 text-amber-700;
}

.person-items-list {
  @apply p-4;
}

.items-table {
  @apply border border-stone-200 rounded-xl overflow-hidden;
}

.items-table-header {
  @apply flex bg-stone-50 text-xs font-semibold text-stone-600;
}

.items-table-header > span,
.items-table-row > span {
  @apply px-3 py-2.5;
}

.col-order {
  @apply w-16 shrink-0 text-center;
}

.col-name {
  @apply flex-1 min-w-[100px];
}

.col-status {
  @apply w-20 shrink-0 text-center;
}

.col-maintenance {
  @apply flex-1 min-w-[120px] hidden lg:table-cell;
}

.col-handover {
  @apply flex-1 min-w-[120px] hidden lg:table-cell;
}

.col-time {
  @apply w-36 shrink-0 hidden md:table-cell;
}

.items-table-body {
  @apply max-h-80 overflow-y-auto;
}

.items-table-row {
  @apply flex text-sm border-t border-stone-100;
}

.items-table-row.row-handed {
  @apply bg-emerald-50/30;
}

.items-table-row.row-unhanded {
  @apply bg-amber-50/20;
}

.status-indicator {
  @apply inline-flex items-center justify-center w-full text-xs px-2 py-0.5 rounded-full font-medium;
}

.status-handed {
  @apply bg-emerald-100 text-emerald-700;
}

.status-unhanded {
  @apply bg-amber-100 text-amber-700;
}

.person-card-actions {
  @apply mt-4 flex justify-end;
}

.btn-go-detail {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
    text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200
    transition-all cursor-pointer;
}

.unhanded-list {
  @apply space-y-3;
}

.unhanded-item {
  @apply bg-amber-50 border border-amber-200 rounded-xl p-4;
}

.unhanded-item-header {
  @apply flex items-center gap-2 mb-2;
}

.unhanded-plant {
  @apply flex-1 text-sm font-semibold text-amber-800;
}

.unhanded-person {
  @apply text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium;
}

.unhanded-reason {
  @apply flex items-start gap-2 text-sm text-amber-700;
}

.reason-label {
  @apply font-medium shrink-0;
}

.reason-text {
  @apply flex-1;
}

.reminders-list {
  @apply space-y-2;
}

.reminder-item {
  @apply flex items-start gap-3 p-3.5 rounded-xl border transition-all;
}

.reminder-item.reminder-high {
  @apply bg-red-50 border-red-200 text-red-800;
}

.reminder-item.reminder-medium {
  @apply bg-amber-50 border-amber-200 text-amber-800;
}

.reminder-item.reminder-success {
  @apply bg-emerald-50 border-emerald-200 text-emerald-800;
}

.reminder-item:not(.reminder-high):not(.reminder-medium):not(.reminder-success) {
  @apply bg-stone-50 border-stone-200 text-stone-700;
}

.reminder-text {
  @apply flex-1 text-sm;
}

@keyframes expand {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media print {
  .no-print {
    display: none !important;
  }

  .delivery-overlay {
    @apply fixed inset-0 bg-white;
    backdrop-filter: none;
  }

  .delivery-container {
    @apply max-w-none max-h-none shadow-none rounded-none;
  }
}
</style>
