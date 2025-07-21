// 项目状态管理 - 使用单例模式
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { projectsApi } from '@/api'
import type { Project, CreateProjectRequest, PaginatedResponse } from '@/types'
import { ElMessage } from 'element-plus'

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
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
    status: '',
    sortBy: 'createTime',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  // 计算属性
  const hasProjects = computed(() => projects.value.length > 0)
  const activeProjects = computed(() =>
    projects.value.filter(p => p.status === 'active')
  )
  const completedProjects = computed(() =>
    projects.value.filter(p => p.status === 'completed')
  )

  // 项目统计
  const projectStats = computed(() => ({
    total: projects.value.length,
    active: activeProjects.value.length,
    completed: completedProjects.value.length,
    pending: projects.value.filter(p => p.status === 'pending').length
  }))

  // Actions

  // 获取项目列表
  const fetchProjects = async (params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
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

      const response = await projectsApi.getProjects({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        search: filters.value.search,
        status: filters.value.status,
        sortBy: filters.value.sortBy,
        sortOrder: filters.value.sortOrder
      })

      projects.value = response.items
      pagination.value = response.pagination

      return response
    } catch (err: any) {
      error.value = err.message || '获取项目列表失败'
      ElMessage.error(error.value)
      return { items: [], pagination: { page: 1, pageSize: 10, total: 0 } }
    } finally {
      loading.value = false
    }
  }

  // 获取单个项目
  const fetchProject = async (id: string | number) => {
    try {
      loading.value = true
      error.value = null

      const project = await projectsApi.getProject(id)
      currentProject.value = project

      return project
    } catch (err: any) {
      error.value = err.message || '获取项目详情失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 创建项目
  const createProject = async (data: CreateProjectRequest) => {
    try {
      loading.value = true
      error.value = null

      const project = await projectsApi.createProject(data)
      projects.value.unshift(project)
      pagination.value.total += 1

      return project
    } catch (err: any) {
      error.value = err.message || '创建项目失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 更新项目
  const updateProject = async (id: string | number, data: Partial<CreateProjectRequest>) => {
    try {
      loading.value = true
      error.value = null

      const project = await projectsApi.updateProject(id, data)

      // 更新列表中的项目
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = project
      }

      // 更新当前项目
      if (currentProject.value?.id === id) {
        currentProject.value = project
      }

      ElMessage.success('项目更新成功')
      return project
    } catch (err: any) {
      error.value = err.message || '更新项目失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 删除项目
  const deleteProject = async (id: string | number) => {
    try {
      loading.value = true
      error.value = null

      await projectsApi.deleteProject(id)

      // 从列表中移除
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value.splice(index, 1)
        pagination.value.total -= 1
      }

      // 清空当前项目
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }

      ElMessage.success('项目删除成功')
      return true
    } catch (err: any) {
      error.value = err.message || '删除项目失败'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  // 更新项目状态
  const updateProjectStatus = async (id: string | number, status: string) => {
    try {
      const project = await projectsApi.updateProjectStatus(id, status)

      // 更新列表中的项目
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = project
      }

      // 更新当前项目
      if (currentProject.value?.id === id) {
        currentProject.value = project
      }

      ElMessage.success('项目状态更新成功')
      return project
    } catch (err: any) {
      error.value = err.message || '更新项目状态失败'
      ElMessage.error(error.value)
      return null
    }
  }

  // 设置当前项目
  const setCurrentProject = (project: Project | null) => {
    currentProject.value = project
  }

  // 重置状态
  const resetState = () => {
    projects.value = []
    currentProject.value = null
    loading.value = false
    error.value = null
    pagination.value = { page: 1, pageSize: 10, total: 0 }
    filters.value = { search: '', status: '', sortBy: 'createTime', sortOrder: 'desc' }
  }

  // 刷新当前页
  const refresh = () => fetchProjects()

  return {
    // 状态
    projects,
    currentProject,
    loading,
    error,
    pagination,
    filters,

    // 计算属性
    hasProjects,
    activeProjects,
    completedProjects,
    projectStats,

    // 方法
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    setCurrentProject,
    resetState,
    refresh
  }
})
