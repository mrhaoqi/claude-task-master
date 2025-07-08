/**
 * docs/swagger.js
 * Swagger documentation configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';
import config from '../config/config.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: config.swagger.title,
      version: config.swagger.version,
      description: config.swagger.description,
      contact: {
        name: 'Task Master Team',
        url: 'https://github.com/your-org/task-master',
        email: 'support@taskmaster.dev'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}${config.api.prefix}`,
        description: 'Development server'
      },
      {
        url: `https://api.taskmaster.dev${config.api.prefix}`,
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication'
        }
      },
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique task identifier',
              example: '1'
            },
            title: {
              type: 'string',
              description: 'Task title',
              example: 'Initialize Project'
            },
            description: {
              type: 'string',
              description: 'Brief task description',
              example: 'Set up the initial project structure'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'done', 'cancelled', 'blocked', 'deferred'],
              description: 'Current task status',
              example: 'pending'
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Task priority level',
              example: 'medium'
            },
            dependencies: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of task IDs that must be completed first',
              example: ['2', '3']
            },
            details: {
              type: 'string',
              description: 'Detailed implementation instructions',
              example: 'Create package.json, set up directory structure...'
            },
            testStrategy: {
              type: 'string',
              description: 'Testing approach for this task',
              example: 'Verify all files are created and dependencies installed'
            },
            subtasks: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Subtask'
              },
              description: 'List of subtasks'
            }
          },
          required: ['id', 'title', 'description', 'status']
        },
        Subtask: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Subtask identifier (e.g., "1.1")',
              example: '1.1'
            },
            title: {
              type: 'string',
              description: 'Subtask title',
              example: 'Create package.json'
            },
            description: {
              type: 'string',
              description: 'Subtask description',
              example: 'Initialize npm package with basic configuration'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'done', 'cancelled', 'blocked', 'deferred'],
              description: 'Current subtask status',
              example: 'pending'
            },
            dependencies: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of task/subtask IDs that must be completed first',
              example: []
            },
            details: {
              type: 'string',
              description: 'Detailed implementation instructions',
              example: 'Run npm init and configure basic project metadata'
            }
          },
          required: ['id', 'title', 'description', 'status']
        },
        Tag: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tag name',
              example: 'feature-auth'
            },
            description: {
              type: 'string',
              description: 'Tag description',
              example: 'Authentication feature tasks'
            },
            taskCount: {
              type: 'integer',
              description: 'Number of tasks in this tag',
              example: 15
            },
            completedTasks: {
              type: 'integer',
              description: 'Number of completed tasks',
              example: 8
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Tag creation timestamp',
              example: '2024-01-15T10:30:00Z'
            }
          },
          required: ['name', 'taskCount', 'completedTasks']
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error type',
              example: 'validation_error'
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
              example: 'Invalid task ID provided'
            },
            details: {
              type: 'object',
              description: 'Additional error details',
              example: {
                field: 'id',
                code: 'invalid_format'
              }
            }
          },
          required: ['success', 'error', 'message']
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            meta: {
              type: 'object',
              description: 'Additional metadata',
              properties: {
                requestId: {
                  type: 'string',
                  description: 'Request identifier',
                  example: '1642234567890-abc123'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Response timestamp',
                  example: '2024-01-15T10:30:00Z'
                }
              }
            }
          },
          required: ['success', 'data']
        }
      }
    },
    security: config.security.requireAuth ? [{ ApiKeyAuth: [] }] : [],
    tags: [
      {
        name: 'Tasks',
        description: 'Task management operations'
      },
      {
        name: 'Projects',
        description: 'Project initialization and management'
      },
      {
        name: 'Tags',
        description: 'Tag management for organizing tasks'
      },
      {
        name: 'Research',
        description: 'AI-powered research functionality'
      },
      {
        name: 'Health',
        description: 'API health and status endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/server.js'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec; 