<!-- 优先级标签组件 -->
<script setup lang="ts">
import { computed } from 'vue'

// Props定义
interface Props {
  priority: string
  size?: 'small' | 'default' | 'large'
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  showIcon: false
})

// 优先级配置
const priorityConfig = computed(() => {
  switch (props.priority?.toLowerCase()) {
    case 'urgent':
      return { type: 'danger', text: '紧急', icon: 'Warning' }
    case 'high':
      return { type: 'danger', text: '高', icon: 'ArrowUp' }
    case 'medium':
      return { type: 'warning', text: '中', icon: 'Minus' }
    case 'low':
      return { type: 'success', text: '低', icon: 'ArrowDown' }
    default:
      return { type: 'info', text: props.priority || '未知', icon: 'QuestionFilled' }
  }
})
</script>

<template>
  <el-tag 
    :type="priorityConfig.type as any" 
    :size="size"
    class="priority-tag"
  >
    <el-icon v-if="showIcon" class="tag-icon">
      <component :is="priorityConfig.icon" />
    </el-icon>
    {{ priorityConfig.text }}
  </el-tag>
</template>

<style scoped>
.priority-tag {
  font-weight: 500;
}

.tag-icon {
  margin-right: 4px;
}
</style>
