<!-- PRD管理页面 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PrdUpload, PrdViewer } from '@/components/prd'
import { useProjectStore } from '@/stores'
import { useNotification } from '@/composables/useNotification'
import { safeFormatDate } from '@/utils/dateUtils'

// 路由相关
const route = useRoute()
const router = useRouter()

// 使用状态管理和通知
const projectStore = useProjectStore()
const notification = useNotification()

// 组件状态
const loading = ref(false)
const activeTab = ref('list')
const selectedProject = ref('')
const selectedPrd = ref('')
const uploadDialogVisible = ref(false)

// PRD列表数据
const prdList = ref([
  {
    id: '1',
    title: '用户管理系统PRD',
    projectId: '1',
    projectName: '项目管理系统',
    version: '1.0',
    author: '产品经理',
    status: 'published',
    createTime: '2024-01-15T10:00:00Z',
    updateTime: '2024-01-20T15:30:00Z',
    size: '15KB'
  },
  {
    id: '2',
    title: '任务跟踪功能PRD',
    projectId: '2',
    projectName: '任务跟踪工具',
    version: '2.1',
    author: '产品经理',
    status: 'draft',
    createTime: '2024-01-18T09:00:00Z',
    updateTime: '2024-01-22T11:20:00Z',
    size: '23KB'
  }
])

// 项目列表（用于筛选）
const projectList = ref([
  { id: '1', name: '项目管理系统' },
  { id: '2', name: '任务跟踪工具' },
  { id: '3', name: 'PRD文档管理' }
])

// 过滤后的PRD列表
const filteredPrdList = computed(() => {
  if (!selectedProject.value) return prdList.value
  return prdList.value.filter(prd => prd.projectId === selectedProject.value)
})

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'published': return 'success'
    case 'draft': return 'warning'
    case 'archived': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'published': return '已发布'
    case 'draft': return '草稿'
    case 'archived': return '已归档'
    default: return '未知'
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return safeFormatDate(dateStr, 'yyyy-MM-dd HH:mm', '未知时间')
}

// 查看PRD
const viewPrd = (prd: any) => {
  selectedPrd.value = prd.id
  selectedProject.value = prd.projectId
  activeTab.value = 'viewer'
  notification.info('查看PRD', `正在加载 ${prd.title}`)
}

// 编辑PRD
const editPrd = (prd: any) => {
  selectedPrd.value = prd.id
  selectedProject.value = prd.projectId
  activeTab.value = 'viewer'
  notification.info('编辑模式', 'PRD编辑功能开发中，敬请期待')
}

// 删除PRD
const deletePrd = async (prd: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除PRD文档 "${prd.title}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    loading.value = true

    try {
      // 模拟删除API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 从列表中移除
      const index = prdList.value.findIndex(item => item.id === prd.id)
      if (index > -1) {
        prdList.value.splice(index, 1)
      }

      notification.deleteSuccess('PRD文档')
    } catch (error: any) {
      notification.apiError('删除', 'PRD文档', error.message)
    } finally {
      loading.value = false
    }
  } catch {
    // 用户取消删除
  }
}

// 上传成功处理
const handleUploadSuccess = (file: any, response: any) => {
  const fileName = file.name.replace(/\.[^/.]+$/, '')
  notification.uploadSuccess(fileName)

  // 添加到列表（模拟）
  const newPrd = {
    id: Date.now().toString(),
    title: fileName,
    projectId: selectedProject.value,
    projectName: projectList.value.find(p => p.id === selectedProject.value)?.name || '',
    version: '1.0',
    author: '当前用户',
    status: 'draft',
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    size: `${Math.round(file.size / 1024)}KB`
  }

  prdList.value.unshift(newPrd)

  // 切换到查看模式
  selectedPrd.value = newPrd.id
  activeTab.value = 'viewer'
}

// 上传失败处理
const handleUploadError = (error: any) => {
  console.error('Upload error:', error)
  notification.error('上传失败', '文件上传过程中发生错误，请重试')
}

// 生成任务处理
const handleGenerateTasks = (prdId: string | number) => {
  notification.info('任务生成', '开始从PRD生成任务，正在跳转...')
  // 这里会跳转到任务生成页面或显示生成进度
  router.push(`/tasks/generate?prdId=${prdId}&projectId=${selectedProject.value}`)
}

// 返回列表
const backToList = () => {
  activeTab.value = 'list'
  selectedPrd.value = ''
}

// 组件挂载时的初始化
onMounted(() => {
  // 从路由参数获取项目ID
  const projectId = route.query.projectId as string
  if (projectId) {
    selectedProject.value = projectId
  }
})
</script>

<template>
  <div class="prd-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">PRD文档管理</h1>
        <p class="page-description">管理项目需求文档，支持上传、编辑和任务生成</p>
      </div>
      
      <div class="header-actions">
        <el-button 
          v-if="activeTab === 'viewer'" 
          :icon="ArrowLeft" 
          @click="backToList"
        >
          返回列表
        </el-button>
        <el-button 
          v-if="activeTab === 'list'" 
          type="primary" 
          :icon="Plus"
          @click="activeTab = 'upload'"
        >
          上传PRD
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- PRD列表 -->
      <el-card v-if="activeTab === 'list'" class="list-card">
        <!-- 筛选工具栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-select
              v-model="selectedProject"
              placeholder="选择项目"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="project in projectList"
                :key="project.id"
                :label="project.name"
                :value="project.id"
              />
            </el-select>
          </div>
          
          <div class="toolbar-right">
            <el-button type="primary" :icon="Plus" @click="activeTab = 'upload'">
              上传PRD
            </el-button>
          </div>
        </div>

        <!-- PRD表格 -->
        <el-table :data="filteredPrdList" style="width: 100%" v-loading="loading">
          <el-table-column prop="title" label="文档标题" min-width="200" />
          <el-table-column prop="projectName" label="所属项目" width="150" />
          <el-table-column prop="version" label="版本" width="80" />
          <el-table-column prop="author" label="作者" width="100" />
          
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="size" label="文件大小" width="100" />
          <el-table-column prop="updateTime" label="更新时间" width="120">
            <template #default="{ row }">
              {{ formatDate(row.updateTime) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="viewPrd(row)">
                查看
              </el-button>
              <el-button size="small" type="warning" @click="editPrd(row)">
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="deletePrd(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- PRD上传 -->
      <el-card v-else-if="activeTab === 'upload'" class="upload-card">
        <template #header>
          <div class="card-header">
            <span>上传PRD文档</span>
            <el-button @click="activeTab = 'list'">返回列表</el-button>
          </div>
        </template>
        
        <div class="upload-content">
          <!-- 项目选择 -->
          <div class="project-select">
            <el-form-item label="选择项目" required>
              <el-select
                v-model="selectedProject"
                placeholder="请选择项目"
                style="width: 300px"
              >
                <el-option
                  v-for="project in projectList"
                  :key="project.id"
                  :label="project.name"
                  :value="project.id"
                />
              </el-select>
            </el-form-item>
          </div>
          
          <!-- 文件上传 -->
          <PrdUpload
            v-if="selectedProject"
            :project-id="selectedProject"
            @upload-success="handleUploadSuccess"
            @upload-error="handleUploadError"
          />
          
          <el-alert
            v-else
            title="请先选择项目"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </el-card>

      <!-- PRD查看器 -->
      <el-card v-else-if="activeTab === 'viewer'" class="viewer-card">
        <PrdViewer
          :project-id="selectedProject"
          :prd-id="selectedPrd"
          :editable="true"
          @generate-tasks="handleGenerateTasks"
        />
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.prd-view {
  padding: var(--theme-spacing-lg);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--theme-spacing-lg);
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 var(--theme-spacing-xs) 0;
}

.page-description {
  font-size: 16px;
  color: var(--theme-text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--theme-spacing-sm);
}

.main-content {
  width: 100%;
}

.list-card,
.upload-card,
.viewer-card {
  width: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--theme-spacing-lg);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-md);
}

.toolbar-right {
  display: flex;
  gap: var(--theme-spacing-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-content {
  width: 100%;
}

.project-select {
  margin-bottom: var(--theme-spacing-xl);
  padding-bottom: var(--theme-spacing-lg);
  border-bottom: 1px solid var(--theme-border-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .prd-view {
    padding: var(--theme-spacing-md);
  }
  
  .page-header {
    flex-direction: column;
    gap: var(--theme-spacing-md);
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .toolbar {
    flex-direction: column;
    gap: var(--theme-spacing-md);
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
}
</style>
