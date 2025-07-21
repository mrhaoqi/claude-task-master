<!-- 任务详情组件 -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores'
import type { Task, TaskStatus } from '@/types'
import { ElMessage } from 'element-plus'

// Props定义
interface Props {
  taskId: string | number
  projectId?: string | number
}

const props = defineProps<Props>()

// 使用任务状态管理
const taskStore = useTaskStore()

// 组件状态
const loading = ref(false)
const task = ref<Task | null>(null)
const editMode = ref(false)

// 评论相关
const comments = ref<Array<{
  id: string
  author: string
  content: string
  createTime: string
  avatar?: string
}>>([])
const newComment = ref('')
const commentLoading = ref(false)

// 进度跟踪
const progressHistory = ref<Array<{
  date: string
  progress: number
  note: string
}>>([])

// 获取任务详情
const fetchTaskDetail = async () => {
  try {
    loading.value = true
    task.value = await taskStore.getTask(props.taskId, props.projectId)
    
    // 模拟获取评论数据
    comments.value = [
      {
        id: '1',
        author: '张三',
        content: '任务已开始，预计明天完成基础功能',
        createTime: '2024-01-15 10:30:00'
      },
      {
        id: '2',
        author: '李四',
        content: '需要注意数据验证的部分',
        createTime: '2024-01-15 14:20:00'
      }
    ]
    
    // 模拟进度跟踪数据
    progressHistory.value = [
      { date: '2024-01-15', progress: 0, note: '任务创建' },
      { date: '2024-01-16', progress: 30, note: '开始开发' },
      { date: '2024-01-17', progress: 60, note: '完成基础功能' },
      { date: '2024-01-18', progress: 80, note: '进行测试' }
    ]
  } catch (error) {
    ElMessage.error('获取任务详情失败')
  } finally {
    loading.value = false
  }
}

// 状态相关方法
const getStatusType = (status: string) => {
  switch (status) {
    case 'todo': return 'info'
    case 'in_progress': return 'primary'
    case 'completed': return 'success'
    case 'cancelled': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'todo': return '待开始'
    case 'in_progress': return '进行中'
    case 'completed': return '已完成'
    case 'cancelled': return '已取消'
    default: return '未知'
  }
}

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

// 更新任务状态
const updateTaskStatus = async (newStatus: TaskStatus) => {
  if (!task.value) return
  
  try {
    await taskStore.updateTaskStatus(task.value.id, newStatus, task.value.projectId)
    task.value.status = newStatus
    ElMessage.success('任务状态更新成功')
  } catch (error) {
    ElMessage.error('任务状态更新失败')
  }
}

// 添加评论
const addComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    commentLoading.value = true
    
    // 模拟添加评论
    const comment = {
      id: Date.now().toString(),
      author: '当前用户',
      content: newComment.value.trim(),
      createTime: new Date().toLocaleString()
    }
    
    comments.value.push(comment)
    newComment.value = ''
    ElMessage.success('评论添加成功')
  } catch (error) {
    ElMessage.error('评论添加失败')
  } finally {
    commentLoading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

// 计算进度百分比
const progressPercentage = computed(() => {
  return task.value?.progress || 0
})

// 组件挂载时获取数据
onMounted(() => {
  fetchTaskDetail()
})
</script>

<template>
  <div class="task-detail" v-loading="loading">
    <div v-if="task" class="task-content">
      <!-- 任务头部信息 -->
      <el-card class="task-header">
        <div class="header-content">
          <div class="task-title-section">
            <h2 class="task-title">{{ task.title }}</h2>
            <div class="task-meta">
              <el-tag :type="getStatusType(task.status)" size="small">
                {{ getStatusText(task.status) }}
              </el-tag>
              <el-tag :type="getPriorityType(task.priority)" size="small">
                {{ getPriorityText(task.priority) }}
              </el-tag>
              <span class="meta-item">负责人: {{ task.assignee }}</span>
              <span class="meta-item">截止日期: {{ task.dueDate }}</span>
            </div>
          </div>
          
          <div class="task-actions">
            <el-dropdown @command="updateTaskStatus">
              <el-button type="primary">
                更新状态
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="todo">待开始</el-dropdown-item>
                  <el-dropdown-item command="in_progress">进行中</el-dropdown-item>
                  <el-dropdown-item command="completed">已完成</el-dropdown-item>
                  <el-dropdown-item command="cancelled">已取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <el-button @click="editMode = true">编辑任务</el-button>
          </div>
        </div>
      </el-card>

      <!-- 任务详情内容 -->
      <el-row :gutter="20">
        <!-- 左侧主要内容 -->
        <el-col :span="16">
          <!-- 任务描述 -->
          <el-card title="任务描述" class="content-card">
            <div class="task-description">
              {{ task.description || '暂无描述' }}
            </div>
          </el-card>

          <!-- 进度跟踪 -->
          <el-card title="进度跟踪" class="content-card">
            <div class="progress-section">
              <div class="progress-bar">
                <span class="progress-label">完成进度: {{ progressPercentage }}%</span>
                <el-progress :percentage="progressPercentage" :stroke-width="8" />
              </div>
              
              <div class="progress-history">
                <h4>进度历史</h4>
                <el-timeline>
                  <el-timeline-item
                    v-for="item in progressHistory"
                    :key="item.date"
                    :timestamp="item.date"
                  >
                    <div class="timeline-content">
                      <span class="progress-value">{{ item.progress }}%</span>
                      <span class="progress-note">{{ item.note }}</span>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </el-card>

          <!-- 评论系统 -->
          <el-card title="评论" class="content-card">
            <div class="comment-section">
              <!-- 评论列表 -->
              <div class="comment-list">
                <div
                  v-for="comment in comments"
                  :key="comment.id"
                  class="comment-item"
                >
                  <el-avatar :size="40" :icon="UserFilled" />
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.author }}</span>
                      <span class="comment-time">{{ comment.createTime }}</span>
                    </div>
                    <div class="comment-text">{{ comment.content }}</div>
                  </div>
                </div>
              </div>
              
              <!-- 添加评论 -->
              <div class="add-comment">
                <el-input
                  v-model="newComment"
                  type="textarea"
                  :rows="3"
                  placeholder="添加评论..."
                  maxlength="500"
                  show-word-limit
                />
                <div class="comment-actions">
                  <el-button
                    type="primary"
                    @click="addComment"
                    :loading="commentLoading"
                    :disabled="!newComment.trim()"
                  >
                    发表评论
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧信息面板 -->
        <el-col :span="8">
          <!-- 任务信息 -->
          <el-card title="任务信息" class="info-card">
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">创建时间:</span>
                <span class="info-value">{{ formatDate(task.createTime) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">更新时间:</span>
                <span class="info-value">{{ formatDate(task.updateTime) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">所属项目:</span>
                <span class="info-value">{{ task.project }}</span>
              </div>
            </div>
          </el-card>

          <!-- 任务标签 -->
          <el-card title="标签" class="info-card" v-if="task.tags && task.tags.length > 0">
            <div class="tag-list">
              <el-tag
                v-for="tag in task.tags"
                :key="tag"
                size="small"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="!loading" description="任务不存在或已被删除" />
  </div>
</template>

<style scoped>
.task-detail {
  padding: var(--theme-spacing-lg);
}

.task-header {
  margin-bottom: var(--theme-spacing-lg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.task-title-section {
  flex: 1;
}

.task-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 var(--theme-spacing-sm) 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-md);
  flex-wrap: wrap;
}

.meta-item {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.task-actions {
  display: flex;
  gap: var(--theme-spacing-sm);
}

.content-card,
.info-card {
  margin-bottom: var(--theme-spacing-lg);
}

.task-description {
  font-size: 14px;
  line-height: 1.6;
  color: var(--theme-text-primary);
  white-space: pre-wrap;
}

.progress-section {
  space-y: var(--theme-spacing-lg);
}

.progress-bar {
  margin-bottom: var(--theme-spacing-lg);
}

.progress-label {
  display: block;
  margin-bottom: var(--theme-spacing-sm);
  font-weight: 500;
  color: var(--theme-text-primary);
}

.progress-history h4 {
  margin-bottom: var(--theme-spacing-md);
  color: var(--theme-text-primary);
}

.timeline-content {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-sm);
}

.progress-value {
  font-weight: 600;
  color: var(--theme-primary);
}

.progress-note {
  color: var(--theme-text-secondary);
}

.comment-section {
  space-y: var(--theme-spacing-lg);
}

.comment-list {
  margin-bottom: var(--theme-spacing-lg);
}

.comment-item {
  display: flex;
  gap: var(--theme-spacing-sm);
  margin-bottom: var(--theme-spacing-lg);
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--theme-spacing-xs);
}

.comment-author {
  font-weight: 500;
  color: var(--theme-text-primary);
}

.comment-time {
  font-size: 12px;
  color: var(--theme-text-tertiary);
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--theme-text-secondary);
}

.add-comment {
  border-top: 1px solid var(--theme-border-light);
  padding-top: var(--theme-spacing-lg);
}

.comment-actions {
  margin-top: var(--theme-spacing-sm);
  text-align: right;
}

.info-list {
  space-y: var(--theme-spacing-sm);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--theme-spacing-xs) 0;
}

.info-label {
  font-weight: 500;
  color: var(--theme-text-secondary);
}

.info-value {
  color: var(--theme-text-primary);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-detail {
    padding: var(--theme-spacing-md);
  }
  
  .header-content {
    flex-direction: column;
    gap: var(--theme-spacing-md);
  }
  
  .task-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .task-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--theme-spacing-xs);
  }
}
</style>
