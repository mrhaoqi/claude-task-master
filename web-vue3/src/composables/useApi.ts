// API调用组合式函数

import { ref, reactive, computed } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'

// API状态接口
export interface ApiState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

// API选项接口
export interface ApiOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  showMessage?: boolean
  successMessage?: string
  errorMessage?: string
}

// 基础API调用Hook
export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<T>,
  options: ApiOptions = {}
) {
  const {
    immediate = false,
    onSuccess,
    onError,
    showMessage = true,
    successMessage,
    errorMessage
  } = options

  // 响应式状态
  const state = reactive<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false
  })

  // 计算属性
  const isLoading = computed(() => state.loading)
  const hasError = computed(() => !!state.error)
  const hasData = computed(() => !!state.data)

  // 执行API调用
  const execute = async (...args: any[]): Promise<T | null> => {
    try {
      state.loading = true
      state.error = null
      state.success = false

      const result = await apiCall(...args)
      
      state.data = result
      state.success = true

      // 成功回调
      if (onSuccess) {
        onSuccess(result)
      }

      // 显示成功消息
      if (showMessage && successMessage) {
        ElMessage.success(successMessage)
      }

      return result
    } catch (error: any) {
      const errorMsg = error.message || '请求失败'
      state.error = errorMsg
      state.success = false

      // 错误回调
      if (onError) {
        onError(error)
      }

      // 显示错误消息
      if (showMessage) {
        ElMessage.error(errorMessage || errorMsg)
      }

      return null
    } finally {
      state.loading = false
    }
  }

  // 重置状态
  const reset = () => {
    state.data = null
    state.loading = false
    state.error = null
    state.success = false
  }

  // 立即执行
  if (immediate) {
    execute()
  }

  return {
    data: computed(() => state.data),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    success: computed(() => state.success),
    isLoading,
    hasError,
    hasData,
    execute,
    reset
  }
}

// 分页API调用Hook
export function usePaginatedApi<T = any>(
  apiCall: (params: any) => Promise<{ items: T[]; pagination: any }>,
  options: ApiOptions & {
    defaultPageSize?: number
    defaultPage?: number
  } = {}
) {
  const {
    defaultPageSize = 10,
    defaultPage = 1,
    ...apiOptions
  } = options

  // 分页参数
  const pagination = reactive({
    page: defaultPage,
    pageSize: defaultPageSize,
    total: 0
  })

  // 搜索和筛选参数
  const filters = ref<Record<string, any>>({})

  // 使用基础API Hook
  const {
    data,
    loading,
    error,
    success,
    isLoading,
    hasError,
    execute: baseExecute,
    reset
  } = useApi(apiCall, apiOptions)

  // 列表数据
  const items = computed(() => {
    if (!data.value) return []
    return data.value.items || []
  })

  // 执行查询
  const execute = async (params: Record<string, any> = {}) => {
    const queryParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters.value,
      ...params
    }

    const result = await baseExecute(queryParams)
    
    if (result?.pagination) {
      Object.assign(pagination, result.pagination)
    }

    return result
  }

  // 刷新当前页
  const refresh = () => execute()

  // 重置并刷新
  const resetAndRefresh = () => {
    pagination.page = defaultPage
    pagination.pageSize = defaultPageSize
    filters.value = {}
    return execute()
  }

  // 页码变化
  const handlePageChange = (page: number) => {
    pagination.page = page
    return execute()
  }

  // 页大小变化
  const handlePageSizeChange = (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    return execute()
  }

  // 设置筛选条件
  const setFilters = (newFilters: Record<string, any>) => {
    filters.value = { ...newFilters }
    pagination.page = 1
    return execute()
  }

  // 更新筛选条件
  const updateFilters = (newFilters: Record<string, any>) => {
    Object.assign(filters.value, newFilters)
    pagination.page = 1
    return execute()
  }

  return {
    // 数据
    data,
    items,
    pagination,
    filters,
    
    // 状态
    loading,
    error,
    success,
    isLoading,
    hasError,
    
    // 方法
    execute,
    refresh,
    reset,
    resetAndRefresh,
    handlePageChange,
    handlePageSizeChange,
    setFilters,
    updateFilters
  }
}

// 表单提交Hook
export function useFormSubmit<T = any>(
  submitFn: (data: any) => Promise<T>,
  options: ApiOptions & {
    resetOnSuccess?: boolean
    closeOnSuccess?: boolean
  } = {}
) {
  const {
    resetOnSuccess = false,
    closeOnSuccess = false,
    ...apiOptions
  } = options

  const formRef = ref()
  const dialogVisible = ref(false)

  const {
    loading,
    error,
    success,
    execute,
    reset
  } = useApi(submitFn, {
    ...apiOptions,
    onSuccess: (data) => {
      if (resetOnSuccess && formRef.value) {
        formRef.value.resetFields()
      }
      if (closeOnSuccess) {
        dialogVisible.value = false
      }
      options.onSuccess?.(data)
    }
  })

  const submit = async (formData: any) => {
    if (formRef.value) {
      try {
        await formRef.value.validate()
        return await execute(formData)
      } catch (validationError) {
        console.warn('Form validation failed:', validationError)
        return null
      }
    } else {
      return await execute(formData)
    }
  }

  const openDialog = () => {
    dialogVisible.value = true
    reset()
  }

  const closeDialog = () => {
    dialogVisible.value = false
    if (formRef.value) {
      formRef.value.resetFields()
    }
    reset()
  }

  return {
    formRef,
    dialogVisible,
    loading,
    error,
    success,
    submit,
    reset,
    openDialog,
    closeDialog
  }
}

// 删除确认Hook
export function useDeleteConfirm<T = any>(
  deleteFn: (id: string | number) => Promise<T>,
  options: ApiOptions & {
    confirmTitle?: string
    confirmMessage?: string
  } = {}
) {
  const {
    confirmTitle = '确认删除',
    confirmMessage = '此操作不可撤销，确定要删除吗？',
    ...apiOptions
  } = options

  const { execute, loading, error, success } = useApi(deleteFn, apiOptions)

  const deleteWithConfirm = async (id: string | number, itemName?: string) => {
    try {
      await ElMessageBox.confirm(
        itemName ? `确定要删除 "${itemName}" 吗？` : confirmMessage,
        confirmTitle,
        {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }
      )
      
      return await execute(id)
    } catch {
      // 用户取消删除
      return null
    }
  }

  return {
    loading,
    error,
    success,
    deleteWithConfirm
  }
}
