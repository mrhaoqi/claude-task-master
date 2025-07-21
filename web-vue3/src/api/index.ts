// API服务统一导出

// 导出基础HTTP客户端
export { default as httpClient, BaseHttpClient, ApiError } from './base'
export type { HttpClient, RequestConfig, ResponseInterceptor, RequestInterceptor } from './base'

// 导出项目API
export { default as projectsApi, ProjectsApiService } from './projects'

// 导出任务API
export { default as tasksApi, TasksApiService } from './tasks'

// 导入API实例
import projectsApi from './projects'
import tasksApi from './tasks'

// 创建API服务集合（单例模式）
export class ApiService {
  public readonly projects = projectsApi
  public readonly tasks = tasksApi

  // 可以添加全局配置方法
  setAuthToken(token: string): void {
    httpClient.setDefaultHeader('Authorization', `Bearer ${token}`)
  }

  removeAuthToken(): void {
    httpClient.removeDefaultHeader('Authorization')
  }

  setBaseURL(baseURL: string): void {
    // 这里可以重新创建httpClient实例或者添加配置方法
    console.warn('setBaseURL not implemented yet')
  }
}

// 导出单例API服务实例
export const api = new ApiService()
export default api
