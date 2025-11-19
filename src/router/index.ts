import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { analytics } from '@/assets/script/analytics'
import Index from '@/views/Index.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Index',
    component: Index
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由变化时发送页面浏览统计
router.afterEach((to) => {
  analytics.trackPageView(to.path)
})

export default router
