// missions 모듈의 라우트 정의.
// platform frontend로 이식할 때 이 배열을 그쪽 라우터에 spread 하면 된다.
export const missionRoutes = [
  {
    path: '/missions',
    name: 'mission-list',
    component: () => import('./pages/HomePage.vue'),
  },
  {
    path: '/missions/history',
    name: 'mission-history',
    component: () => import('./pages/HistoryPage.vue'),
  },
  {
    path: '/missions/:id',
    name: 'mission-detail',
    component: () => import('./pages/MissionPage.vue'),
  },
  {
    path: '/missions/:id/review',
    name: 'mission-review',
    component: () => import('./pages/ReviewPage.vue'),
  },
  {
    path: '/projects',
    name: 'project-list',
    component: () => import('./pages/ProjectsPage.vue'),
  },
  {
    path: '/projects/:id',
    name: 'project-journey',
    component: () => import('./pages/ProjectJourneyPage.vue'),
  },
]
