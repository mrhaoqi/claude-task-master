<!-- 空状态组件 -->
<script setup lang="ts">
import { computed } from 'vue'

// Props定义
interface Props {
  type?: 'default' | 'no-data' | 'no-search' | 'error' | 'network' | 'permission'
  title?: string
  description?: string
  image?: string
  imageSize?: number
  showAction?: boolean
  actionText?: string
  actionType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  imageSize: 120,
  showAction: false,
  actionText: '重试',
  actionType: 'primary'
})

// Emits定义
interface Emits {
  'action': []
}

const emit = defineEmits<Emits>()

// 预定义的空状态配置
const emptyConfigs = {
  default: {
    title: '暂无数据',
    description: '当前没有任何数据',
    icon: 'DocumentDelete'
  },
  'no-data': {
    title: '暂无数据',
    description: '还没有相关数据，快去创建一个吧',
    icon: 'FolderOpened'
  },
  'no-search': {
    title: '无搜索结果',
    description: '没有找到符合条件的数据，请尝试其他搜索条件',
    icon: 'Search'
  },
  error: {
    title: '出错了',
    description: '页面遇到了一些问题，请稍后重试',
    icon: 'CircleClose'
  },
  network: {
    title: '网络异常',
    description: '网络连接失败，请检查网络设置后重试',
    icon: 'Connection'
  },
  permission: {
    title: '无权限访问',
    description: '您没有权限访问此内容，请联系管理员',
    icon: 'Lock'
  }
}

// 计算配置
const config = computed(() => {
  const defaultConfig = emptyConfigs[props.type]
  return {
    title: props.title || defaultConfig.title,
    description: props.description || defaultConfig.description,
    icon: defaultConfig.icon
  }
})

// 处理操作按钮点击
const handleAction = () => {
  emit('action')
}
</script>

<template>
  <div class="empty-state">
    <div class="empty-content">
      <!-- 自定义图片或默认图标 -->
      <div class="empty-image">
        <img 
          v-if="image" 
          :src="image" 
          :style="{ width: `${imageSize}px`, height: `${imageSize}px` }"
          alt="Empty"
        />
        <el-icon 
          v-else 
          :size="imageSize" 
          class="empty-icon"
        >
          <component :is="config.icon" />
        </el-icon>
      </div>
      
      <!-- 标题 -->
      <h3 class="empty-title">{{ config.title }}</h3>
      
      <!-- 描述 -->
      <p class="empty-description">{{ config.description }}</p>
      
      <!-- 操作按钮 -->
      <div v-if="showAction" class="empty-action">
        <el-button 
          :type="actionType" 
          @click="handleAction"
        >
          {{ actionText }}
        </el-button>
      </div>
      
      <!-- 自定义插槽 -->
      <div v-if="$slots.default" class="empty-extra">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: var(--theme-spacing-xl);
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-image {
  margin-bottom: var(--theme-spacing-lg);
}

.empty-icon {
  color: var(--theme-text-tertiary);
  opacity: 0.6;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--theme-text-primary);
  margin: 0 0 var(--theme-spacing-sm) 0;
}

.empty-description {
  font-size: 14px;
  color: var(--theme-text-secondary);
  line-height: 1.5;
  margin: 0 0 var(--theme-spacing-lg) 0;
}

.empty-action {
  margin-bottom: var(--theme-spacing-md);
}

.empty-extra {
  margin-top: var(--theme-spacing-md);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .empty-state {
    padding: var(--theme-spacing-lg);
    min-height: 150px;
  }
  
  .empty-title {
    font-size: 16px;
  }
  
  .empty-description {
    font-size: 13px;
  }
}
</style>
