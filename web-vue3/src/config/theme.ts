// 主题配置系统
import { ref, computed } from 'vue'

// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'auto'
export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red'

// 主题配置接口
export interface ThemeConfig {
  mode: ThemeMode
  primaryColor: ThemeColor
  borderRadius: 'small' | 'medium' | 'large'
  componentSize: 'small' | 'default' | 'large'
}

// 预定义主题色彩
export const THEME_COLORS = {
  blue: {
    primary: '#409EFF',
    light: '#79bbff',
    lighter: '#a0cfff',
    dark: '#337ecc'
  },
  green: {
    primary: '#67C23A',
    light: '#85ce61',
    lighter: '#a4da89',
    dark: '#529b2e'
  },
  purple: {
    primary: '#9C27B0',
    light: '#ba68c8',
    lighter: '#ce93d8',
    dark: '#7b1fa2'
  },
  orange: {
    primary: '#FF9800',
    light: '#ffb74d',
    lighter: '#ffcc80',
    dark: '#f57c00'
  },
  red: {
    primary: '#F56C6C',
    light: '#f78989',
    lighter: '#fab6b6',
    dark: '#dd6161'
  }
} as const

// 响应式断点配置
export const BREAKPOINTS = {
  xs: 480,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1920
} as const

// 默认主题配置
const DEFAULT_THEME: ThemeConfig = {
  mode: 'light',
  primaryColor: 'blue',
  borderRadius: 'medium',
  componentSize: 'default'
}

// 主题状态管理
class ThemeManager {
  private _config = ref<ThemeConfig>({ ...DEFAULT_THEME })
  private _isDark = ref(false)

  constructor() {
    this.loadThemeFromStorage()
    this.initSystemThemeListener()
    this.applyTheme()
  }

  // 获取当前主题配置
  get config() {
    return this._config.value
  }

  // 获取是否为暗黑模式
  get isDark() {
    return this._isDark.value
  }

  // 计算属性：当前主题色彩
  get currentColors() {
    return computed(() => THEME_COLORS[this._config.value.primaryColor])
  }

  // 设置主题模式
  setMode(mode: ThemeMode) {
    this._config.value.mode = mode
    this.updateDarkMode()
    this.saveThemeToStorage()
    this.applyTheme()
  }

  // 设置主题色彩
  setPrimaryColor(color: ThemeColor) {
    this._config.value.primaryColor = color
    this.saveThemeToStorage()
    this.applyTheme()
  }

  // 设置边框圆角
  setBorderRadius(radius: 'small' | 'medium' | 'large') {
    this._config.value.borderRadius = radius
    this.saveThemeToStorage()
    this.applyTheme()
  }

  // 设置组件大小
  setComponentSize(size: 'small' | 'default' | 'large') {
    this._config.value.componentSize = size
    this.saveThemeToStorage()
    this.applyTheme()
  }

  // 切换暗黑模式
  toggleDark() {
    const newMode = this._config.value.mode === 'dark' ? 'light' : 'dark'
    this.setMode(newMode)
  }

  // 从本地存储加载主题
  private loadThemeFromStorage() {
    try {
      const stored = localStorage.getItem('theme-config')
      if (stored) {
        const config = JSON.parse(stored)
        this._config.value = { ...DEFAULT_THEME, ...config }
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error)
    }
    this.updateDarkMode()
  }

  // 保存主题到本地存储
  private saveThemeToStorage() {
    try {
      localStorage.setItem('theme-config', JSON.stringify(this._config.value))
    } catch (error) {
      console.warn('Failed to save theme to storage:', error)
    }
  }

  // 初始化系统主题监听
  private initSystemThemeListener() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = () => {
        if (this._config.value.mode === 'auto') {
          this.updateDarkMode()
          this.applyTheme()
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      
      // 清理函数
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }

  // 更新暗黑模式状态
  private updateDarkMode() {
    if (this._config.value.mode === 'auto') {
      this._isDark.value = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    } else {
      this._isDark.value = this._config.value.mode === 'dark'
    }
  }

  // 应用主题到DOM
  private applyTheme() {
    const root = document.documentElement
    const colors = THEME_COLORS[this._config.value.primaryColor]

    // 设置CSS变量
    root.style.setProperty('--el-color-primary', colors.primary)
    root.style.setProperty('--el-color-primary-light-3', colors.light)
    root.style.setProperty('--el-color-primary-light-5', colors.lighter)
    root.style.setProperty('--el-color-primary-dark-2', colors.dark)

    // 设置边框圆角
    const radiusMap = {
      small: '2px',
      medium: '4px',
      large: '8px'
    }
    root.style.setProperty('--el-border-radius-base', radiusMap[this._config.value.borderRadius])

    // 设置暗黑模式类名
    if (this._isDark.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // 设置组件大小类名
    root.setAttribute('data-theme-size', this._config.value.componentSize)
  }
}

// 创建全局主题管理器实例
export const themeManager = new ThemeManager()

// 导出响应式主题状态
export const useTheme = () => {
  return {
    config: computed(() => themeManager.config),
    isDark: computed(() => themeManager.isDark),
    currentColors: themeManager.currentColors,
    setMode: themeManager.setMode.bind(themeManager),
    setPrimaryColor: themeManager.setPrimaryColor.bind(themeManager),
    setBorderRadius: themeManager.setBorderRadius.bind(themeManager),
    setComponentSize: themeManager.setComponentSize.bind(themeManager),
    toggleDark: themeManager.toggleDark.bind(themeManager)
  }
}

// 响应式断点Hook
export const useBreakpoints = () => {
  const width = ref(window.innerWidth)
  
  const updateWidth = () => {
    width.value = window.innerWidth
  }
  
  window.addEventListener('resize', updateWidth)
  
  const breakpoint = computed(() => {
    if (width.value < BREAKPOINTS.xs) return 'xs'
    if (width.value < BREAKPOINTS.sm) return 'sm'
    if (width.value < BREAKPOINTS.md) return 'md'
    if (width.value < BREAKPOINTS.lg) return 'lg'
    if (width.value < BREAKPOINTS.xl) return 'xl'
    return 'xxl'
  })
  
  const isMobile = computed(() => width.value < BREAKPOINTS.md)
  const isTablet = computed(() => width.value >= BREAKPOINTS.md && width.value < BREAKPOINTS.lg)
  const isDesktop = computed(() => width.value >= BREAKPOINTS.lg)
  
  return {
    width: computed(() => width.value),
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    cleanup: () => window.removeEventListener('resize', updateWidth)
  }
}
