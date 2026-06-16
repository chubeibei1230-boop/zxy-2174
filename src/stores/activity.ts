import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Activity } from '@/types'
import { createDefaultActivity } from '@/types'
import { dbGetActivity, dbSaveActivity, dbGetAllActivities } from '@/utils/idb'

export const useActivityStore = defineStore('activity', () => {
  const activity = ref<Activity>(createDefaultActivity())
  const loaded = ref(false)

  async function loadActivity(id?: string) {
    if (id) {
      const data = await dbGetActivity(id)
      if (data) {
        activity.value = data
      }
    } else {
      const all = await dbGetAllActivities()
      if (all.length > 0) {
        activity.value = all[0]
      } else {
        await dbSaveActivity(activity.value)
      }
    }
    loaded.value = true
  }

  async function saveActivity(data: Partial<Activity>) {
    activity.value = { ...activity.value, ...data, updatedAt: Date.now() }
    await dbSaveActivity(activity.value)
  }

  function resetActivity() {
    activity.value = createDefaultActivity()
  }

  return { activity, loaded, loadActivity, saveActivity, resetActivity }
})
