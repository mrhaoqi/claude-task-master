<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores'
import { usePaginatedApi, useFormSubmit, useDeleteConfirm } from '@/composables/useApi'
import { projectsApi } from '@/api'
import type { CreateProjectRequest } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Folder } from '@element-plus/icons-vue'
import { ProjectForm } from '@/components/project'
import { useNotification } from '@/composables/useNotification'

// 路由相关
const router = useRouter()

// 使用项目状态管理
const projectStore = useProjectStore()

// 使用通知系统
const notification = useNotification()

// 搜索和筛选
const searchText = ref('')
const statusFilter = ref('')

// 新建项目对话框
const dialogVisible = ref(false)
const projectForm = reactive<CreateProjectRequest>({
  name: '',
  description: '',
  status: 'pending'
})

// 使用分页API Hook
const {
  items: projects,
  pagination,
  loading,
  error,
  execute: fetchProjects,
  handlePageChange,
  handlePageSizeChange,
  setFilters
} = usePaginatedApi(
  (params) => projectStore.fetchProjects(params),
  {
    defaultPageSize: 10,
    showMessage: false // 由store处理消息显示
  }
)

// 使用表单提交Hook
const {
  loading: createLoading,
  submit: submitCreate
} = useFormSubmit(
  (data: CreateProjectRequest) => projectStore.createProject(data),
  {
    resetOnSuccess: true,
    closeOnSuccess: true,
    onSuccess: () => {
      dialogVisible.value = false
      fetchProjects() // 刷新列表
    }
  }
)

// 使用删除确认Hook
const { deleteWithConfirm } = useDeleteConfirm(
  (id: string | number) => projectStore.deleteProject(id),
  {
    onSuccess: () => {
      fetchProjects() // 刷新列表
    }
  }
)

// 计算属性
const filteredProjects = computed(() => {
  return projects.value.filter(project => {
    const matchesSearch = !searchText.value ||
      project.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      project.description.toLowerCase().includes(searchText.value.toLowerCase())

    const matchesStatus = !statusFilter.value || project.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

// 方法
const handleSearch = () => {
  setFilters({
    search: searchText.value,
    status: statusFilter.value
  })
}

const handleFilter = () => {
  setFilters({
    search: searchText.value,
    status: statusFilter.value
  })
}

const handleCreate = () => {
  dialogVisible.value = true
  resetForm()
}

const handleEdit = (row: any) => {
  // TODO: 实现编辑功能
  ElMessage.info(`编辑项目功能开发中: ${row.name}`)
}

const handleDelete = (row: any) => {
  deleteWithConfirm(row.id, row.name)
}

const handleView = (row: any) => {
  // 跳转到项目详情页
  router.push({
    name: 'project-detail',
    params: { id: row.id }
  })
}

const submitForm = async () => {
  if (!projectForm.name.trim()) {
    ElMessage.error('请输入项目名称')
    return
  }

  await submitCreate(projectForm)
}

const resetForm = () => {
  Object.assign(projectForm, {
    name: '',
    description: '',
    status: 'pending'
  })
}

// 组件挂载时获取数据
onMounted(() => {
  fetchProjects()
})

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'primary'
    case 'completed': return 'success'
    case 'pending': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '进行中'
    case 'completed': return '已完成'
    case 'pending': return '待开始'
    default: return '未知'
  }
}

// 刷新项目列表
const handleRefresh = () => {
  notification.info('刷新中', '正在获取最新项目数据...', { duration: 1000 })
  fetchProjects()
}

// 查看项目详情
const handleViewProject = (project: any) => {
  router.push(`/projects/${project.id}`)
}

// 删除项目
const handleDeleteProject = async (project: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${project.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 调用删除API
    await projectStore.deleteProject(project.id)
    notification.deleteSuccess('项目')

    // 刷新列表
    fetchProjects()
  } catch (error: any) {
    // 用户取消删除
    if (error === 'cancel') {
      return
    }

    // 删除失败
    console.error('Failed to delete project:', error)
    if (error.code === 'NETWORK_OFFLINE') {
      notification.networkError()
    } else if (error.status === 403) {
      notification.permissionError('删除项目')
    } else if (error.status === 404) {
      notification.error('删除失败', '项目不存在或已被删除')
    } else {
      notification.apiError('删除', '项目', error.message)
    }
  }
}

// 测试通知系统
const handleNotificationTest = (command: string) => {
  switch (command) {
    case 'success':
      notification.success('操作成功', '这是一个成功通知的示例')
      break
    case 'warning':
      notification.warning('注意事项', '这是一个警告通知的示例，请注意相关事项')
      break
    case 'error':
      notification.error('操作失败', '这是一个错误通知的示例，请检查相关设置')
      break
    case 'info':
      notification.info('系统信息', '这是一个信息通知的示例')
      break
    case 'persistent':
      notification.persistent('重要通知', '这是一个持久通知，需要手动关闭', 'warning')
      break
  }
}
</script>

<template>
  <div class="projects-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Folder /></el-icon>
        项目管理
      </h1>
      <p class="page-description">管理和跟踪所有项目的进度和状态</p>
    </div>

    <!-- 项目列表标题和操作 -->
    <div class="projects-header">
      <h2 class="section-title">项目列表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          创建项目
        </el-button>
        <el-button @click="handleRefresh">
          刷新
        </el-button>
        <el-dropdown @command="handleNotificationTest">
          <el-button>
            测试通知
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="success">成功通知</el-dropdown-item>
              <el-dropdown-item command="warning">警告通知</el-dropdown-item>
              <el-dropdown-item command="error">错误通知</el-dropdown-item>
              <el-dropdown-item command="info">信息通知</el-dropdown-item>
              <el-dropdown-item command="persistent">持久通知</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 项目卡片列表 -->
    <div class="projects-grid" v-loading="loading">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card"
        @click="handleViewProject(project)"
      >
        <div class="project-card-header">
          <h3 class="project-title">{{ project.name }}</h3>
          <span class="project-id">#{{ project.id }}</span>
        </div>

        <div class="project-description">
          {{ project.description || '暂无描述' }}
        </div>

        <div class="project-stats">
          <div class="stat-item">
            <span class="stat-label">任务:</span>
            <span class="stat-value">{{ project.taskCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">需求:</span>
            <span class="stat-value">{{ project.requirementCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">变更:</span>
            <span class="stat-value">{{ project.changeCount || 0 }}</span>
          </div>
        </div>

        <div class="project-actions">
          <el-button
            type="primary"
            size="small"
            @click.stop="handleViewProject(project)"
          >
            选择项目
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click.stop="handleDeleteProject(project)"
          >
            删除
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && filteredProjects.length === 0" class="empty-state">
        <el-empty description="暂无项目数据">
          <el-button type="primary" @click="handleCreate">创建第一个项目</el-button>
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

    <!-- 新建项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新建项目"
      width="600px"
      :before-close="resetForm"
    >
      <ProjectForm
        v-model="projectForm"
        mode="create"
        :loading="createLoading"
        @submit="submitForm"
        @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.projects-container {
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

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 0;
  border-bottom: 1px solid #e8e8e8;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.project-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.project-card:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.4;
}

.project-id {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.project-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  min-height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
}

.project-actions {
  display: flex;
  gap: 8px;
}

.project-actions .el-button {
  flex: 1;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .projects-container {
    padding: 16px;
  }

  .projects-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .project-card {
    padding: 16px;
  }

  .project-stats {
    flex-direction: column;
    gap: 8px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    margin-bottom: 0;
  }
}

@media (max-width: 480px) {
  .project-actions {
    flex-direction: column;
  }

  .project-actions .el-button {
    width: 100%;
  }
}
</style>
