// 最简单的JavaScript版本测试
import { createApp } from 'vue'

const app = createApp({
  data() {
    return {
      message: 'Hello Vue3!',
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  },
  template: `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: #2c3e50;">{{ message }}</h1>
      <p>计数: {{ count }}</p>
      <button @click="increment" style="padding: 8px 16px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: pointer;">
        点击增加
      </button>
    </div>
  `
})

app.mount('#app')
