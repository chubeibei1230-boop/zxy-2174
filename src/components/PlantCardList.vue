<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { PlantRecord } from '@/types'
import { usePlantRecordsStore } from '@/stores/plantRecords'
import { useAutoCheck } from '@/composables/useAutoCheck'
import PlantCard from './PlantCard.vue'
import { Plus, CopyPlus } from 'lucide-vue-next'

const store = usePlantRecordsStore()
const { getRecordIssues } = useAutoCheck()

const localList = ref<PlantRecord[]>([])

watch(
  () => store.filteredRecords,
  (newVal) => {
    localList.value = [...newVal]
  },
  { immediate: true, deep: true },
)

async function onDragEnd() {
  await store.reorderFiltered(localList.value)
  localList.value = [...store.filteredRecords]
}

function onUpdate(id: string, data: Partial<PlantRecord>) {
  store.updateRecord(id, data)
}

function onDelete(id: string) {
  if (confirm('确定删除这条记录吗？')) {
    store.deleteRecord(id)
  }
}

function onCopyPrev(id: string) {
  const list = localList.value
  const idx = list.findIndex((r) => r.id === id)
  if (idx <= 0) {
    alert('已是第一条记录，没有上一条可复制')
    return
  }
  const sourceId = list[idx - 1].id
  store.copyFromRecord(sourceId, id)
}

async function addNew() {
  await store.addRecord()
}
</script>

<template>
  <div class="card-list">
    <div class="list-header">
      <span class="list-count">
        共 {{ store.filteredRecords.length }} 条
        <span v-if="store.filter.search || store.filter.lightType || store.filter.status || store.filter.responsiblePerson || store.filter.riskLevel !== ''" class="filter-hint">
          （已筛选，总计 {{ store.records.length }} 条）
        </span>
      </span>
      <div class="list-actions">
        <button class="btn-add" @click="addNew">
          <Plus :size="16" />
          <span>添加记录</span>
        </button>
      </div>
    </div>

    <draggable
      :list="localList"
      item-key="id"
      handle=".drag-handle"
      ghost-class="ghost-card"
      drag-class="drag-card"
      :animation="200"
      @end="onDragEnd"
    >
      <template #item="{ element: record }">
        <PlantCard
          :record="record"
          :issues="getRecordIssues(record.id)"
          :selected="store.selectedIds.has(record.id)"
          @update="onUpdate"
          @delete="onDelete"
          @copy-prev="onCopyPrev"
          @toggle-select="store.toggleSelect"
        />
      </template>
    </draggable>

    <div v-if="store.filteredRecords.length === 0" class="empty-state">
      <div class="empty-icon">🌱</div>
      <p class="empty-text">暂无植物记录</p>
      <button class="btn-add-lg" @click="addNew">
        <CopyPlus :size="18" />
        <span>添加第一条记录</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.card-list {
  @apply flex flex-col gap-3;
}

.list-header {
  @apply flex items-center justify-between px-1;
}

.list-count {
  @apply text-sm text-stone-500;
}

.filter-hint {
  @apply text-stone-400 text-xs;
}

.btn-add {
  @apply inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm
    bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer border-0
    shadow-sm hover:shadow;
}

.ghost-card {
  @apply opacity-40 bg-emerald-50;
}

.drag-card {
  @apply shadow-xl scale-[1.02];
}

.empty-state {
  @apply flex flex-col items-center justify-center py-16 text-stone-400;
}

.empty-icon {
  @apply text-5xl mb-4;
}

.empty-text {
  @apply text-lg mb-4;
}

.btn-add-lg {
  @apply inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white
    bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer border-0
    shadow-md hover:shadow-lg;
}
</style>
