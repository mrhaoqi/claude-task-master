<!-- 基础表单组件 - 使用装饰器模式增强Element Plus表单 -->
<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch } from 'vue'
import type { FormRules } from 'element-plus'

// 表单项配置接口
export interface FormItemConfig {
  key: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'datetime' | 'number' | 'switch' | 'upload' | 'custom'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  options?: Array<{ label: string; value: any; disabled?: boolean }>
  rules?: any[]
  props?: Record<string, any>
  span?: number
  offset?: number
  show?: boolean | ((formData: T) => boolean)
}

// Props定义
interface Props {
  modelValue: T
  config: FormItemConfig[]
  rules?: FormRules
  labelWidth?: string
  labelPosition?: 'left' | 'right' | 'top'
  inline?: boolean
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
  validateOnRuleChange?: boolean
  hideRequiredAsterisk?: boolean
  showMessage?: boolean
  inlineMessage?: boolean
  statusIcon?: boolean
  loading?: boolean
  gutter?: number
}

const props = withDefaults(defineProps<Props>(), {
  labelWidth: '100px',
  labelPosition: 'right',
  inline: false,
  size: 'default',
  disabled: false,
  validateOnRuleChange: true,
  hideRequiredAsterisk: false,
  showMessage: true,
  inlineMessage: false,
  statusIcon: false,
  loading: false,
  gutter: 20
})

// Emits定义
interface Emits {
  'update:modelValue': [value: T]
  'validate': [prop: string, isValid: boolean, message: string]
  'submit': [formData: T]
  'reset': []
}

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref()

// 表单数据
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 可见的表单项
const visibleConfig = computed(() => {
  return props.config.filter(item => {
    if (item.show === undefined) return true
    if (typeof item.show === 'boolean') return item.show
    return item.show(formData.value)
  })
})

// 合并的规则
const mergedRules = computed(() => {
  const configRules: FormRules = {}
  
  props.config.forEach(item => {
    if (item.rules) {
      configRules[item.key] = item.rules
    } else if (item.required) {
      configRules[item.key] = [
        { required: true, message: `请输入${item.label}`, trigger: 'blur' }
      ]
    }
  })
  
  return { ...configRules, ...props.rules }
})

// 更新表单项值
const updateValue = (key: string, value: any) => {
  const newData = { ...formData.value, [key]: value }
  emit('update:modelValue', newData)
}

// 验证表单
const validate = async (): Promise<boolean> => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

// 验证指定字段
const validateField = async (props: string | string[]): Promise<boolean> => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validateField(props)
    return true
  } catch (error) {
    return false
  }
}

// 重置表单
const resetFields = () => {
  formRef.value?.resetFields()
  emit('reset')
}

// 清空验证
const clearValidate = (props?: string | string[]) => {
  formRef.value?.clearValidate(props)
}

// 滚动到错误字段
const scrollToField = (prop: string) => {
  formRef.value?.scrollToField(prop)
}

// 提交表单
const handleSubmit = async () => {
  const isValid = await validate()
  if (isValid) {
    emit('submit', formData.value)
  }
}

// 处理验证事件
const handleValidate = (prop: string, isValid: boolean, message: string) => {
  emit('validate', prop, isValid, message)
}

// 暴露方法
defineExpose({
  validate,
  validateField,
  resetFields,
  clearValidate,
  scrollToField,
  formRef
})

// 获取表单项的span值
const getSpan = (item: FormItemConfig): number => {
  return item.span || (props.inline ? undefined : 24) || 24
}

// 获取表单项的offset值
const getOffset = (item: FormItemConfig): number => {
  return item.offset || 0
}
</script>

<template>
  <div class="base-form" v-loading="loading">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="mergedRules"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :inline="inline"
      :size="size"
      :disabled="disabled"
      :validate-on-rule-change="validateOnRuleChange"
      :hide-required-asterisk="hideRequiredAsterisk"
      :show-message="showMessage"
      :inline-message="inlineMessage"
      :status-icon="statusIcon"
      @validate="handleValidate"
      @submit.prevent="handleSubmit"
    >
      <el-row :gutter="gutter">
        <el-col
          v-for="item in visibleConfig"
          :key="item.key"
          :span="getSpan(item)"
          :offset="getOffset(item)"
        >
          <el-form-item
            :prop="item.key"
            :label="item.label"
            :required="item.required"
          >
            <!-- 输入框 -->
            <el-input
              v-if="item.type === 'input'"
              :model-value="formData[item.key]"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              :readonly="item.readonly"
              v-bind="item.props"
              @update:model-value="updateValue(item.key, $event)"
            />

            <!-- 文本域 -->
            <el-input
              v-else-if="item.type === 'textarea'"
              :model-value="formData[item.key]"
              type="textarea"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              :readonly="item.readonly"
              v-bind="item.props"
              @update:model-value="updateValue(item.key, $event)"
            />

            <!-- 选择器 -->
            <el-select
              v-else-if="item.type === 'select'"
              :model-value="formData[item.key]"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              v-bind="item.props"
              @update:model-value="updateValue(item.key, $event)"
            >
              <el-option
                v-for="option in item.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
                :disabled="option.disabled"
              />
            </el-select>

            <!-- 单选框组 -->
            <el-radio-group
              v-else-if="item.type === 'radio'"
              :model-value="formData[item.key]"
              :disabled="item.disabled"
              v-bind="item.props"
              @update:model-value="updateValue(item.key, $event)"
            >
              <el-radio
                v-for="option in item.options"
                :key="option.value"
                :label="option.value"
                :disabled="option.disabled"
              >
                {{ option.label }}
              </el-radio>
            </el-radio-group>

            <!-- 复选框组 -->
            <el-checkbox-group
              v-else-if="item.type === 'checkbox'"
              :model-value="formData[item.key]"
              :disabled="item.disabled"
              v-bind="item.props"
              @update:model-value="updateValue(item.key, $event)"
            >
              <el-checkbox
                v-for="option in item.options"
                :key="option.value"
                :label="option.value"
                :disabled="option.disabled"
              >
                {{ option.label }}
              </el-checkbox>
            </el-checkbox-group>

            <!-- 日期选择器 -->
            <el-date-picker
              v-else-if="item.type === 'date'"
              :model-value="formData[item.key]"
              type="date"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              v-bind="item.props"
              @update:model-value="updateValue(item.key, $event)"
            />

            <!-- 日期时间选择器 -->
            <el-date-picker
              v-else-if="item.type === 'datetime'"
              :model-value="formData[item.key]"
              type="datetime"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              v-bind="item.props"
              @update:model-value="updateValue(item.key, $event)"
            />

            <!-- 数字输入框 -->
            <el-input-number
              v-else-if="item.type === 'number'"
              :model-value="formData[item.key]"
              :disabled="item.disabled"
              v-bind="item.props"
              @update:model-value="updateValue(item.key, $event)"
            />

            <!-- 开关 -->
            <el-switch
              v-else-if="item.type === 'switch'"
              :model-value="formData[item.key]"
              :disabled="item.disabled"
              v-bind="item.props"
              @update:model-value="updateValue(item.key, $event)"
            />

            <!-- 自定义插槽 -->
            <slot
              v-else-if="item.type === 'custom'"
              :name="item.key"
              :item="item"
              :value="formData[item.key]"
              :update-value="(value: any) => updateValue(item.key, value)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 表单按钮插槽 -->
      <slot name="actions" :validate="validate" :reset="resetFields" />
    </el-form>
  </div>
</template>

<style scoped>
.base-form {
  width: 100%;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #2c3e50;
}

:deep(.el-input__wrapper) {
  border-radius: 3px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 3px;
}

:deep(.el-textarea__inner) {
  border-radius: 3px;
}

:deep(.el-date-editor.el-input) {
  border-radius: 3px;
}
</style>
