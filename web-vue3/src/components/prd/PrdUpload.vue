<!-- PRD文档上传组件 -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadProps, UploadUserFile } from 'element-plus'

// Props定义
interface Props {
  projectId?: string | number
  accept?: string
  maxSize?: number // MB
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.md,.txt,.doc,.docx,.pdf',
  maxSize: 10,
  multiple: false
})

// Emits定义
interface Emits {
  'upload-success': [file: any, response: any]
  'upload-error': [error: any]
  'upload-progress': [progress: number]
}

const emit = defineEmits<Emits>()

// 组件状态
const uploading = ref(false)
const uploadProgress = ref(0)
const fileList = ref<UploadUserFile[]>([])

// 上传URL
const uploadUrl = computed(() => {
  return `http://localhost:3000/api/projects/${props.projectId}/prd/upload`
})

// 文件上传前的检查
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 检查文件大小
  if (rawFile.size / 1024 / 1024 > props.maxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  
  // 检查文件类型
  const allowedTypes = props.accept.split(',').map(type => type.trim())
  const fileExtension = '.' + rawFile.name.split('.').pop()?.toLowerCase()
  
  if (!allowedTypes.includes(fileExtension)) {
    ElMessage.error(`只支持 ${props.accept} 格式的文件`)
    return false
  }
  
  uploading.value = true
  uploadProgress.value = 0
  return true
}

// 上传进度
const onProgress: UploadProps['onProgress'] = (evt) => {
  uploadProgress.value = Math.round(evt.percent || 0)
  emit('upload-progress', uploadProgress.value)
}

// 上传成功
const onSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
  uploading.value = false
  uploadProgress.value = 100
  
  ElMessage.success('PRD文档上传成功')
  emit('upload-success', uploadFile, response)
  
  // 清空文件列表
  fileList.value = []
}

// 上传失败
const onError: UploadProps['onError'] = (error) => {
  uploading.value = false
  uploadProgress.value = 0
  
  console.error('Upload error:', error)
  ElMessage.error('PRD文档上传失败')
  emit('upload-error', error)
  
  // 清空文件列表
  fileList.value = []
}

// 文件移除
const onRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log('File removed:', uploadFile, uploadFiles)
}

// 手动上传
const submitUpload = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }
  
  // 这里可以触发手动上传
  ElMessage.info('开始上传文件...')
}

// 清空文件列表
const clearFiles = () => {
  fileList.value = []
  uploadProgress.value = 0
}
</script>

<template>
  <div class="prd-upload">
    <el-upload
      v-model:file-list="fileList"
      class="upload-area"
      :action="uploadUrl"
      :before-upload="beforeUpload"
      :on-progress="onProgress"
      :on-success="onSuccess"
      :on-error="onError"
      :on-remove="onRemove"
      :multiple="multiple"
      :accept="accept"
      :auto-upload="true"
      :show-file-list="true"
      drag
    >
      <div class="upload-content">
        <el-icon class="upload-icon" size="48">
          <UploadFilled />
        </el-icon>
        <div class="upload-text">
          <p class="upload-title">点击或拖拽文件到此区域上传</p>
          <p class="upload-hint">
            支持 {{ accept }} 格式，文件大小不超过 {{ maxSize }}MB
          </p>
        </div>
      </div>
    </el-upload>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <el-progress 
        :percentage="uploadProgress" 
        :stroke-width="8"
        status="success"
      />
      <p class="progress-text">正在上传... {{ uploadProgress }}%</p>
    </div>

    <!-- 操作按钮 -->
    <div class="upload-actions" v-if="fileList.length > 0 && !uploading">
      <el-button @click="clearFiles">清空列表</el-button>
      <el-button type="primary" @click="submitUpload">开始上传</el-button>
    </div>

    <!-- 上传说明 -->
    <div class="upload-tips">
      <h4>上传说明：</h4>
      <ul>
        <li>支持 Markdown (.md)、文本 (.txt)、Word (.doc/.docx)、PDF (.pdf) 格式</li>
        <li>文件大小限制：{{ maxSize }}MB</li>
        <li>上传后将自动解析文档内容并生成任务</li>
        <li>建议使用 Markdown 格式以获得最佳解析效果</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.prd-upload {
  width: 100%;
}

.upload-area {
  width: 100%;
  margin-bottom: var(--theme-spacing-lg);
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  border: 2px dashed var(--theme-border-base);
  border-radius: var(--theme-radius-lg);
  background: var(--theme-bg-primary);
  transition: all 0.3s ease;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: var(--theme-primary);
  background: var(--theme-bg-tertiary);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--theme-spacing-lg);
}

.upload-icon {
  color: var(--theme-text-tertiary);
  margin-bottom: var(--theme-spacing-md);
}

.upload-text {
  text-align: center;
}

.upload-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--theme-text-primary);
  margin: 0 0 var(--theme-spacing-xs) 0;
}

.upload-hint {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin: 0;
}

.upload-progress {
  margin-bottom: var(--theme-spacing-lg);
  padding: var(--theme-spacing-md);
  background: var(--theme-bg-tertiary);
  border-radius: var(--theme-radius-base);
}

.progress-text {
  text-align: center;
  margin: var(--theme-spacing-sm) 0 0 0;
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--theme-spacing-sm);
  margin-bottom: var(--theme-spacing-lg);
}

.upload-tips {
  padding: var(--theme-spacing-md);
  background: var(--theme-bg-tertiary);
  border-radius: var(--theme-radius-base);
  border-left: 4px solid var(--theme-primary);
}

.upload-tips h4 {
  margin: 0 0 var(--theme-spacing-sm) 0;
  font-size: 14px;
  color: var(--theme-text-primary);
}

.upload-tips ul {
  margin: 0;
  padding-left: var(--theme-spacing-lg);
}

.upload-tips li {
  font-size: 13px;
  color: var(--theme-text-secondary);
  line-height: 1.5;
  margin-bottom: var(--theme-spacing-xs);
}

.upload-tips li:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-area :deep(.el-upload-dragger) {
    height: 150px;
  }
  
  .upload-content {
    padding: var(--theme-spacing-md);
  }
  
  .upload-icon {
    font-size: 36px;
  }
  
  .upload-title {
    font-size: 14px;
  }
  
  .upload-hint {
    font-size: 12px;
  }
  
  .upload-actions {
    flex-direction: column;
  }
  
  .upload-actions .el-button {
    width: 100%;
  }
}
</style>
