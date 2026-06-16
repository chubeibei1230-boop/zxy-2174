<script setup lang="ts">
import { usePlantRecordsStore } from '@/stores/plantRecords'
import { LIGHT_TYPES, PROOFREAD_STATUSES, RISK_LABELS } from '@/types'
import type { RiskLevel } from '@/types'
import { Search, FilterX } from 'lucide-vue-next'

const store = usePlantRecordsStore()

function onRiskLevelChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  store.setFilter('riskLevel', val === '' ? '' : Number(val))
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-group">
      <div class="filter-item">
        <Search :size="16" class="filter-icon" />
        <input
          :value="store.filter.search"
          type="text"
          class="filter-input search-input"
          placeholder="搜索植物名、拉丁名、责任人..."
          @input="store.setFilter('search', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <select
        :value="store.filter.lightType"
        class="filter-select"
        @change="store.setFilter('lightType', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部光照</option>
        <option v-for="lt in LIGHT_TYPES" :key="lt" :value="lt">{{ lt }}</option>
      </select>
      <select
        :value="store.filter.responsiblePerson"
        class="filter-select"
        @change="store.setFilter('responsiblePerson', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部责任人</option>
        <option v-for="p in store.responsiblePersons" :key="p" :value="p">{{ p }}</option>
      </select>
      <select
        :value="store.filter.status"
        class="filter-select"
        @change="store.setFilter('status', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部状态</option>
        <option v-for="s in PROOFREAD_STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <select
        :value="store.filter.riskLevel === '' ? '' : store.filter.riskLevel"
        class="filter-select"
        @change="onRiskLevelChange"
      >
        <option value="">全部风险</option>
        <option v-for="lvl in ([0, 1, 2, 3] as RiskLevel[])" :key="lvl" :value="lvl">
          {{ RISK_LABELS[lvl] }}
        </option>
      </select>
      <select
        :value="store.filter.handoverStatus"
        class="filter-select"
        @change="store.setFilter('handoverStatus', ($event.target as HTMLSelectElement).value)"
      >
        <option value="all">全部交接状态</option>
        <option value="notHanded">未交接</option>
        <option value="handed">已交接</option>
      </select>
    </div>
    <button class="btn-reset" @click="store.resetFilter()">
      <FilterX :size="14" />
      <span>重置</span>
    </button>
  </div>
</template>

<style scoped>
.filter-bar {
  @apply flex items-center justify-between gap-4 px-6 py-3 bg-white rounded-xl
    border border-stone-200 mb-4 shadow-sm;
}

.filter-group {
  @apply flex items-center gap-3 flex-wrap;
}

.filter-item {
  @apply relative flex items-center;
}

.filter-icon {
  @apply absolute left-2.5 text-stone-400 pointer-events-none;
}

.search-input {
  @apply pl-8 pr-3;
}

.filter-input,
.filter-select {
  @apply h-9 px-3 rounded-lg border border-stone-200 text-sm bg-stone-50
    text-stone-700 outline-none transition-colors;
  font-family: 'Noto Sans SC', sans-serif;
}

.filter-input:focus,
.filter-select:focus {
  @apply border-emerald-400 ring-1 ring-emerald-400/30;
}

.filter-select {
  @apply cursor-pointer appearance-none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2rem;
}

.btn-reset {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-500
    hover:text-stone-700 hover:bg-stone-100 transition-all text-sm cursor-pointer border-0 bg-transparent;
}
</style>
