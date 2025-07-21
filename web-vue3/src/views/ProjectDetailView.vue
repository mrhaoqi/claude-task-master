<!-- 项目详情页面 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ProjectDetail } from '@/components/project'
import { ArrowLeft } from '@element-plus/icons-vue'

// 路由相关
const route = useRoute()
const router = useRouter()

// 从路由参数获取项目ID
const projectId = computed(() => route.params.id as string)

// 返回项目中心
const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="project-detail-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">
        返回项目中心
      </el-button>
    </div>

    <!-- 项目详情组件 -->
    <ProjectDetail :project-id="projectId" />
  </div>
</template>

<style scoped>
.project-detail-view {
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
