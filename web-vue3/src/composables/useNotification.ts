// 通知服务 Composable
import { useNotificationStore } from '@/stores/notification'
import type { NotificationOptions } from '@/stores/notification'

/**
 * 通知服务 Hook
 * 提供便捷的通知方法
 */
export function useNotification() {
  const notificationStore = useNotificationStore()

  // 基础通知方法
  const notify = (options: NotificationOptions): string => {
    return notificationStore.addNotification(options)
  }

  // 成功通知
  const success = (title: string, message?: string, options?: Partial<NotificationOptions>): string => {
    return notificationStore.success(title, message, options)
  }

  // 警告通知
  const warning = (title: string, message?: string, options?: Partial<NotificationOptions>): string => {
    return notificationStore.warning(title, message, options)
  }

  // 错误通知
  const error = (title: string, message?: string, options?: Partial<NotificationOptions>): string => {
    return notificationStore.error(title, message, options)
  }

  // 信息通知
  const info = (title: string, message?: string, options?: Partial<NotificationOptions>): string => {
    return notificationStore.info(title, message, options)
  }

  // 持久通知（不自动关闭）
  const persistent = (title: string, message?: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): string => {
    return notificationStore.persistent(title, message, type)
  }

  // 关闭通知
  const close = (id: string): void => {
    notificationStore.removeNotification(id)
  }

  // 清空所有通知
  const clearAll = (): void => {
    notificationStore.clearAllNotifications()
  }

  // 业务场景的便捷方法

  // API请求成功
  const apiSuccess = (action: string, resource?: string): string => {
    const title = resource ? `${resource}${action}成功` : `${action}成功`
    return success(title)
  }

  // API请求失败
  const apiError = (action: string, resource?: string, errorMessage?: string): string => {
    const title = resource ? `${resource}${action}失败` : `${action}失败`
    const message = errorMessage || '请稍后重试或联系管理员'
    return error(title, message)
  }

  // 表单验证错误
  const validationError = (message: string = '请检查表单输入'): string => {
    return warning('表单验证失败', message)
  }

  // 权限错误
  const permissionError = (action?: string): string => {
    const title = action ? `无权限执行${action}` : '权限不足'
    const message = '请联系管理员获取相应权限'
    return error(title, message)
  }

  // 网络错误
  const networkError = (message: string = '网络连接异常，请检查网络设置'): string => {
    return error('网络错误', message)
  }

  // 操作确认
  const operationConfirm = (action: string, resource?: string): string => {
    const title = resource ? `${resource}${action}` : action
    const message = '操作已提交，正在处理中...'
    return info(title, message, { duration: 2000 })
  }

  // 数据加载中
  const loading = (message: string = '数据加载中...'): string => {
    return info('加载中', message, { duration: 0, showClose: false })
  }

  // 数据保存成功
  const saveSuccess = (resource?: string): string => {
    return apiSuccess('保存', resource)
  }

  // 数据删除成功
  const deleteSuccess = (resource?: string): string => {
    return apiSuccess('删除', resource)
  }

  // 数据更新成功
  const updateSuccess = (resource?: string): string => {
    return apiSuccess('更新', resource)
  }

  // 数据创建成功
  const createSuccess = (resource?: string): string => {
    return apiSuccess('创建', resource)
  }

  // 复制成功
  const copySuccess = (content?: string): string => {
    const message = content ? `已复制: ${content}` : '内容已复制到剪贴板'
    return success('复制成功', message, { duration: 2000 })
  }

  // 上传成功
  const uploadSuccess = (filename?: string): string => {
    const message = filename ? `文件 ${filename} 上传成功` : '文件上传成功'
    return success('上传成功', message)
  }

  // 下载成功
  const downloadSuccess = (filename?: string): string => {
    const message = filename ? `文件 ${filename} 下载成功` : '文件下载成功'
    return success('下载成功', message)
  }

  // 导入成功
  const importSuccess = (count?: number): string => {
    const message = count ? `成功导入 ${count} 条数据` : '数据导入成功'
    return success('导入成功', message)
  }

  // 导出成功
  const exportSuccess = (filename?: string): string => {
    const message = filename ? `文件已导出: ${filename}` : '数据导出成功'
    return success('导出成功', message)
  }

  // 系统维护通知
  const maintenanceNotice = (message: string, startTime?: string): string => {
    const title = '系统维护通知'
    const fullMessage = startTime ? `${message}\n维护时间: ${startTime}` : message
    return warning(title, fullMessage, { duration: 0 })
  }

  // 版本更新通知
  const updateNotice = (version: string, features?: string[]): string => {
    const title = `系统已更新到 v${version}`
    const message = features ? `新功能: ${features.join(', ')}` : '请刷新页面获取最新功能'
    return info(title, message, { duration: 8000 })
  }

  return {
    // 基础方法
    notify,
    success,
    warning,
    error,
    info,
    persistent,
    close,
    clearAll,

    // API相关
    apiSuccess,
    apiError,
    validationError,
    permissionError,
    networkError,

    // 操作相关
    operationConfirm,
    loading,
    saveSuccess,
    deleteSuccess,
    updateSuccess,
    createSuccess,

    // 文件相关
    copySuccess,
    uploadSuccess,
    downloadSuccess,
    importSuccess,
    exportSuccess,

    // 系统相关
    maintenanceNotice,
    updateNotice
  }
}

// 导出类型
export type { NotificationOptions } from '@/stores/notification'
