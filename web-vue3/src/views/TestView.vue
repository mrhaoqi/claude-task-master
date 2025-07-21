<!-- 测试页面 - 用于诊断问题 -->
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello Vue3!')
const count = ref(0)

const increment = () => {
  count.value++
}
</script>

<template>
  <div class="test-view">
    <h1>测试页面</h1>
    <p>{{ message }}</p>
    <p>计数: {{ count }}</p>
    <el-button @click="increment">点击增加</el-button>
  </div>
</template>

<style scoped>
.test-view {
  padding: 20px;
}
</style>
