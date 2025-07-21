// 应用常量定义

// 应用信息
export const APP_INFO = {
  NAME: 'TaskMaster Vue3',
  VERSION: '1.0.0',
  DESCRIPTION: '基于Vue3的现代化任务管理系统',
  AUTHOR: 'TaskMaster Team'
} as const

// API配置
export const API_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 10000,
  RETRY_TIMES: 3,
  RETRY_DELAY: 1000
} as const

// 路由路径
export const ROUTES = {
  HOME: '/',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:id',
  PRD: '/prd',
  CHANGE_REQUESTS: '/change-requests',
  ABOUT: '/about',
  LOGIN: '/login',
  PROFILE: '/profile'
} as const

// 本地存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  THEME_CONFIG: 'theme_config',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  TABLE_SETTINGS: 'table_settings'
} as const

// 项目状态
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled'
} as const

export const PROJECT_STATUS_OPTIONS = [
  { label: '进行中', value: PROJECT_STATUS.ACTIVE, type: 'primary' },
  { label: '已完成', value: PROJECT_STATUS.COMPLETED, type: 'success' },
  { label: '待开始', value: PROJECT_STATUS.PENDING, type: 'info' },
  { label: '已取消', value: PROJECT_STATUS.CANCELLED, type: 'danger' }
] as const

// 任务状态
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const TASK_STATUS_OPTIONS = [
  { label: '待开始', value: TASK_STATUS.TODO, type: 'info' },
  { label: '进行中', value: TASK_STATUS.IN_PROGRESS, type: 'primary' },
  { label: '已完成', value: TASK_STATUS.COMPLETED, type: 'success' },
  { label: '已取消', value: TASK_STATUS.CANCELLED, type: 'danger' }
] as const

// 任务优先级
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

export const TASK_PRIORITY_OPTIONS = [
  { label: '低', value: TASK_PRIORITY.LOW, type: 'success' },
  { label: '中', value: TASK_PRIORITY.MEDIUM, type: 'warning' },
  { label: '高', value: TASK_PRIORITY.HIGH, type: 'danger' },
  { label: '紧急', value: TASK_PRIORITY.URGENT, type: 'danger' }
] as const

// PRD状态
export const PRD_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const

export const PRD_STATUS_OPTIONS = [
  { label: '草稿', value: PRD_STATUS.DRAFT, type: 'info' },
  { label: '审核中', value: PRD_STATUS.REVIEW, type: 'warning' },
  { label: '已批准', value: PRD_STATUS.APPROVED, type: 'success' },
  { label: '已拒绝', value: PRD_STATUS.REJECTED, type: 'danger' }
] as const

// 变更请求类型
export const CHANGE_REQUEST_TYPE = {
  FEATURE: 'feature',
  BUG: 'bug',
  IMPROVEMENT: 'improvement',
  DOCUMENTATION: 'documentation'
} as const

export const CHANGE_REQUEST_TYPE_OPTIONS = [
  { label: '新功能', value: CHANGE_REQUEST_TYPE.FEATURE, type: 'primary' },
  { label: '缺陷修复', value: CHANGE_REQUEST_TYPE.BUG, type: 'danger' },
  { label: '改进优化', value: CHANGE_REQUEST_TYPE.IMPROVEMENT, type: 'warning' },
  { label: '文档更新', value: CHANGE_REQUEST_TYPE.DOCUMENTATION, type: 'info' }
] as const

// 变更请求状态
export const CHANGE_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IMPLEMENTED: 'implemented'
} as const

export const CHANGE_REQUEST_STATUS_OPTIONS = [
  { label: '待审核', value: CHANGE_REQUEST_STATUS.PENDING, type: 'warning' },
  { label: '已批准', value: CHANGE_REQUEST_STATUS.APPROVED, type: 'success' },
  { label: '已拒绝', value: CHANGE_REQUEST_STATUS.REJECTED, type: 'danger' },
  { label: '已实施', value: CHANGE_REQUEST_STATUS.IMPLEMENTED, type: 'primary' }
] as const

// 用户角色
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
  VIEWER: 'viewer'
} as const

export const USER_ROLE_OPTIONS = [
  { label: '管理员', value: USER_ROLES.ADMIN },
  { label: '项目经理', value: USER_ROLES.MANAGER },
  { label: '开发者', value: USER_ROLES.DEVELOPER },
  { label: '查看者', value: USER_ROLES.VIEWER }
] as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000
} as const

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
} as const

// 主题配置
export const THEME_CONFIG = {
  PRIMARY_COLOR: '#3498db',
  SUCCESS_COLOR: '#27ae60',
  WARNING_COLOR: '#f39c12',
  DANGER_COLOR: '#e74c3c',
  INFO_COLOR: '#95a5a6',
  BORDER_RADIUS: '3px',
  BOX_SHADOW: '0 2px 4px rgba(0, 0, 0, 0.08)'
} as const

// 动画配置
export const ANIMATION = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
  },
  EASING: {
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out'
  }
} as const

// 正则表达式
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/.+/,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
} as const

// 错误代码
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND'
} as const

// 事件类型
export const EVENT_TYPES = {
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  NOTIFICATION_RECEIVED: 'notification:received'
} as const
