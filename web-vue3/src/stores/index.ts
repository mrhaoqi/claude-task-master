// Pinia stores 统一导出

// 导出所有store
export { useAppStore } from './app'
export { useProjectStore } from './project'
export { useTaskStore } from './task'
export { useNotificationStore } from './notification'

// 创建store管理器（单例模式）
export class StoreManager {
  private static instance: StoreManager
  
  private constructor() {}
  
  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager()
    }
    return StoreManager.instance
  }
  
  // 重置所有store状态
  public resetAllStores() {
    const appStore = useAppStore()
    const projectStore = useProjectStore()
    const taskStore = useTaskStore()
    
    // 重置各个store的状态
    projectStore.resetState()
    taskStore.resetState()
    
    // 应用store通常不需要完全重置，只清理用户相关数据
    appStore.logout()
  }
  
  // 初始化所有store
  public async initializeStores() {
    const appStore = useAppStore()
    
    // 初始化应用store
    await appStore.initializeApp()
  }
  
  // 获取所有store的状态摘要
  public getStoresSummary() {
    const appStore = useAppStore()
    const projectStore = useProjectStore()
    const taskStore = useTaskStore()
    
    return {
      app: {
        isAuthenticated: appStore.isAuthenticated,
        user: appStore.user?.username,
        loading: appStore.loading,
        notificationCount: appStore.unreadCount
      },
      project: {
        totalProjects: projectStore.projectStats.total,
        activeProjects: projectStore.projectStats.active,
        currentProject: projectStore.currentProject?.name,
        loading: projectStore.loading
      },
      task: {
        totalTasks: taskStore.taskStats.total,
        inProgressTasks: taskStore.taskStats.inProgress,
        overdueTasks: taskStore.taskStats.overdue,
        currentTask: taskStore.currentTask?.title,
        loading: taskStore.loading
      }
    }
  }
}

// 导出单例实例
export const storeManager = StoreManager.getInstance()

// 导出便捷的初始化函数
export const initializeStores = () => storeManager.initializeStores()
export const resetAllStores = () => storeManager.resetAllStores()
export const getStoresSummary = () => storeManager.getStoresSummary()
