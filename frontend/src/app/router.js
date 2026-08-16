import { createRouter, createWebHistory } from 'vue-router'
import { missionRoutes } from '../modules/missions/routes.js'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 16 }
    return { top: 0 }
  },
  routes: [
    { path: '/', redirect: '/missions' },
    ...missionRoutes,
  ],
})
