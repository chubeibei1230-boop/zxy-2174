<script setup lang="ts">
import { computed } from 'vue'
import { usePrintBatchStore } from '@/stores/printBatch'
import type { PrintBatch } from '@/types'
import {
  X,
  FileCheck,
  Eye,
  Edit3,
  Calendar,
  User,
  FileText,
  Package,
  Clock,
} from 'lucide-vue-next'

const printBatchStore = usePrintBatchStore()

const sortedBatches = computed(() => {
  return [...printBatchStore.batches].sort((a, b) => b.confirmedAt - a.confirmedAt)
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

function handleView(batch: PrintBatch) {
  printBatchStore.viewBatchFromHistory(batch)
}

function handleEdit(batch: PrintBatch) {
  printBatchStore.openHistoryBatchForEdit(batch)
}

function handleClose() {
  printBatchStore.closeHistoryListView()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="printBatchStore.showHistoryList" class="history-overlay" @click.self="handleClose">
      <div class="history-container">
        <div class="history-header">
          <div class="header-left">
            <FileCheck :size="20" class="text-emerald-600" />
            <h2 class="history-title">历史交付批次</h2>
            <span class="count-badge">共 {{ sortedBatches.length }} 个批次</span>
          </div>
          <button class="btn-close" @click="handleClose">
            <X :size="18" />
          </button>
        </div>

        <div class="history-content">
          <div v-if="sortedBatches.length === 0" class="empty-state">
            <Package :size="48" class="text-stone-300" />
            <p class="empty-text">暂无历史交付批次</p>
          </div>

          <div v-else class="batch-list">
            <div v-for="batch in sortedBatches" :key="batch.id" class="batch-card">
              <div class="batch-header">
                <div class="batch-title-row">
                  <span class="version-tag">{{ batch.version }}</span>
                  <span class="batch-activity">{{ batch.activitySnapshot.name || '未命名活动' }}</span>
                </div>
                <div class="batch-meta">
                  <span class="meta-item">
                    <Clock :size="12" />
                    {{ formatDate(batch.confirmedAt) }}
                  </span>
                  <span class="meta-item">
                    <User :size="12" />
                    {{ batch.confirmedBy || '负责人' }}
                  </span>
                </div>
              </div>

              <div class="batch-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ batch.summary.totalRecords }}</span>
                  <span class="stat-label">总记录</span>
                </div>
                <div class="stat-item printable">
                  <span class="stat-value">{{ batch.summary.printableCount }}</span>
                  <span class="stat-label">可打印</span>
                </div>
                <div class="stat-item missing">
                  <span class="stat-value">{{ batch.summary.pendingCount + batch.summary.toBeSupplementedCount }}</span>
                  <span class="stat-label">遗漏项</span>
                </div>
                <div class="stat-item risk">
                  <span class="stat-value">{{ batch.summary.highRiskCount + batch.summary.mediumRiskCount }}</span>
                  <span class="stat-label">风险项</span>
                </div>
              </div>

              <div v-if="batch.deliveryNote" class="batch-note">
                <FileText :size="12" class="text-stone-400" />
                <span class="note-text">{{ batch.deliveryNote }}</span>
              </div>

              <div class="batch-actions">
                <button class="btn-view" @click="handleView(batch)">
                  <Eye :size="14" />
                  查看汇总
                </button>
                <button class="btn-edit" @click="handleEdit(batch)">
                  <Edit3 :size="14" />
                  修改备注
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.history-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
  backdrop-filter: blur(2px);
}

.history-container {
  @apply bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden;
}

.history-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50;
}

.header-left {
  @apply flex items-center gap-3;
}

.history-title {
  @apply text-lg font-bold text-stone-800;
  font-family: 'Playfair Display', serif;
}

.count-badge {
  @apply text-xs px-2 py-0.5 bg-stone-200 text-stone-600 rounded-full;
}

.btn-close {
  @apply p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-all cursor-pointer border-0;
}

.history-content {
  @apply flex-1 overflow-y-auto p-6;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-16 gap-4;
}

.empty-text {
  @apply text-stone-400 text-sm;
}

.batch-list {
  @apply space-y-4;
}

.batch-card {
  @apply border border-stone-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all;
}

.batch-header {
  @apply mb-4;
}

.batch-title-row {
  @apply flex items-center gap-2 mb-2;
}

.version-tag {
  @apply text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-mono;
}

.batch-activity {
  @apply text-sm font-medium text-stone-700;
}

.batch-meta {
  @apply flex items-center gap-4 text-xs text-stone-500;
}

.meta-item {
  @apply flex items-center gap-1;
}

.batch-stats {
  @apply grid grid-cols-4 gap-3 mb-4;
}

.stat-item {
  @apply text-center p-2 bg-stone-50 rounded-lg;
}

.stat-item.printable {
  @apply bg-emerald-50;
}

.stat-item.missing {
  @apply bg-amber-50;
}

.stat-item.risk {
  @apply bg-red-50;
}

.stat-value {
  @apply block text-lg font-bold text-stone-700;
}

.stat-item.printable .stat-value {
  @apply text-emerald-600;
}

.stat-item.missing .stat-value {
  @apply text-amber-600;
}

.stat-item.risk .stat-value {
  @apply text-red-600;
}

.stat-label {
  @apply block text-xs text-stone-500 mt-1;
}

.batch-note {
  @apply flex items-start gap-2 p-3 bg-stone-50 rounded-lg mb-4 text-sm text-stone-600;
}

.note-text {
  @apply flex-1 line-clamp-2;
}

.batch-actions {
  @apply flex gap-2 justify-end;
}

.btn-view {
  @apply flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-all cursor-pointer border-0;
}

.btn-edit {
  @apply flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all cursor-pointer border-0;
}
</style>
