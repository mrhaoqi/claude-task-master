<!-- 操作按钮组组件 -->
<script setup lang="ts">
import { computed } from 'vue'

// 按钮配置接口
interface ButtonConfig {
  key: string
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  icon?: string
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
  loading?: boolean
  show?: boolean
  permission?: string
}

// Props定义
interface Props {
  buttons: ButtonConfig[]
  size?: 'large' | 'default' | 'small'
  direction?: 'horizontal' | 'vertical'
  align?: 'left' | 'center' | 'right'
  gap?: number
  maxButtons?: number
  moreText?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  direction: 'horizontal',
  align: 'left',
  gap: 8,
  maxButtons: 3,
  moreText: '更多'
})

// Emits定义
interface Emits {
  'click': [key: string, button: ButtonConfig]
}

const emit = defineEmits<Emits>()

// 过滤可显示的按钮
const visibleButtons = computed(() => {
  return props.buttons.filter(button => button.show !== false)
})

// 主要按钮（直接显示）
const primaryButtons = computed(() => {
  return visibleButtons.value.slice(0, props.maxButtons)
})

// 更多按钮（下拉显示）
const moreButtons = computed(() => {
  return visibleButtons.value.slice(props.maxButtons)
})

// 是否显示更多按钮
const showMoreButton = computed(() => {
  return moreButtons.value.length > 0
})

// 按钮点击处理
const handleClick = (button: ButtonConfig) => {
  if (button.disabled || button.loading) return
  emit('click', button.key, button)
}

// 计算容器样式
const containerStyle = computed(() => {
  const styles: Record<string, any> = {
    display: 'flex',
    gap: `${props.gap}px`,
    alignItems: 'center'
  }
  
  if (props.direction === 'vertical') {
    styles.flexDirection = 'column'
    styles.alignItems = 'stretch'
  }
  
  if (props.align === 'center') {
    styles.justifyContent = 'center'
  } else if (props.align === 'right') {
    styles.justifyContent = 'flex-end'
  }
  
  return styles
})
</script>

<template>
  <div class="action-buttons" :style="containerStyle">
    <!-- 主要按钮 -->
    <el-button
      v-for="button in primaryButtons"
      :key="button.key"
      :type="button.type"
      :size="button.size || size"
      :disabled="button.disabled"
      :loading="button.loading"
      @click="handleClick(button)"
    >
      <el-icon v-if="button.icon">
        <component :is="button.icon" />
      </el-icon>
      {{ button.label }}
    </el-button>
    
    <!-- 更多按钮下拉菜单 -->
    <el-dropdown v-if="showMoreButton" @command="handleClick">
      <el-button :size="size">
        {{ moreText }}
        <el-icon class="el-icon--right">
          <ArrowDown />
        </el-icon>
      </el-button>
      
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="button in moreButtons"
            :key="button.key"
            :command="button"
            :disabled="button.disabled"
          >
            <el-icon v-if="button.icon">
              <component :is="button.icon" />
            </el-icon>
            {{ button.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.action-buttons {
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-buttons {
    width: 100%;
  }
  
  .action-buttons :deep(.el-button) {
    flex: 1;
    min-width: 0;
  }
}
</style>
