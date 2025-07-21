import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useNotificationStore } from '@/stores/notification'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '首页',
        requiresAuth: false,
        keepAlive: true
      }
    },
    // 项目列表页面已集成到首页，此路由重定向到首页
    {
      path: '/projects',
      redirect: '/'
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('../views/ProjectDetailView.vue'),
      meta: {
        title: '项目详情',
        requiresAuth: false,
        keepAlive: false
      }
    },
    // 任务管理已集成到项目详情页，保留全局任务页面用于跨项目查看
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('../views/TasksView.vue'),
      meta: {
        title: '任务管理',
        requiresAuth: false,
        keepAlive: true
      }
    },
    {
      path: '/tasks/:id',
      name: 'task-detail',
      component: () => import('../views/TaskDetailView.vue'),
      meta: {
        title: '任务详情',
        requiresAuth: false,
        keepAlive: false
      }
    },
    {
      path: '/tasks/generate',
      name: 'task-generate',
      component: () => import('../views/TaskGenerateView.vue'),
      meta: {
        title: '生成任务',
        requiresAuth: false,
        keepAlive: false
      }
    },
    // PRD、需求基线、变更请求已集成到项目详情页，这些路由重定向到首页
    {
      path: '/prd',
      redirect: '/'
    },
    {
      path: '/requirements',
      redirect: '/'
    },
    {
      path: '/changes',
      redirect: '/'
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestView.vue'),
    },
  ],
})

// 全局前置守卫
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 任务管理系统`
  } else {
    document.title = '任务管理系统'
  }

  // 权限检查（如果需要）
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      // 重定向到登录页面（如果有的话）
      const notificationStore = useNotificationStore()
      notificationStore.warning('访问受限', '请先登录后再访问此页面')
      next('/')
      return
    }
  }

  // 路由变化通知
  if (from.name && from.name !== to.name) {
    console.log(`Navigation: ${String(from.name)} -> ${String(to.name)}`)
  }

  next()
})

// 全局后置钩子
router.afterEach((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  // 页面切换完成后的处理
  console.log(`Navigation completed: ${String(to.name)}`)

  // 滚动到顶部
  window.scrollTo(0, 0)
})

// 路由错误处理
router.onError((error) => {
  console.error('Router error:', error)
  const notificationStore = useNotificationStore()
  notificationStore.error('页面加载失败', '请刷新页面重试')
})

export default router
