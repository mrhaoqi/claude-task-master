<!-- 任务表单组件 - 基于BaseForm -->
<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { BaseForm } from '@/components'
import type { FormItemConfig } from '@/components/base/BaseForm.vue'
import type { CreateTaskRequest, Task, TaskStatus, TaskPriority } from '@/types'
import { useProjectStore } from '@/stores'

// Props定义
interface Props {
  modelValue?: Task | null
  mode?: 'create' | 'edit'
  loading?: boolean
  projectId?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  mode: 'create',
  loading: false
})

// Emits定义
interface Emits {
  'update:modelValue': [value: CreateTaskRequest]
  'submit': [data: CreateTaskRequest]
  'cancel': []
}

const emit = defineEmits<Emits>()

// 使用项目状态管理
const projectStore = useProjectStore()

// 表单数据
const formData = reactive<CreateTaskRequest>({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assignee: '',
  projectId: props.projectId || '',
  dueDate: '',
  tags: []
})

// 表单引用
const formRef = ref()

// 子任务管理
const subtasks = ref<Array<{ title: string; completed: boolean }>>([])
const newSubtask = ref('')

// 标签管理
const availableTags = ref(['前端', '后端', '设计', '测试', '文档', '优化'])
const tagInput = ref('')

// 监听props变化，初始化表单数据
const initFormData = () => {
  if (props.modelValue && props.mode === 'edit') {
    Object.assign(formData, {
      title: props.modelValue.title,
      description: props.modelValue.description,
      status: props.modelValue.status,
      priority: props.modelValue.priority,
      assignee: props.modelValue.assignee,
      projectId: props.modelValue.projectId,
      dueDate: props.modelValue.dueDate,
      tags: props.modelValue.tags || []
    })
  } else {
    Object.assign(formData, {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: '',
      projectId: props.projectId || '',
      dueDate: '',
      tags: []
    })
  }
}

// 初始化表单数据
initFormData()

// 监听projectId变化
watch(() => props.projectId, (newProjectId) => {
  if (newProjectId) {
    formData.projectId = newProjectId
  }
})

// 获取项目列表
const projects = computed(() => projectStore.projects)

// 状态选项
const statusOptions = [
  { label: '待开始', value: 'todo' as TaskStatus },
  { label: '进行中', value: 'in_progress' as TaskStatus },
  { label: '已完成', value: 'completed' as TaskStatus },
  { label: '已取消', value: 'cancelled' as TaskStatus }
]

// 优先级选项
const priorityOptions = [
  { label: '低', value: 'low' as TaskPriority },
  { label: '中', value: 'medium' as TaskPriority },
  { label: '高', value: 'high' as TaskPriority },
  { label: '紧急', value: 'urgent' as TaskPriority }
]

// 表单配置
const formConfig = computed<FormItemConfig[]>(() => [
  {
    key: 'title',
    label: '任务标题',
    type: 'input',
    placeholder: '请输入任务标题',
    required: true,
    rules: [
      { required: true, message: '请输入任务标题', trigger: 'blur' },
      { min: 2, max: 100, message: '任务标题长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    props: {
      clearable: true,
      maxlength: 100,
      showWordLimit: true
    }
  },
  {
    key: 'description',
    label: '任务描述',
    type: 'textarea',
    placeholder: '请输入任务描述（可选）',
    required: false,
    props: {
      rows: 4,
      maxlength: 1000,
      showWordLimit: true,
      clearable: true
    }
  },
  {
    key: 'projectId',
    label: '所属项目',
    type: 'select',
    placeholder: '请选择项目',
    required: true,
    options: projects.value.map(project => ({
      label: project.name,
      value: project.id
    })),
    show: !props.projectId // 如果已指定项目ID，则不显示项目选择
  },
  {
    key: 'status',
    label: '任务状态',
    type: 'select',
    placeholder: '请选择任务状态',
    required: true,
    options: statusOptions.map(option => ({
      label: option.label,
      value: option.value
    }))
  },
  {
    key: 'priority',
    label: '优先级',
    type: 'select',
    placeholder: '请选择优先级',
    required: true,
    options: priorityOptions.map(option => ({
      label: option.label,
      value: option.value
    }))
  },
  {
    key: 'assignee',
    label: '负责人',
    type: 'input',
    placeholder: '请输入负责人',
    required: false,
    props: {
      clearable: true
    }
  },
  {
    key: 'dueDate',
    label: '截止日期',
    type: 'date',
    placeholder: '请选择截止日期',
    required: false,
    props: {
      type: 'date',
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      clearable: true
    }
  }
])

// 表单验证规则
const formRules = computed(() => ({
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 2, max: 100, message: '任务标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  projectId: [
    { required: true, message: '请选择项目', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择任务状态', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}))

// 计算标题
const title = computed(() => {
  return props.mode === 'create' ? '新建任务' : '编辑任务'
})

// 添加子任务
const addSubtask = () => {
  if (newSubtask.value.trim()) {
    subtasks.value.push({
      title: newSubtask.value.trim(),
      completed: false
    })
    newSubtask.value = ''
  }
}

// 删除子任务
const removeSubtask = (index: number) => {
  subtasks.value.splice(index, 1)
}

// 添加标签
const addTag = () => {
  if (tagInput.value.trim() && !formData.tags.includes(tagInput.value.trim())) {
    formData.tags.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

// 删除标签
const removeTag = (tag: string) => {
  const index = formData.tags.indexOf(tag)
  if (index > -1) {
    formData.tags.splice(index, 1)
  }
}

// 选择预设标签
const selectTag = (tag: string) => {
  if (!formData.tags.includes(tag)) {
    formData.tags.push(tag)
  }
}

// 提交表单
const handleSubmit = async () => {
  const isValid = await formRef.value?.validate()
  if (isValid) {
    const submitData = {
      ...formData,
      subtasks: subtasks.value
    }
    emit('update:modelValue', submitData)
    emit('submit', submitData)
  }
}

// 取消操作
const handleCancel = () => {
  emit('cancel')
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  subtasks.value = []
  initFormData()
}

// 验证表单
const validate = () => {
  return formRef.value?.validate()
}

// 暴露方法
defineExpose({
  resetForm,
  validate,
  formData
})
</script>

<template>
  <div class="task-form">
    <BaseForm
      ref="formRef"
      v-model="formData"
      :config="formConfig"
      :rules="formRules"
      :loading="loading"
      label-width="100px"
      @submit="handleSubmit"
    >
      <!-- 标签管理 -->
      <template #after-form>
        <el-form-item label="任务标签">
          <div class="tag-section">
            <!-- 已选标签 -->
            <div class="selected-tags" v-if="formData.tags.length > 0">
              <el-tag
                v-for="tag in formData.tags"
                :key="tag"
                closable
                @close="removeTag(tag)"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ tag }}
              </el-tag>
            </div>
            
            <!-- 标签输入 -->
            <div class="tag-input">
              <el-input
                v-model="tagInput"
                placeholder="输入标签名称"
                size="small"
                style="width: 150px; margin-right: 8px;"
                @keyup.enter="addTag"
              />
              <el-button size="small" @click="addTag">添加</el-button>
            </div>
            
            <!-- 预设标签 -->
            <div class="preset-tags">
              <span class="preset-label">常用标签：</span>
              <el-button
                v-for="tag in availableTags"
                :key="tag"
                size="small"
                type="info"
                plain
                @click="selectTag(tag)"
                :disabled="formData.tags.includes(tag)"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ tag }}
              </el-button>
            </div>
          </div>
        </el-form-item>

        <!-- 子任务管理 -->
        <el-form-item label="子任务">
          <div class="subtask-section">
            <!-- 子任务列表 -->
            <div class="subtask-list" v-if="subtasks.length > 0">
              <div
                v-for="(subtask, index) in subtasks"
                :key="index"
                class="subtask-item"
              >
                <el-checkbox v-model="subtask.completed" />
                <span :class="{ completed: subtask.completed }">{{ subtask.title }}</span>
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click="removeSubtask(index)"
                >
                  删除
                </el-button>
              </div>
            </div>
            
            <!-- 添加子任务 -->
            <div class="add-subtask">
              <el-input
                v-model="newSubtask"
                placeholder="输入子任务标题"
                size="small"
                style="width: 200px; margin-right: 8px;"
                @keyup.enter="addSubtask"
              />
              <el-button size="small" @click="addSubtask">添加子任务</el-button>
            </div>
          </div>
        </el-form-item>
      </template>

      <template #actions="{ validate, reset }">
        <div class="form-actions">
          <el-button @click="handleCancel" :disabled="loading">
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click="handleSubmit" 
            :loading="loading"
          >
            {{ mode === 'create' ? '创建任务' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </BaseForm>
  </div>
</template>

<style scoped>
.task-form {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--theme-border-light);
}

.tag-section {
  width: 100%;
}

.selected-tags {
  margin-bottom: 12px;
}

.tag-input {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.preset-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-right: 8px;
}

.subtask-section {
  width: 100%;
}

.subtask-list {
  margin-bottom: 16px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--theme-border-light);
}

.subtask-item:last-child {
  border-bottom: none;
}

.subtask-item span {
  flex: 1;
  transition: all 0.3s ease;
}

.subtask-item span.completed {
  text-decoration: line-through;
  color: var(--theme-text-tertiary);
}

.add-subtask {
  display: flex;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
  
  .tag-input {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .preset-tags {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .add-subtask {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
