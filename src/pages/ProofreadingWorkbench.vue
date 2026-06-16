<script setup lang="ts">
import { onMounted } from 'vue'
import { useActivityStore } from '@/stores/activity'
import { usePlantRecordsStore } from '@/stores/plantRecords'
import { usePrintBatchStore } from '@/stores/printBatch'
import ActivityInfo from '@/components/ActivityInfo.vue'
import FilterBar from '@/components/FilterBar.vue'
import PlantCardList from '@/components/PlantCardList.vue'
import FloatingSummary from '@/components/FloatingSummary.vue'
import PrintBatchConfirmDialog from '@/components/PrintBatchConfirmDialog.vue'
import DeliverySummaryView from '@/components/DeliverySummaryView.vue'
import PrintBatchHistoryList from '@/components/PrintBatchHistoryList.vue'
import DeliveryConfirmationSummary from '@/components/DeliveryConfirmationSummary.vue'

const activityStore = useActivityStore()
const recordStore = usePlantRecordsStore()
const printBatchStore = usePrintBatchStore()

onMounted(async () => {
  await activityStore.loadActivity()
  if (activityStore.activity.id) {
    await recordStore.loadRecords(activityStore.activity.id)
    await printBatchStore.loadBatches(activityStore.activity.id)
    await printBatchStore.loadLatestBatch(activityStore.activity.id)
  } else {
    await activityStore.saveActivity({})
    await recordStore.loadRecords(activityStore.activity.id)
  }
})
</script>

<template>
  <div class="workbench" v-if="activityStore.loaded">
    <ActivityInfo />
    <FilterBar />

    <div class="main-layout">
      <div class="main-content">
        <PlantCardList />
      </div>
      <aside class="sidebar">
        <FloatingSummary />
      </aside>
    </div>

    <PrintBatchConfirmDialog />
    <DeliverySummaryView />
    <PrintBatchHistoryList />
    <DeliveryConfirmationSummary />
  </div>
  <div v-else class="loading">
    <div class="loading-icon">🌿</div>
    <p>加载中...</p>
  </div>
</template>

<style scoped>
.workbench {
  @apply max-w-7xl mx-auto px-4 py-6;
}

.main-layout {
  @apply flex flex-col md:flex-row gap-6;
}

.main-content {
  @apply flex-1 min-w-0;
}

.sidebar {
  @apply shrink-0;
}

.loading {
  @apply flex flex-col items-center justify-center min-h-screen text-stone-400;
}

.loading-icon {
  @apply text-4xl mb-3 animate-bounce;
}
</style>
