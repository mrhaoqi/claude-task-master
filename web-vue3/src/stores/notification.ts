// 通知状态管理
import { defineStore } from 'pinia'
import { ref } from 'vue'

// 通知数据类型
export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
  showClose?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  createdAt: number
}

// 通知选项类型
export interface NotificationOptions {
  type?: 'success' | 'warning' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
  showClose?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const notifications = ref<Notification[]>([])

  // 默认配置
  const defaultConfig = {
    type: 'info' as const,
    duration: 4500,
    showClose: true,
    position: 'top-right' as const
  }

  // 生成唯一ID
  const generateId = (): string => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 添加通知
  const addNotification = (options: NotificationOptions): string => {
    const notification: Notification = {
      id: generateId(),
      type: options.type || defaultConfig.type,
      title: options.title,
      message: options.message,
      duration: options.duration !== undefined ? options.duration : defaultConfig.duration,
      showClose: options.showClose !== undefined ? options.showClose : defaultConfig.showClose,
      position: options.position || defaultConfig.position,
      createdAt: Date.now()
    }

    notifications.value.push(notification)

    // 自动移除通知
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  // 移除通知
  const removeNotification = (id: string): void => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  // 清空所有通知
  const clearAllNotifications = (): void => {
    notifications.value = []
  }

  // 清空指定位置的通知
  const clearNotificationsByPosition = (position: string): void => {
    notifications.value = notifications.value.filter(n => n.position !== position)
  }

  // 便捷方法：成功通知
  const success = (title: string, message?: string, options?: Partial<NotificationOptions>): string => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  // 便捷方法：警告通知
  const warning = (title: string, message?: string, options?: Partial<NotificationOptions>): string => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  // 便捷方法：错误通知
  const error = (title: string, message?: string, options?: Partial<NotificationOptions>): string => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 6000, // 错误通知显示更长时间
      ...options
    })
  }

  // 便捷方法：信息通知
  const info = (title: string, message?: string, options?: Partial<NotificationOptions>): string => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  // 便捷方法：持久通知（不自动关闭）
  const persistent = (title: string, message?: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): string => {
    return addNotification({
      type,
      title,
      message,
      duration: 0, // 不自动关闭
      showClose: true
    })
  }

  // 获取指定位置的通知数量
  const getNotificationCountByPosition = (position: string): number => {
    return notifications.value.filter(n => n.position === position).length
  }

  // 获取指定类型的通知数量
  const getNotificationCountByType = (type: string): number => {
    return notifications.value.filter(n => n.type === type).length
  }

  // 检查是否有错误通知
  const hasErrorNotifications = (): boolean => {
    return notifications.value.some(n => n.type === 'error')
  }

  // 检查是否有警告通知
  const hasWarningNotifications = (): boolean => {
    return notifications.value.some(n => n.type === 'warning')
  }

  return {
    // 状态
    notifications,

    // 基础方法
    addNotification,
    removeNotification,
    clearAllNotifications,
    clearNotificationsByPosition,

    // 便捷方法
    success,
    warning,
    error,
    info,
    persistent,

    // 查询方法
    getNotificationCountByPosition,
    getNotificationCountByType,
    hasErrorNotifications,
    hasWarningNotifications
  }
})

// 导出类型
export type { Notification, NotificationOptions }
