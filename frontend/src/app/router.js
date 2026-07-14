import { createRouter, createWebHistory } from 'vue-router'
import { missionRoutes } from '../modules/missions/routes.js'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/missions' },
    ...missionRoutes,
  ],
})
