<!-- 状态标签组件 -->
<script setup lang="ts">
import { computed } from 'vue'

// Props定义
interface Props {
  status: string
  type?: 'project' | 'task' | 'custom'
  size?: 'small' | 'default' | 'large'
  customConfig?: Record<string, { type: string; text: string }>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'custom',
  size: 'default'
})

// 预定义的状态配置
const statusConfigs = {
  project: {
    active: { type: 'success', text: '进行中' },
    completed: { type: 'primary', text: '已完成' },
    pending: { type: 'warning', text: '待开始' },
    cancelled: { type: 'danger', text: '已取消' }
  },
  task: {
    todo: { type: 'info', text: '待开始' },
    in_progress: { type: 'primary', text: '进行中' },
    completed: { type: 'success', text: '已完成' },
    cancelled: { type: 'danger', text: '已取消' }
  }
}

// 计算状态配置
const statusConfig = computed(() => {
  if (props.customConfig) {
    return props.customConfig[props.status] || { type: 'info', text: props.status }
  }
  
  const config = statusConfigs[props.type]
  return config?.[props.status] || { type: 'info', text: props.status }
})
</script>

<template>
  <el-tag 
    :type="statusConfig.type as any" 
    :size="size"
    class="status-tag"
  >
    {{ statusConfig.text }}
  </el-tag>
</template>

<style scoped>
.status-tag {
  font-weight: 500;
}
</style>
