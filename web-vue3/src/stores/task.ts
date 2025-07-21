// 任务状态管理 - 使用单例模式
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { tasksApi } from '@/api'
import type { Task, CreateTaskRequest, TaskStatus, TaskPriority } from '@/types'
import { ElMessage } from 'element-plus'

export const useTaskStore = defineStore('task', () => {
  // 状态
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 分页状态
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0
  })
  
  // 筛选状态
  const filters = ref({
    search: '',
    status: '' as TaskStatus | '',
    priority: '' as TaskPriority | '',
    projectId: '' as string | number | '',
    assignee: '',
    sortBy: 'createTime',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  // 计算属性
  const hasTasks = computed(() => tasks.value.length > 0)
  
  // 按状态分组的任务
  const todoTasks = computed(() => 
    tasks.value.filter(t => t.status === 'todo')
  )
  const inProgressTasks = computed(() => 
    tasks.value.filter(t => t.status === 'in_progress')
  )
  const completedTasks = computed(() => 
    tasks.value.filter(t => t.status === 'completed')
  )
  const cancelledTasks = computed(() => 
    tasks.value.filter(t => t.status === 'cancelled')
  )
  
  // 按优先级分组的任务
  const highPriorityTasks = computed(() => 
    tasks.value.filter(t => t.priority === 'high' || t.priority === 'urgent')
  )
  const mediumPriorityTasks = computed(() => 
    tasks.value.filter(t => t.priority === 'medium')
  )
  const lowPriorityTasks = computed(() => 
    tasks.value.filter(t => t.priority === 'low')
  )
  
  // 逾期任务
  const overdueTasks = computed(() => 
    tasks.value.filter(t => {
      if (t.status === 'completed') return false
      const dueDate = new Date(t.dueDate)
      const now = new Date()
      return dueDate < now
    })
  )
  
  // 任务统计
  const taskStats = computed(() => ({
    total: tasks.value.length,
    todo: todoTasks.value.length,
    inProgress: inProgressTasks.value.length,
    completed: completedTasks.value.length,
    cancelled: cancelledTasks.value.length,
    overdue: overdueTasks.value.length,
    highPriority: highPriorityTasks.value.length
  }))

  // Actions
  
  // 获取任务列表
  const fetchTasks = async (params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: TaskStatus
    priority?: TaskPriority
    projectId?: string | number
    assignee?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    try {
      loading.value = true
      error.value = null
      
      // 更新筛选参数
      if (params) {
        Object.assign(filters.value, params)
        if (params.page) pagination.value.page = params.page
        if (params.pageSize) pagination.value.pageSize = params.pageSize
      }
      
      const response = await tasksApi.getTasks({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        search: filters.value.search,
        status: filters.value.status || undefined,
        priority: filters.value.priority || undefined,
        projectId: filters.value.projectId || undefined,
        assignee: filters.value.assignee,
        sortBy: filters.value.sortBy,
        sortOrder: filters.value.sortOrder
      })
      
      tasks.value = response.items
      pagination.value = response.pagination

      return response
    } catch (err: any) {
      error.value = err.message || '获取任务列表失败'
      ElMessage.error(error.value)
      return { items: [], pagination: { page: 1, pageSize: 10, total: 0 } }
    } finally {
      loading.value = false
    }
  }

  // 获取项目任务
  const fetchProjectTasks = async (projectId: string | number, params?: {
    page?: number
    pageSize?: number
    status?: TaskStatus
    assignee?: string
  }) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await tasksApi.getProjectTasks(projectId, params)
      tasks.value = response.items
      pagination.value = response.pagination

      return response
    } catch (err: any) {
      error.value = err.message || '获取项目任务失败'
      ElMessage.error(error.value)
      return { items: [], pagination: { page: 1, pageSize: 10, total: 0 } }
    } finally {
      loading.value = false
    }
  }

  // 获取单个任务
  const fetchTask = async (id: string | number) => {
    try {
      loading.value = true
      error.value = null
      
      const task = await tasksApi.getTask(id)
      currentTask.value = task
      
      return task
    } catch (err: any) {
      error.value = err.message || '获取任务详情失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 创建任务
  const createTask = async (data: CreateTaskRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const task = await tasksApi.createTask(data)
      tasks.value.unshift(task)
      pagination.value.total += 1
      
      ElMessage.success('任务创建成功')
      return task
    } catch (err: any) {
      error.value = err.message || '创建任务失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 更新任务
  const updateTask = async (id: string | number, data: Partial<CreateTaskRequest>) => {
    try {
      loading.value = true
      error.value = null
      
      const task = await tasksApi.updateTask(id, data)
      
      // 更新列表中的任务
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = task
      }
      
      // 更新当前任务
      if (currentTask.value?.id === id) {
        currentTask.value = task
      }
      
      ElMessage.success('任务更新成功')
      return task
    } catch (err: any) {
      error.value = err.message || '更新任务失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 删除任务
  const deleteTask = async (id: string | number) => {
    try {
      loading.value = true
      error.value = null
      
      await tasksApi.deleteTask(id)
      
      // 从列表中移除
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value.splice(index, 1)
        pagination.value.total -= 1
      }
      
      // 清空当前任务
      if (currentTask.value?.id === id) {
        currentTask.value = null
      }
      
      ElMessage.success('任务删除成功')
      return true
    } catch (err: any) {
      error.value = err.message || '删除任务失败'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  // 更新任务状态
  const updateTaskStatus = async (id: string | number, status: TaskStatus) => {
    try {
      const task = await tasksApi.updateTaskStatus(id, status)
      
      // 更新列表中的任务
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = task
      }
      
      // 更新当前任务
      if (currentTask.value?.id === id) {
        currentTask.value = task
      }
      
      ElMessage.success('任务状态更新成功')
      return task
    } catch (err: any) {
      error.value = err.message || '更新任务状态失败'
      ElMessage.error(error.value)
      return null
    }
  }

  // 更新任务进度
  const updateTaskProgress = async (id: string | number, progress: number) => {
    try {
      const task = await tasksApi.updateTaskProgress(id, progress)
      
      // 更新列表中的任务
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = task
      }
      
      // 更新当前任务
      if (currentTask.value?.id === id) {
        currentTask.value = task
      }
      
      ElMessage.success('任务进度更新成功')
      return task
    } catch (err: any) {
      error.value = err.message || '更新任务进度失败'
      ElMessage.error(error.value)
      return null
    }
  }

  // 分配任务
  const assignTask = async (id: string | number, assignee: string) => {
    try {
      const task = await tasksApi.assignTask(id, assignee)
      
      // 更新列表中的任务
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = task
      }
      
      // 更新当前任务
      if (currentTask.value?.id === id) {
        currentTask.value = task
      }
      
      ElMessage.success('任务分配成功')
      return task
    } catch (err: any) {
      error.value = err.message || '任务分配失败'
      ElMessage.error(error.value)
      return null
    }
  }

  // 获取我的任务
  const fetchMyTasks = async (params?: {
    status?: TaskStatus
    priority?: TaskPriority
    dueDate?: string
  }) => {
    try {
      loading.value = true
      error.value = null
      
      const myTasks = await tasksApi.getMyTasks(params)
      tasks.value = myTasks
      
    } catch (err: any) {
      error.value = err.message || '获取我的任务失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  // 设置当前任务
  const setCurrentTask = (task: Task | null) => {
    currentTask.value = task
  }

  // 重置状态
  const resetState = () => {
    tasks.value = []
    currentTask.value = null
    loading.value = false
    error.value = null
    pagination.value = { page: 1, pageSize: 10, total: 0 }
    filters.value = {
      search: '',
      status: '',
      priority: '',
      projectId: '',
      assignee: '',
      sortBy: 'createTime',
      sortOrder: 'desc'
    }
  }

  // 刷新当前页
  const refresh = () => fetchTasks()

  return {
    // 状态
    tasks,
    currentTask,
    loading,
    error,
    pagination,
    filters,
    
    // 计算属性
    hasTasks,
    todoTasks,
    inProgressTasks,
    completedTasks,
    cancelledTasks,
    highPriorityTasks,
    mediumPriorityTasks,
    lowPriorityTasks,
    overdueTasks,
    taskStats,
    
    // 方法
    fetchTasks,
    fetchProjectTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskProgress,
    assignTask,
    fetchMyTasks,
    setCurrentTask,
    resetState,
    refresh
  }
})
