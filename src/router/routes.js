const routes = [
  {
    path: '/',
    component: () => import('pages/SelectBuilding.vue'),
  },
  {
    path: 'map', component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '', name: 'map', component: () => import('pages/Map.vue'), props: true
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
