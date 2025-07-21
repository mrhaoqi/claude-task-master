<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onUnmounted } from 'vue'
import { useBreakpoints } from '@/config/theme'
import { AppHeader } from '@/components'
import NotificationContainer from '@/components/notification/NotificationContainer.vue'

// 使用响应式断点
const { cleanup } = useBreakpoints()

// 组件卸载时清理事件监听
onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div class="app-container">
    <!-- 应用头部 -->
    <AppHeader />

    <!-- 主要内容区域 -->
    <main class="app-main">
      <RouterView />
    </main>

    <!-- 全局通知容器 -->
    <NotificationContainer />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--theme-bg-secondary);
  transition: background-color 0.3s ease;
}

.app-main {
  flex: 1;
  padding: var(--theme-spacing-lg);
  background: var(--theme-bg-secondary);
  transition: background-color 0.3s ease;
}

@media (max-width: 768px) {
  .app-main {
    padding: var(--theme-spacing-md);
  }
}

@media (max-width: 480px) {
  .app-main {
    padding: var(--theme-spacing-sm);
  }
}
</style>
