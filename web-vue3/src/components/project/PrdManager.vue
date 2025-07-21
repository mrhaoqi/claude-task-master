<template>
  <div class="prd-manager">
    <!-- PRD文档列表 -->
    <div v-if="prdDocuments.length > 0" class="prd-list">
      <el-row :gutter="20">
        <el-col 
          :span="8" 
          v-for="prd in prdDocuments" 
          :key="prd.id"
          class="prd-col"
        >
          <el-card class="prd-card" :body-style="{ padding: '20px' }">
            <div class="prd-header">
              <div class="prd-info">
                <h4 class="prd-title">
                  <el-icon><Document /></el-icon>
                  {{ prd.title }}
                </h4>
                <el-tag :type="getVersionType(prd.version)" size="small">
                  v{{ prd.version }}
                </el-tag>
              </div>
              <el-dropdown @command="handlePrdAction">
                <el-button type="text" :icon="More" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="`view-${prd.id}`">
                      <el-icon><View /></el-icon>
                      预览
                    </el-dropdown-item>
                    <el-dropdown-item :command="`edit-${prd.id}`">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item :command="`generate-${prd.id}`">
                      <el-icon><Cpu /></el-icon>
                      生成任务
                    </el-dropdown-item>
                    <el-dropdown-item :command="`delete-${prd.id}`" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div class="prd-description">
              {{ prd.description || '暂无描述' }}
            </div>
            
            <div class="prd-meta">
              <span class="meta-item">
                <el-icon><User /></el-icon>
                {{ prd.author }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(prd.updateTime) }}
              </span>
            </div>
            
            <div class="prd-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="viewPrd(prd)"
              >
                查看详情
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                @click="generateTasks(prd)"
              >
                生成任务
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="暂无PRD文档">
        <el-button type="primary" @click="showUploadDialog = true">
          上传第一个PRD文档
        </el-button>
      </el-empty>
    </div>
    
    <!-- 上传PRD对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传PRD文档"
      width="600px"
      :before-close="closeUploadDialog"
    >
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="文档标题" required>
          <el-input 
            v-model="uploadForm.title" 
            placeholder="请输入PRD文档标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="版本号">
          <el-input 
            v-model="uploadForm.version" 
            placeholder="如：1.0.0"
            style="width: 200px;"
          />
        </el-form-item>
        
        <el-form-item label="文档描述">
          <el-input 
            v-model="uploadForm.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入文档描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="上传方式">
          <el-radio-group v-model="uploadForm.uploadType">
            <el-radio label="file">文件上传</el-radio>
            <el-radio label="text">文本输入</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="uploadForm.uploadType === 'file'" label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".md,.txt,.doc,.docx"
            :on-change="handleFileChange"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 .md, .txt, .doc, .docx 格式文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item v-if="uploadForm.uploadType === 'text'" label="文档内容">
          <el-input 
            v-model="uploadForm.content" 
            type="textarea"
            :rows="10"
            placeholder="请输入或粘贴PRD文档内容"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeUploadDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="uploadPrd"
            :disabled="!canUpload"
            :loading="uploading"
          >
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- PRD预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="currentPrd?.title"
      width="80%"
      :before-close="closePreviewDialog"
    >
      <div class="prd-preview">
        <div class="preview-header">
          <div class="preview-meta">
            <el-tag type="info">v{{ currentPrd?.version }}</el-tag>
            <span class="meta-text">作者：{{ currentPrd?.author }}</span>
            <span class="meta-text">更新时间：{{ formatDate(currentPrd?.updateTime) }}</span>
          </div>
          <div class="preview-actions">
            <el-button type="success" @click="generateTasks(currentPrd)">
              <el-icon><Cpu /></el-icon>
              生成任务
            </el-button>
          </div>
        </div>
        
        <div class="preview-content">
          <div v-html="currentPrd?.content" class="markdown-content"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Upload,
  Cpu,
  More,
  View,
  Edit,
  Delete,
  User,
  Calendar
} from '@element-plus/icons-vue'

// Props
interface Props {
  projectId: string | number
}

const props = defineProps<Props>()

// 响应式数据
const prdDocuments = ref([
  {
    id: '1',
    title: '用户管理系统PRD',
    version: '1.0.0',
    description: '用户管理系统的产品需求文档，包含用户注册、登录、权限管理等功能',
    author: '产品经理',
    content: '<h1>用户管理系统PRD</h1><p>这是一个示例PRD文档...</p>',
    updateTime: '2024-01-15T10:30:00Z',
    createTime: '2024-01-15T10:30:00Z'
  }
])

const showUploadDialog = ref(false)
const showPreviewDialog = ref(false)
const currentPrd = ref(null)
const uploading = ref(false)

// 上传表单
const uploadForm = ref({
  title: '',
  version: '1.0.0',
  description: '',
  uploadType: 'file',
  content: '',
  file: null
})

// 计算属性
const canUpload = computed(() => {
  return uploadForm.value.title && 
    (uploadForm.value.uploadType === 'text' ? uploadForm.value.content : uploadForm.value.file)
})

// 方法
const getVersionType = (version: string) => {
  const [major] = version.split('.')
  return parseInt(major) >= 2 ? 'success' : 'primary'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const handlePrdAction = (command: string) => {
  const [action, id] = command.split('-')
  const prd = prdDocuments.value.find(p => p.id === id)
  
  switch (action) {
    case 'view':
      viewPrd(prd)
      break
    case 'edit':
      editPrd(prd)
      break
    case 'generate':
      generateTasks(prd)
      break
    case 'delete':
      deletePrd(prd)
      break
  }
}

const viewPrd = (prd: any) => {
  currentPrd.value = prd
  showPreviewDialog.value = true
}

const editPrd = (prd: any) => {
  ElMessage.info('编辑功能开发中...')
}

const generateTasks = (prd: any) => {
  ElMessage.success(`正在从 "${prd.title}" 生成任务...`)
  // TODO: 实现AI任务生成逻辑
}

const deletePrd = (prd: any) => {
  ElMessageBox.confirm(
    `确定要删除PRD文档 "${prd.title}" 吗？`,
    '确认删除',
    { type: 'warning' }
  ).then(() => {
    const index = prdDocuments.value.findIndex(p => p.id === prd.id)
    if (index > -1) {
      prdDocuments.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleFileChange = (file: any) => {
  uploadForm.value.file = file.raw
}

const uploadPrd = async () => {
  try {
    uploading.value = true
    
    // TODO: 实现实际的上传逻辑
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟添加新PRD
    const newPrd = {
      id: Date.now().toString(),
      title: uploadForm.value.title,
      version: uploadForm.value.version,
      description: uploadForm.value.description,
      author: '当前用户',
      content: uploadForm.value.content || '文件内容...',
      updateTime: new Date().toISOString(),
      createTime: new Date().toISOString()
    }
    
    prdDocuments.value.unshift(newPrd)
    ElMessage.success('PRD文档上传成功')
    closeUploadDialog()
  } catch (error) {
    ElMessage.error('上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

const closeUploadDialog = () => {
  showUploadDialog.value = false
  uploadForm.value = {
    title: '',
    version: '1.0.0',
    description: '',
    uploadType: 'file',
    content: '',
    file: null
  }
}

const closePreviewDialog = () => {
  showPreviewDialog.value = false
  currentPrd.value = null
}

// 暴露方法给父组件
defineExpose({
  showUploadDialog: () => { showUploadDialog.value = true }
})
</script>

<style scoped>
.prd-manager {
  padding: 20px;
}

.prd-list {
  margin-bottom: 20px;
}

.prd-col {
  margin-bottom: 20px;
}

.prd-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.prd-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.prd-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.prd-info {
  flex: 1;
}

.prd-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prd-description {
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

.prd-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.prd-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.prd-preview {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-text {
  font-size: 14px;
  color: #7f8c8d;
}

.preview-content {
  line-height: 1.6;
}

.markdown-content {
  color: #2c3e50;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  color: #2c3e50;
  margin-top: 24px;
  margin-bottom: 16px;
}

.markdown-content p {
  margin-bottom: 16px;
}

.markdown-content ul,
.markdown-content ol {
  margin-bottom: 16px;
  padding-left: 24px;
}

.markdown-content li {
  margin-bottom: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
