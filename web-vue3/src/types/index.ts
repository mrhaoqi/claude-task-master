// 通用类型定义

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  code: number
}

// 分页类型
export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationParams
}

// 项目相关类型
export interface Project {
  id: string | number
  name: string
  description: string
  status: ProjectStatus
  progress: number
  createTime: string
  updateTime?: string
  members: number
  tasks: number
  owner?: string
}

export type ProjectStatus = 'active' | 'completed' | 'pending' | 'cancelled'

export interface CreateProjectRequest {
  name: string
  description?: string
  status?: ProjectStatus
}

// 任务相关类型
export interface Task {
  id: string | number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  progress: number
  assignee: string
  projectId: string | number
  project?: string
  dueDate: string
  createTime: string
  updateTime?: string
  tags?: string[]
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface CreateTaskRequest {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee?: string
  projectId: string | number
  dueDate?: string
  tags?: string[]
}

// PRD相关类型
export interface PRD {
  id: string | number
  title: string
  content: string
  version: string
  status: PRDStatus
  projectId: string | number
  project?: string
  author: string
  createTime: string
  updateTime?: string
}

export type PRDStatus = 'draft' | 'review' | 'approved' | 'rejected'

// 变更请求类型
export interface ChangeRequest {
  id: string | number
  title: string
  description: string
  type: ChangeType
  status: ChangeStatus
  priority: TaskPriority
  projectId: string | number
  project?: string
  requester: string
  assignee?: string
  createTime: string
  updateTime?: string
}

export type ChangeType = 'feature' | 'bug' | 'improvement' | 'documentation'
export type ChangeStatus = 'pending' | 'approved' | 'rejected' | 'implemented'

// 用户类型
export interface User {
  id: string | number
  username: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  createTime: string
}

export type UserRole = 'admin' | 'manager' | 'developer' | 'viewer'

// 表单类型
export interface FormState {
  loading: boolean
  errors: Record<string, string>
}

// 表格类型
export interface TableColumn {
  key: string
  title: string
  width?: number
  sortable?: boolean
  filterable?: boolean
}

export interface TableState {
  loading: boolean
  data: any[]
  pagination: PaginationParams
  selection: any[]
  sort: {
    field: string
    order: 'asc' | 'desc'
  }
  filters: Record<string, any>
}

// 路由类型
export interface RouteConfig {
  path: string
  name: string
  component: any
  meta?: {
    title?: string
    requiresAuth?: boolean
    roles?: UserRole[]
    icon?: string
  }
  children?: RouteConfig[]
}

// 菜单类型
export interface MenuItem {
  key: string
  title: string
  icon?: string
  path?: string
  children?: MenuItem[]
  roles?: UserRole[]
}

// 通知类型
export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  duration?: number
  timestamp: number
}

// 主题类型
export interface ThemeConfig {
  primaryColor: string
  mode: 'light' | 'dark'
  compact: boolean
}

// 应用配置类型
export interface AppConfig {
  title: string
  version: string
  apiBaseUrl: string
  theme: ThemeConfig
  features: {
    enableNotifications: boolean
    enableDarkMode: boolean
    enableRealtime: boolean
  }
}

// 错误类型
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: number
}

// 事件类型
export interface AppEvent {
  type: string
  payload: any
  timestamp: number
}

// 导出所有类型的联合类型
export type EntityType = Project | Task | PRD | ChangeRequest | User
export type EntityStatus = ProjectStatus | TaskStatus | PRDStatus | ChangeStatus
export type EntityPriority = TaskPriority
