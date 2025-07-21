// 组件统一导出

// 基础组件
export { default as BaseTable } from './base/BaseTable.vue'
export { default as BaseForm } from './base/BaseForm.vue'

// 装饰器组件
export { default as WithLoading } from './decorators/withLoading.vue'
export { default as WithPermission } from './decorators/withPermission.vue'

// 适配器组件
export { default as LegacyApiAdapter } from './adapters/LegacyApiAdapter.vue'

// 项目相关组件
export { default as ProjectForm } from './project/ProjectForm.vue'
export { default as ProjectDetail } from './project/ProjectDetail.vue'

// 任务相关组件
export { default as TaskForm } from './task/TaskForm.vue'
export { default as TaskDetail } from './task/TaskDetail.vue'

// PRD相关组件
export { default as PrdUpload } from './prd/PrdUpload.vue'
export { default as PrdViewer } from './prd/PrdViewer.vue'

// 主题相关组件
export { default as ThemeSwitcher } from './theme/ThemeSwitcher.vue'

// 布局组件
export { default as AppHeader } from './layout/AppHeader.vue'

// 业务组件
export { default as StatusTag } from './business/StatusTag.vue'
export { default as PriorityTag } from './business/PriorityTag.vue'
export { default as ProgressBar } from './business/ProgressBar.vue'
export { default as ActionButtons } from './business/ActionButtons.vue'
export { default as EmptyState } from './business/EmptyState.vue'

// 组件类型导出
export type { FormItemConfig } from './base/BaseForm.vue'
