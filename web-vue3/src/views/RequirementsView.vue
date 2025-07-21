<!-- 需求基线管理页面 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 需求基线数据类型
interface Requirement {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'draft' | 'approved' | 'implemented' | 'changed'
  version: string
  projectId: string
  projectName: string
  createdAt: string
  updatedAt: string
  author: string
  category: string
}

// 响应式数据
const requirements = ref<Requirement[]>([])
const loading = ref(false)
const searchText = ref('')
const selectedProject = ref('')
const selectedStatus = ref('')
const selectedPriority = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表单相关
const dialogVisible = ref(false)
const editingRequirement = ref<Requirement | null>(null)
const requirementForm = ref({
  title: '',
  description: '',
  priority: 'medium' as const,
  category: '',
  projectId: ''
})

// 项目列表
const projects = ref([
  { id: '1', name: '需求助手001' },
  { id: '2', name: '项目管理系统' }
])

// 状态选项
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已批准', value: 'approved' },
  { label: '已实现', value: 'implemented' },
  { label: '已变更', value: 'changed' }
]

// 优先级选项
const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]

// 获取需求基线列表
const fetchRequirements = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockData: Requirement[] = [
      {
        id: '1',
        title: '用户登录功能',
        description: '实现用户登录、注册、密码重置等基础认证功能',
        priority: 'high',
        status: 'approved',
        version: '1.0',
        projectId: '1',
        projectName: '需求助手001',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
        author: '产品经理',
        category: '用户管理'
      },
      {
        id: '2',
        title: '任务管理模块',
        description: '支持任务创建、分配、状态跟踪、优先级设置等功能',
        priority: 'high',
        status: 'implemented',
        version: '1.0',
        projectId: '1',
        projectName: '需求助手001',
        createdAt: '2024-01-16',
        updatedAt: '2024-01-25',
        author: '产品经理',
        category: '任务管理'
      },
      {
        id: '3',
        title: '数据统计报表',
        description: '提供项目进度、任务完成率、团队效率等统计报表',
        priority: 'medium',
        status: 'draft',
        version: '1.1',
        projectId: '1',
        projectName: '需求助手001',
        createdAt: '2024-01-18',
        updatedAt: '2024-01-18',
        author: '产品经理',
        category: '数据分析'
      }
    ]
    
    requirements.value = mockData
    total.value = mockData.length
  } catch (error) {
    ElMessage.error('获取需求基线失败')
  } finally {
    loading.value = false
  }
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'draft': return 'info'
    case 'approved': return 'success'
    case 'implemented': return 'primary'
    case 'changed': return 'warning'
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

// 新建需求
const createRequirement = () => {
  editingRequirement.value = null
  requirementForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    projectId: ''
  }
  dialogVisible.value = true
}

// 编辑需求
const editRequirement = (requirement: Requirement) => {
  editingRequirement.value = requirement
  requirementForm.value = {
    title: requirement.title,
    description: requirement.description,
    priority: requirement.priority,
    category: requirement.category,
    projectId: requirement.projectId
  }
  dialogVisible.value = true
}

// 删除需求
const deleteRequirement = async (requirement: Requirement) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除需求"${requirement.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    requirements.value = requirements.value.filter(r => r.id !== requirement.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

// 保存需求
const saveRequirement = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (editingRequirement.value) {
      // 更新现有需求
      const index = requirements.value.findIndex(r => r.id === editingRequirement.value!.id)
      if (index !== -1) {
        requirements.value[index] = {
          ...requirements.value[index],
          ...requirementForm.value,
          updatedAt: new Date().toISOString().split('T')[0]
        }
      }
      ElMessage.success('更新成功')
    } else {
      // 创建新需求
      const newRequirement: Requirement = {
        id: Date.now().toString(),
        ...requirementForm.value,
        status: 'draft',
        version: '1.0',
        projectName: projects.value.find(p => p.id === requirementForm.value.projectId)?.name || '',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        author: '当前用户'
      }
      requirements.value.unshift(newRequirement)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 搜索和筛选
const filteredRequirements = computed(() => {
  let filtered = requirements.value
  
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
  
  if (selectedPriority.value) {
    filtered = filtered.filter(r => r.priority === selectedPriority.value)
  }
  
  return filtered
})

// 分页数据
const paginatedRequirements = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRequirements.value.slice(start, end)
})

// 页面加载时获取数据
onMounted(() => {
  fetchRequirements()
})
</script>

<template>
  <div class="requirements-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">需求基线</h1>
        <p class="page-description">管理项目需求基线，跟踪需求变更</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="createRequirement">
          <el-icon><Plus /></el-icon>
          新建需求
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-input
            v-model="searchText"
            placeholder="搜索需求标题或描述"
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
          <el-select v-model="selectedPriority" placeholder="选择优先级" clearable>
            <el-option
              v-for="priority in priorityOptions"
              :key="priority.value"
              :label="priority.label"
              :value="priority.value"
            />
          </el-select>
        </el-col>
      </el-row>
    </div>

    <!-- 需求列表 -->
    <div class="requirements-list">
      <el-table
        :data="paginatedRequirements"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="title" label="需求标题" min-width="200">
          <template #default="{ row }">
            <div class="requirement-title">
              <strong>{{ row.title }}</strong>
              <div class="requirement-meta">
                <span>{{ row.category }}</span> • 
                <span>v{{ row.version }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="300">
          <template #default="{ row }">
            <div class="requirement-description">
              {{ row.description }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="projectName" label="所属项目" width="150" />
        
        <el-table-column prop="priority" label="优先级" width="100">
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
        
        <el-table-column prop="author" label="创建人" width="100" />
        
        <el-table-column prop="updatedAt" label="更新时间" width="120" />
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="editRequirement(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteRequirement(row)"
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
        :total="filteredRequirements.length"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <!-- 新建/编辑需求对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingRequirement ? '编辑需求' : '新建需求'"
      width="600px"
    >
      <el-form :model="requirementForm" label-width="100px">
        <el-form-item label="需求标题" required>
          <el-input v-model="requirementForm.title" placeholder="请输入需求标题" />
        </el-form-item>
        
        <el-form-item label="需求描述" required>
          <el-input
            v-model="requirementForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入需求描述"
          />
        </el-form-item>
        
        <el-form-item label="所属项目" required>
          <el-select v-model="requirementForm.projectId" placeholder="选择项目">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="需求分类">
          <el-input v-model="requirementForm.category" placeholder="如：用户管理、任务管理等" />
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-select v-model="requirementForm.priority">
            <el-option
              v-for="priority in priorityOptions"
              :key="priority.value"
              :label="priority.label"
              :value="priority.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRequirement">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.requirements-view {
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

.requirements-list {
  margin-bottom: var(--theme-spacing-lg);
}

.requirement-title strong {
  color: var(--theme-text-primary);
  font-size: 14px;
}

.requirement-meta {
  margin-top: 4px;
  color: var(--theme-text-secondary);
  font-size: 12px;
}

.requirement-description {
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

.pagination-section {
  display: flex;
  justify-content: center;
  padding: var(--theme-spacing-md) 0;
}

@media (max-width: 768px) {
  .requirements-view {
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
