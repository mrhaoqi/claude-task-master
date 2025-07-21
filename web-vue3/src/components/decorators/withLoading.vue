<!-- 加载装饰器组件 - 为任何组件添加加载状态 -->
<script setup lang="ts">
import { computed } from 'vue'

// Props定义
interface Props {
  loading?: boolean
  loadingText?: string
  loadingSpinner?: string
  loadingBackground?: string
  minHeight?: string | number
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: '加载中...',
  loadingSpinner: '',
  loadingBackground: 'rgba(255, 255, 255, 0.8)',
  minHeight: '200px',
  fullscreen: false
})

// 计算最小高度
const containerStyle = computed(() => ({
  minHeight: typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight,
  position: 'relative' as const
}))
</script>

<template>
  <div 
    class="loading-decorator" 
    :style="containerStyle"
    v-loading="loading"
    :element-loading-text="loadingText"
    :element-loading-spinner="loadingSpinner"
    :element-loading-background="loadingBackground"
    :element-loading-lock="fullscreen"
  >
    <slot />
  </div>
</template>

<style scoped>
.loading-decorator {
  width: 100%;
}
</style>
