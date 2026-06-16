<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PlantRecord, RiskIssue } from '@/types'
import { LIGHT_TYPES, PROOFREAD_STATUSES } from '@/types'
import { usePlantRecordsStore } from '@/stores/plantRecords'
import {
  GripVertical,
  Trash2,
  Copy,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
} from 'lucide-vue-next'

const props = defineProps<{
  record: PlantRecord
  issues: RiskIssue[]
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'update', id: string, data: Partial<PlantRecord>): void
  (e: 'delete', id: string): void
  (e: 'copy-prev', id: string): void
  (e: 'toggle-select', id: string): void
}>()

const store = usePlantRecordsStore()
const expanded = ref(false)
const localRecord = ref({ ...props.record })

watch(
  () => props.record,
  (newVal) => {
    localRecord.value = { ...newVal }
  },
  { deep: true },
)

function onUpdate(field: keyof PlantRecord, value: any) {
  ;(localRecord.value as any)[field] = value
  emit('update', props.record.id, { [field]: value })
}

const statusColors: Record<string, string> = {
  '待补充': 'bg-stone-200 text-stone-600',
  '待校对': 'bg-amber-100 text-amber-700',
  '可打印': 'bg-emerald-100 text-emerald-700',
  '暂不展示': 'bg-red-100 text-red-600',
}

function getRiskColor(level: number): string {
  if (level >= 3) return 'text-red-500'
  if (level === 2) return 'text-amber-500'
  if (level === 1) return 'text-orange-400'
  return 'text-emerald-500'
}
</script>

<template>
  <div
    class="plant-card"
    :class="{
      'ring-2 ring-amber-400/50': issues.length > 0 && issues.some((i) => i.level >= 2),
      'ring-2 ring-red-400/50': issues.length > 0 && issues.some((i) => i.level >= 3),
      'selected-card': selected,
    }"
  >
    <div class="card-header" @click="expanded = !expanded">
      <div class="card-header-left">
        <GripVertical :size="18" class="drag-handle text-stone-300 cursor-grab" />
        <label class="checkbox-wrapper" @click.stop>
          <input
            type="checkbox"
            :checked="selected"
            class="sr-only"
            @change="emit('toggle-select', record.id)"
          />
          <span class="checkbox-custom" :class="{ checked: selected }">
            <Check v-if="selected" :size="12" />
          </span>
        </label>
        <span class="card-order">#{{ record.displayOrder }}</span>
        <span class="card-name">{{ record.plantName || '未命名' }}</span>
        <span v-if="record.latinName" class="card-latin">{{ record.latinName }}</span>
      </div>
      <div class="card-header-right">
        <span
          class="status-tag"
          :class="statusColors[record.status]"
        >
          {{ record.status }}
        </span>
        <AlertTriangle
          v-if="issues.length > 0"
          :size="16"
          :class="getRiskColor(Math.max(...issues.map((i) => i.level)))"
          class="animate-pulse-once"
        />
        <span class="expand-icon" :class="{ rotated: expanded }">›</span>
      </div>
    </div>

    <Transition name="expand">
      <div v-if="expanded" class="card-body">
        <div class="card-issues" v-if="issues.length > 0">
          <div
            v-for="(issue, idx) in issues"
            :key="idx"
            class="issue-tag"
            :class="{
              'issue-high': issue.level >= 3,
              'issue-medium': issue.level === 2,
              'issue-low': issue.level === 1,
            }"
          >
            <AlertCircle v-if="issue.level >= 2" :size="12" />
            <Info v-else :size="12" />
            <span>{{ issue.message }}</span>
          </div>
        </div>

        <div class="card-fields">
          <div class="field-group">
            <label class="field-label">植物名</label>
            <input
              :value="localRecord.plantName"
              type="text"
              class="field-input"
              placeholder="如：月季"
              @input="onUpdate('plantName', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="field-group">
            <label class="field-label">拉丁名</label>
            <input
              :value="localRecord.latinName"
              type="text"
              class="field-input style-italic"
              placeholder="如：Rosa chinensis"
              @input="onUpdate('latinName', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="field-group">
            <label class="field-label">适合光照</label>
            <select
              :value="localRecord.lightType"
              class="field-select"
              @change="onUpdate('lightType', ($event.target as HTMLSelectElement).value)"
            >
              <option value="">请选择</option>
              <option v-for="lt in LIGHT_TYPES" :key="lt" :value="lt">{{ lt }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">浇水提醒</label>
            <input
              :value="localRecord.wateringReminder"
              type="text"
              class="field-input"
              placeholder="如：每周2次"
              @input="onUpdate('wateringReminder', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="field-group">
            <label class="field-label">展示序号</label>
            <input
              :value="localRecord.displayOrder"
              type="number"
              class="field-input w-20"
              min="1"
              @input="onUpdate('displayOrder', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="field-group">
            <label class="field-label">责任人</label>
            <input
              :value="localRecord.responsiblePerson"
              type="text"
              class="field-input"
              placeholder="如：张三"
              @input="onUpdate('responsiblePerson', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <div class="field-full">
          <label class="field-label">校对备注</label>
          <textarea
            :value="localRecord.proofreadNote"
            class="field-textarea"
            placeholder="补充说明..."
            rows="2"
            @input="onUpdate('proofreadNote', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </div>

        <div class="card-actions">
          <div class="status-buttons">
            <button
              v-for="s in PROOFREAD_STATUSES"
              :key="s"
              class="btn-status"
              :class="[statusColors[s], { active: record.status === s }]"
              @click="onUpdate('status', s)"
            >
              {{ s }}
            </button>
          </div>
          <div class="action-buttons">
            <button class="btn-action btn-copy" @click="emit('copy-prev', record.id)">
              <Copy :size="14" />
              <span>复制上一条</span>
            </button>
            <button class="btn-action btn-delete" @click="emit('delete', record.id)">
              <Trash2 :size="14" />
              <span>删除</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.plant-card {
  @apply bg-white rounded-xl border border-stone-200 shadow-sm
    transition-all duration-200 hover:shadow-md;
}

.plant-card.selected-card {
  @apply ring-2 ring-emerald-400 bg-emerald-50/30;
}

.card-header {
  @apply flex items-center justify-between px-4 py-3 cursor-pointer select-none;
}

.card-header-left {
  @apply flex items-center gap-2.5 flex-1 min-w-0;
}

.card-header-right {
  @apply flex items-center gap-2;
}

.drag-handle {
  @apply shrink-0;
}

.checkbox-wrapper {
  @apply cursor-pointer;
}

.checkbox-custom {
  @apply w-4 h-4 rounded border-2 border-stone-300 flex items-center justify-center
    transition-all duration-150;
}

.checkbox-custom.checked {
  @apply bg-emerald-500 border-emerald-500 text-white;
}

.card-order {
  @apply text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0;
}

.card-name {
  @apply font-semibold text-stone-800 truncate;
}

.card-latin {
  @apply text-sm text-stone-400 italic truncate hidden sm:inline;
}

.status-tag {
  @apply text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap;
}

.expand-icon {
  @apply text-stone-400 text-lg transition-transform duration-200;
}

.expand-icon.rotated {
  @apply rotate-90;
}

.card-body {
  @apply px-4 pb-4 space-y-3;
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

.card-issues {
  @apply space-y-1.5;
}

.issue-tag {
  @apply flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg;
}

.issue-high {
  @apply bg-red-50 text-red-600;
}

.issue-medium {
  @apply bg-amber-50 text-amber-600;
}

.issue-low {
  @apply bg-orange-50 text-orange-500;
}

.card-fields {
  @apply grid grid-cols-2 sm:grid-cols-3 gap-3;
}

.field-group {
  @apply flex flex-col gap-1;
}

.field-label {
  @apply text-xs font-medium text-stone-500;
}

.field-input,
.field-select {
  @apply h-8 px-2.5 rounded-lg border border-stone-200 text-sm bg-stone-50
    text-stone-700 outline-none transition-colors;
}

.field-input:focus,
.field-select:focus {
  @apply border-emerald-400 ring-1 ring-emerald-400/30;
}

.field-input.style-italic {
  font-style: italic;
}

.field-select {
  @apply cursor-pointer;
}

.field-full {
  @apply flex flex-col gap-1;
}

.field-textarea {
  @apply px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm bg-stone-50
    text-stone-700 outline-none resize-none transition-colors;
}

.field-textarea:focus {
  @apply border-emerald-400 ring-1 ring-emerald-400/30;
}

.card-actions {
  @apply flex items-center justify-between pt-2 border-t border-stone-100;
}

.status-buttons {
  @apply flex gap-1.5;
}

.btn-status {
  @apply text-xs px-2.5 py-1 rounded-full cursor-pointer border-0 transition-all
    opacity-60 hover:opacity-100;
}

.btn-status.active {
  @apply opacity-100 ring-2 ring-offset-1;
}

.action-buttons {
  @apply flex gap-2;
}

.btn-action {
  @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs
    cursor-pointer border-0 transition-all;
}

.btn-copy {
  @apply text-emerald-600 bg-emerald-50 hover:bg-emerald-100;
}

.btn-delete {
  @apply text-red-500 bg-red-50 hover:bg-red-100;
}

.w-20 {
  width: 5rem;
}

.animate-pulse-once {
  animation: pulseOnce 1s ease-in-out 2;
}

@keyframes pulseOnce {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
