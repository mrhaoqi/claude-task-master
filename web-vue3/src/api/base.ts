// API基础服务 - 适配器模式实现

import type { ApiResponse } from '@/types'

// HTTP客户端接口
export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>
  delete<T>(url: string, config?: RequestConfig): Promise<T>
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>
}

// 请求配置接口
export interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
  params?: Record<string, any>
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
}

// 响应拦截器接口
export interface ResponseInterceptor {
  onFulfilled?: (response: any) => any
  onRejected?: (error: any) => any
}

// 请求拦截器接口
export interface RequestInterceptor {
  onFulfilled?: (config: any) => any
  onRejected?: (error: any) => any
}

// API错误类
export class ApiError extends Error {
  public code: string
  public status: number
  public data: any

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 0, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.data = data
  }
}

// 基础HTTP客户端实现（适配器模式）
export class BaseHttpClient implements HttpClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private timeout: number
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []

  constructor(baseURL: string = '', timeout: number = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  // 设置默认头部
  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value
  }

  // 移除默认头部
  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key]
  }

  // 构建完整URL
  private buildURL(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `${this.baseURL}${url.startsWith('/') ? url : '/' + url}`
  }

  // 处理请求配置
  private processRequestConfig(config: RequestConfig = {}): RequestConfig {
    const processedConfig = {
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...config.headers,
      },
      timeout: config.timeout || this.timeout,
    }

    // 应用请求拦截器
    return this.requestInterceptors.reduce((cfg, interceptor) => {
      return interceptor.onFulfilled ? interceptor.onFulfilled(cfg) : cfg
    }, processedConfig)
  }

  // 处理响应
  private async processResponse<T>(response: Response): Promise<T> {
    let data: any

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      const error = new ApiError(
        data.message || `HTTP Error: ${response.status}`,
        data.code || 'HTTP_ERROR',
        response.status,
        data
      )

      // 应用响应拦截器的错误处理
      const processedError = this.responseInterceptors.reduce((err, interceptor) => {
        return interceptor.onRejected ? interceptor.onRejected(err) : err
      }, error)

      throw processedError
    }

    // 应用响应拦截器的成功处理
    return this.responseInterceptors.reduce((result, interceptor) => {
      return interceptor.onFulfilled ? interceptor.onFulfilled(result) : result
    }, data)
  }

  // 通用请求方法
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    const processedConfig = this.processRequestConfig(config)
    const fullURL = this.buildURL(url)

    const requestInit: RequestInit = {
      method,
      headers: processedConfig.headers,
      signal: AbortSignal.timeout(processedConfig.timeout || this.timeout),
    }

    // 添加请求体
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      if (data instanceof FormData) {
        requestInit.body = data
        // 移除Content-Type，让浏览器自动设置
        delete (requestInit.headers as any)['Content-Type']
      } else {
        requestInit.body = JSON.stringify(data)
      }
    }

    // 添加查询参数
    if (processedConfig.params) {
      const searchParams = new URLSearchParams()
      Object.entries(processedConfig.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const separator = fullURL.includes('?') ? '&' : '?'
      url = `${fullURL}${separator}${searchParams.toString()}`
    }

    try {
      const response = await fetch(fullURL, requestInit)
      return await this.processResponse<T>(response)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // 处理网络错误或超时
      const apiError = new ApiError(
        error instanceof Error ? error.message : 'Network Error',
        'NETWORK_ERROR',
        0,
        error
      )

      // 应用响应拦截器的错误处理
      const processedError = this.responseInterceptors.reduce((err, interceptor) => {
        return interceptor.onRejected ? interceptor.onRejected(err) : err
      }, apiError)

      throw processedError
    }
  }

  // HTTP方法实现
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config)
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config)
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config)
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config)
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config)
  }
}

// 创建默认的HTTP客户端实例（单例模式）
export const httpClient = new BaseHttpClient('http://localhost:3000/api')

// 添加默认的响应拦截器
httpClient.addResponseInterceptor({
  onFulfilled: (response) => {
    // Express API返回格式: { success: true, data: {...}, message: "...", requestId: "..." }
    if (response && typeof response === 'object' && 'success' in response) {
      const apiResponse = response as ApiResponse
      if (apiResponse.success) {
        return apiResponse.data
      } else {
        throw new ApiError(
          apiResponse.message || 'API request failed',
          String(apiResponse.code || 'API_ERROR'),
          0,
          apiResponse
        )
      }
    }
    return response
  },
  onRejected: (error) => {
    // 统一错误处理
    console.error('API Error:', error)

    // 处理HTTP错误响应
    if (error.status) {
      let message = '请求失败'
      if (error.status === 401) {
        message = '身份验证失败，请重新登录'
      } else if (error.status === 403) {
        message = '权限不足，无法执行此操作'
      } else if (error.status === 404) {
        message = '请求的资源不存在'
      } else if (error.status >= 500) {
        message = '服务器内部错误，请稍后重试'
      } else if (error.status === 400) {
        message = '请求参数错误'
      } else if (error.status === 408) {
        message = '请求超时，请稍后重试'
      }

      return Promise.reject(new ApiError(
        message,
        `HTTP_${error.status}`,
        error.status,
        error.data
      ))
    }

    // 网络错误
    if (!navigator.onLine) {
      return Promise.reject(new ApiError(
        '网络连接已断开，请检查网络设置',
        'NETWORK_OFFLINE',
        0
      ))
    }

    // 超时错误
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(new ApiError(
        '请求超时，请稍后重试',
        'REQUEST_TIMEOUT',
        408
      ))
    }

    return Promise.reject(error)
  },
})

// 添加默认的请求拦截器
httpClient.addRequestInterceptor({
  onFulfilled: (config) => {
    // 可以在这里添加认证token等
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }
    return config
  },
})

export default httpClient
