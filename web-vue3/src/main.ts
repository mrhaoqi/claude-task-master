// 导入样式
import 'element-plus/dist/index.css'
import './styles/global.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Element Plus 全局配置
const elementPlusConfig = {
  // 全局组件大小
  size: 'default' as const,
  // 全局 z-index 起始值
  zIndex: 2000,
  // 国际化配置
  locale: zhCn,
  // 按钮相关配置
  button: {
    autoInsertSpace: true
  },
  // 消息相关配置
  message: {
    max: 5
  }
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, elementPlusConfig)

app.mount('#app')
