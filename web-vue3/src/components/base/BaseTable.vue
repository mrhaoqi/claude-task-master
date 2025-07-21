<!-- 基础表格组件 - 使用装饰器模式增强Element Plus表格 -->
<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, watch } from 'vue'
import type { TableColumn } from '@/types'

// Props定义
interface Props {
  data: T[]
  columns: TableColumn[]
  loading?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
  selection?: boolean
  sortable?: boolean
  filterable?: boolean
  showHeader?: boolean
  stripe?: boolean
  border?: boolean
  size?: 'large' | 'default' | 'small'
  height?: string | number
  maxHeight?: string | number
  emptyText?: string
  rowKey?: string
  defaultSort?: {
    prop: string
    order: 'ascending' | 'descending'
  }
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selection: false,
  sortable: true,
  filterable: false,
  showHeader: true,
  stripe: false,
  border: true,
  size: 'default',
  emptyText: '暂无数据',
  rowKey: 'id'
})

// Emits定义
interface Emits {
  'selection-change': [selection: T[]]
  'sort-change': [{ column: any; prop: string; order: string }]
  'filter-change': [filters: Record<string, any>]
  'row-click': [row: T, column: any, event: Event]
  'row-dblclick': [row: T, column: any, event: Event]
  'page-change': [page: number]
  'page-size-change': [pageSize: number]
}

const emit = defineEmits<Emits>()

// 表格引用
const tableRef = ref()

// 选中的行
const selectedRows = ref<T[]>([])

// 计算属性
const tableData = computed(() => props.data)
const tableColumns = computed(() => props.columns)

// 处理选择变化
const handleSelectionChange = (selection: T[]) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

// 处理排序变化
const handleSortChange = (sortInfo: { column: any; prop: string; order: string }) => {
  emit('sort-change', sortInfo)
}

// 处理筛选变化
const handleFilterChange = (filters: Record<string, any>) => {
  emit('filter-change', filters)
}

// 处理行点击
const handleRowClick = (row: T, column: any, event: Event) => {
  emit('row-click', row, column, event)
}

// 处理行双击
const handleRowDblclick = (row: T, column: any, event: Event) => {
  emit('row-dblclick', row, column, event)
}

// 处理分页变化
const handlePageChange = (page: number) => {
  emit('page-change', page)
}

const handlePageSizeChange = (pageSize: number) => {
  emit('page-size-change', pageSize)
}

// 清空选择
const clearSelection = () => {
  tableRef.value?.clearSelection()
}

// 切换行选择
const toggleRowSelection = (row: T, selected?: boolean) => {
  tableRef.value?.toggleRowSelection(row, selected)
}

// 切换全选
const toggleAllSelection = () => {
  tableRef.value?.toggleAllSelection()
}

// 设置当前行
const setCurrentRow = (row: T) => {
  tableRef.value?.setCurrentRow(row)
}

// 暴露方法
defineExpose({
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  setCurrentRow,
  selectedRows
})

// 监听数据变化，清空选择
watch(() => props.data, () => {
  selectedRows.value = []
}, { deep: true })
</script>

<template>
  <div class="base-table">
    <!-- 表格 -->
    <el-table
      ref="tableRef"
      :data="tableData"
      :loading="loading"
      :stripe="stripe"
      :border="border"
      :size="size"
      :height="height"
      :max-height="maxHeight"
      :show-header="showHeader"
      :empty-text="emptyText"
      :row-key="rowKey"
      :default-sort="defaultSort"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblclick"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="selection"
        type="selection"
        width="55"
        align="center"
        fixed="left"
      />

      <!-- 动态列 -->
      <el-table-column
        v-for="column in tableColumns"
        :key="column.key"
        :prop="column.key"
        :label="column.title"
        :width="column.width"
        :min-width="column.width"
        :sortable="sortable && column.sortable !== false"
        :show-overflow-tooltip="true"
      >
        <template #default="{ row, column: tableColumn, $index }">
          <slot
            :name="column.key"
            :row="row"
            :column="tableColumn"
            :index="$index"
            :value="row[column.key]"
          >
            {{ row[column.key] }}
          </slot>
        </template>

        <!-- 表头插槽 -->
        <template #header="{ column: tableColumn, $index }">
          <slot
            :name="`${column.key}-header`"
            :column="tableColumn"
            :index="$index"
          >
            {{ column.title }}
          </slot>
        </template>
      </el-table-column>

      <!-- 操作列插槽 -->
      <slot name="actions" />
    </el-table>

    <!-- 分页 -->
    <div v-if="pagination" class="table-pagination">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.base-table {
  width: 100%;
}

.table-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

:deep(.el-table) {
  border-radius: 3px;
}

:deep(.el-table__header) {
  background-color: #f8f9fa;
}

:deep(.el-table__row:hover) {
  background-color: #f4f6f6;
}

:deep(.el-pagination) {
  --el-pagination-button-color: #5d6d7e;
  --el-pagination-hover-color: #3498db;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  border-radius: 3px;
}

:deep(.el-pagination .el-pager li) {
  border-radius: 3px;
}
</style>
