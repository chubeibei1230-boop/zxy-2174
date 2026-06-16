import { createRouter, createWebHistory } from 'vue-router'
import ProofreadingWorkbench from '@/pages/ProofreadingWorkbench.vue'
import ResponsiblePersonDashboard from '@/pages/ResponsiblePersonDashboard.vue'
import PersonDetail from '@/pages/PersonDetail.vue'

const routes = [
  {
    path: '/',
    name: 'workbench',
    component: ProofreadingWorkbench,
  },
  {
    path: '/responsible-dashboard',
    name: 'responsible-dashboard',
    component: ResponsiblePersonDashboard,
  },
  {
    path: '/person/:personName',
    name: 'person-detail',
    component: PersonDetail,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
