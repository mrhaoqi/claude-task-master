// 工具函数集合

import { REGEX } from '@/constants'

// 日期时间工具
export const dateUtils = {
  // 格式化日期
  format(date: Date | string | number, format: string = 'YYYY-MM-DD'): string {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  },

  // 相对时间
  relative(date: Date | string | number): string {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    const minute = 60 * 1000
    const hour = minute * 60
    const day = hour * 24
    const week = day * 7
    const month = day * 30
    const year = day * 365

    if (diff < minute) return '刚刚'
    if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
    if (diff < day) return `${Math.floor(diff / hour)}小时前`
    if (diff < week) return `${Math.floor(diff / day)}天前`
    if (diff < month) return `${Math.floor(diff / week)}周前`
    if (diff < year) return `${Math.floor(diff / month)}个月前`
    return `${Math.floor(diff / year)}年前`
  },

  // 是否是今天
  isToday(date: Date | string | number): boolean {
    const d = new Date(date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  },

  // 是否逾期
  isOverdue(date: Date | string | number): boolean {
    const d = new Date(date)
    const now = new Date()
    return d.getTime() < now.getTime()
  },

  // 添加天数
  addDays(date: Date | string | number, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  }
}

// 字符串工具
export const stringUtils = {
  // 截断字符串
  truncate(str: string, length: number, suffix: string = '...'): string {
    if (str.length <= length) return str
    return str.substring(0, length) + suffix
  },

  // 首字母大写
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  // 驼峰转短横线
  kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  },

  // 短横线转驼峰
  camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  },

  // 生成随机字符串
  random(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // 生成UUID
  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

// 数字工具
export const numberUtils = {
  // 格式化数字
  format(num: number, decimals: number = 0): string {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  },

  // 格式化文件大小
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // 格式化百分比
  formatPercent(num: number, decimals: number = 1): string {
    return (num * 100).toFixed(decimals) + '%'
  },

  // 限制数字范围
  clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max)
  }
}

// 数组工具
export const arrayUtils = {
  // 去重
  unique<T>(arr: T[]): T[] {
    return [...new Set(arr)]
  },

  // 分组
  groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return arr.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  // 排序
  sortBy<T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...arr].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })
  },

  // 分页
  paginate<T>(arr: T[], page: number, pageSize: number): T[] {
    const start = (page - 1) * pageSize
    return arr.slice(start, start + pageSize)
  },

  // 移动元素
  move<T>(arr: T[], from: number, to: number): T[] {
    const result = [...arr]
    const [removed] = result.splice(from, 1)
    result.splice(to, 0, removed)
    return result
  }
}

// 对象工具
export const objectUtils = {
  // 深拷贝
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
    if (obj instanceof Array) return obj.map(item => objectUtils.deepClone(item)) as unknown as T
    
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = objectUtils.deepClone(obj[key])
      }
    }
    return cloned
  },

  // 深度合并
  deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target
    const source = sources.shift()

    if (objectUtils.isObject(target) && objectUtils.isObject(source)) {
      for (const key in source) {
        if (objectUtils.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} })
          objectUtils.deepMerge(target[key], source[key])
        } else {
          Object.assign(target, { [key]: source[key] })
        }
      }
    }

    return objectUtils.deepMerge(target, ...sources)
  },

  // 判断是否为对象
  isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item)
  },

  // 获取嵌套属性
  get(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.')
    let result = obj
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue
      }
      result = result[key]
    }
    
    return result !== undefined ? result : defaultValue
  },

  // 设置嵌套属性
  set(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    let current = obj
    
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }
    
    current[lastKey] = value
  }
}

// 验证工具
export const validateUtils = {
  // 邮箱验证
  isEmail(email: string): boolean {
    return REGEX.EMAIL.test(email)
  },

  // 手机号验证
  isPhone(phone: string): boolean {
    return REGEX.PHONE.test(phone)
  },

  // URL验证
  isUrl(url: string): boolean {
    return REGEX.URL.test(url)
  },

  // 密码强度验证
  isStrongPassword(password: string): boolean {
    return REGEX.PASSWORD.test(password)
  },

  // 非空验证
  isRequired(value: any): boolean {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  },

  // 长度验证
  hasLength(value: string, min: number, max?: number): boolean {
    const length = value.length
    if (length < min) return false
    if (max !== undefined && length > max) return false
    return true
  }
}

// 本地存储工具
export const storageUtils = {
  // 设置本地存储
  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to set localStorage:', error)
    }
  },

  // 获取本地存储
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error('Failed to get localStorage:', error)
      return defaultValue || null
    }
  },

  // 删除本地存储
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove localStorage:', error)
    }
  },

  // 清空本地存储
  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return function (...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= wait) {
      lastTime = now
      func.apply(this, args)
    }
  }
}

// 异步延迟
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 重试函数
export async function retry<T>(
  fn: () => Promise<T>,
  times: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (times <= 1) throw error
    await sleep(delay)
    return retry(fn, times - 1, delay)
  }
}
