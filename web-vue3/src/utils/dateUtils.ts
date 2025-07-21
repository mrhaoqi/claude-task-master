// 日期工具函数
import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 安全的日期格式化函数
 * @param dateInput 日期输入（字符串、Date对象或undefined）
 * @param formatStr 格式化字符串，默认为 'yyyy-MM-dd'
 * @param fallback 当日期无效时的回退值
 * @returns 格式化后的日期字符串
 */
export function safeFormatDate(
  dateInput: string | Date | undefined | null,
  formatStr: string = 'yyyy-MM-dd',
  fallback: string = '未设置'
): string {
  if (!dateInput) {
    return fallback
  }

  try {
    let date: Date

    if (typeof dateInput === 'string') {
      // 处理ISO字符串
      if (dateInput.includes('T')) {
        date = parseISO(dateInput)
      } else {
        date = new Date(dateInput)
      }
    } else {
      date = dateInput
    }

    if (!isValid(date)) {
      return fallback
    }

    return format(date, formatStr, { locale: zhCN })
  } catch (error) {
    console.warn('Date formatting error:', error, 'Input:', dateInput)
    return fallback
  }
}

/**
 * 提取日期部分（去掉时间）
 * @param dateInput 日期输入
 * @param fallback 回退值
 * @returns YYYY-MM-DD 格式的日期字符串
 */
export function extractDatePart(
  dateInput: string | Date | undefined | null,
  fallback: string = new Date().toISOString().split('T')[0]
): string {
  if (!dateInput) {
    return fallback
  }

  try {
    if (typeof dateInput === 'string') {
      // 如果已经是 YYYY-MM-DD 格式，直接返回
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput
      }
      
      // 如果包含时间部分，提取日期部分
      if (dateInput.includes('T')) {
        return dateInput.split('T')[0]
      }
      
      // 尝试解析其他格式
      const date = new Date(dateInput)
      if (isValid(date)) {
        return date.toISOString().split('T')[0]
      }
    } else {
      // Date 对象
      if (isValid(dateInput)) {
        return dateInput.toISOString().split('T')[0]
      }
    }
  } catch (error) {
    console.warn('Date extraction error:', error, 'Input:', dateInput)
  }

  return fallback
}

/**
 * 格式化为本地日期字符串
 * @param dateInput 日期输入
 * @param fallback 回退值
 * @returns 本地化的日期字符串
 */
export function formatLocalDate(
  dateInput: string | Date | undefined | null,
  fallback: string = '未设置'
): string {
  return safeFormatDate(dateInput, 'yyyy年MM月dd日', fallback)
}

/**
 * 格式化为相对时间
 * @param dateInput 日期输入
 * @param fallback 回退值
 * @returns 相对时间字符串（如：3天前）
 */
export function formatRelativeTime(
  dateInput: string | Date | undefined | null,
  fallback: string = '未知时间'
): string {
  if (!dateInput) {
    return fallback
  }

  try {
    let date: Date

    if (typeof dateInput === 'string') {
      date = dateInput.includes('T') ? parseISO(dateInput) : new Date(dateInput)
    } else {
      date = dateInput
    }

    if (!isValid(date)) {
      return fallback
    }

    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: zhCN 
    })
  } catch (error) {
    console.warn('Relative time formatting error:', error, 'Input:', dateInput)
    return fallback
  }
}

/**
 * 格式化为日期时间字符串
 * @param dateInput 日期输入
 * @param fallback 回退值
 * @returns 日期时间字符串
 */
export function formatDateTime(
  dateInput: string | Date | undefined | null,
  fallback: string = '未设置'
): string {
  return safeFormatDate(dateInput, 'yyyy-MM-dd HH:mm:ss', fallback)
}

/**
 * 检查日期是否过期
 * @param dateInput 日期输入
 * @returns 是否过期
 */
export function isOverdue(dateInput: string | Date | undefined | null): boolean {
  if (!dateInput) {
    return false
  }

  try {
    let date: Date

    if (typeof dateInput === 'string') {
      date = dateInput.includes('T') ? parseISO(dateInput) : new Date(dateInput)
    } else {
      date = dateInput
    }

    if (!isValid(date)) {
      return false
    }

    return date < new Date()
  } catch (error) {
    console.warn('Overdue check error:', error, 'Input:', dateInput)
    return false
  }
}

/**
 * 获取安全的日期对象
 * @param dateInput 日期输入
 * @param fallback 回退日期
 * @returns Date对象
 */
export function getSafeDate(
  dateInput: string | Date | undefined | null,
  fallback: Date = new Date()
): Date {
  if (!dateInput) {
    return fallback
  }

  try {
    let date: Date

    if (typeof dateInput === 'string') {
      date = dateInput.includes('T') ? parseISO(dateInput) : new Date(dateInput)
    } else {
      date = dateInput
    }

    if (!isValid(date)) {
      return fallback
    }

    return date
  } catch (error) {
    console.warn('Safe date creation error:', error, 'Input:', dateInput)
    return fallback
  }
}

/**
 * 日期范围格式化
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param separator 分隔符
 * @returns 日期范围字符串
 */
export function formatDateRange(
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null,
  separator: string = ' ~ '
): string {
  const start = safeFormatDate(startDate, 'yyyy-MM-dd', '')
  const end = safeFormatDate(endDate, 'yyyy-MM-dd', '')
  
  if (!start && !end) {
    return '未设置'
  }
  
  if (!start) {
    return `至 ${end}`
  }
  
  if (!end) {
    return `${start} 起`
  }
  
  return `${start}${separator}${end}`
}

// 导出常用的日期格式常量
export const DATE_FORMATS = {
  DATE: 'yyyy-MM-dd',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  TIME: 'HH:mm:ss',
  MONTH: 'yyyy-MM',
  YEAR: 'yyyy',
  LOCAL_DATE: 'yyyy年MM月dd日',
  LOCAL_DATETIME: 'yyyy年MM月dd日 HH:mm:ss'
} as const
