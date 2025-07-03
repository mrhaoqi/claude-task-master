# Claude Task Master - API 文档

## 概述

Claude Task Master 提供了完整的 REST API 和 MCP (Model Context Protocol) 接口，支持多项目任务管理。

## 基础信息

- **基础URL**: `http://localhost:3000`
- **API版本**: v1
- **内容类型**: `application/json`
- **认证**: 暂不支持（开发版本）

## 项目管理 API

### 获取所有项目

```http
GET /api/projects
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "my-web-app",
      "name": "My Web App",
      "description": "A modern web application",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 创建新项目

```http
POST /api/projects
```

**请求体**:
```json
{
  "id": "my-new-project",
  "name": "My New Project",
  "description": "Project description"
}
```

### 获取项目详情

```http
GET /api/projects/{projectId}
```

### 更新项目

```http
PUT /api/projects/{projectId}
```

### 删除项目

```http
DELETE /api/projects/{projectId}
```

## 任务管理 API

### 获取任务列表

```http
GET /api/projects/{projectId}/tasks
```

**查询参数**:
- `status`: 过滤任务状态 (pending, done, in-progress)
- `withSubtasks`: 包含子任务 (true/false)
- `tag`: 按标签过滤

### 创建新任务

```http
POST /api/projects/{projectId}/tasks
```

**请求体**:
```json
{
  "title": "Task Title",
  "description": "Task description",
  "status": "pending",
  "priority": "medium"
}
```

### 获取任务详情

```http
GET /api/projects/{projectId}/tasks/{taskId}
```

### 更新任务

```http
PUT /api/projects/{projectId}/tasks/{taskId}
```

### 删除任务

```http
DELETE /api/projects/{projectId}/tasks/{taskId}
```

### 设置任务状态

```http
PATCH /api/projects/{projectId}/tasks/{taskId}/status
```

**请求体**:
```json
{
  "status": "done"
}
```

## PRD 解析 API

### 解析 PRD 文档

```http
POST /api/projects/{projectId}/prd/parse
```

**请求体**:
```json
{
  "content": "PRD document content...",
  "numTasks": 10,
  "useResearch": true
}
```

### 上传 PRD 文件

```http
POST /api/projects/{projectId}/prd/upload
```

**请求体**: `multipart/form-data`
- `file`: PRD 文件

## 文件管理 API

### 生成任务文件

```http
POST /api/projects/{projectId}/files/generate
```

### 获取项目文件列表

```http
GET /api/projects/{projectId}/files
```

### 下载文件

```http
GET /api/projects/{projectId}/files/{filename}
```

## MCP 工具接口

### 连接信息

- **协议**: HTTP MCP
- **端点**: `http://localhost:3000/mcp`
- **传输**: HTTP POST

### 自定义头部

- `X-PROJECT`: 项目ID
- `X-USERNAME`: 用户名（可选）
- `X-PASSWORD`: 密码（可选）

### 可用工具

#### 项目初始化
- `initialize_project`: 初始化新项目
- `models`: 配置AI模型
- `rules`: 管理项目规则
- `migrate`: 迁移项目结构

#### 任务管理
- `get_tasks`: 获取任务列表
- `get_task`: 获取任务详情
- `add_task`: 添加新任务
- `update_task`: 更新任务
- `remove_task`: 删除任务
- `set_task_status`: 设置任务状态
- `next_task`: 获取下一个任务

#### 子任务管理
- `add_subtask`: 添加子任务
- `update_subtask`: 更新子任务
- `remove_subtask`: 删除子任务
- `clear_subtasks`: 清除所有子任务

#### 任务分析
- `analyze`: 分析项目复杂度
- `expand_task`: 扩展任务为子任务
- `expand_all`: 扩展所有任务
- `complexity_report`: 生成复杂度报告

#### 依赖管理
- `add_dependency`: 添加任务依赖
- `remove_dependency`: 删除任务依赖
- `validate_dependencies`: 验证依赖关系
- `fix_dependencies`: 修复依赖问题

#### 标签管理
- `list_tags`: 列出所有标签
- `add_tag`: 添加新标签
- `delete_tag`: 删除标签
- `use_tag`: 切换标签
- `rename_tag`: 重命名标签
- `copy_tag`: 复制标签

#### 文档和帮助
- `sync_readme`: 同步任务到README
- `help`: 显示帮助信息
- `get_operation_status`: 获取操作状态

#### 其他功能
- `parse_prd`: 解析PRD文档
- `generate`: 生成任务文件
- `research`: AI研究功能
- `move_task`: 移动任务位置

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

### 常见错误代码

- `PROJECT_NOT_FOUND`: 项目不存在
- `TASK_NOT_FOUND`: 任务不存在
- `INVALID_REQUEST`: 请求参数无效
- `INTERNAL_ERROR`: 内部服务器错误
- `FILE_NOT_FOUND`: 文件不存在
- `PERMISSION_DENIED`: 权限不足

## 状态码

- `200`: 成功
- `201`: 创建成功
- `400`: 请求错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 限制和配额

- 最大请求体大小: 10MB
- 最大文件上传大小: 50MB
- 并发请求限制: 100/分钟
- 项目数量限制: 无限制（开发版本）
