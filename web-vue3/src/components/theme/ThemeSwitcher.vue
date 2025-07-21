<!-- 主题切换器组件 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useTheme, THEME_COLORS, type ThemeColor, type ThemeMode } from '@/config/theme'
import { Setting } from '@element-plus/icons-vue'

// 使用主题Hook
const { config, isDark, toggleDark, setMode, setPrimaryColor, setBorderRadius, setComponentSize } = useTheme()

// 主题模式选项
const modeOptions = [
  { label: '浅色', value: 'light' as ThemeMode, icon: 'Sunny' },
  { label: '深色', value: 'dark' as ThemeMode, icon: 'Moon' },
  { label: '跟随系统', value: 'auto' as ThemeMode, icon: 'Monitor' }
]

// 主题色彩选项
const colorOptions = Object.keys(THEME_COLORS).map(key => ({
  label: getColorLabel(key as ThemeColor),
  value: key as ThemeColor,
  color: THEME_COLORS[key as ThemeColor].primary
}))

// 边框圆角选项
const radiusOptions = [
  { label: '小', value: 'small' as const },
  { label: '中', value: 'medium' as const },
  { label: '大', value: 'large' as const }
]

// 组件大小选项
const sizeOptions = [
  { label: '小', value: 'small' as const },
  { label: '默认', value: 'default' as const },
  { label: '大', value: 'large' as const }
]

// 获取颜色标签
function getColorLabel(color: ThemeColor): string {
  const labels = {
    blue: '蓝色',
    green: '绿色',
    purple: '紫色',
    orange: '橙色',
    red: '红色'
  }
  return labels[color]
}

// 当前模式图标
const currentModeIcon = computed(() => {
  const option = modeOptions.find(opt => opt.value === config.value.mode)
  return option?.icon || 'Sunny'
})
</script>

<template>
  <div class="theme-switcher">
    <!-- 快速切换按钮 -->
    <div class="quick-actions">
      <el-button
        :icon="currentModeIcon"
        circle
        @click="toggleDark"
        :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
      />
      
      <el-dropdown trigger="click" placement="bottom-end">
        <el-button :icon="Setting" circle title="主题设置" />
        
        <template #dropdown>
          <el-dropdown-menu class="theme-dropdown">
            <!-- 主题模式 -->
            <div class="theme-section">
              <div class="section-title">
                <el-icon><Monitor /></el-icon>
                主题模式
              </div>
              <el-radio-group 
                :model-value="config.mode" 
                @update:model-value="setMode"
                size="small"
              >
                <el-radio-button 
                  v-for="option in modeOptions" 
                  :key="option.value"
                  :value="option.value"
                  :title="option.label"
                >
                  <el-icon>
                    <component :is="option.icon" />
                  </el-icon>
                </el-radio-button>
              </el-radio-group>
            </div>

            <!-- 主题色彩 -->
            <div class="theme-section">
              <div class="section-title">
                <el-icon><Brush /></el-icon>
                主题色彩
              </div>
              <div class="color-options">
                <div
                  v-for="option in colorOptions"
                  :key="option.value"
                  class="color-option"
                  :class="{ active: config.primaryColor === option.value }"
                  @click="setPrimaryColor(option.value)"
                  :title="option.label"
                >
                  <div 
                    class="color-circle" 
                    :style="{ backgroundColor: option.color }"
                  />
                </div>
              </div>
            </div>

            <!-- 边框圆角 -->
            <div class="theme-section">
              <div class="section-title">
                <el-icon><Grid /></el-icon>
                边框圆角
              </div>
              <el-radio-group 
                :model-value="config.borderRadius" 
                @update:model-value="setBorderRadius"
                size="small"
              >
                <el-radio-button 
                  v-for="option in radiusOptions" 
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-radio-button>
              </el-radio-group>
            </div>

            <!-- 组件大小 -->
            <div class="theme-section">
              <div class="section-title">
                <el-icon><Rank /></el-icon>
                组件大小
              </div>
              <el-radio-group 
                :model-value="config.componentSize" 
                @update:model-value="setComponentSize"
                size="small"
              >
                <el-radio-button 
                  v-for="option in sizeOptions" 
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-radio-button>
              </el-radio-group>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
}

.quick-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.theme-dropdown {
  width: 280px;
  padding: 16px;
}

.theme-section {
  margin-bottom: 20px;
}

.theme-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option:hover {
  border-color: var(--el-color-primary);
  transform: scale(1.1);
}

.color-option.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.color-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .theme-dropdown {
    width: 260px;
    padding: 12px;
  }
  
  .theme-section {
    margin-bottom: 16px;
  }
  
  .color-option {
    width: 28px;
    height: 28px;
  }
  
  .color-circle {
    width: 16px;
    height: 16px;
  }
}
</style>
