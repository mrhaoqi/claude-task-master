<!-- 权限装饰器组件 - 为任何组件添加权限控制 -->
<script setup lang="ts">
import { computed } from 'vue'
import type { UserRole } from '@/types'

// Props定义
interface Props {
  roles?: UserRole[]
  permissions?: string[]
  requireAll?: boolean
  fallback?: 'hide' | 'disable' | 'placeholder'
  placeholderText?: string
}

const props = withDefaults(defineProps<Props>(), {
  roles: () => [],
  permissions: () => [],
  requireAll: false,
  fallback: 'hide',
  placeholderText: '暂无权限访问'
})

// 模拟当前用户信息（实际项目中应该从store获取）
const currentUser = computed(() => ({
  role: 'developer' as UserRole,
  permissions: ['read', 'write', 'delete']
}))

// 检查角色权限
const hasRolePermission = computed(() => {
  if (props.roles.length === 0) return true
  return props.roles.includes(currentUser.value.role)
})

// 检查具体权限
const hasSpecificPermission = computed(() => {
  if (props.permissions.length === 0) return true
  
  const userPermissions = currentUser.value.permissions
  
  if (props.requireAll) {
    return props.permissions.every(permission => userPermissions.includes(permission))
  } else {
    return props.permissions.some(permission => userPermissions.includes(permission))
  }
})

// 最终权限检查
const hasPermission = computed(() => {
  return hasRolePermission.value && hasSpecificPermission.value
})

// 是否显示内容
const shouldShow = computed(() => {
  return hasPermission.value || props.fallback !== 'hide'
})

// 是否禁用
const shouldDisable = computed(() => {
  return !hasPermission.value && props.fallback === 'disable'
})

// 是否显示占位符
const shouldShowPlaceholder = computed(() => {
  return !hasPermission.value && props.fallback === 'placeholder'
})
</script>

<template>
  <div v-if="shouldShow" class="permission-decorator">
    <!-- 占位符 -->
    <div v-if="shouldShowPlaceholder" class="permission-placeholder">
      <el-empty :description="placeholderText" />
    </div>
    
    <!-- 正常内容 -->
    <div v-else :class="{ 'permission-disabled': shouldDisable }">
      <slot :has-permission="hasPermission" :disabled="shouldDisable" />
    </div>
  </div>
</template>

<style scoped>
.permission-decorator {
  width: 100%;
}

.permission-disabled {
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
}

.permission-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #85929e;
}
</style>
