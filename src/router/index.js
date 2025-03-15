import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true }
    },
    {
      path: '/pipelines',
      name: 'pipelines',
      component: () => import('@/views/PipelinesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pipelines/:id',
      name: 'pipeline-details',
      component: () => import('@/views/PipelineDetailsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/data-sources',
      name: 'data-sources',
      component: () => import('@/views/DataSourcesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/transformations',
      name: 'transformations',
      component: () => import('@/views/TransformationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tenants',
      name: 'tenants',
      component: () => import('@/views/TenantsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/executions',
      name: 'executions',
      component: () => import('@/views/ExecutionsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const isGuestRoute = to.matched.some(record => record.meta.guest)

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (requiresAdmin && !authStore.isAdmin) {
    next('/')
  } else if (isGuestRoute && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
