<template>
  <div class="task-manager">
    <!-- 任务统计卡片 -->
    <el-row :gutter="20" class="task-stats">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon size="20"><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ taskStats.total }}</div>
              <div class="stat-label">总任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon size="20"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ taskStats.pending }}</div>
              <div class="stat-label">待开始</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon progress">
              <el-icon size="20"><Loading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ taskStats.inProgress }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon completed">
              <el-icon size="20"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ taskStats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务操作栏 -->
    <div class="task-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchText"
          placeholder="搜索任务标题或描述"
          :prefix-icon="Search"
          clearable
          style="width: 300px; margin-right: 12px;"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="statusFilter"
          placeholder="筛选状态"
          clearable
          style="width: 150px; margin-right: 12px;"
        >
          <el-option label="待开始" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select
          v-model="priorityFilter"
          placeholder="筛选优先级"
          clearable
          style="width: 150px; margin-right: 12px;"
        >
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">
          搜索
        </el-button>
        <el-button :icon="Refresh" @click="resetFilters">
          重置
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          新建任务
        </el-button>
      </div>
    </div>

    <!-- 任务列表 -->
    <el-card class="task-list-card">
      <div v-loading="loading" class="task-list">
        <div v-if="tasks.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无任务">
            <el-button type="primary" @click="showCreateDialog = true">
              创建第一个任务
            </el-button>
          </el-empty>
        </div>
        
        <div v-else class="task-items">
          <div 
            v-for="task in tasks" 
            :key="task.id"
            class="task-item"
            @click="viewTask(task)"
          >
            <div class="task-content">
              <div class="task-header">
                <div class="task-title">
                  <el-icon><Document /></el-icon>
                  {{ task.title }}
                </div>
                <div class="task-meta">
                  <el-tag 
                    :type="getStatusType(task.status)" 
                    size="small"
                  >
                    {{ getStatusText(task.status) }}
                  </el-tag>
                  <el-tag 
                    :type="getPriorityType(task.priority)" 
                    size="small"
                  >
                    {{ getPriorityText(task.priority) }}
                  </el-tag>
                </div>
              </div>
              
              <div class="task-description">
                {{ task.description || '暂无描述' }}
              </div>
              
              <div class="task-footer">
                <div class="task-info">
                  <span class="info-item">
                    <el-icon><User /></el-icon>
                    {{ task.assignee || '未分配' }}
                  </span>
                  <span class="info-item">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(task.dueDate) }}
                  </span>
                </div>
                
                <div class="task-actions" @click.stop>
                  <el-button size="small" type="primary" @click="editTask(task)">
                    编辑
                  </el-button>
                  <el-button size="small" type="success" @click="updateTaskStatus(task)">
                    更新状态
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteTask(task)">
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="pagination.total > pagination.pageSize">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 新建任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建任务"
      width="600px"
      :before-close="closeCreateDialog"
    >
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="任务标题" required>
          <el-input 
            v-model="taskForm.title" 
            placeholder="请输入任务标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="任务描述">
          <el-input 
            v-model="taskForm.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-select v-model="taskForm.priority" style="width: 100%">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="负责人">
          <el-input 
            v-model="taskForm.assignee" 
            placeholder="请输入负责人"
          />
        </el-form-item>
        
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="taskForm.dueDate"
            type="date"
            placeholder="选择截止日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeCreateDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="createTask"
            :disabled="!taskForm.title"
            :loading="creating"
          >
            创建任务
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  List, 
  Clock, 
  Loading, 
  Check, 
  Search, 
  Refresh, 
  Plus, 
  Document, 
  User, 
  Calendar 
} from '@element-plus/icons-vue'

// Props
interface Props {
  projectId: string | number
}

const props = defineProps<Props>()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const creating = ref(false)
const searchText = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const showCreateDialog = ref(false)

// 模拟任务数据
const tasks = ref([
  {
    id: '1',
    title: '用户登录功能开发',
    description: '实现用户登录功能，包括表单验证、API调用和状态管理',
    status: 'in_progress',
    priority: 'high',
    assignee: '张三',
    dueDate: '2024-02-15',
    createTime: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: '数据库设计',
    description: '设计用户管理系统的数据库表结构',
    status: 'completed',
    priority: 'medium',
    assignee: '李四',
    dueDate: '2024-02-10',
    createTime: '2024-01-10T09:00:00Z'
  },
  {
    id: '3',
    title: 'UI界面设计',
    description: '设计用户管理系统的界面原型',
    status: 'pending',
    priority: 'low',
    assignee: '王五',
    dueDate: '2024-02-20',
    createTime: '2024-01-20T14:00:00Z'
  }
])

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 3
})

// 任务表单
const taskForm = ref({
  title: '',
  description: '',
  priority: 'medium',
  assignee: '',
  dueDate: null
})

// 计算属性
const taskStats = computed(() => {
  const total = tasks.value.length
  const pending = tasks.value.filter(t => t.status === 'pending').length
  const inProgress = tasks.value.filter(t => t.status === 'in_progress').length
  const completed = tasks.value.filter(t => t.status === 'completed').length
  
  return { total, pending, inProgress, completed }
})

// 方法
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': 'info',
    'in_progress': 'warning',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '待开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

const getPriorityType = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }
  return priorityMap[priority] || 'info'
}

const getPriorityText = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return priorityMap[priority] || priority
}

const formatDate = (dateString: string) => {
  if (!dateString) return '未设置'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const handleSearch = () => {
  // TODO: 实现搜索逻辑
  ElMessage.info('搜索功能开发中...')
}

const resetFilters = () => {
  searchText.value = ''
  statusFilter.value = ''
  priorityFilter.value = ''
  handleSearch()
}

const viewTask = (task: any) => {
  router.push(`/tasks/${task.id}`)
}

const editTask = (task: any) => {
  ElMessage.info('编辑功能开发中...')
}

const updateTaskStatus = (task: any) => {
  ElMessage.info('状态更新功能开发中...')
}

const deleteTask = (task: any) => {
  ElMessageBox.confirm(
    `确定要删除任务 "${task.title}" 吗？`,
    '确认删除',
    { type: 'warning' }
  ).then(() => {
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index > -1) {
      tasks.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const createTask = async () => {
  try {
    creating.value = true

    // TODO: 实现实际的创建逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟添加新任务
    const newTask = {
      id: Date.now().toString(),
      title: taskForm.value.title,
      description: taskForm.value.description,
      status: 'pending',
      priority: taskForm.value.priority,
      assignee: taskForm.value.assignee,
      dueDate: taskForm.value.dueDate ? taskForm.value.dueDate.toISOString().split('T')[0] : '',
      createTime: new Date().toISOString()
    }

    tasks.value.unshift(newTask)
    ElMessage.success('任务创建成功')
    closeCreateDialog()
  } catch (error) {
    ElMessage.error('创建失败，请重试')
  } finally {
    creating.value = false
  }
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    dueDate: null
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  // TODO: 重新加载数据
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  // TODO: 重新加载数据
}

// 暴露方法给父组件
defineExpose({
  showCreateDialog: () => { showCreateDialog.value = true }
})
</script>

<style scoped>
.task-manager {
  padding: 20px;
}

.task-stats {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
  color: white;
}

.stat-icon.progress {
  background: linear-gradient(135deg, #74b9ff, #0984e3);
  color: white;
}

.stat-icon.completed {
  background: linear-gradient(135deg, #00b894, #00cec9);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
}

.task-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.task-list-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-list {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.task-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.task-content {
  width: 100%;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-meta {
  display: flex;
  gap: 8px;
}

.task-description {
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-info {
  display: flex;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #95a5a6;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .toolbar-left {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-end;
  }

  .task-header {
    flex-direction: column;
    gap: 8px;
  }

  .task-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
