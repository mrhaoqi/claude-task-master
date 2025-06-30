#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
// Using built-in fetch in Node.js 18+

class TaskMasterRemoteMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'taskmaster-remote',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 从环境变量获取配置
    this.apiUrl = process.env.TASKMASTER_API_URL || 'http://localhost:3000';
    this.port = process.env.MCP_PORT || 3001;

    // 项目ID将从HTTP头中获取，不再从环境变量
    this.defaultProjectId = process.env.TASKMASTER_PROJECT_ID || 'default';

    this.setupToolHandlers();
    this.setupHttpServer();
  }

  /**
   * 设置HTTP服务器
   */
  setupHttpServer() {
    this.app = express();

    // 中间件
    this.app.use(cors());
    this.app.use(express.json());

    // 认证中间件
    this.app.use('/mcp', this.authenticateRequest.bind(this));

    // MCP端点
    this.app.post('/mcp', this.handleMcpRequest.bind(this));

    // 健康检查
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  /**
   * 认证请求
   */
  authenticateRequest(req, res, next) {
    const projectId = req.headers['x-project'];
    const username = req.headers['x-username'];
    const password = req.headers['x-password'];

    // 简单的认证逻辑（实际项目中应该更严格）
    if (!projectId) {
      return res.status(400).json({ error: 'X-PROJECT header is required' });
    }

    if (!username || !password) {
      return res.status(401).json({ error: 'X-USERNAME and X-PASSWORD headers are required' });
    }

    // 将项目ID附加到请求对象
    req.projectId = projectId;
    req.username = username;

    next();
  }

  /**
   * 处理MCP请求
   */
  async handleMcpRequest(req, res) {
    try {
      const mcpRequest = req.body;

      // 临时设置项目ID用于API调用
      const originalProjectId = this.projectId;
      this.projectId = req.projectId;

      let response;

      if (mcpRequest.method === 'tools/list') {
        response = await this.getToolsList();
      } else if (mcpRequest.method === 'tools/call') {
        response = await this.handleToolCall(mcpRequest.params);
      } else {
        throw new Error(`Unsupported method: ${mcpRequest.method}`);
      }

      // 恢复原始项目ID
      this.projectId = originalProjectId;

      res.json(response);
    } catch (error) {
      res.status(500).json({
        error: {
          code: -32603,
          message: error.message
        }
      });
    }
  }

  /**
   * 构建API URL - 这里进行URL拼接
   */
  buildApiUrl(endpoint, projectId = null) {
    const targetProjectId = projectId || this.projectId || this.defaultProjectId;
    // 拼接项目ID到URL路径中
    const projectEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.apiUrl}/api/projects/${targetProjectId}/${projectEndpoint}`;
  }

  /**
   * 调用远程API
   */
  async callApi(endpoint, options = {}) {
    const url = this.buildApiUrl(endpoint);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * 获取工具列表（用于HTTP模式）
   */
  async getToolsList() {
    const projectId = this.projectId || this.defaultProjectId;
    return {
      tools: [
        {
          name: 'add-task',
          description: `Add a new task to project ${projectId}`,
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Task title',
              },
              description: {
                type: 'string',
                description: 'Task description',
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Task priority',
                default: 'medium',
              },
            },
            required: ['title', 'description'],
          },
        },
        {
          name: 'list-tasks',
          description: `List all tasks in project ${projectId}`,
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: 'Filter tasks by status',
              },
            },
          },
        },
        {
          name: 'update-task',
          description: `Update a task in project ${projectId}`,
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'number',
                description: 'Task ID to update',
              },
              title: {
                type: 'string',
                description: 'New task title',
              },
              description: {
                type: 'string',
                description: 'New task description',
              },
              status: {
                type: 'string',
                description: 'New task status',
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'New task priority',
              },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'switch-project',
          description: 'Switch to a different project',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'Project ID to switch to',
              },
            },
            required: ['projectId'],
          },
        },
        {
          name: 'parse-prd',
          description: `Parse PRD content and generate tasks for project ${projectId}`,
          inputSchema: {
            type: 'object',
            properties: {
              prdContent: {
                type: 'string',
                description: 'PRD content to parse',
              },
              numTasks: {
                type: 'number',
                description: 'Number of tasks to generate',
                default: 10,
              },
            },
            required: ['prdContent'],
          },
        },
      ],
    };
  }

  /**
   * 处理工具调用（用于HTTP模式）
   */
  async handleToolCall(params) {
    const { name, arguments: args } = params;

    try {
      switch (name) {
        case 'add-task':
          return await this.handleAddTask(args);
        case 'list-tasks':
          return await this.handleListTasks(args);
        case 'update-task':
          return await this.handleUpdateTask(args);
        case 'switch-project':
          return await this.handleSwitchProject(args);
        case 'parse-prd':
          return await this.handleParsePRD(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return await this.getToolsList();
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.handleToolCall(request.params);
    });
  }

  async handleAddTask(args) {
    const { title, description, priority = 'medium' } = args;
    
    // URL会被拼接为: http://localhost:3000/api/projects/{projectId}/tasks
    const result = await this.callApi('tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, priority }),
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Task added successfully to project ${this.projectId}!\n\n${JSON.stringify(result.data, null, 2)}`,
        },
      ],
    };
  }

  async handleListTasks(args) {
    const { status } = args;
    
    // URL会被拼接为: http://localhost:3000/api/projects/{projectId}/tasks
    let endpoint = 'tasks';
    if (status) {
      endpoint += `?statusFilter=${encodeURIComponent(status)}`;
    }
    
    const result = await this.callApi(endpoint);

    const tasks = result.data?.tasks || [];
    const taskList = tasks.map(task => 
      `${task.id}. ${task.title} (${task.status}) - ${task.priority}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `📋 Tasks in project ${this.projectId}:\n\n${taskList || 'No tasks found'}`,
        },
      ],
    };
  }

  async handleUpdateTask(args) {
    const { taskId, ...updates } = args;
    
    // URL会被拼接为: http://localhost:3000/api/projects/{projectId}/tasks/{taskId}
    const result = await this.callApi(`tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Task ${taskId} updated successfully in project ${this.projectId}!\n\n${JSON.stringify(result.data, null, 2)}`,
        },
      ],
    };
  }

  async handleSwitchProject(args) {
    const { projectId } = args;
    
    // 验证项目是否存在
    try {
      const url = `${this.apiUrl}/api/projects/${projectId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Project ${projectId} not found`);
      }
      
      // 更新当前项目ID
      this.projectId = projectId;
      process.env.TASKMASTER_PROJECT_ID = projectId;
      
      return {
        content: [
          {
            type: 'text',
            text: `🔄 Switched to project: ${projectId}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to switch project: ${error.message}`);
    }
  }

  async handleParsePRD(args) {
    const { prdContent, numTasks = 10 } = args;
    
    // URL会被拼接为: http://localhost:3000/api/projects/{projectId}/prd/parse
    const result = await this.callApi('prd/parse', {
      method: 'POST',
      body: JSON.stringify({ prdContent, numTasks }),
    });

    return {
      content: [
        {
          type: 'text',
          text: `📄 PRD parsed successfully for project ${this.projectId}!\n\n${JSON.stringify(result.data, null, 2)}`,
        },
      ],
    };
  }

  async run() {
    // 检查是否以HTTP模式运行
    const httpMode = process.env.MCP_HTTP_MODE === 'true' || process.argv.includes('--http');

    if (httpMode) {
      // HTTP服务器模式
      this.app.listen(this.port, () => {
        console.log(`🚀 TaskMaster MCP HTTP server running on port ${this.port}`);
        console.log(`📡 Health check: http://localhost:${this.port}/health`);
        console.log(`🔗 MCP endpoint: http://localhost:${this.port}/mcp`);
      });
    } else {
      // 传统stdio模式
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error(`TaskMaster Remote MCP server running for project: ${this.defaultProjectId}`);
    }
  }
}

const server = new TaskMasterRemoteMCPServer();
server.run().catch(console.error);
