// 项目API服务

import httpClient from './base'
import type { 
  Project, 
  CreateProjectRequest, 
  PaginatedResponse, 
  PaginationParams 
} from '@/types'

// 项目API服务类
export class ProjectsApiService {
  private readonly basePath = '/projects'

  // 获取项目列表
  async getProjects(params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Project>> {
    // Express API返回格式: { success: true, data: [...], count: number }
    const response = await httpClient.get<Project[]>(this.basePath, {
      params: {
        search: params?.search,
        status: params?.status,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      }
    })

    // 转换为分页格式
    const rawProjects = Array.isArray(response) ? response : []

    // 转换项目数据格式，确保所有字段都有默认值
    const projects = rawProjects.map(project => ({
      id: project.id || project.name,
      name: project.name || 'Unknown Project',
      description: project.description || '',
      status: this.mapProjectStatus(project.template || project.status),
      progress: project.progress || 0,
      createTime: project.created || project.createdAt || project.createTime || new Date().toISOString(),
      updateTime: project.updated || project.lastAccessed || project.updatedAt || project.updateTime || new Date().toISOString(),
      members: project.members || 1,
      tasks: project.tasks || 0
    }))

    const total = projects.length
    const page = params?.page || 1
    const pageSize = params?.pageSize || 10
    const start = (page - 1) * pageSize
    const items = projects.slice(start, start + pageSize)

    return {
      items,
      pagination: {
        page,
        pageSize,
        total
      }
    }
  }

  // 获取单个项目
  async getProject(id: string | number): Promise<Project> {
    const response = await httpClient.get<any>(`${this.basePath}/${id}`)

    // 转换express-api格式到前端格式
    return {
      id: response.id,
      name: response.name,
      description: response.description || '',
      status: this.mapProjectStatus(response.template),
      progress: 0, // express-api没有进度字段，默认为0
      createTime: response.created || response.createdAt || new Date().toISOString(),
      updateTime: response.updated || response.lastAccessed || response.updatedAt || new Date().toISOString(),
      members: 1, // 默认值，实际应该从成员API获取
      tasks: 0 // 默认值，实际应该从任务API获取
    }
  }

  // 创建项目
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const requestData = {
      id: data.name.toLowerCase().replace(/\s+/g, '-'), // 生成项目ID
      name: data.name,
      description: data.description || '',
      template: 'default'
    }

    const response = await httpClient.post<any>(this.basePath, requestData)

    return {
      id: response.id,
      name: response.name,
      description: response.description || '',
      status: data.status || 'pending',
      progress: 0,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      members: 1,
      tasks: 0
    }
  }

  // 更新项目
  async updateProject(id: string | number, data: Partial<CreateProjectRequest>): Promise<Project> {
    const requestData = {
      name: data.name,
      description: data.description,
      template: 'default'
    }

    const response = await httpClient.put<any>(`${this.basePath}/${id}`, requestData)

    return {
      id: response.id,
      name: response.name,
      description: response.description || '',
      status: data.status || 'active',
      progress: 0,
      createTime: response.created || new Date().toISOString(),
      updateTime: new Date().toISOString(),
      members: 1,
      tasks: 0
    }
  }

  // 删除项目
  async deleteProject(id: string | number): Promise<void> {
    await httpClient.delete<void>(`${this.basePath}/${id}`, {
      params: { deleteFiles: false }
    })
  }

  // 辅助方法：映射项目状态
  private mapProjectStatus(template?: string): string {
    // express-api使用template字段，我们映射到status
    return 'active' // 默认状态
  }

  // 获取项目统计信息
  async getProjectStats(id: string | number): Promise<{
    totalTasks: number
    completedTasks: number
    activeTasks: number
    overdueTasks: number
    members: number
    progress: number
  }> {
    return httpClient.get(`${this.basePath}/${id}/stats`)
  }

  // 获取项目成员
  async getProjectMembers(id: string | number): Promise<any[]> {
    return httpClient.get(`${this.basePath}/${id}/members`)
  }

  // 添加项目成员
  async addProjectMember(id: string | number, userId: string | number, role?: string): Promise<void> {
    return httpClient.post(`${this.basePath}/${id}/members`, { userId, role })
  }

  // 移除项目成员
  async removeProjectMember(id: string | number, userId: string | number): Promise<void> {
    return httpClient.delete(`${this.basePath}/${id}/members/${userId}`)
  }

  // 更新项目状态
  async updateProjectStatus(id: string | number, status: string): Promise<Project> {
    return httpClient.patch<Project>(`${this.basePath}/${id}/status`, { status })
  }

  // 复制项目
  async duplicateProject(id: string | number, name: string): Promise<Project> {
    return httpClient.post<Project>(`${this.basePath}/${id}/duplicate`, { name })
  }

  // 归档项目
  async archiveProject(id: string | number): Promise<void> {
    return httpClient.post(`${this.basePath}/${id}/archive`)
  }

  // 恢复项目
  async restoreProject(id: string | number): Promise<void> {
    return httpClient.post(`${this.basePath}/${id}/restore`)
  }
}

// 导出单例实例
export const projectsApi = new ProjectsApiService()
export default projectsApi
