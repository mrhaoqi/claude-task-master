<!-- 任务详情页面 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TaskDetail } from '@/components/task'

// 路由相关
const route = useRoute()
const router = useRouter()

// 从路由参数获取任务ID和项目ID
const taskId = computed(() => route.params.id as string)
const projectId = computed(() => route.query.projectId as string)

// 返回任务列表
const goBack = () => {
  router.push('/tasks')
}
</script>

<template>
  <div class="task-detail-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">
        返回任务列表
      </el-button>
    </div>

    <!-- 任务详情组件 -->
    <TaskDetail 
      :task-id="taskId" 
      :project-id="projectId"
    />
  </div>
</template>

<style scoped>
.task-detail-view {
  min-height: 100vh;
  background: var(--theme-bg-secondary);
}

.page-header {
  padding: var(--theme-spacing-lg);
  background: var(--theme-bg-primary);
  border-bottom: 1px solid var(--theme-border-light);
  box-shadow: var(--theme-shadow-light);
}

@media (max-width: 768px) {
  .page-header {
    padding: var(--theme-spacing-md);
  }
}
</style>
