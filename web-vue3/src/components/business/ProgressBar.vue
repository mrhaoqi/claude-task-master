<!-- 进度条组件 -->
<script setup lang="ts">
import { computed } from 'vue'

// Props定义
interface Props {
  percentage: number
  showText?: boolean
  textInside?: boolean
  strokeWidth?: number
  status?: 'success' | 'exception' | 'warning' | ''
  color?: string | string[]
  format?: (percentage: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  textInside: false,
  strokeWidth: 8,
  status: ''
})

// 计算进度状态
const progressStatus = computed(() => {
  if (props.status) return props.status
  
  if (props.percentage >= 100) return 'success'
  if (props.percentage >= 80) return ''
  if (props.percentage >= 60) return 'warning'
  return 'exception'
})

// 计算进度颜色
const progressColor = computed(() => {
  if (props.color) return props.color
  
  // 根据进度返回渐变色
  if (props.percentage >= 80) {
    return ['#67C23A', '#85CE61']
  } else if (props.percentage >= 60) {
    return ['#E6A23C', '#F7BA2A']
  } else if (props.percentage >= 40) {
    return ['#409EFF', '#79BBFF']
  } else {
    return ['#F56C6C', '#F78989']
  }
})

// 格式化文本
const formatText = (percentage: number) => {
  if (props.format) {
    return props.format(percentage)
  }
  return `${percentage}%`
}
</script>

<template>
  <div class="progress-bar">
    <el-progress
      :percentage="percentage"
      :show-text="showText"
      :text-inside="textInside"
      :stroke-width="strokeWidth"
      :status="progressStatus"
      :color="progressColor"
      :format="formatText"
    />
  </div>
</template>

<style scoped>
.progress-bar {
  width: 100%;
}
</style>
