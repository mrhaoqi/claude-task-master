// 应用全局状态管理 - 使用单例模式
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User, ThemeConfig, AppConfig, Notification } from '@/types'
import { storageUtils } from '@/utils'
import { STORAGE_KEYS, THEME_CONFIG } from '@/constants'

export const useAppStore = defineStore('app', () => {
  // 状态
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const sidebarCollapsed = ref(false)
  const notifications = ref<Notification[]>([])
  
  // 主题配置
  const themeConfig = ref<ThemeConfig>({
    primaryColor: THEME_CONFIG.PRIMARY_COLOR,
    mode: 'light',
    compact: false
  })
  
  // 应用配置
  const appConfig = ref<AppConfig>({
    title: 'TaskMaster Vue3',
    version: '1.0.0',
    apiBaseUrl: '/api',
    theme: themeConfig.value,
    features: {
      enableNotifications: true,
      enableDarkMode: true,
      enableRealtime: false
    }
  })

  // 计算属性
  const isDarkMode = computed(() => themeConfig.value.mode === 'dark')
  const isCompactMode = computed(() => themeConfig.value.compact)
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  )
  const unreadCount = computed(() => unreadNotifications.value.length)

  // Actions
  
  // 初始化应用
  const initializeApp = async () => {
    try {
      loading.value = true
      
      // 从本地存储恢复状态
      await restoreFromStorage()
      
      // 检查认证状态
      await checkAuthStatus()
      
    } catch (error) {
      console.error('Failed to initialize app:', error)
    } finally {
      loading.value = false
    }
  }

  // 从本地存储恢复状态
  const restoreFromStorage = async () => {
    // 恢复主题配置
    const savedTheme = storageUtils.get<ThemeConfig>(STORAGE_KEYS.THEME_CONFIG)
    if (savedTheme) {
      themeConfig.value = { ...themeConfig.value, ...savedTheme }
      appConfig.value.theme = themeConfig.value
    }
    
    // 恢复侧边栏状态
    const savedSidebarState = storageUtils.get<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED)
    if (savedSidebarState !== null) {
      sidebarCollapsed.value = savedSidebarState
    }
    
    // 恢复用户信息
    const savedUser = storageUtils.get<User>(STORAGE_KEYS.USER_INFO)
    if (savedUser) {
      user.value = savedUser
      isAuthenticated.value = true
    }
  }

  // 检查认证状态
  const checkAuthStatus = async () => {
    const token = storageUtils.get<string>(STORAGE_KEYS.AUTH_TOKEN)
    if (token) {
      // 这里应该验证token的有效性
      // 暂时简单设置为已认证
      isAuthenticated.value = true
    }
  }

  // 用户登录
  const login = async (credentials: { username: string; password: string }) => {
    try {
      loading.value = true
      
      // 这里应该调用登录API
      // 暂时模拟登录成功
      const mockUser: User = {
        id: '1',
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        name: credentials.username,
        role: 'developer',
        createTime: new Date().toISOString()
      }
      
      const mockToken = 'mock-jwt-token'
      
      // 保存用户信息和token
      user.value = mockUser
      isAuthenticated.value = true
      
      storageUtils.set(STORAGE_KEYS.USER_INFO, mockUser)
      storageUtils.set(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      
      return { success: true, user: mockUser }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 用户登出
  const logout = async () => {
    try {
      loading.value = true
      
      // 清空状态
      user.value = null
      isAuthenticated.value = false
      
      // 清空本地存储
      storageUtils.remove(STORAGE_KEYS.USER_INFO)
      storageUtils.remove(STORAGE_KEYS.AUTH_TOKEN)
      
      // 清空通知
      notifications.value = []
      
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      loading.value = false
    }
  }

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      storageUtils.set(STORAGE_KEYS.USER_INFO, user.value)
    }
  }

  // 切换主题模式
  const toggleThemeMode = () => {
    themeConfig.value.mode = themeConfig.value.mode === 'light' ? 'dark' : 'light'
    appConfig.value.theme = themeConfig.value
    storageUtils.set(STORAGE_KEYS.THEME_CONFIG, themeConfig.value)
  }

  // 设置主题颜色
  const setThemeColor = (color: string) => {
    themeConfig.value.primaryColor = color
    appConfig.value.theme = themeConfig.value
    storageUtils.set(STORAGE_KEYS.THEME_CONFIG, themeConfig.value)
  }

  // 切换紧凑模式
  const toggleCompactMode = () => {
    themeConfig.value.compact = !themeConfig.value.compact
    appConfig.value.theme = themeConfig.value
    storageUtils.set(STORAGE_KEYS.THEME_CONFIG, themeConfig.value)
  }

  // 切换侧边栏
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    storageUtils.set(STORAGE_KEYS.SIDEBAR_COLLAPSED, sidebarCollapsed.value)
  }

  // 设置侧边栏状态
  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
    storageUtils.set(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed)
  }

  // 添加通知
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
      duration: notification.duration || 4500,
      ...notification
    }
    
    notifications.value.unshift(newNotification)
    
    // 自动移除通知
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, newNotification.duration)
    }
    
    return newNotification
  }

  // 移除通知
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  // 标记通知为已读
  const markNotificationAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  // 清空所有通知
  const clearAllNotifications = () => {
    notifications.value = []
  }

  // 标记所有通知为已读
  const markAllNotificationsAsRead = () => {
    notifications.value.forEach(n => n.read = true)
  }

  // 设置加载状态
  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  // 更新应用配置
  const updateAppConfig = (config: Partial<AppConfig>) => {
    appConfig.value = { ...appConfig.value, ...config }
  }

  return {
    // 状态
    user,
    isAuthenticated,
    loading,
    sidebarCollapsed,
    notifications,
    themeConfig,
    appConfig,
    
    // 计算属性
    isDarkMode,
    isCompactMode,
    unreadNotifications,
    unreadCount,
    
    // 方法
    initializeApp,
    restoreFromStorage,
    checkAuthStatus,
    login,
    logout,
    updateUser,
    toggleThemeMode,
    setThemeColor,
    toggleCompactMode,
    toggleSidebar,
    setSidebarCollapsed,
    addNotification,
    removeNotification,
    markNotificationAsRead,
    clearAllNotifications,
    markAllNotificationsAsRead,
    setLoading,
    updateAppConfig
  }
})
