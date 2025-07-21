<!-- PRD文档查看器组件 -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

// Props定义
interface Props {
  projectId: string | number
  prdId?: string | number
  content?: string
  format?: 'markdown' | 'text' | 'html'
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  format: 'markdown',
  editable: false
})

// Emits定义
interface Emits {
  'content-change': [content: string]
  'save': [content: string]
  'generate-tasks': [prdId: string | number]
}

const emit = defineEmits<Emits>()

// 组件状态
const loading = ref(false)
const editing = ref(false)
const prdContent = ref('')
const editContent = ref('')

// PRD元数据
const prdMeta = ref({
  title: '',
  version: '',
  author: '',
  createTime: '',
  updateTime: '',
  status: 'draft'
})

// 计算属性
const isMarkdown = computed(() => props.format === 'markdown')
const hasContent = computed(() => prdContent.value.trim().length > 0)

// 获取PRD内容
const fetchPrdContent = async () => {
  if (!props.prdId) {
    prdContent.value = props.content || ''
    return
  }
  
  try {
    loading.value = true
    
    // 模拟API调用
    const response = await fetch(`http://localhost:3000/api/projects/${props.projectId}/prd/${props.prdId}`)
    const data = await response.json()
    
    if (data.success) {
      prdContent.value = data.data.content || ''
      prdMeta.value = {
        title: data.data.title || 'PRD文档',
        version: data.data.version || '1.0',
        author: data.data.author || '未知',
        createTime: data.data.createTime || new Date().toISOString(),
        updateTime: data.data.updateTime || new Date().toISOString(),
        status: data.data.status || 'draft'
      }
    } else {
      ElMessage.error('获取PRD内容失败')
    }
  } catch (error) {
    console.error('Fetch PRD error:', error)
    ElMessage.error('获取PRD内容失败')
  } finally {
    loading.value = false
  }
}

// 开始编辑
const startEdit = () => {
  editContent.value = prdContent.value
  editing.value = true
}

// 取消编辑
const cancelEdit = () => {
  editing.value = false
  editContent.value = ''
}

// 保存编辑
const saveEdit = async () => {
  try {
    loading.value = true
    
    // 模拟保存API调用
    const response = await fetch(`http://localhost:3000/api/projects/${props.projectId}/prd/${props.prdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: editContent.value
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      prdContent.value = editContent.value
      editing.value = false
      ElMessage.success('PRD内容保存成功')
      emit('save', editContent.value)
    } else {
      ElMessage.error('保存PRD内容失败')
    }
  } catch (error) {
    console.error('Save PRD error:', error)
    ElMessage.error('保存PRD内容失败')
  } finally {
    loading.value = false
  }
}

// 生成任务
const generateTasks = () => {
  if (!props.prdId) {
    ElMessage.warning('请先保存PRD文档')
    return
  }
  
  emit('generate-tasks', props.prdId)
}

// 渲染markdown（简单实现，实际项目中建议使用专业的markdown库）
const renderMarkdown = (content: string) => {
  return content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    .replace(/^(.*)$/gim, '<p>$1</p>')
}

// 监听props变化
watch(() => props.content, (newContent) => {
  if (newContent !== undefined) {
    prdContent.value = newContent
  }
})

watch(() => props.prdId, () => {
  if (props.prdId) {
    fetchPrdContent()
  }
})

// 组件挂载时获取内容
onMounted(() => {
  if (props.prdId) {
    fetchPrdContent()
  } else if (props.content) {
    prdContent.value = props.content
  }
})
</script>

<template>
  <div class="prd-viewer" v-loading="loading">
    <!-- PRD头部信息 -->
    <div class="prd-header" v-if="prdId">
      <div class="prd-meta">
        <h2 class="prd-title">{{ prdMeta.title }}</h2>
        <div class="meta-info">
          <span class="meta-item">版本: {{ prdMeta.version }}</span>
          <span class="meta-item">作者: {{ prdMeta.author }}</span>
          <span class="meta-item">更新时间: {{ new Date(prdMeta.updateTime).toLocaleDateString() }}</span>
          <el-tag :type="prdMeta.status === 'published' ? 'success' : 'warning'" size="small">
            {{ prdMeta.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </div>
      </div>
      
      <div class="prd-actions">
        <el-button v-if="!editing && editable" @click="startEdit">编辑</el-button>
        <el-button type="primary" @click="generateTasks">生成任务</el-button>
      </div>
    </div>

    <!-- PRD内容区域 -->
    <div class="prd-content">
      <!-- 编辑模式 -->
      <div v-if="editing" class="edit-mode">
        <el-input
          v-model="editContent"
          type="textarea"
          :rows="20"
          placeholder="请输入PRD内容..."
          class="edit-textarea"
        />
        
        <div class="edit-actions">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveEdit" :loading="loading">保存</el-button>
        </div>
      </div>
      
      <!-- 查看模式 -->
      <div v-else class="view-mode">
        <!-- Markdown渲染 -->
        <div 
          v-if="isMarkdown && hasContent" 
          class="markdown-content"
          v-html="renderMarkdown(prdContent)"
        />
        
        <!-- 纯文本显示 -->
        <div 
          v-else-if="hasContent" 
          class="text-content"
        >
          <pre>{{ prdContent }}</pre>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-content">
          <el-empty description="暂无PRD内容">
            <el-button v-if="editable" type="primary" @click="startEdit">
              开始编写PRD
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prd-viewer {
  width: 100%;
  background: var(--theme-bg-primary);
  border-radius: var(--theme-radius-base);
  overflow: hidden;
}

.prd-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--theme-spacing-lg);
  border-bottom: 1px solid var(--theme-border-light);
  background: var(--theme-bg-secondary);
}

.prd-meta {
  flex: 1;
}

.prd-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 var(--theme-spacing-sm) 0;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-md);
  flex-wrap: wrap;
}

.meta-item {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.prd-actions {
  display: flex;
  gap: var(--theme-spacing-sm);
}

.prd-content {
  padding: var(--theme-spacing-lg);
}

.edit-mode {
  width: 100%;
}

.edit-textarea {
  margin-bottom: var(--theme-spacing-lg);
}

.edit-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--theme-spacing-sm);
}

.view-mode {
  width: 100%;
}

.markdown-content {
  line-height: 1.8;
  color: var(--theme-text-primary);
}

.markdown-content :deep(h1) {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 var(--theme-spacing-lg) 0;
  color: var(--theme-text-primary);
  border-bottom: 2px solid var(--theme-primary);
  padding-bottom: var(--theme-spacing-sm);
}

.markdown-content :deep(h2) {
  font-size: 24px;
  font-weight: 600;
  margin: var(--theme-spacing-xl) 0 var(--theme-spacing-lg) 0;
  color: var(--theme-text-primary);
}

.markdown-content :deep(h3) {
  font-size: 20px;
  font-weight: 500;
  margin: var(--theme-spacing-lg) 0 var(--theme-spacing-md) 0;
  color: var(--theme-text-primary);
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--theme-text-primary);
}

.markdown-content :deep(em) {
  font-style: italic;
  color: var(--theme-text-secondary);
}

.text-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: var(--theme-text-primary);
  background: var(--theme-bg-tertiary);
  padding: var(--theme-spacing-lg);
  border-radius: var(--theme-radius-base);
  overflow-x: auto;
}

.text-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.empty-content {
  text-align: center;
  padding: var(--theme-spacing-xl) 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .prd-header {
    flex-direction: column;
    gap: var(--theme-spacing-md);
  }
  
  .prd-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .meta-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--theme-spacing-xs);
  }
  
  .prd-content {
    padding: var(--theme-spacing-md);
  }
  
  .edit-actions {
    flex-direction: column;
  }
  
  .edit-actions .el-button {
    width: 100%;
  }
}
</style>
