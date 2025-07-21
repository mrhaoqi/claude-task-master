<!-- 项目表单组件 - 基于BaseForm -->
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { BaseForm } from '@/components'
import type { FormItemConfig } from '@/components/base/BaseForm.vue'
import type { CreateProjectRequest, Project } from '@/types'
import { PROJECT_STATUS_OPTIONS } from '@/constants'

// Props定义
interface Props {
  modelValue?: Project | null
  mode?: 'create' | 'edit'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  mode: 'create',
  loading: false
})

// Emits定义
interface Emits {
  'update:modelValue': [value: CreateProjectRequest]
  'submit': [data: CreateProjectRequest]
  'cancel': []
}

const emit = defineEmits<Emits>()

// 表单数据
const formData = reactive<CreateProjectRequest>({
  name: '',
  description: '',
  status: 'pending'
})

// 表单引用
const formRef = ref()

// 监听props变化，初始化表单数据
const initFormData = () => {
  if (props.modelValue && props.mode === 'edit') {
    Object.assign(formData, {
      name: props.modelValue.name,
      description: props.modelValue.description,
      status: props.modelValue.status
    })
  } else {
    Object.assign(formData, {
      name: '',
      description: '',
      status: 'pending'
    })
  }
}

// 初始化表单数据
initFormData()

// 表单配置
const formConfig = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: '项目名称',
    type: 'input',
    placeholder: '请输入项目名称',
    required: true,
    rules: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    props: {
      clearable: true,
      maxlength: 50,
      showWordLimit: true
    }
  },
  {
    key: 'description',
    label: '项目描述',
    type: 'textarea',
    placeholder: '请输入项目描述（可选）',
    required: false,
    props: {
      rows: 4,
      maxlength: 500,
      showWordLimit: true,
      clearable: true
    }
  },
  {
    key: 'status',
    label: '初始状态',
    type: 'select',
    placeholder: '请选择项目状态',
    required: true,
    options: PROJECT_STATUS_OPTIONS.map(option => ({
      label: option.label,
      value: option.value
    })),
    show: props.mode === 'create' // 只在创建时显示
  }
])

// 表单验证规则
const formRules = computed(() => ({
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}))

// 计算标题
const title = computed(() => {
  return props.mode === 'create' ? '新建项目' : '编辑项目'
})

// 提交表单
const handleSubmit = async () => {
  const isValid = await formRef.value?.validate()
  if (isValid) {
    emit('update:modelValue', { ...formData })
    emit('submit', { ...formData })
  }
}

// 取消操作
const handleCancel = () => {
  emit('cancel')
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
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
  <div class="project-form">
    <BaseForm
      ref="formRef"
      v-model="formData"
      :config="formConfig"
      :rules="formRules"
      :loading="loading"
      label-width="100px"
      @submit="handleSubmit"
    >
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
            {{ mode === 'create' ? '创建' : '保存' }}
          </el-button>
        </div>
      </template>
    </BaseForm>
  </div>
</template>

<style scoped>
.project-form {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e8edee;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}
</style>
