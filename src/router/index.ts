import { createRouter, createWebHistory } from 'vue-router'
import ProofreadingWorkbench from '@/pages/ProofreadingWorkbench.vue'

const routes = [
  {
    path: '/',
    name: 'workbench',
    component: ProofreadingWorkbench,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
