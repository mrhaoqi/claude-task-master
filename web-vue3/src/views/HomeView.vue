<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores'
import { usePaginatedApi } from '@/composables/useApi'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Folder,
  List,
  Document,
  EditPen,
  Plus,
  Connection,
  Search,
  Filter,
  Calendar
} from '@element-plus/icons-vue'

// 路由相关
const router = useRouter()

// 使用项目状态管理
const projectStore = useProjectStore()

// 搜索和筛选
const searchText = ref('')
const statusFilter = ref('')

// 新建项目对话框
const dialogVisible = ref(false)
const projectForm = ref({
  name: '',
  description: '',
  status: 'pending'
})

// API测试状态
const apiTestResult = ref<string>('')
const apiLoading = ref(false)

// 使用分页API Hook获取项目列表
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
    defaultPageSize: 12,
    showMessage: false
  }
)

// 系统统计数据
const systemStats = computed(() => {
  const allProjects = projects.value || []
  return {
    totalProjects: allProjects.length,
    activeProjects: allProjects.filter(p => p.status === 'active').length,
    completedProjects: allProjects.filter(p => p.status === 'completed').length,
    pendingProjects: allProjects.filter(p => p.status === 'pending').length
  }
})

// 测试API连接
const testApiConnection = async () => {
  try {
    apiLoading.value = true
    apiTestResult.value = '正在测试API连接...'

    await fetchProjects()
    apiTestResult.value = `API连接成功！获取到 ${projects.value.length} 个项目`
  } catch (error: any) {
    apiTestResult.value = `API连接失败: ${error.message}`
    console.error('API Test Error:', error)
  } finally {
    apiLoading.value = false
  }
}

// 进入项目详情
const enterProject = (project: any) => {
  router.push(`/projects/${project.id}`)
}

// 新建项目
const createProject = async () => {
  try {
    const result = await projectStore.createProject(projectForm.value)
    if (result) {
      ElMessage.success('项目创建成功')
      dialogVisible.value = false
      projectForm.value = { name: '', description: '', status: 'pending' }
      // 刷新项目列表
      await fetchProjects()
    }
  } catch (error) {
    ElMessage.error('项目创建失败')
  }
}

// 搜索项目
const handleSearch = () => {
  setFilters({
    search: searchText.value,
    status: statusFilter.value
  })
}

// 重置搜索
const resetSearch = () => {
  searchText.value = ''
  statusFilter.value = ''
  setFilters({})
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'active': 'success',
    'completed': 'info',
    'pending': 'warning',
    'archived': 'info'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'active': '进行中',
    'completed': '已完成',
    'pending': '待开始',
    'archived': '已归档'
  }
  return statusMap[status] || status
}

// 组件挂载时获取数据
onMounted(() => {
  testApiConnection()
  fetchProjects()
})
</script>

<template>
  <div class="home-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">
            <el-icon><Folder /></el-icon>
            项目管理中心
          </h1>
          <p class="page-description">
            选择项目开始工作，或创建新项目
          </p>
        </div>
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="dialogVisible = true">
            新建项目
          </el-button>
        </div>
      </div>
    </div>

    <!-- 系统统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon total">
              <el-icon size="24"><Folder /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ systemStats.totalProjects }}</div>
              <div class="stats-label">总项目数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon active">
              <el-icon size="24"><List /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ systemStats.activeProjects }}</div>
              <div class="stats-label">进行中</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon completed">
              <el-icon size="24"><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ systemStats.completedProjects }}</div>
              <div class="stats-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon pending">
              <el-icon size="24"><EditPen /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ systemStats.pendingProjects }}</div>
              <div class="stats-label">待开始</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- API连接状态 -->
    <el-card class="api-status-card" v-if="apiTestResult">
      <div class="api-status">
        <el-alert
          :title="apiTestResult"
          :type="apiTestResult.includes('成功') ? 'success' : 'error'"
          show-icon
          :closable="false"
        >
          <template #default>
            <div class="api-actions">
              <el-button
                size="small"
                :loading="apiLoading"
                @click="testApiConnection"
              >
                重新测试
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <div class="search-content">
        <div class="search-left">
          <el-input
            v-model="searchText"
            placeholder="搜索项目名称或描述"
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
            style="width: 300px; margin-right: 12px;"
          />
          <el-select
            v-model="statusFilter"
            placeholder="筛选状态"
            clearable
            style="width: 150px; margin-right: 12px;"
          >
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="待开始" value="pending" />
            <el-option label="已归档" value="archived" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Filter" @click="resetSearch">
            重置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 项目网格 -->
    <el-card class="projects-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Folder /></el-icon>
            项目列表 ({{ projects.length }})
          </span>
        </div>
      </template>

      <div v-loading="loading" class="projects-grid">
        <div v-if="projects.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无项目">
            <el-button type="primary" @click="dialogVisible = true">
              创建第一个项目
            </el-button>
          </el-empty>
        </div>

        <el-row :gutter="20" v-else>
          <el-col
            :span="8"
            v-for="project in projects"
            :key="project.id"
            class="project-col"
          >
            <el-card
              class="project-card"
              :body-style="{ padding: '20px' }"
              @click="enterProject(project)"
            >
              <div class="project-header">
                <div class="project-info">
                  <h3 class="project-name">
                    <el-icon><Folder /></el-icon>
                    {{ project.name }}
                  </h3>
                  <el-tag
                    :type="getStatusType(project.status)"
                    size="small"
                  >
                    {{ getStatusText(project.status) }}
                  </el-tag>
                </div>
              </div>

              <div class="project-description">
                {{ project.description || '暂无描述' }}
              </div>

              <div class="project-progress">
                <div class="progress-label">
                  <span>项目进度</span>
                  <span>{{ project.progress || 0 }}%</span>
                </div>
                <el-progress
                  :percentage="project.progress || 0"
                  :stroke-width="6"
                  :show-text="false"
                />
              </div>

              <div class="project-meta">
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  {{ project.createTime }}
                </span>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="pagination.total > pagination.pageSize">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[12, 24, 48]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 新建项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新建项目"
      width="500px"
      :before-close="() => { dialogVisible = false }"
    >
      <el-form :model="projectForm" label-width="80px">
        <el-form-item label="项目名称" required>
          <el-input
            v-model="projectForm.name"
            placeholder="请输入项目名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="项目描述">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="初始状态">
          <el-select v-model="projectForm.status" style="width: 100%">
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="active" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="createProject"
            :disabled="!projectForm.name"
          >
            创建项目
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.page-description {
  font-size: 16px;
  color: #5d6d7e;
  margin: 0;
}

.api-test-card {
  margin-bottom: 30px;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.api-test-result {
  margin-top: 10px;
}

.stats-row {
  margin-bottom: 30px;
}

.stats-card {
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stats-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.success {
    background-color: #e8f8f5;
    color: #27ae60;
  }

  &.warning {
    background-color: #fdf2e9;
    color: #f39c12;
  }

  &.info {
    background-color: #f4f6f6;
    color: #95a5a6;
  }

  &.danger {
    background-color: #fdedec;
    color: #e74c3c;
  }
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1;
}

.stats-label {
  font-size: 14px;
  color: #85929e;
  margin-top: 4px;
}

.table-card,
.features-card {
  margin-bottom: 30px;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2c3e50;
}

.feature-item {
  text-align: center;
  padding: 20px;
}

.feature-icon {
  margin-bottom: 15px;
}

/* 项目卡片样式 */
.projects-grid {
  min-height: 400px;
}

.project-col {
  margin-bottom: 20px;
}

.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.project-info {
  flex: 1;
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-description {
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  min-height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-progress {
  margin-bottom: 12px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.progress-label span:first-child {
  color: #7f8c8d;
}

.progress-label span:last-child {
  color: #2c3e50;
  font-weight: 600;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #95a5a6;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.search-card {
  margin-bottom: 20px;
}

.search-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-left {
  display: flex;
  align-items: center;
}

.api-status-card {
  margin-bottom: 20px;
}

.api-status .el-alert {
  border: none;
}

.api-actions {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .stats-row .el-col {
    margin-bottom: 15px;
  }

  .page-title {
    font-size: 24px;
  }

  .card-header {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
