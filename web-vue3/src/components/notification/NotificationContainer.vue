<!-- 全局通知容器组件 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { storeToRefs } from 'pinia'

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

// 使用通知状态管理
const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

// 获取通知图标
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success': return 'CircleCheck'
    case 'warning': return 'Warning'
    case 'error': return 'CircleClose'
    case 'info': return 'InfoFilled'
    default: return 'InfoFilled'
  }
}

// 获取通知类型样式类
const getNotificationClass = (type: string) => {
  return `notification-${type}`
}

// 关闭通知
const closeNotification = (id: string) => {
  notificationStore.removeNotification(id)
}

// 自动关闭通知
const autoCloseNotification = (notification: Notification) => {
  if (notification.duration && notification.duration > 0) {
    setTimeout(() => {
      closeNotification(notification.id)
    }, notification.duration)
  }
}

// 监听新通知，设置自动关闭
const handleNewNotification = (notification: Notification) => {
  autoCloseNotification(notification)
}

// 组件挂载时监听通知变化
onMounted(() => {
  // 为现有通知设置自动关闭
  notifications.value.forEach(notification => {
    autoCloseNotification(notification)
  })
})
</script>

<template>
  <div class="notification-container">
    <!-- 按位置分组显示通知 -->
    <div 
      v-for="position in ['top-right', 'top-left', 'bottom-right', 'bottom-left']" 
      :key="position"
      :class="['notification-group', `notification-group-${position}`]"
    >
      <transition-group name="notification" tag="div">
        <div
          v-for="notification in notifications.filter(n => (n.position || 'top-right') === position)"
          :key="notification.id"
          :class="['notification-item', getNotificationClass(notification.type)]"
          @click="closeNotification(notification.id)"
        >
          <!-- 通知图标 -->
          <div class="notification-icon">
            <el-icon :size="20">
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>
          </div>
          
          <!-- 通知内容 -->
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div v-if="notification.message" class="notification-message">
              {{ notification.message }}
            </div>
          </div>
          
          <!-- 关闭按钮 -->
          <div 
            v-if="notification.showClose !== false" 
            class="notification-close"
            @click.stop="closeNotification(notification.id)"
          >
            <el-icon :size="14">
              <Close />
            </el-icon>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
}

.notification-group {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  pointer-events: none;
}

.notification-group-top-right {
  top: 0;
  right: 0;
}

.notification-group-top-left {
  top: 0;
  left: 0;
}

.notification-group-bottom-right {
  bottom: 0;
  right: 0;
  flex-direction: column-reverse;
}

.notification-group-bottom-left {
  bottom: 0;
  left: 0;
  flex-direction: column-reverse;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 400px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
}

.notification-item:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.notification-success {
  border-left-color: #67c23a;
}

.notification-warning {
  border-left-color: #e6a23c;
}

.notification-error {
  border-left-color: #f56c6c;
}

.notification-info {
  border-left-color: #409eff;
}

.notification-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-success .notification-icon {
  color: #67c23a;
}

.notification-warning .notification-icon {
  color: #e6a23c;
}

.notification-error .notification-icon {
  color: #f56c6c;
}

.notification-info .notification-icon {
  color: #409eff;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  word-wrap: break-word;
}

.notification-close {
  flex-shrink: 0;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s ease;
}

.notification-close:hover {
  color: #606266;
}

/* 动画效果 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-group-top-left .notification-enter-from,
.notification-group-bottom-left .notification-enter-from {
  transform: translateX(-100%);
}

.notification-group-top-left .notification-leave-to,
.notification-group-bottom-left .notification-leave-to {
  transform: translateX(-100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-group {
    padding: 16px;
  }
  
  .notification-item {
    min-width: 280px;
    max-width: calc(100vw - 32px);
  }
}

@media (max-width: 480px) {
  .notification-group {
    padding: 12px;
  }
  
  .notification-item {
    min-width: 240px;
    padding: 12px;
  }
  
  .notification-title {
    font-size: 13px;
  }
  
  .notification-message {
    font-size: 12px;
  }
}
</style>
