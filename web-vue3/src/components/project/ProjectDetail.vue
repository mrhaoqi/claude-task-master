<!-- 项目详情组件 -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjectStore, useTaskStore } from '@/stores'
import type { Project, Task } from '@/types'
import { ElMessage } from 'element-plus'
import { StatusTag, PriorityTag, ProgressBar, ActionButtons, EmptyState } from '@/components/business'
import PrdManager from './PrdManager.vue'
import TaskManager from './TaskManager.vue'
import {
  Upload,
  Magic,
  Plus,
  EditPen,
  UserFilled,
  Setting,
  Document,
  List
} from '@element-plus/icons-vue'

// Props定义
interface Props {
  projectId: string | number
}

const props = defineProps<Props>()

// 使用状态管理
const projectStore = useProjectStore()
const taskStore = useTaskStore()

// 组件状态
const loading = ref(false)
const project = ref<Project | null>(null)
const projectTasks = ref<Task[]>([])
const activeTab = ref('overview')

// 项目统计数据
const projectStats = ref({
  totalTasks: 0,
  completedTasks: 0,
  inProgressTasks: 0,
  pendingTasks: 0,
  overdueTasks: 0
})

// 项目成员数据（模拟）
const projectMembers = ref([
  {
    id: '1',
    name: '张三',
    role: '项目经理',
    avatar: '',
    email: 'zhangsan@example.com',
    joinDate: '2024-01-01'
  },
  {
    id: '2',
    name: '李四',
    role: '前端开发',
    avatar: '',
    email: 'lisi@example.com',
    joinDate: '2024-01-05'
  },
  {
    id: '3',
    name: '王五',
    role: '后端开发',
    avatar: '',
    email: 'wangwu@example.com',
    joinDate: '2024-01-10'
  }
])

// 需求基线数据（模拟）
const requirements = ref([
  {
    id: '1',
    title: '用户注册功能需求',
    description: '实现用户注册功能，包括邮箱验证、密码强度检查等',
    type: 'functional',
    priority: 'high',
    status: 'approved',
    createTime: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: '系统性能需求',
    description: '系统响应时间不超过2秒，支持1000并发用户',
    type: 'non_functional',
    priority: 'medium',
    status: 'draft',
    createTime: '2024-01-16T14:20:00Z'
  }
])

// 变更请求数据（模拟）
const changeRequests = ref([
  {
    id: '1',
    title: '增加第三方登录功能',
    description: '支持微信、QQ、微博等第三方登录方式',
    type: 'feature_add',
    impact: 'medium',
    status: 'pending',
    requestor: '产品经理',
    createTime: '2024-01-18T09:15:00Z'
  }
])

// 对话框状态
const showRequirementDialog = ref(false)
const showChangeRequestDialog = ref(false)

// 获取项目详情
const fetchProjectDetail = async () => {
  try {
    loading.value = true
    project.value = await projectStore.fetchProject(props.projectId)
    
    // 获取项目任务
    const tasksResponse = await taskStore.fetchTasks({
      projectId: props.projectId,
      pageSize: 100 // 获取所有任务用于统计
    })
    projectTasks.value = tasksResponse.items
    
    // 计算统计数据
    calculateStats()
  } catch (error) {
    ElMessage.error('获取项目详情失败')
  } finally {
    loading.value = false
  }
}

// 计算项目统计数据
const calculateStats = () => {
  const tasks = projectTasks.value
  projectStats.value = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    pendingTasks: tasks.filter(t => t.status === 'todo').length,
    overdueTasks: tasks.filter(t => 
      t.status !== 'completed' && 
      new Date(t.dueDate) < new Date()
    ).length
  }
}

// 计算项目进度
const projectProgress = computed(() => {
  if (projectStats.value.totalTasks === 0) return 0
  return Math.round((projectStats.value.completedTasks / projectStats.value.totalTasks) * 100)
})

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'completed': return 'primary'
    case 'pending': return 'warning'
    case 'cancelled': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '进行中'
    case 'completed': return '已完成'
    case 'pending': return '待开始'
    case 'cancelled': return '已取消'
    default: return '未知'
  }
}

// 获取任务状态类型
const getTaskStatusType = (status: string) => {
  switch (status) {
    case 'todo': return 'info'
    case 'in_progress': return 'primary'
    case 'completed': return 'success'
    case 'cancelled': return 'danger'
    default: return 'info'
  }
}

const getTaskStatusText = (status: string) => {
  switch (status) {
    case 'todo': return '待开始'
    case 'in_progress': return '进行中'
    case 'completed': return '已完成'
    case 'cancelled': return '已取消'
    default: return '未知'
  }
}

// 获取优先级类型
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

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

// 编辑项目
const editProject = () => {
  ElMessage.info('编辑项目功能开发中')
}

// 删除项目
const deleteProject = () => {
  ElMessage.info('删除项目功能开发中')
}

// 添加成员
const addMember = () => {
  ElMessage.info('添加成员功能开发中')
}

// 移除成员
const removeMember = (memberId: string) => {
  ElMessage.info(`移除成员功能开发中: ${memberId}`)
}

// 查看任务详情
const viewTask = (taskId: string | number) => {
  // 这里可以跳转到任务详情页面或打开任务详情弹窗
  ElMessage.info(`查看任务: ${taskId}`)
}

// 需求基线相关方法
const getRequirementTypeColor = (type: string) => {
  const typeMap: Record<string, string> = {
    'functional': 'primary',
    'non_functional': 'success',
    'interface': 'warning'
  }
  return typeMap[type] || 'info'
}

const getRequirementTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'functional': '功能需求',
    'non_functional': '非功能需求',
    'interface': '接口需求'
  }
  return typeMap[type] || type
}

const getRequirementStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    'draft': 'info',
    'approved': 'success',
    'rejected': 'danger',
    'implemented': 'primary'
  }
  return statusMap[status] || 'info'
}

const getRequirementStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'draft': '草稿',
    'approved': '已批准',
    'rejected': '已拒绝',
    'implemented': '已实现'
  }
  return statusMap[status] || status
}

const viewRequirement = (requirement: any) => {
  ElMessage.info(`查看需求: ${requirement.title}`)
}

const deleteRequirement = (requirement: any) => {
  ElMessage.info(`删除需求: ${requirement.title}`)
}

// 变更请求相关方法
const getChangeTypeColor = (type: string) => {
  const typeMap: Record<string, string> = {
    'feature_add': 'success',
    'feature_modify': 'warning',
    'feature_remove': 'danger',
    'bug_fix': 'info'
  }
  return typeMap[type] || 'info'
}

const getChangeTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'feature_add': '功能新增',
    'feature_modify': '功能修改',
    'feature_remove': '功能删除',
    'bug_fix': '缺陷修复'
  }
  return typeMap[type] || type
}

const getImpactColor = (impact: string) => {
  const impactMap: Record<string, string> = {
    'low': 'success',
    'medium': 'warning',
    'high': 'danger'
  }
  return impactMap[impact] || 'info'
}

const getImpactText = (impact: string) => {
  const impactMap: Record<string, string> = {
    'low': '低',
    'medium': '中',
    'high': '高'
  }
  return impactMap[impact] || impact
}

const getChangeStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'implemented': 'primary'
  }
  return statusMap[status] || 'info'
}

const getChangeStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '待审批',
    'approved': '已批准',
    'rejected': '已拒绝',
    'implemented': '已实现'
  }
  return statusMap[status] || status
}

const viewChangeRequest = (changeRequest: any) => {
  ElMessage.info(`查看变更请求: ${changeRequest.title}`)
}

const deleteChangeRequest = (changeRequest: any) => {
  ElMessage.info(`删除变更请求: ${changeRequest.title}`)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchProjectDetail()
})
</script>

<template>
  <div class="project-detail" v-loading="loading">
    <div v-if="project" class="project-content">
      <!-- 项目头部信息 -->
      <el-card class="project-header">
        <div class="header-content">
          <div class="project-info">
            <h1 class="project-title">{{ project.name }}</h1>
            <div class="project-meta">
              <StatusTag :status="project.status" type="project" size="large" />
              <span class="meta-item">创建时间: {{ formatDate(project.createTime) }}</span>
              <span class="meta-item">更新时间: {{ formatDate(project.updateTime) }}</span>
            </div>
            <p class="project-description">{{ project.description || '暂无描述' }}</p>
          </div>
          
          <div class="project-actions">
            <el-button type="primary" @click="editProject">编辑项目</el-button>
            <el-button type="danger" @click="deleteProject">删除项目</el-button>
          </div>
        </div>
      </el-card>

      <!-- 项目统计 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ projectStats.totalTasks }}</div>
              <div class="stat-label">总任务数</div>
            </div>
            <el-icon class="stat-icon" color="#409EFF"><List /></el-icon>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ projectStats.completedTasks }}</div>
              <div class="stat-label">已完成</div>
            </div>
            <el-icon class="stat-icon" color="#67C23A"><CircleCheck /></el-icon>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ projectStats.inProgressTasks }}</div>
              <div class="stat-label">进行中</div>
            </div>
            <el-icon class="stat-icon" color="#E6A23C"><Clock /></el-icon>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ projectStats.overdueTasks }}</div>
              <div class="stat-label">已逾期</div>
            </div>
            <el-icon class="stat-icon" color="#F56C6C"><Warning /></el-icon>
          </el-card>
        </el-col>
      </el-row>

      <!-- 项目进度 -->
      <el-card class="progress-card">
        <template #header>
          <div class="card-header">
            <span>项目进度</span>
            <span class="progress-text">{{ projectProgress }}%</span>
          </div>
        </template>
        
        <ProgressBar
          :percentage="projectProgress"
          :stroke-width="12"
          :text-inside="true"
        />
      </el-card>

      <!-- 详细信息标签页 -->
      <el-card class="detail-tabs">
        <el-tabs v-model="activeTab" class="project-tabs">
          <!-- 项目概览 -->
          <el-tab-pane label="项目概览" name="overview">
            <div class="overview-section">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card class="overview-card">
                    <template #header>
                      <span>项目信息</span>
                    </template>
                    <div class="info-item">
                      <label>项目名称：</label>
                      <span>{{ project?.name }}</span>
                    </div>
                    <div class="info-item">
                      <label>项目状态：</label>
                      <StatusTag :status="project?.status" type="project" />
                    </div>
                    <div class="info-item">
                      <label>创建时间：</label>
                      <span>{{ formatDate(project?.createTime) }}</span>
                    </div>
                    <div class="info-item">
                      <label>更新时间：</label>
                      <span>{{ formatDate(project?.updateTime) }}</span>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card class="overview-card">
                    <template #header>
                      <span>任务统计</span>
                    </template>
                    <div class="stats-grid">
                      <div class="stat-item">
                        <div class="stat-value">{{ projectStats.totalTasks }}</div>
                        <div class="stat-label">总任务</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">{{ projectStats.completedTasks }}</div>
                        <div class="stat-label">已完成</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">{{ projectStats.inProgressTasks }}</div>
                        <div class="stat-label">进行中</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">{{ projectStats.overdueTasks }}</div>
                        <div class="stat-label">已逾期</div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- PRD文档管理 -->
          <el-tab-pane label="PRD文档" name="prd">
            <div class="prd-section">
              <div class="section-header">
                <h3>PRD文档管理</h3>
                <div class="header-actions">
                  <el-button type="primary" size="small" @click="$refs.prdManager.showUploadDialog()">
                    <el-icon><Upload /></el-icon>
                    上传PRD
                  </el-button>
                </div>
              </div>

              <PrdManager ref="prdManager" :project-id="projectId" />
            </div>
          </el-tab-pane>

          <!-- 需求基线 -->
          <el-tab-pane label="需求基线" name="requirements">
            <div class="requirements-section">
              <div class="section-header">
                <h3>需求基线管理</h3>
                <el-button type="primary" size="small" @click="showRequirementDialog = true">
                  <el-icon><Plus /></el-icon>
                  新建需求
                </el-button>
              </div>

              <div class="requirements-content">
                <div v-if="requirements.length > 0" class="requirements-list">
                  <el-table :data="requirements" style="width: 100%">
                    <el-table-column prop="title" label="需求标题" min-width="200" />
                    <el-table-column prop="type" label="需求类型" width="120">
                      <template #default="{ row }">
                        <el-tag :type="getRequirementTypeColor(row.type)" size="small">
                          {{ getRequirementTypeText(row.type) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="priority" label="优先级" width="100">
                      <template #default="{ row }">
                        <el-tag :type="getPriorityType(row.priority)" size="small">
                          {{ getPriorityText(row.priority) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                      <template #default="{ row }">
                        <el-tag :type="getRequirementStatusColor(row.status)" size="small">
                          {{ getRequirementStatusText(row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="createTime" label="创建时间" width="120">
                      <template #default="{ row }">
                        {{ formatDate(row.createTime) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150">
                      <template #default="{ row }">
                        <el-button size="small" type="primary" @click="viewRequirement(row)">
                          查看
                        </el-button>
                        <el-button size="small" type="danger" @click="deleteRequirement(row)">
                          删除
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <div v-else class="empty-state">
                  <el-empty description="暂无需求基线">
                    <el-button type="primary" @click="showRequirementDialog = true">
                      创建第一个需求
                    </el-button>
                  </el-empty>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 变更请求 -->
          <el-tab-pane label="变更请求" name="changes">
            <div class="changes-section">
              <div class="section-header">
                <h3>变更请求管理</h3>
                <el-button type="primary" size="small" @click="showChangeRequestDialog = true">
                  <el-icon><EditPen /></el-icon>
                  新建变更请求
                </el-button>
              </div>

              <div class="changes-content">
                <div v-if="changeRequests.length > 0" class="changes-list">
                  <el-table :data="changeRequests" style="width: 100%">
                    <el-table-column prop="title" label="变更标题" min-width="200" />
                    <el-table-column prop="type" label="变更类型" width="120">
                      <template #default="{ row }">
                        <el-tag :type="getChangeTypeColor(row.type)" size="small">
                          {{ getChangeTypeText(row.type) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="impact" label="影响程度" width="100">
                      <template #default="{ row }">
                        <el-tag :type="getImpactColor(row.impact)" size="small">
                          {{ getImpactText(row.impact) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                      <template #default="{ row }">
                        <el-tag :type="getChangeStatusColor(row.status)" size="small">
                          {{ getChangeStatusText(row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="requestor" label="申请人" width="100" />
                    <el-table-column prop="createTime" label="申请时间" width="120">
                      <template #default="{ row }">
                        {{ formatDate(row.createTime) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150">
                      <template #default="{ row }">
                        <el-button size="small" type="primary" @click="viewChangeRequest(row)">
                          查看
                        </el-button>
                        <el-button size="small" type="danger" @click="deleteChangeRequest(row)">
                          删除
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <div v-else class="empty-state">
                  <el-empty description="暂无变更请求">
                    <el-button type="primary" @click="showChangeRequestDialog = true">
                      创建第一个变更请求
                    </el-button>
                  </el-empty>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 任务管理 -->
          <el-tab-pane label="任务管理" name="tasks">
            <div class="tasks-section">
              <div class="section-header">
                <h3>项目任务</h3>
                <el-button type="primary" size="small" @click="$refs.taskManager.showCreateDialog()">
                  新建任务
                </el-button>
              </div>

              <TaskManager ref="taskManager" :project-id="projectId" />
            </div>
          </el-tab-pane>

          <!-- 项目成员 -->
          <el-tab-pane label="项目成员" name="members">
            <div class="members-section">
              <div class="section-header">
                <h3>项目成员</h3>
                <el-button type="primary" size="small" @click="addMember">添加成员</el-button>
              </div>
              
              <div class="members-grid">
                <el-card 
                  v-for="member in projectMembers" 
                  :key="member.id"
                  class="member-card"
                >
                  <div class="member-info">
                    <el-avatar :size="50" :icon="UserFilled" />
                    <div class="member-details">
                      <h4 class="member-name">{{ member.name }}</h4>
                      <p class="member-role">{{ member.role }}</p>
                      <p class="member-email">{{ member.email }}</p>
                      <p class="member-join">加入时间: {{ formatDate(member.joinDate) }}</p>
                    </div>
                  </div>
                  
                  <div class="member-actions">
                    <el-button size="small" type="danger" @click="removeMember(member.id)">
                      移除
                    </el-button>
                  </div>
                </el-card>
              </div>
            </div>
          </el-tab-pane>

          <!-- 项目设置 -->
          <el-tab-pane label="项目设置" name="settings">
            <div class="settings-section">
              <h3>项目设置</h3>
              <el-form label-width="120px">
                <el-form-item label="项目名称">
                  <el-input v-model="project.name" disabled />
                </el-form-item>
                
                <el-form-item label="项目状态">
                  <el-select v-model="project.status" disabled>
                    <el-option label="进行中" value="active" />
                    <el-option label="已完成" value="completed" />
                    <el-option label="待开始" value="pending" />
                    <el-option label="已取消" value="cancelled" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="项目描述">
                  <el-input 
                    v-model="project.description" 
                    type="textarea" 
                    :rows="4" 
                    disabled 
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary">保存设置</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="!loading" description="项目不存在或已被删除" />
  </div>
</template>

<style scoped>
.project-detail {
  padding: var(--theme-spacing-lg);
}

.project-header {
  margin-bottom: var(--theme-spacing-lg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.project-info {
  flex: 1;
}

.project-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 var(--theme-spacing-md) 0;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-md);
  margin-bottom: var(--theme-spacing-md);
  flex-wrap: wrap;
}

.meta-item {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.project-description {
  font-size: 16px;
  line-height: 1.6;
  color: var(--theme-text-secondary);
  margin: 0;
}

.project-actions {
  display: flex;
  gap: var(--theme-spacing-sm);
}

.stats-row {
  margin-bottom: var(--theme-spacing-lg);
}

.stat-card {
  text-align: center;
  position: relative;
  overflow: hidden;
}

.stat-content {
  position: relative;
  z-index: 2;
}

.stat-number {
  font-size: 32px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin-bottom: var(--theme-spacing-xs);
}

.stat-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.stat-icon {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  font-size: 32px;
  opacity: 0.3;
}

.progress-card {
  margin-bottom: var(--theme-spacing-lg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-primary);
}

.detail-tabs {
  margin-bottom: var(--theme-spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--theme-spacing-lg);
}

.section-header h3 {
  margin: 0;
  color: var(--theme-text-primary);
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--theme-spacing-lg);
}

.member-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-md);
}

.member-details h4 {
  margin: 0 0 var(--theme-spacing-xs) 0;
  color: var(--theme-text-primary);
}

.member-details p {
  margin: 0 0 var(--theme-spacing-xs) 0;
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.settings-section h3 {
  margin-bottom: var(--theme-spacing-lg);
  color: var(--theme-text-primary);
}

/* 新增标签页样式 */
.project-tabs {
  margin-top: var(--theme-spacing-lg);
}

.overview-section {
  padding: var(--theme-spacing-lg);
}

.overview-card {
  height: 100%;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--theme-spacing-md);
}

.info-item label {
  font-weight: 600;
  color: var(--theme-text-secondary);
  min-width: 100px;
  margin-right: var(--theme-spacing-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--theme-spacing-lg);
}

.stat-item {
  text-align: center;
  padding: var(--theme-spacing-md);
  border-radius: var(--theme-border-radius);
  background: var(--theme-bg-secondary);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--theme-primary);
  margin-bottom: var(--theme-spacing-xs);
}

.stat-label {
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.prd-section,
.requirements-section,
.changes-section {
  padding: var(--theme-spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--theme-spacing-lg);
}

.section-header h3 {
  margin: 0;
  color: var(--theme-text-primary);
}

.header-actions {
  display: flex;
  gap: var(--theme-spacing-sm);
}

.prd-content,
.requirements-content,
.changes-content {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-detail {
    padding: var(--theme-spacing-md);
  }
  
  .header-content {
    flex-direction: column;
    gap: var(--theme-spacing-md);
  }
  
  .project-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .project-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--theme-spacing-xs);
  }
  
  .stats-row .el-col {
    margin-bottom: var(--theme-spacing-md);
  }
  
  .members-grid {
    grid-template-columns: 1fr;
  }
  
  .member-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--theme-spacing-md);
  }
  
  .member-actions {
    width: 100%;
    text-align: right;
  }
}
</style>
