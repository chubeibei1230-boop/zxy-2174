<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useActivityStore } from '@/stores/activity'
import { usePlantRecordsStore } from '@/stores/plantRecords'
import type { PlantRecord } from '@/types'
import {
  ArrowLeft,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  ChevronDown,
  Check,
  X,
  Leaf,
  Droplets,
  Sun,
  ClipboardList,
  Handshake,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const activityStore = useActivityStore()
const recordStore = usePlantRecordsStore()

const personName = computed(() => route.params.personName as string)
const personRecords = computed(() => recordStore.getRecordsByPerson(personName.value))

const expandedRecords = ref<Set<string>>(new Set())
const localRecords = ref<Map<string, PlantRecord>>(new Map())

const personSummary = computed(() => {
  const total = personRecords.value.length
  const handedOver = personRecords.value.filter((r) => r.isHandedOver).length
  const toBeSupplemented = personRecords.value.filter((r) => r.status === '待补充').length
  const pendingProofread = personRecords.value.filter((r) => r.status === '待校对').length
  const printable = personRecords.value.filter((r) => r.status === '可打印').length
  const riskCount = personRecords.value.filter((r) => r.riskLevel > 0).length
  const progress = total > 0 ? (handedOver / total) * 100 : 0
  return {
    total,
    handedOver,
    notHandedOver: total - handedOver,
    toBeSupplemented,
    pendingProofread,
    printable,
    riskCount,
    progress,
  }
})

function toggleExpand(id: string) {
  if (expandedRecords.value.has(id)) {
    expandedRecords.value.delete(id)
  } else {
    expandedRecords.value.add(id)
  }
  expandedRecords.value = new Set(expandedRecords.value)
}

function isExpanded(id: string): boolean {
  return expandedRecords.value.has(id)
}

function getLocalRecord(id: string): PlantRecord {
  if (!localRecords.value.has(id)) {
    const sourceRecord = personRecords.value.find((r) => r.id === id)
    if (sourceRecord) {
      localRecords.value.set(id, { ...sourceRecord })
    }
  }
  return localRecords.value.get(id) || { id } as PlantRecord
}

function updateLocalField(id: string, field: keyof PlantRecord, value: any) {
  const record = getLocalRecord(id)
  if (!record) return
  ;(record as any)[field] = value
  localRecords.value = new Map(localRecords.value)
}

async function handleUpdateMaintenance(id: string, maintenanceInfo: string) {
  await recordStore.updateMaintenanceInfo(id, maintenanceInfo)
  updateLocalField(id, 'maintenanceInfo', maintenanceInfo)
}

async function handleUpdateHandoverNote(id: string, handoverNote: string) {
  await recordStore.updateHandoverNote(id, handoverNote)
  updateLocalField(id, 'handoverNote', handoverNote)
}

async function handleMarkHandedOver(id: string) {
  const record = personRecords.value.find((r) => r.id === id)
  if (!record) return
  await recordStore.markAsHandedOver(id, record.handoverNote)
  updateLocalField(id, 'isHandedOver', true)
  updateLocalField(id, 'handedOverAt', Date.now())
}

async function handleCancelHandover(id: string) {
  await recordStore.cancelHandover(id)
  updateLocalField(id, 'isHandedOver', false)
  updateLocalField(id, 'handedOverAt', null)
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function goBack() {
  router.push({ name: 'responsible-dashboard' })
}

const statusColors: Record<string, string> = {
  '待补充': 'bg-stone-200 text-stone-600',
  '待校对': 'bg-amber-100 text-amber-700',
  '可打印': 'bg-emerald-100 text-emerald-700',
  '暂不展示': 'bg-red-100 text-red-600',
}

const lightIcons: Record<string, string> = {
  '全日照': '☀️',
  '半日照': '🌤️',
  '耐阴': '🌥️',
  '喜散射光': '💫',
}

onMounted(async () => {
  await activityStore.loadActivity()
  if (activityStore.activity.id) {
    await recordStore.loadRecords(activityStore.activity.id)
    personRecords.value.forEach((r) => {
      localRecords.value.set(r.id, { ...r })
    })
  }
})
</script>

<template>
  <div class="person-detail-page">
    <div class="page-header">
      <button class="btn-back" @click="goBack">
        <ArrowLeft :size="18" />
        <span>返回看板</span>
      </button>

      <div class="person-header">
        <div class="person-avatar-large">
          <User :size="28" />
        </div>
        <div class="person-header-info">
          <h1 class="person-name-large">{{ personName }}</h1>
          <p class="person-role">活动责任人</p>
        </div>
        <div
          class="handover-badge"
          :class="personSummary.notHandedOver === 0 ? 'all-done' : 'pending'"
        >
          <CheckCircle v-if="personSummary.notHandedOver === 0" :size="14" />
          <Clock v-else :size="14" />
          <span>{{ personSummary.notHandedOver === 0 ? '全部已交接' : '待交接' }}</span>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <FileText :size="18" />
        </div>
        <div class="stat-content">
          <span class="stat-number">{{ personSummary.total }}</span>
          <span class="stat-label">总记录</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon supplement">
          <Leaf :size="18" />
        </div>
        <div class="stat-content">
          <span class="stat-number">{{ personSummary.toBeSupplemented }}</span>
          <span class="stat-label">待补充</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon proofread">
          <ClipboardList :size="18" />
        </div>
        <div class="stat-content">
          <span class="stat-number">{{ personSummary.pendingProofread }}</span>
          <span class="stat-label">待校对</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon printable">
          <CheckCircle :size="18" />
        </div>
        <div class="stat-content">
          <span class="stat-number">{{ personSummary.printable }}</span>
          <span class="stat-label">可打印</span>
        </div>
      </div>
    </div>

    <div class="handover-progress-card">
      <div class="progress-header">
        <div class="progress-title-row">
          <Handshake :size="18" class="text-emerald-600" />
          <span class="progress-title">交接进度</span>
        </div>
        <span class="progress-percent">{{ personSummary.progress.toFixed(1) }}%</span>
      </div>
      <div class="progress-bar-large">
        <div
          class="progress-fill-large"
          :style="{ width: personSummary.progress + '%' }"
        ></div>
      </div>
      <div class="progress-stats-row">
        <div class="progress-stat">
          <span class="dot handed-dot"></span>
          <span class="progress-stat-label">已交接</span>
          <span class="progress-stat-value">{{ personSummary.handedOver }}</span>
        </div>
        <div class="progress-stat">
          <span class="dot not-handed-dot"></span>
          <span class="progress-stat-label">待交接</span>
          <span class="progress-stat-value">{{ personSummary.notHandedOver }}</span>
        </div>
        <div class="progress-stat">
          <AlertTriangle v-if="personSummary.riskCount > 0" :size="14" class="text-amber-500" />
          <span class="progress-stat-label">风险项</span>
          <span class="progress-stat-value" :class="{ 'text-amber-500': personSummary.riskCount > 0 }">
            {{ personSummary.riskCount }}
          </span>
        </div>
      </div>
    </div>

    <div class="records-section">
      <h2 class="section-title">植物记录清单</h2>

      <div class="records-list">
        <div
          v-for="record in personRecords"
          :key="record.id"
          class="record-card"
          :class="{ 'handed-over': record.isHandedOver }"
        >
          <div class="record-card-header" @click="toggleExpand(record.id)">
            <div class="record-left">
              <span class="record-order">#{{ record.displayOrder }}</span>
              <span class="record-name">{{ record.plantName || '未命名' }}</span>
              <span v-if="record.latinName" class="record-latin">{{ record.latinName }}</span>
            </div>
            <div class="record-right">
              <span class="status-tag" :class="statusColors[record.status]">
                {{ record.status }}
              </span>
              <span v-if="record.isHandedOver" class="handover-tag handed">
                <Check :size="12" />
                已交接
              </span>
              <span v-else class="handover-tag not-handed">
                <Clock :size="12" />
                待交接
              </span>
              <ChevronDown
                :size="18"
                class="expand-icon"
                :class="{ rotated: isExpanded(record.id) }"
              />
            </div>
          </div>

          <Transition name="expand">
            <div v-if="isExpanded(record.id)" class="record-card-body">
              <div class="record-info-grid">
                <div class="info-item">
                  <Sun :size="14" class="info-icon" />
                  <span class="info-label">光照需求</span>
                  <span class="info-value">{{ record.lightType || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <Droplets :size="14" class="info-icon" />
                  <span class="info-label">浇水提醒</span>
                  <span class="info-value">{{ record.wateringReminder || '未设置' }}</span>
                </div>
                <div class="info-item" v-if="record.handedOverAt">
                  <CheckCircle :size="14" class="info-icon text-emerald-500" />
                  <span class="info-label">交接时间</span>
                  <span class="info-value">{{ formatDate(record.handedOverAt) }}</span>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-header">
                  <Leaf :size="14" class="text-emerald-600" />
                  <span class="form-section-title">养护信息</span>
                </div>
                <textarea
                  :value="getLocalRecord(record.id).maintenanceInfo"
                  class="form-textarea"
                  placeholder="请填写养护信息，如养护要点、注意事项等..."
                  rows="3"
                  @blur="handleUpdateMaintenance(record.id, ($event.target as HTMLTextAreaElement).value)"
                  @input="updateLocalField(record.id, 'maintenanceInfo', ($event.target as HTMLTextAreaElement).value)"
                ></textarea>
              </div>

              <div class="form-section">
                <div class="form-section-header">
                  <ClipboardList :size="14" class="text-amber-600" />
                  <span class="form-section-title">交接备注</span>
                </div>
                <textarea
                  :value="getLocalRecord(record.id).handoverNote"
                  class="form-textarea"
                  placeholder="请填写交接备注，如交接时的特殊说明..."
                  rows="2"
                  @blur="handleUpdateHandoverNote(record.id, ($event.target as HTMLTextAreaElement).value)"
                  @input="updateLocalField(record.id, 'handoverNote', ($event.target as HTMLTextAreaElement).value)"
                ></textarea>
              </div>

              <div class="action-section">
                <button
                  v-if="!record.isHandedOver"
                  class="btn-handover"
                  @click="handleMarkHandedOver(record.id)"
                >
                  <CheckCircle :size="16" />
                  <span>标记已交接确认</span>
                </button>
                <button
                  v-else
                  class="btn-cancel-handover"
                  @click="handleCancelHandover(record.id)"
                >
                  <X :size="16" />
                  <span>取消交接</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div v-if="personRecords.length === 0" class="empty-state">
        <div class="empty-icon">🌱</div>
        <p class="empty-text">该责任人暂无植物记录</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.person-detail-page {
  @apply max-w-4xl mx-auto px-4 py-6 space-y-5;
}

.page-header {
  @apply space-y-4;
}

.btn-back {
  @apply inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-stone-500
    hover:text-stone-700 hover:bg-stone-100 transition-all text-sm cursor-pointer
    border-0 bg-transparent;
}

.person-header {
  @apply flex items-center gap-4;
}

.person-avatar-large {
  @apply w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600
    flex items-center justify-center shrink-0;
}

.person-header-info {
  @apply flex-1 min-w-0;
}

.person-name-large {
  @apply text-xl font-bold text-stone-800 m-0;
  font-family: 'Playfair Display', serif;
}

.person-role {
  @apply text-sm text-stone-400 m-0;
}

.handover-badge {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium;
}

.handover-badge.all-done {
  @apply bg-emerald-100 text-emerald-700;
}

.handover-badge.pending {
  @apply bg-amber-100 text-amber-700;
}

.stats-row {
  @apply grid grid-cols-2 md:grid-cols-4 gap-3;
}

.stat-card {
  @apply bg-white rounded-xl border border-stone-200 shadow-sm p-4
    flex items-center gap-3;
}

.stat-icon {
  @apply w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0;
}

.stat-icon.total {
  @apply bg-emerald-500;
}

.stat-icon.supplement {
  @apply bg-stone-400;
}

.stat-icon.proofread {
  @apply bg-amber-500;
}

.stat-icon.printable {
  @apply bg-teal-500;
}

.stat-content {
  @apply flex flex-col min-w-0;
}

.stat-number {
  @apply text-xl font-bold text-stone-800;
  font-family: 'Playfair Display', serif;
}

.stat-label {
  @apply text-xs text-stone-400;
}

.handover-progress-card {
  @apply bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4;
}

.progress-header {
  @apply flex items-center justify-between;
}

.progress-title-row {
  @apply flex items-center gap-2;
}

.progress-title {
  @apply text-sm font-medium text-stone-700;
}

.progress-percent {
  @apply text-xl font-bold text-emerald-600;
  font-family: 'Playfair Display', serif;
}

.progress-bar-large {
  @apply h-4 bg-stone-100 rounded-full overflow-hidden;
}

.progress-fill-large {
  @apply h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full
    transition-all duration-500 ease-out;
}

.progress-stats-row {
  @apply flex items-center gap-6;
}

.progress-stat {
  @apply flex items-center gap-1.5 text-sm;
}

.dot {
  @apply w-2.5 h-2.5 rounded-full shrink-0;
}

.handed-dot {
  @apply bg-emerald-500;
}

.not-handed-dot {
  @apply bg-stone-300;
}

.progress-stat-label {
  @apply text-stone-500;
}

.progress-stat-value {
  @apply font-medium text-stone-700;
}

.records-section {
  @apply space-y-3;
}

.section-title {
  @apply text-lg font-bold text-stone-800 m-0;
  font-family: 'Playfair Display', serif;
}

.records-list {
  @apply space-y-3;
}

.record-card {
  @apply bg-white rounded-xl border border-stone-200 shadow-sm
    transition-all duration-200 overflow-hidden;
}

.record-card.handed-over {
  @apply border-emerald-200 bg-emerald-50/20;
}

.record-card-header {
  @apply flex items-center justify-between px-4 py-3 cursor-pointer select-none;
}

.record-left {
  @apply flex items-center gap-2.5 flex-1 min-w-0;
}

.record-order {
  @apply text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0;
}

.record-name {
  @apply font-semibold text-stone-800 truncate;
}

.record-latin {
  @apply text-sm text-stone-400 italic truncate hidden sm:inline;
}

.record-right {
  @apply flex items-center gap-2 shrink-0;
}

.status-tag {
  @apply text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap;
}

.handover-tag {
  @apply inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap;
}

.handover-tag.handed {
  @apply bg-emerald-100 text-emerald-700;
}

.handover-tag.not-handed {
  @apply bg-stone-100 text-stone-500;
}

.expand-icon {
  @apply text-stone-400 transition-transform duration-200;
}

.expand-icon.rotated {
  @apply rotate-180;
}

.record-card-body {
  @apply px-4 pb-4 space-y-4 border-t border-stone-100 pt-4;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.record-info-grid {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-3;
}

.info-item {
  @apply flex flex-col gap-1 p-2.5 bg-stone-50 rounded-lg;
}

.info-icon {
  @apply text-stone-400;
}

.info-label {
  @apply text-xs text-stone-400;
}

.info-value {
  @apply text-sm font-medium text-stone-700;
}

.form-section {
  @apply space-y-2;
}

.form-section-header {
  @apply flex items-center gap-1.5;
}

.form-section-title {
  @apply text-sm font-medium text-stone-700;
}

.form-textarea {
  @apply w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm bg-white
    text-stone-700 outline-none resize-none transition-colors;
}

.form-textarea:focus {
  @apply border-emerald-400 ring-1 ring-emerald-400/30;
}

.action-section {
  @apply pt-2;
}

.btn-handover {
  @apply inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
    bg-gradient-to-r from-emerald-500 to-teal-500 text-white
    hover:from-emerald-600 hover:to-teal-600 transition-all cursor-pointer
    border-0 shadow-sm;
}

.btn-cancel-handover {
  @apply inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
    bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all cursor-pointer
    border-0;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-16 text-stone-400;
}

.empty-icon {
  @apply text-5xl mb-3;
}

.empty-text {
  @apply text-base font-medium text-stone-500 m-0;
}
</style>
