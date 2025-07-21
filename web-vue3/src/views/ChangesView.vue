<!-- 变更请求管理页面 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useNotification } from '@/composables/useNotification'
import { safeFormatDate } from '@/utils/dateUtils'

// 变更请求数据类型
interface ChangeRequest {
  id: string
  title: string
  description: string
  type: 'feature' | 'bug' | 'enhancement' | 'removal'
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'rejected' | 'implemented'
  projectId: string
  projectName: string
  requirementId?: string
  requirementTitle?: string
  requestor: string
  approver?: string
  createdAt: string
  updatedAt: string
  reason: string
  impact: string
  estimatedEffort: string
}

// 使用通知系统
const notification = useNotification()

// 响应式数据
const changeRequests = ref<ChangeRequest[]>([])
const loading = ref(false)
const searchText = ref('')
const selectedProject = ref('')
const selectedStatus = ref('')
const selectedType = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表单相关
const dialogVisible = ref(false)
const editingRequest = ref<ChangeRequest | null>(null)
const requestForm = ref({
  title: '',
  description: '',
  type: 'feature' as const,
  priority: 'medium' as const,
  projectId: '',
  requirementId: '',
  reason: '',
  impact: '',
  estimatedEffort: ''
})

// 项目列表
const projects = ref([
  { id: '1', name: '需求助手001' },
  { id: '2', name: '项目管理系统' }
])

// 需求列表
const requirements = ref([
  { id: '1', title: '用户登录功能', projectId: '1' },
  { id: '2', title: '任务管理模块', projectId: '1' },
  { id: '3', title: '数据统计报表', projectId: '1' }
])

// 变更类型选项
const typeOptions = [
  { label: '新功能', value: 'feature' },
  { label: '缺陷修复', value: 'bug' },
  { label: '功能增强', value: 'enhancement' },
  { label: '功能移除', value: 'removal' }
]

// 状态选项
const statusOptions = [
  { label: '待审批', value: 'pending' },
  { label: '已批准', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已实现', value: 'implemented' }
]

// 优先级选项
const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]

// 获取变更请求列表
const fetchChangeRequests = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockData: ChangeRequest[] = [
      {
        id: '1',
        title: '增加用户头像上传功能',
        description: '在用户个人资料页面增加头像上传功能，支持jpg、png格式',
        type: 'feature',
        priority: 'medium',
        status: 'pending',
        projectId: '1',
        projectName: '需求助手001',
        requirementId: '1',
        requirementTitle: '用户登录功能',
        requestor: '产品经理',
        createdAt: '2024-01-20',
        updatedAt: '2024-01-20',
        reason: '用户反馈希望能够自定义头像，提升用户体验',
        impact: '需要增加文件上传接口和前端上传组件',
        estimatedEffort: '3天'
      },
      {
        id: '2',
        title: '修复任务状态更新bug',
        description: '修复任务状态从"进行中"更新为"已完成"时偶尔失败的问题',
        type: 'bug',
        priority: 'high',
        status: 'approved',
        projectId: '1',
        projectName: '需求助手001',
        requirementId: '2',
        requirementTitle: '任务管理模块',
        requestor: '测试工程师',
        approver: '技术负责人',
        createdAt: '2024-01-18',
        updatedAt: '2024-01-19',
        reason: '用户反馈任务状态更新不稳定，影响使用体验',
        impact: '需要排查数据库事务处理逻辑',
        estimatedEffort: '1天'
      },
      {
        id: '3',
        title: '优化数据统计报表性能',
        description: '优化大数据量情况下统计报表的查询性能',
        type: 'enhancement',
        priority: 'medium',
        status: 'implemented',
        projectId: '1',
        projectName: '需求助手001',
        requirementId: '3',
        requirementTitle: '数据统计报表',
        requestor: '运维工程师',
        approver: '技术负责人',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-22',
        reason: '当前数据量增长，报表查询速度变慢',
        impact: '需要优化SQL查询和增加缓存机制',
        estimatedEffort: '5天'
      }
    ]
    
    changeRequests.value = mockData
    total.value = mockData.length
  } catch (error) {
    ElMessage.error('获取变更请求失败')
  } finally {
    loading.value = false
  }
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'implemented': return 'primary'
    default: return 'info'
  }
}

// 获取类型标签类型
const getTypeType = (type: string) => {
  switch (type) {
    case 'feature': return 'primary'
    case 'bug': return 'danger'
    case 'enhancement': return 'success'
    case 'removal': return 'warning'
    default: return 'info'
  }
}

// 获取优先级标签类型
const getPriorityType = (priority: string) => {
  switch (priority) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

// 新建变更请求
const createChangeRequest = () => {
  editingRequest.value = null
  requestForm.value = {
    title: '',
    description: '',
    type: 'feature',
    priority: 'medium',
    projectId: '',
    requirementId: '',
    reason: '',
    impact: '',
    estimatedEffort: ''
  }
  dialogVisible.value = true
}

// 编辑变更请求
const editChangeRequest = (request: ChangeRequest) => {
  editingRequest.value = request
  requestForm.value = {
    title: request.title,
    description: request.description,
    type: request.type,
    priority: request.priority,
    projectId: request.projectId,
    requirementId: request.requirementId || '',
    reason: request.reason,
    impact: request.impact,
    estimatedEffort: request.estimatedEffort
  }
  dialogVisible.value = true
}

// 删除变更请求
const deleteChangeRequest = async (request: ChangeRequest) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除变更请求"${request.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    changeRequests.value = changeRequests.value.filter(r => r.id !== request.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

// 审批变更请求
const approveChangeRequest = async (request: ChangeRequest, approved: boolean) => {
  try {
    const action = approved ? '批准' : '拒绝'
    await ElMessageBox.confirm(
      `确定要${action}变更请求"${request.title}"吗？`,
      `确认${action}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: approved ? 'success' : 'warning',
      }
    )
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = changeRequests.value.findIndex(r => r.id === request.id)
    if (index !== -1) {
      changeRequests.value[index] = {
        ...changeRequests.value[index],
        status: approved ? 'approved' : 'rejected',
        approver: '当前用户',
        updatedAt: new Date().toISOString().split('T')[0]
      }
    }
    
    ElMessage.success(`${action}成功`)
  } catch (error) {
    // 用户取消操作
  }
}

// 保存变更请求
const saveChangeRequest = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (editingRequest.value) {
      // 更新现有请求
      const index = changeRequests.value.findIndex(r => r.id === editingRequest.value!.id)
      if (index !== -1) {
        const requirement = requirements.value.find(r => r.id === requestForm.value.requirementId)
        changeRequests.value[index] = {
          ...changeRequests.value[index],
          ...requestForm.value,
          requirementTitle: requirement?.title,
          updatedAt: new Date().toISOString().split('T')[0]
        }
      }
      ElMessage.success('更新成功')
    } else {
      // 创建新请求
      const requirement = requirements.value.find(r => r.id === requestForm.value.requirementId)
      const project = projects.value.find(p => p.id === requestForm.value.projectId)
      
      const newRequest: ChangeRequest = {
        id: Date.now().toString(),
        ...requestForm.value,
        status: 'pending',
        projectName: project?.name || '',
        requirementTitle: requirement?.title,
        requestor: '当前用户',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
      changeRequests.value.unshift(newRequest)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 搜索和筛选
const filteredChangeRequests = computed(() => {
  let filtered = changeRequests.value
  
  if (searchText.value) {
    filtered = filtered.filter(r => 
      r.title.includes(searchText.value) || 
      r.description.includes(searchText.value)
    )
  }
  
  if (selectedProject.value) {
    filtered = filtered.filter(r => r.projectId === selectedProject.value)
  }
  
  if (selectedStatus.value) {
    filtered = filtered.filter(r => r.status === selectedStatus.value)
  }
  
  if (selectedType.value) {
    filtered = filtered.filter(r => r.type === selectedType.value)
  }
  
  return filtered
})

// 分页数据
const paginatedChangeRequests = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredChangeRequests.value.slice(start, end)
})

// 根据项目筛选需求
const filteredRequirements = computed(() => {
  if (!requestForm.value.projectId) return []
  return requirements.value.filter(r => r.projectId === requestForm.value.projectId)
})

// 页面加载时获取数据
onMounted(() => {
  fetchChangeRequests()
})
</script>

<template>
  <div class="changes-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">变更请求</h1>
        <p class="page-description">管理项目变更请求，跟踪需求变更流程</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="createChangeRequest">
          <el-icon><Plus /></el-icon>
          新建变更请求
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-input
            v-model="searchText"
            placeholder="搜索变更请求标题或描述"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="selectedProject" placeholder="选择项目" clearable>
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="selectedStatus" placeholder="选择状态" clearable>
            <el-option
              v-for="status in statusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="selectedType" placeholder="选择类型" clearable>
            <el-option
              v-for="type in typeOptions"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-col>
      </el-row>
    </div>

    <!-- 变更请求列表 -->
    <div class="changes-list">
      <el-table
        :data="paginatedChangeRequests"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="title" label="变更标题" min-width="200">
          <template #default="{ row }">
            <div class="change-title">
              <strong>{{ row.title }}</strong>
              <div class="change-meta">
                <span>{{ row.requestor }}</span> • 
                <span>{{ row.createdAt }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="250">
          <template #default="{ row }">
            <div class="change-description">
              {{ row.description }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="projectName" label="所属项目" width="120" />
        
        <el-table-column prop="requirementTitle" label="关联需求" width="150">
          <template #default="{ row }">
            <span v-if="row.requirementTitle">{{ row.requirementTitle }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeType(row.type)" size="small">
              {{ typeOptions.find(t => t.value === row.type)?.label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ priorityOptions.find(p => p.value === row.priority)?.label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ statusOptions.find(s => s.value === row.status)?.label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="estimatedEffort" label="预估工作量" width="120" />
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="editChangeRequest(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="approveChangeRequest(row, true)"
            >
              批准
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="warning"
              size="small"
              @click="approveChangeRequest(row, false)"
            >
              拒绝
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteChangeRequest(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredChangeRequests.length"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <!-- 新建/编辑变更请求对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingRequest ? '编辑变更请求' : '新建变更请求'"
      width="700px"
    >
      <el-form :model="requestForm" label-width="120px">
        <el-form-item label="变更标题" required>
          <el-input v-model="requestForm.title" placeholder="请输入变更标题" />
        </el-form-item>
        
        <el-form-item label="变更描述" required>
          <el-input
            v-model="requestForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入变更描述"
          />
        </el-form-item>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属项目" required>
              <el-select v-model="requestForm.projectId" placeholder="选择项目">
                <el-option
                  v-for="project in projects"
                  :key="project.id"
                  :label="project.name"
                  :value="project.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联需求">
              <el-select v-model="requestForm.requirementId" placeholder="选择需求" clearable>
                <el-option
                  v-for="requirement in filteredRequirements"
                  :key="requirement.id"
                  :label="requirement.title"
                  :value="requirement.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="变更类型">
              <el-select v-model="requestForm.type">
                <el-option
                  v-for="type in typeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="requestForm.priority">
                <el-option
                  v-for="priority in priorityOptions"
                  :key="priority.value"
                  :label="priority.label"
                  :value="priority.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="变更原因" required>
          <el-input
            v-model="requestForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请说明变更原因"
          />
        </el-form-item>
        
        <el-form-item label="影响分析" required>
          <el-input
            v-model="requestForm.impact"
            type="textarea"
            :rows="2"
            placeholder="请分析变更对项目的影响"
          />
        </el-form-item>
        
        <el-form-item label="预估工作量">
          <el-input v-model="requestForm.estimatedEffort" placeholder="如：3天、1周等" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveChangeRequest">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.changes-view {
  padding: var(--theme-spacing-lg);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--theme-spacing-lg);
}

.page-title {
  margin: 0 0 var(--theme-spacing-xs) 0;
  color: var(--theme-text-primary);
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: var(--theme-text-secondary);
  font-size: 14px;
}

.filter-section {
  margin-bottom: var(--theme-spacing-lg);
  padding: var(--theme-spacing-md);
  background: var(--theme-bg-primary);
  border-radius: var(--theme-border-radius);
  border: 1px solid var(--theme-border-color);
}

.changes-list {
  margin-bottom: var(--theme-spacing-lg);
}

.change-title strong {
  color: var(--theme-text-primary);
  font-size: 14px;
}

.change-meta {
  margin-top: 4px;
  color: var(--theme-text-secondary);
  font-size: 12px;
}

.change-description {
  color: var(--theme-text-secondary);
  font-size: 13px;
  line-height: 1.4;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.text-muted {
  color: var(--theme-text-secondary);
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: var(--theme-spacing-md) 0;
}

@media (max-width: 768px) {
  .changes-view {
    padding: var(--theme-spacing-md);
  }
  
  .page-header {
    flex-direction: column;
    gap: var(--theme-spacing-md);
  }
  
  .filter-section .el-row {
    flex-direction: column;
    gap: var(--theme-spacing-sm);
  }
}
</style>
