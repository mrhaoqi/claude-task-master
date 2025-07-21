// 任务API服务

import httpClient from './base'
import type { 
  Task, 
  CreateTaskRequest, 
  PaginatedResponse,
  TaskStatus,
  TaskPriority
} from '@/types'

// 任务API服务类
export class TasksApiService {
  private readonly basePath = '/tasks'

  // 获取任务列表 - 通过项目ID获取
  async getTasks(params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: TaskStatus
    priority?: TaskPriority
    projectId?: string | number
    assignee?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Task>> {
    // 如果没有projectId，返回空结果
    if (!params?.projectId) {
      return {
        items: [],
        pagination: { page: 1, pageSize: 10, total: 0 }
      }
    }

    return this.getProjectTasks(params.projectId, {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
      assignee: params.assignee
    })
  }

  // 获取项目任务
  async getProjectTasks(projectId: string | number, params?: {
    page?: number
    pageSize?: number
    status?: TaskStatus
    assignee?: string
  }): Promise<PaginatedResponse<Task>> {
    // Express API路径: /api/projects/:projectId/tasks
    const response = await httpClient.get<any>(`/projects/${projectId}/tasks`, {
      params: {
        tag: params?.status || 'main'
      }
    })

    // Express API返回格式: { tasks: [...], metadata: {...} }
    const tasks = response?.tasks || []
    const convertedTasks = tasks.map((task: any) => this.convertTaskFormat(task, projectId))

    // 客户端分页
    const page = params?.page || 1
    const pageSize = params?.pageSize || 10
    const total = convertedTasks.length
    const start = (page - 1) * pageSize
    const items = convertedTasks.slice(start, start + pageSize)

    return {
      items,
      pagination: { page, pageSize, total }
    }
  }

  // 获取单个任务
  async getTask(id: string | number, projectId?: string | number): Promise<Task> {
    if (!projectId) {
      throw new Error('Project ID is required to get task')
    }

    const response = await httpClient.get<any>(`/projects/${projectId}/tasks/${id}`)
    return this.convertTaskFormat(response, projectId)
  }

  // 转换任务格式：express-api格式 -> 前端格式
  private convertTaskFormat(task: any, projectId: string | number): Task {
    return {
      id: task.id,
      title: task.title || task.name || '',
      description: task.description || '',
      status: this.mapTaskStatus(task.status),
      priority: this.mapTaskPriority(task.priority),
      progress: task.progress || 0,
      assignee: task.assignee || 'Unknown',
      projectId: projectId,
      project: task.project || '',
      dueDate: task.dueDate || task.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createTime: task.createdAt || task.created || task.createTime || new Date().toISOString(),
      updateTime: task.updatedAt || task.updated || task.updateTime || new Date().toISOString(),
      tags: task.tags || []
    }
  }

  // 映射任务状态
  private mapTaskStatus(status?: string): TaskStatus {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'todo':
        return 'todo'
      case 'in_progress':
      case 'working':
      case 'active':
        return 'in_progress'
      case 'completed':
      case 'done':
        return 'completed'
      case 'cancelled':
      case 'canceled':
        return 'cancelled'
      default:
        return 'todo'
    }
  }

  // 映射任务优先级
  private mapTaskPriority(priority?: string): TaskPriority {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'high'
      case 'medium':
        return 'medium'
      case 'low':
        return 'low'
      case 'urgent':
        return 'urgent'
      default:
        return 'medium'
    }
  }

  // 创建任务
  async createTask(data: CreateTaskRequest): Promise<Task> {
    const requestData = {
      title: data.title,
      description: data.description || '',
      priority: data.priority || 'medium',
      useManualData: false
    }

    const response = await httpClient.post<any>(`/projects/${data.projectId}/tasks`, requestData)
    return this.convertTaskFormat(response, data.projectId)
  }

  // 更新任务
  async updateTask(id: string | number, data: Partial<CreateTaskRequest>): Promise<Task> {
    if (!data.projectId) {
      throw new Error('Project ID is required to update task')
    }

    const requestData = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status
    }

    const response = await httpClient.put<any>(`/projects/${data.projectId}/tasks/${id}`, requestData)
    return this.convertTaskFormat(response, data.projectId)
  }

  // 删除任务
  async deleteTask(id: string | number, projectId?: string | number): Promise<void> {
    if (!projectId) {
      throw new Error('Project ID is required to delete task')
    }

    await httpClient.delete<void>(`/projects/${projectId}/tasks/${id}`)
  }

  // 更新任务状态
  async updateTaskStatus(id: string | number, status: TaskStatus, projectId?: string | number): Promise<Task> {
    if (!projectId) {
      throw new Error('Project ID is required to update task status')
    }

    const response = await httpClient.put<any>(`/projects/${projectId}/tasks/${id}/status`, {
      status: this.mapStatusToExpressApi(status)
    })
    return this.convertTaskFormat(response, projectId)
  }

  // 更新任务进度
  async updateTaskProgress(id: string | number, progress: number, projectId?: string | number): Promise<Task> {
    if (!projectId) {
      throw new Error('Project ID is required to update task progress')
    }

    // Express API可能没有直接的进度更新接口，通过更新任务来实现
    const response = await httpClient.put<any>(`/projects/${projectId}/tasks/${id}`, {
      progress
    })
    return this.convertTaskFormat(response, projectId)
  }

  // 分配任务
  async assignTask(id: string | number, assignee: string, projectId?: string | number): Promise<Task> {
    if (!projectId) {
      throw new Error('Project ID is required to assign task')
    }

    const response = await httpClient.put<any>(`/projects/${projectId}/tasks/${id}`, {
      assignee
    })
    return this.convertTaskFormat(response, projectId)
  }

  // 映射前端状态到express-api状态
  private mapStatusToExpressApi(status: TaskStatus): string {
    switch (status) {
      case 'todo':
        return 'pending'
      case 'in_progress':
        return 'in_progress'
      case 'completed':
        return 'completed'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'pending'
    }
  }

  // 获取任务评论
  async getTaskComments(id: string | number): Promise<any[]> {
    return httpClient.get(`${this.basePath}/${id}/comments`)
  }

  // 添加任务评论
  async addTaskComment(id: string | number, content: string): Promise<any> {
    return httpClient.post(`${this.basePath}/${id}/comments`, { content })
  }

  // 获取任务附件
  async getTaskAttachments(id: string | number): Promise<any[]> {
    return httpClient.get(`${this.basePath}/${id}/attachments`)
  }

  // 上传任务附件
  async uploadTaskAttachment(id: string | number, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    return httpClient.post(`${this.basePath}/${id}/attachments`, formData)
  }

  // 删除任务附件
  async deleteTaskAttachment(taskId: string | number, attachmentId: string | number): Promise<void> {
    return httpClient.delete(`${this.basePath}/${taskId}/attachments/${attachmentId}`)
  }

  // 获取子任务
  async getSubtasks(id: string | number): Promise<Task[]> {
    return httpClient.get(`${this.basePath}/${id}/subtasks`)
  }

  // 创建子任务
  async createSubtask(parentId: string | number, data: CreateTaskRequest): Promise<Task> {
    return httpClient.post(`${this.basePath}/${parentId}/subtasks`, data)
  }

  // 批量更新任务
  async batchUpdateTasks(updates: Array<{
    id: string | number
    data: Partial<CreateTaskRequest>
  }>): Promise<Task[]> {
    return httpClient.patch(`${this.basePath}/batch`, { updates })
  }

  // 批量删除任务
  async batchDeleteTasks(ids: Array<string | number>): Promise<void> {
    return httpClient.delete(`${this.basePath}/batch`, {
      params: { ids: ids.join(',') }
    })
  }

  // 获取我的任务
  async getMyTasks(params?: {
    status?: TaskStatus
    priority?: TaskPriority
    dueDate?: string
  }): Promise<Task[]> {
    return httpClient.get(`${this.basePath}/my`, { params })
  }

  // 获取逾期任务
  async getOverdueTasks(projectId?: string | number): Promise<Task[]> {
    return httpClient.get(`${this.basePath}/overdue`, {
      params: { projectId }
    })
  }

  // 获取任务统计
  async getTaskStats(projectId?: string | number): Promise<{
    total: number
    todo: number
    inProgress: number
    completed: number
    overdue: number
  }> {
    return httpClient.get(`${this.basePath}/stats`, {
      params: { projectId }
    })
  }
}

// 导出单例实例
export const tasksApi = new TasksApiService()
export default tasksApi
