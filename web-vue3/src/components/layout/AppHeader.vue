<!-- 应用头部组件 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBreakpoints } from '@/config/theme'
import { ThemeSwitcher } from '@/components/theme'
import {
  House,
  InfoFilled,
  Management,
  Menu,
  UserFilled,
  Setting
} from '@element-plus/icons-vue'

// 路由相关
const router = useRouter()
const route = useRoute()

// 响应式断点
const { isMobile } = useBreakpoints()

// 导航菜单 - 项目中心化设计
const menuItems = [
  { path: '/', label: '项目中心', icon: 'House' },
  { path: '/about', label: '关于系统', icon: 'InfoFilled' }
]

// 当前激活的菜单项
const activeMenu = computed(() => {
  return route.path
})

// 导航到指定路径
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="app-header">
    <div class="header-container">
      <!-- Logo 和标题 -->
      <div class="header-left">
        <div class="logo">
          <el-icon size="24" color="var(--theme-primary)">
            <Management />
          </el-icon>
          <span class="logo-text" v-if="!isMobile">任务管理系统</span>
        </div>
      </div>

      <!-- 导航菜单 -->
      <div class="header-center" v-if="!isMobile">
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          :ellipsis="false"
          background-color="transparent"
          text-color="var(--theme-text-primary)"
          active-text-color="var(--theme-primary)"
          @select="navigateTo"
        >
          <el-menu-item 
            v-for="item in menuItems" 
            :key="item.path"
            :index="item.path"
          >
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧操作区 -->
      <div class="header-right">
        <!-- 移动端菜单按钮 -->
        <el-dropdown v-if="isMobile" trigger="click" placement="bottom-end">
          <el-button :icon="Menu" circle />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item 
                v-for="item in menuItems" 
                :key="item.path"
                @click="navigateTo(item.path)"
                :class="{ active: activeMenu === item.path }"
              >
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 主题切换器 -->
        <ThemeSwitcher />

        <!-- 用户菜单 -->
        <el-dropdown trigger="click" placement="bottom-end">
          <el-avatar :size="32" :icon="UserFilled" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <el-icon><User /></el-icon>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item>
                <el-icon><Setting /></el-icon>
                系统设置
              </el-dropdown-item>
              <el-dropdown-item divided>
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-header {
  background: var(--theme-bg-primary);
  border-bottom: 1px solid var(--theme-border-light);
  box-shadow: var(--theme-shadow-light);
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--theme-spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-sm);
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-text-primary);
  cursor: pointer;
  transition: color 0.3s ease;
}

.logo-text {
  white-space: nowrap;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
}

.header-center :deep(.el-menu) {
  border-bottom: none;
}

.header-center :deep(.el-menu-item) {
  border-bottom: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.header-center :deep(.el-menu-item.is-active) {
  border-bottom-color: var(--theme-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-md);
}

/* 移动端下拉菜单项样式 */
:deep(.el-dropdown-menu__item.active) {
  color: var(--theme-primary);
  background-color: var(--theme-primary-lighter);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-container {
    padding: 0 var(--theme-spacing-md);
    height: 56px;
  }
  
  .logo {
    font-size: 16px;
  }
  
  .header-right {
    gap: var(--theme-spacing-sm);
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 var(--theme-spacing-sm);
  }
  
  .header-right {
    gap: var(--theme-spacing-xs);
  }
}
</style>
