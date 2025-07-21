<!-- 任务生成页面 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// 路由相关
const route = useRoute()
const router = useRouter()

// 组件状态
const loading = ref(false)
const generating = ref(false)
const progress = ref(0)
const currentStep = ref(0)

// 参数
const prdId = computed(() => route.query.prdId as string)
const projectId = computed(() => route.query.projectId as string)

// PRD信息
const prdInfo = ref({
  title: '',
  content: '',
  projectName: ''
})

// 生成配置
const generateConfig = ref({
  useAI: true,
  aiProvider: 'deepseek',
  generateSubtasks: true,
  assignDefaultUser: true,
  defaultAssignee: '产品经理',
  priority: 'medium',
  estimatedDays: 7
})

// 生成步骤
const steps = [
  { title: '解析PRD文档', description: '分析PRD内容结构' },
  { title: '提取任务信息', description: '识别功能模块和需求' },
  { title: '生成任务列表', description: '创建主任务和子任务' },
  { title: '设置任务属性', description: '分配优先级和负责人' },
  { title: '保存到项目', description: '将任务添加到项目中' }
]

// 生成的任务预览
const generatedTasks = ref([])

// 获取PRD信息
const fetchPrdInfo = async () => {
  try {
    loading.value = true
    
    // 模拟API调用
    const response = await fetch(`http://localhost:3000/api/projects/${projectId.value}/prd/${prdId.value}`)
    const data = await response.json()
    
    if (data.success) {
      prdInfo.value = {
        title: data.data.title || 'PRD文档',
        content: data.data.content || '',
        projectName: data.data.projectName || '未知项目'
      }
    }
  } catch (error) {
    console.error('Fetch PRD error:', error)
    ElMessage.error('获取PRD信息失败')
  } finally {
    loading.value = false
  }
}

// 开始生成任务
const startGenerate = async () => {
  try {
    generating.value = true
    progress.value = 0
    currentStep.value = 0
    
    // 模拟生成过程
    for (let i = 0; i < steps.length; i++) {
      currentStep.value = i
      
      // 模拟每个步骤的处理时间
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      progress.value = Math.round(((i + 1) / steps.length) * 100)
      
      // 模拟生成任务数据
      if (i === steps.length - 1) {
        generatedTasks.value = [
          {
            id: '1',
            title: '用户注册功能',
            description: '实现用户注册、邮箱验证等功能',
            priority: 'high',
            estimatedDays: 3,
            subtasks: [
              { title: '设计注册页面UI', estimatedDays: 1 },
              { title: '实现注册API', estimatedDays: 1 },
              { title: '邮箱验证功能', estimatedDays: 1 }
            ]
          },
          {
            id: '2',
            title: '用户登录功能',
            description: '实现用户登录、密码重置等功能',
            priority: 'high',
            estimatedDays: 2,
            subtasks: [
              { title: '设计登录页面UI', estimatedDays: 1 },
              { title: '实现登录API', estimatedDays: 1 }
            ]
          },
          {
            id: '3',
            title: '用户资料管理',
            description: '用户可以查看和编辑个人资料',
            priority: 'medium',
            estimatedDays: 2,
            subtasks: [
              { title: '个人资料页面', estimatedDays: 1 },
              { title: '资料编辑功能', estimatedDays: 1 }
            ]
          }
        ]
      }
    }
    
    ElMessage.success('任务生成完成')
  } catch (error) {
    console.error('Generate error:', error)
    ElMessage.error('任务生成失败')
  } finally {
    generating.value = false
  }
}

// 保存任务到项目
const saveTasks = async () => {
  try {
    loading.value = true
    
    // 模拟保存API调用
    const response = await fetch(`http://localhost:3000/api/projects/${projectId.value}/tasks/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tasks: generatedTasks.value,
        config: generateConfig.value
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      ElMessage.success('任务保存成功')
      router.push(`/tasks?projectId=${projectId.value}`)
    } else {
      ElMessage.error('任务保存失败')
    }
  } catch (error) {
    console.error('Save tasks error:', error)
    ElMessage.error('任务保存失败')
  } finally {
    loading.value = false
  }
}

// 返回PRD页面
const goBack = () => {
  router.push('/prd')
}

// 获取优先级类型
const getPriorityType = (priority: string) => {
  switch (priority) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'info'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return '高'
    case 'medium': return '中'
    case 'low': return '低'
    default: return '未知'
  }
}

// 组件挂载时获取数据
onMounted(() => {
  if (!prdId.value || !projectId.value) {
    ElMessage.error('缺少必要参数')
    router.push('/prd')
    return
  }
  
  fetchPrdInfo()
})
</script>

<template>
  <div class="task-generate-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">从PRD生成任务</h1>
        <p class="page-description">基于PRD文档内容自动生成项目任务</p>
      </div>
      
      <div class="header-actions">
        <el-button :icon="ArrowLeft" @click="goBack">
          返回PRD管理
        </el-button>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- PRD信息卡片 -->
      <el-card class="prd-info-card" v-loading="loading">
        <template #header>
          <div class="card-header">
            <span>PRD文档信息</span>
          </div>
        </template>
        
        <div class="prd-info">
          <div class="info-item">
            <span class="label">文档标题:</span>
            <span class="value">{{ prdInfo.title }}</span>
          </div>
          <div class="info-item">
            <span class="label">所属项目:</span>
            <span class="value">{{ prdInfo.projectName }}</span>
          </div>
          <div class="info-item">
            <span class="label">内容长度:</span>
            <span class="value">{{ prdInfo.content.length }} 字符</span>
          </div>
        </div>
      </el-card>

      <!-- 生成配置 -->
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>生成配置</span>
          </div>
        </template>
        
        <el-form :model="generateConfig" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="使用AI生成">
                <el-switch v-model="generateConfig.useAI" />
              </el-form-item>
              
              <el-form-item label="AI服务商" v-if="generateConfig.useAI">
                <el-select v-model="generateConfig.aiProvider">
                  <el-option label="DeepSeek" value="deepseek" />
                  <el-option label="OpenAI" value="openai" />
                  <el-option label="Claude" value="claude" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="生成子任务">
                <el-switch v-model="generateConfig.generateSubtasks" />
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="默认负责人">
                <el-input v-model="generateConfig.defaultAssignee" />
              </el-form-item>
              
              <el-form-item label="默认优先级">
                <el-select v-model="generateConfig.priority">
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="预估工期(天)">
                <el-input-number v-model="generateConfig.estimatedDays" :min="1" :max="30" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 生成进度 -->
      <el-card v-if="generating" class="progress-card">
        <template #header>
          <div class="card-header">
            <span>生成进度</span>
            <span class="progress-text">{{ progress }}%</span>
          </div>
        </template>
        
        <div class="progress-content">
          <el-progress :percentage="progress" :stroke-width="12" />
          
          <div class="steps-progress">
            <el-steps :active="currentStep" align-center>
              <el-step
                v-for="(step, index) in steps"
                :key="index"
                :title="step.title"
                :description="step.description"
              />
            </el-steps>
          </div>
        </div>
      </el-card>

      <!-- 生成结果 -->
      <el-card v-if="generatedTasks.length > 0" class="result-card">
        <template #header>
          <div class="card-header">
            <span>生成的任务 ({{ generatedTasks.length }})</span>
            <el-button type="primary" @click="saveTasks" :loading="loading">
              保存到项目
            </el-button>
          </div>
        </template>
        
        <div class="tasks-preview">
          <div
            v-for="task in generatedTasks"
            :key="task.id"
            class="task-item"
          >
            <div class="task-header">
              <h4 class="task-title">{{ task.title }}</h4>
              <div class="task-meta">
                <el-tag :type="getPriorityType(task.priority)" size="small">
                  {{ getPriorityText(task.priority) }}
                </el-tag>
                <span class="estimated-days">{{ task.estimatedDays }}天</span>
              </div>
            </div>
            
            <p class="task-description">{{ task.description }}</p>
            
            <div v-if="task.subtasks && task.subtasks.length > 0" class="subtasks">
              <h5>子任务:</h5>
              <ul>
                <li v-for="subtask in task.subtasks" :key="subtask.title">
                  {{ subtask.title }} ({{ subtask.estimatedDays }}天)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button @click="goBack">取消</el-button>
        <el-button 
          type="primary" 
          @click="startGenerate"
          :loading="generating"
          :disabled="!prdInfo.content"
        >
          {{ generating ? '生成中...' : '开始生成任务' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-generate-view {
  padding: var(--theme-spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
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
  display: flex;
  flex-direction: column;
  gap: var(--theme-spacing-lg);
}

.prd-info-card,
.config-card,
.progress-card,
.result-card {
  width: 100%;
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

.prd-info {
  display: flex;
  flex-direction: column;
  gap: var(--theme-spacing-md);
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: var(--theme-text-secondary);
  width: 100px;
}

.info-item .value {
  color: var(--theme-text-primary);
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: var(--theme-spacing-xl);
}

.steps-progress {
  margin-top: var(--theme-spacing-lg);
}

.tasks-preview {
  display: flex;
  flex-direction: column;
  gap: var(--theme-spacing-lg);
}

.task-item {
  padding: var(--theme-spacing-lg);
  border: 1px solid var(--theme-border-light);
  border-radius: var(--theme-radius-base);
  background: var(--theme-bg-tertiary);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--theme-spacing-sm);
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-sm);
}

.estimated-days {
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.task-description {
  font-size: 14px;
  color: var(--theme-text-secondary);
  line-height: 1.5;
  margin: 0 0 var(--theme-spacing-md) 0;
}

.subtasks h5 {
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-text-primary);
  margin: 0 0 var(--theme-spacing-xs) 0;
}

.subtasks ul {
  margin: 0;
  padding-left: var(--theme-spacing-lg);
}

.subtasks li {
  font-size: 13px;
  color: var(--theme-text-secondary);
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: var(--theme-spacing-md);
  padding-top: var(--theme-spacing-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-generate-view {
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
  
  .task-header {
    flex-direction: column;
    gap: var(--theme-spacing-sm);
    align-items: flex-start;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
