<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore, useProjectStore } from '@/stores'
import { usePaginatedApi, useDeleteConfirm, useFormSubmit } from '@/composables/useApi'
import type { TaskStatus, TaskPriority, CreateTaskRequest } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TaskForm } from '@/components/task'
import { useNotification } from '@/composables/useNotification'
import { safeFormatDate } from '@/utils/dateUtils'

// 路由相关
const router = useRouter()

// 使用状态管理
const taskStore = useTaskStore()
const projectStore = useProjectStore()

// 使用通知系统
const notification = useNotification()

// 筛选和搜索
const searchText = ref('')
const statusFilter = ref<TaskStatus | ''>('')
const priorityFilter = ref<TaskPriority | ''>('')
const projectFilter = ref<string | number | ''>('')

// 展开/折叠状态
const expandedTasks = ref<Set<string | number>>(new Set())
const showCompletedTasks = ref(true)
const viewMode = ref<'list' | 'card' | 'kanban'>('card')

// 使用分页API Hook
const {
  items: tasks,
  pagination,
  loading,
  error,
  execute: fetchTasks,
  handlePageChange,
  handlePageSizeChange,
  setFilters
} = usePaginatedApi(
  (params) => taskStore.fetchTasks(params),
  {
    defaultPageSize: 10,
    showMessage: false
  }
)

// 使用删除确认Hook
const { deleteWithConfirm } = useDeleteConfirm(
  (id: string | number) => taskStore.deleteTask(id, projectFilter.value || undefined),
  {
    onSuccess: () => {
      fetchTasks() // 刷新列表
    }
  }
)

// 获取项目列表用于筛选
const projects = computed(() => projectStore.projects)

// 新建任务对话框
const dialogVisible = ref(false)
const taskForm = reactive<CreateTaskRequest>({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assignee: '',
  projectId: '',
  dueDate: '',
  tags: []
})

// 使用表单提交Hook
const {
  loading: createLoading,
  submit: submitCreate
} = useFormSubmit(
  (data: CreateTaskRequest) => taskStore.createTask(data),
  {
    resetOnSuccess: true,
    closeOnSuccess: true,
    onSuccess: () => {
      dialogVisible.value = false
      fetchTasks() // 刷新列表
    }
  }
)

// 计算属性
const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    const matchesSearch = !searchText.value ||
      task.title.toLowerCase().includes(searchText.value.toLowerCase()) ||
      task.description.toLowerCase().includes(searchText.value.toLowerCase())

    const matchesStatus = !statusFilter.value || task.status === statusFilter.value
    const matchesPriority = !priorityFilter.value || task.priority === priorityFilter.value
    const matchesProject = !projectFilter.value || task.projectId === projectFilter.value

    // 根据显示设置过滤已完成任务
    const matchesCompletedFilter = showCompletedTasks.value || task.status !== 'completed'

    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesCompletedFilter
  })
})

// 方法
const getStatusType = (status: string) => {
  switch (status) {
    case 'todo': return 'info'
    case 'in_progress': return 'primary'
    case 'completed': return 'success'
    case 'cancelled': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'todo': return '待开始'
    case 'in_progress': return '进行中'
    case 'completed': return '已完成'
    case 'cancelled': return '已取消'
    default: return '未知'
  }
}

// 展开/折叠相关方法
const toggleTaskExpansion = (taskId: string | number) => {
  if (expandedTasks.value.has(taskId)) {
    expandedTasks.value.delete(taskId)
  } else {
    expandedTasks.value.add(taskId)
  }
}

const isTaskExpanded = (taskId: string | number) => {
  return expandedTasks.value.has(taskId)
}

const expandAllTasks = () => {
  filteredTasks.value.forEach(task => {
    expandedTasks.value.add(task.id)
  })
  notification.info('已展开所有任务')
}

const collapseAllTasks = () => {
  expandedTasks.value.clear()
  notification.info('已折叠所有任务')
}

const toggleCompletedTasks = () => {
  showCompletedTasks.value = !showCompletedTasks.value
  const action = showCompletedTasks.value ? '显示' : '隐藏'
  notification.info(`已${action}已完成任务`)
}

// 辅助方法
const getPriorityType = (priority: string) => {
  switch (priority) {
    case 'high': return 'danger'
    case 'urgent': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'info'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return '高'
    case 'urgent': return '紧急'
    case 'medium': return '中'
    case 'low': return '低'
    default: return '未知'
  }
}

const getProjectName = (projectId: string | number) => {
  const project = projects.value.find(p => p.id === projectId)
  return project?.name || '未知项目'
}

const formatDate = (dateString: string) => {
  return safeFormatDate(dateString, 'yyyy-MM-dd', '未设置')
}

const handleSearch = () => {
  setFilters({
    search: searchText.value,
    status: statusFilter.value,
    priority: priorityFilter.value,
    projectId: projectFilter.value
  })
}

const handleCreate = () => {
  // 如果有选中的项目，预设项目ID
  if (projectFilter.value) {
    taskForm.projectId = projectFilter.value
  }
  dialogVisible.value = true
  resetTaskForm()
}

const handleEdit = (row: any) => {
  // TODO: 实现编辑功能
  ElMessage.info(`编辑任务功能开发中: ${row.title}`)
}

const handleDelete = (row: any) => {
  deleteWithConfirm(row.id, row.title)
}

const handleView = (row: any) => {
  // 跳转到任务详情页
  router.push({
    name: 'task-detail',
    params: { id: row.id },
    query: { projectId: row.projectId }
  })
}

const handleStatusChange = async (row: any, newStatus: string) => {
  try {
    await taskStore.updateTaskStatus(row.id, newStatus as TaskStatus, row.projectId)
    ElMessage.success(`任务状态已更新为: ${getStatusText(newStatus)}`)
    fetchTasks() // 刷新列表
  } catch (error) {
    ElMessage.error('更新任务状态失败')
  }
}

const submitTaskForm = async (data: CreateTaskRequest) => {
  await submitCreate(data)
}

const resetTaskForm = () => {
  Object.assign(taskForm, {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: '',
    projectId: projectFilter.value || '',
    dueDate: '',
    tags: []
  })
}

// 组件挂载时获取数据
onMounted(async () => {
  // 先获取项目列表用于筛选
  await projectStore.fetchProjects()

  // 如果有项目，默认选择第一个项目的任务
  if (projects.value.length > 0) {
    projectFilter.value = projects.value[0].id
    await fetchTasks()
  }
})
</script>

<template>
  <div class="tasks-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><List /></el-icon>
        任务管理
      </h1>
      <p class="page-description">管理和跟踪所有任务的执行情况</p>
    </div>

    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchText"
            placeholder="搜索任务标题..."
            style="width: 250px"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select
            v-model="statusFilter"
            placeholder="状态"
            style="width: 120px"
            clearable
          >
            <el-option label="待开始" value="todo" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          
          <el-select
            v-model="priorityFilter"
            placeholder="优先级"
            style="width: 120px"
            clearable
          >
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
          
          <el-select
            v-model="projectFilter"
            placeholder="项目"
            style="width: 150px"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
          
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
        </div>
        
        <div class="toolbar-right">
          <!-- 视图控制 -->
          <el-button-group>
            <el-button
              :type="showCompletedTasks ? 'primary' : 'default'"
              @click="toggleCompletedTasks"
              size="small"
            >
              {{ showCompletedTasks ? '隐藏已完成' : '显示已完成' }}
            </el-button>
            <el-button @click="expandAllTasks" size="small">
              展开全部
            </el-button>
            <el-button @click="collapseAllTasks" size="small">
              折叠全部
            </el-button>
          </el-button-group>

          <el-button type="primary" :icon="Plus" @click="handleCreate">
            新建任务
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 任务列表 -->
    <div class="tasks-list" v-loading="loading">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-card"
        :class="{ 'task-expanded': isTaskExpanded(task.id) }"
      >
        <!-- 任务卡片头部 -->
        <div class="task-card-header" @click="toggleTaskExpansion(task.id)">
          <div class="task-header-left">
            <el-icon class="expand-icon" :class="{ 'expanded': isTaskExpanded(task.id) }">
              <ArrowRight />
            </el-icon>
            <div class="task-title-section">
              <h4 class="task-title">{{ task.title }}</h4>
              <span class="task-id">#{{ task.id }}</span>
            </div>
          </div>

          <div class="task-header-right">
            <el-tag :type="getStatusType(task.status)" size="small">
              {{ getStatusText(task.status) }}
            </el-tag>
            <el-tag :type="getPriorityType(task.priority)" size="small">
              {{ getPriorityText(task.priority) }}
            </el-tag>
          </div>
        </div>

        <!-- 任务卡片内容（可展开） -->
        <div v-show="isTaskExpanded(task.id)" class="task-card-content">
          <div class="task-description">
            <strong>描述：</strong>
            <p>{{ task.description || '暂无描述' }}</p>
          </div>

          <div class="task-details">
            <div class="task-detail-item">
              <span class="label">项目：</span>
              <span class="value">{{ getProjectName(task.projectId) }}</span>
            </div>
            <div class="task-detail-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatDate(task.createdAt) }}</span>
            </div>
            <div class="task-detail-item">
              <span class="label">截止时间：</span>
              <span class="value">{{ task.dueDate ? formatDate(task.dueDate) : '未设置' }}</span>
            </div>
            <div class="task-detail-item">
              <span class="label">负责人：</span>
              <span class="value">{{ task.assignee || '未分配' }}</span>
            </div>
          </div>

          <div class="task-actions">
            <el-button size="small" @click.stop="handleView(task)">
              查看详情
            </el-button>
            <el-button size="small" @click.stop="handleEdit(task)">
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleStatusChange(task, command)" @click.stop>
              <el-button size="small">
                更改状态
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="todo">待开始</el-dropdown-item>
                  <el-dropdown-item command="in_progress">进行中</el-dropdown-item>
                  <el-dropdown-item command="completed">已完成</el-dropdown-item>
                  <el-dropdown-item command="cancelled">已取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" type="danger" @click.stop="handleDelete(task)">
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && filteredTasks.length === 0" class="empty-state">
        <el-empty description="暂无任务数据">
          <el-button type="primary" @click="handleCreate">创建第一个任务</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <!-- 新建任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新建任务"
      width="700px"
      :before-close="resetTaskForm"
    >
      <TaskForm
        v-model="taskForm"
        mode="create"
        :loading="createLoading"
        :project-id="projectFilter"
        @submit="submitTaskForm"
        @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.tasks-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-description {
  font-size: 14px;
  color: #5d6d7e;
  margin: 0;
}

.toolbar-card {
  margin-bottom: 20px;
  border-radius: 3px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-card {
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.task-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2c3e50;
  font-weight: 500;
}

.overdue {
  color: #e74c3c;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 任务卡片样式 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.task-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-card:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.task-card.task-expanded {
  border-color: #409EFF;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.task-card-header:hover {
  background: #f5f5f5;
}

.task-expanded .task-card-header {
  background: #f0f9ff;
  border-bottom-color: #409EFF;
}

.task-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.expand-icon {
  color: #909399;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.expand-icon.expanded {
  transform: rotate(90deg);
  color: #409EFF;
}

.task-title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.4;
}

.task-id {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
}

.task-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-card-content {
  padding: 20px;
  background: white;
}

.task-description {
  margin-bottom: 16px;
}

.task-description strong {
  color: #2c3e50;
  font-size: 14px;
}

.task-description p {
  margin: 8px 0 0 0;
  color: #606266;
  line-height: 1.5;
}

.task-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
}

.task-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-detail-item .label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
  min-width: 70px;
}

.task-detail-item .value {
  font-size: 13px;
  color: #606266;
  flex: 1;
}

.task-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 15px;
  }

  .toolbar-left {
    width: 100%;
    justify-content: center;
  }

  .toolbar-right {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .task-card-header {
    padding: 12px 16px;
  }

  .task-card-content {
    padding: 16px;
  }

  .task-details {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .task-actions {
    flex-direction: column;
  }

  .task-actions .el-button {
    width: 100%;
  }
}
</style>
