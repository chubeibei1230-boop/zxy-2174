<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore } from '@/stores/activity'
import { usePlantRecordsStore } from '@/stores/plantRecords'
import { usePrintBatchStore } from '@/stores/printBatch'
import {
  Users,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  User,
} from 'lucide-vue-next'

const router = useRouter()
const activityStore = useActivityStore()
const recordStore = usePlantRecordsStore()
const printBatchStore = usePrintBatchStore()

const handoverProgress = computed(() => recordStore.handoverSummary)

function goToPersonDetail(personName: string) {
  router.push({ name: 'person-detail', params: { personName } })
}

function goBack() {
  router.push({ name: 'workbench' })
}

onMounted(async () => {
  await activityStore.loadActivity()
  if (activityStore.activity.id) {
    await recordStore.loadRecords(activityStore.activity.id)
    await printBatchStore.loadBatches(activityStore.activity.id)
    await printBatchStore.loadLatestBatch(activityStore.activity.id)
  }
})
</script>

<template>
  <div class="dashboard-page">
    <div class="page-header">
      <button class="btn-back" @click="goBack">
        <ArrowLeft :size="18" />
        <span>返回工作台</span>
      </button>
      <div class="page-title-section">
        <div class="title-icon">
          <Users :size="24" class="text-emerald-600" />
        </div>
        <div class="title-text">
          <h1 class="page-title">责任人任务看板</h1>
          <p class="page-subtitle">{{ activityStore.activity.name }} · 交接确认进度</p>
        </div>
      </div>
    </div>

    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon total-icon">
          <Users :size="20" />
        </div>
        <div class="card-content">
          <span class="card-number">{{ recordStore.personTaskSummaries.length }}</span>
          <span class="card-label">责任人数</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon handed-icon">
          <CheckCircle :size="20" />
        </div>
        <div class="card-content">
          <span class="card-number">{{ handoverProgress.handedOverCount }}</span>
          <span class="card-label">已交接</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon pending-icon">
          <Clock :size="20" />
        </div>
        <div class="card-content">
          <span class="card-number">{{ handoverProgress.notHandedOverCount }}</span>
          <span class="card-label">待交接</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon total-records-icon">
          <FileText :size="20" />
        </div>
        <div class="card-content">
          <span class="card-number">{{ handoverProgress.totalCount }}</span>
          <span class="card-label">总记录数</span>
        </div>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-title">整体交接进度</span>
        <span class="progress-percent">{{ handoverProgress.progress.toFixed(1) }}%</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: handoverProgress.progress + '%' }"
        ></div>
      </div>
      <div class="progress-detail">
        <span class="progress-hint">
          已完成 {{ handoverProgress.handedOverCount }} / {{ handoverProgress.totalCount }} 条
        </span>
      </div>
    </div>

    <div class="person-list-section">
      <h2 class="section-title">责任人任务清单</h2>
      <div class="person-cards-grid">
        <div
          v-for="person in recordStore.personTaskSummaries"
          :key="person.personName"
          class="person-card"
          @click="goToPersonDetail(person.personName)"
        >
          <div class="person-card-header">
            <div class="person-avatar">
              <User :size="20" />
            </div>
            <div class="person-info">
              <h3 class="person-name">{{ person.personName }}</h3>
              <span class="person-total">负责 {{ person.totalCount }} 条记录</span>
            </div>
            <ChevronRight :size="18" class="arrow-icon" />
          </div>

          <div class="person-stats">
            <div class="stat-item">
              <span class="stat-value pending-supplement">{{ person.toBeSupplementedCount }}</span>
              <span class="stat-label">待补充</span>
            </div>
            <div class="stat-item">
              <span class="stat-value pending-proofread">{{ person.pendingProofreadCount }}</span>
              <span class="stat-label">待校对</span>
            </div>
            <div class="stat-item">
              <span class="stat-value printable">{{ person.printableCount }}</span>
              <span class="stat-label">可打印</span>
            </div>
            <div class="stat-item">
              <span class="stat-value risk" v-if="person.riskCount > 0">{{ person.riskCount }}</span>
              <span class="stat-value no-risk" v-else>0</span>
              <span class="stat-label">风险项</span>
            </div>
          </div>

          <div class="person-handover-progress">
            <div class="handover-progress-header">
              <span class="handover-label">交接进度</span>
              <span class="handover-count">
                {{ person.handedOverCount }}/{{ person.totalCount }}
              </span>
            </div>
            <div class="handover-progress-bar">
              <div
                class="handover-progress-fill"
                :style="{ width: (person.totalCount > 0 ? (person.handedOverCount / person.totalCount) * 100 : 0) + '%' }"
              ></div>
            </div>
          </div>

          <div class="person-card-footer">
            <span class="footer-status" :class="{ 'all-handed': person.notHandedOverCount === 0 }">
              <CheckCircle v-if="person.notHandedOverCount === 0" :size="14" />
              <AlertTriangle v-else :size="14" />
              {{ person.notHandedOverCount === 0 ? '全部已交接' : `还有 ${person.notHandedOverCount} 条待交接` }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="recordStore.personTaskSummaries.length === 0" class="empty-state">
        <div class="empty-icon">👤</div>
        <p class="empty-text">暂无责任人数据</p>
        <p class="empty-hint">请先在植物记录中设置责任人</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  @apply max-w-6xl mx-auto px-4 py-6 space-y-6;
}

.page-header {
  @apply space-y-4;
}

.btn-back {
  @apply inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-stone-500
    hover:text-stone-700 hover:bg-stone-100 transition-all text-sm cursor-pointer
    border-0 bg-transparent;
}

.page-title-section {
  @apply flex items-center gap-3;
}

.title-icon {
  @apply w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center;
}

.title-text {
  @apply flex flex-col;
}

.page-title {
  @apply text-2xl font-bold text-stone-800 m-0;
  font-family: 'Playfair Display', serif;
}

.page-subtitle {
  @apply text-sm text-stone-400 m-0;
}

.overview-cards {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.overview-card {
  @apply bg-white rounded-xl border border-stone-200 shadow-sm p-4
    flex items-center gap-3 transition-all hover:shadow-md;
}

.card-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center text-white;
}

.total-icon {
  @apply bg-emerald-500;
}

.handed-icon {
  @apply bg-teal-500;
}

.pending-icon {
  @apply bg-amber-500;
}

.total-records-icon {
  @apply bg-stone-500;
}

.card-content {
  @apply flex flex-col;
}

.card-number {
  @apply text-2xl font-bold text-stone-800;
  font-family: 'Playfair Display', serif;
}

.card-label {
  @apply text-xs text-stone-400;
}

.progress-section {
  @apply bg-white rounded-xl border border-stone-200 shadow-sm p-5;
}

.progress-header {
  @apply flex items-center justify-between mb-3;
}

.progress-title {
  @apply text-sm font-medium text-stone-700;
}

.progress-percent {
  @apply text-lg font-bold text-emerald-600;
  font-family: 'Playfair Display', serif;
}

.progress-bar {
  @apply h-3 bg-stone-100 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full
    transition-all duration-500 ease-out;
}

.progress-detail {
  @apply mt-2 text-right;
}

.progress-hint {
  @apply text-xs text-stone-400;
}

.person-list-section {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-bold text-stone-800 m-0;
  font-family: 'Playfair Display', serif;
}

.person-cards-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.person-card {
  @apply bg-white rounded-xl border border-stone-200 shadow-sm p-5
    cursor-pointer transition-all hover:shadow-md hover:border-emerald-200
    space-y-4;
}

.person-card-header {
  @apply flex items-center gap-3;
}

.person-avatar {
  @apply w-10 h-10 rounded-full bg-emerald-100 text-emerald-600
    flex items-center justify-center shrink-0;
}

.person-info {
  @apply flex-1 min-w-0;
}

.person-name {
  @apply text-base font-semibold text-stone-800 m-0 truncate;
}

.person-total {
  @apply text-xs text-stone-400;
}

.arrow-icon {
  @apply text-stone-300 shrink-0;
}

.person-stats {
  @apply grid grid-cols-4 gap-2 py-3 border-y border-stone-100;
}

.stat-item {
  @apply flex flex-col items-center;
}

.stat-value {
  @apply text-lg font-bold;
  font-family: 'Playfair Display', serif;
}

.stat-label {
  @apply text-xs text-stone-400 mt-0.5;
}

.pending-supplement {
  @apply text-stone-500;
}

.pending-proofread {
  @apply text-amber-600;
}

.printable {
  @apply text-emerald-600;
}

.risk {
  @apply text-red-500;
}

.no-risk {
  @apply text-stone-300;
}

.person-handover-progress {
  @apply space-y-2;
}

.handover-progress-header {
  @apply flex items-center justify-between text-sm;
}

.handover-label {
  @apply text-stone-500;
}

.handover-count {
  @apply font-medium text-stone-700;
}

.handover-progress-bar {
  @apply h-2 bg-stone-100 rounded-full overflow-hidden;
}

.handover-progress-fill {
  @apply h-full bg-emerald-500 rounded-full transition-all duration-300;
}

.person-card-footer {
  @apply pt-1;
}

.footer-status {
  @apply inline-flex items-center gap-1.5 text-xs font-medium;
}

.footer-status.all-handed {
  @apply text-emerald-600;
}

.footer-status:not(.all-handed) {
  @apply text-amber-600;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-16 text-stone-400;
}

.empty-icon {
  @apply text-5xl mb-3;
}

.empty-text {
  @apply text-base font-medium text-stone-500 m-0 mb-1;
}

.empty-hint {
  @apply text-sm text-stone-400 m-0;
}
</style>
