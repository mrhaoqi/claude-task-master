<!-- 遗留API适配器组件 - 适配原有系统的API格式 -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { httpClient } from '@/api'
import type { ApiResponse } from '@/types'

// Props定义
interface Props {
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: Record<string, any>
  data?: any
  immediate?: boolean
  transform?: (data: any) => any
  errorHandler?: (error: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  method: 'GET',
  params: () => ({}),
  immediate: true
})

// Emits定义
interface Emits {
  'success': [data: any]
  'error': [error: any]
  'loading': [loading: boolean]
}

const emit = defineEmits<Emits>()

// 响应式状态
const loading = ref(false)
const data = ref<any>(null)
const error = ref<string | null>(null)

// 计算属性
const hasData = computed(() => data.value !== null)
const hasError = computed(() => error.value !== null)

// 适配器方法 - 将新API格式转换为旧格式
const adaptRequest = (endpoint: string, method: string, params: any, requestData: any) => {
  // 这里可以根据实际需要转换请求格式
  const adaptedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`
  
  // 转换参数格式（如果需要）
  const adaptedParams = { ...params }
  
  // 转换请求体格式（如果需要）
  const adaptedData = requestData ? { ...requestData } : undefined
  
  return {
    endpoint: adaptedEndpoint,
    params: adaptedParams,
    data: adaptedData
  }
}

// 适配器方法 - 将旧API响应转换为新格式
const adaptResponse = (response: any) => {
  // 如果响应已经是标准格式，直接返回
  if (response && typeof response === 'object' && 'success' in response) {
    return response as ApiResponse
  }
  
  // 适配旧格式响应
  if (response && typeof response === 'object') {
    // 假设旧格式可能是 { code: 0, data: {...}, message: 'success' }
    if ('code' in response) {
      return {
        success: response.code === 0,
        data: response.data || response,
        message: response.message || '',
        code: response.code
      } as ApiResponse
    }
    
    // 或者直接是数据对象
    return {
      success: true,
      data: response,
      message: 'success',
      code: 200
    } as ApiResponse
  }
  
  // 其他情况
  return {
    success: true,
    data: response,
    message: 'success',
    code: 200
  } as ApiResponse
}

// 执行API请求
const execute = async (customParams?: Record<string, any>, customData?: any) => {
  try {
    loading.value = true
    error.value = null
    emit('loading', true)
    
    const { endpoint, params, data: requestData } = adaptRequest(
      props.endpoint,
      props.method,
      { ...props.params, ...customParams },
      customData || props.data
    )
    
    let response: any
    
    switch (props.method) {
      case 'GET':
        response = await httpClient.get(endpoint, { params })
        break
      case 'POST':
        response = await httpClient.post(endpoint, requestData, { params })
        break
      case 'PUT':
        response = await httpClient.put(endpoint, requestData, { params })
        break
      case 'DELETE':
        response = await httpClient.delete(endpoint, { params })
        break
      case 'PATCH':
        response = await httpClient.patch(endpoint, requestData, { params })
        break
      default:
        throw new Error(`Unsupported method: ${props.method}`)
    }
    
    // 适配响应格式
    const adaptedResponse = adaptResponse(response)
    
    if (adaptedResponse.success) {
      let resultData = adaptedResponse.data
      
      // 应用数据转换函数
      if (props.transform) {
        resultData = props.transform(resultData)
      }
      
      data.value = resultData
      emit('success', resultData)
    } else {
      throw new Error(adaptedResponse.message || 'API request failed')
    }
    
  } catch (err: any) {
    const errorMessage = err.message || 'Request failed'
    error.value = errorMessage
    
    // 调用错误处理器
    if (props.errorHandler) {
      props.errorHandler(err)
    }
    
    emit('error', err)
  } finally {
    loading.value = false
    emit('loading', false)
  }
}

// 刷新数据
const refresh = () => execute()

// 重置状态
const reset = () => {
  data.value = null
  error.value = null
  loading.value = false
}

// 监听参数变化
watch(
  () => [props.endpoint, props.params, props.data],
  () => {
    if (props.immediate) {
      execute()
    }
  },
  { deep: true }
)

// 组件挂载时执行
onMounted(() => {
  if (props.immediate) {
    execute()
  }
})

// 暴露方法和状态
defineExpose({
  execute,
  refresh,
  reset,
  loading,
  data,
  error,
  hasData,
  hasError
})
</script>

<template>
  <div class="legacy-api-adapter">
    <!-- 加载状态 -->
    <div v-if="loading" class="adapter-loading">
      <slot name="loading">
        <el-loading />
      </slot>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="adapter-error">
      <slot name="error" :error="error" :retry="execute">
        <el-alert
          :title="error"
          type="error"
          show-icon
          :closable="false"
        >
          <template #default>
            <p>{{ error }}</p>
            <el-button size="small" type="primary" @click="execute">
              重试
            </el-button>
          </template>
        </el-alert>
      </slot>
    </div>
    
    <!-- 成功状态 -->
    <div v-else-if="hasData" class="adapter-success">
      <slot :data="data" :loading="loading" :error="error" :refresh="refresh" />
    </div>
    
    <!-- 空状态 -->
    <div v-else class="adapter-empty">
      <slot name="empty">
        <el-empty description="暂无数据" />
      </slot>
    </div>
  </div>
</template>

<style scoped>
.legacy-api-adapter {
  width: 100%;
}

.adapter-loading,
.adapter-error,
.adapter-success,
.adapter-empty {
  width: 100%;
}

.adapter-error {
  margin: 20px 0;
}

.adapter-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.adapter-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
