/**
 * services/taskmaster-service.js
 * Service layer for Task Master functionality
 * Now uses the remote server API instead of direct MCP functions
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Remote server configuration
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000';
const PROJECTS_DIR = process.env.PROJECTS_DIR || join(__dirname, '../../../projects');

/**
 * Helper functions for API calls and data management
 */

/**
 * Make HTTP request to remote server
 */
async function makeApiCall(endpoint, options = {}) {
  const { method = 'GET', data = null, params = {} } = options;

  try {
    const config = {
      method,
      url: `${SERVER_BASE_URL}${endpoint}`,
      params,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API call failed: ${method} ${endpoint}`, error.message);
    throw new Error(`Remote server error: ${error.message}`);
  }
}

/**
 * Read JSON file with error handling
 */
async function readJsonFile(filePath, defaultValue = null) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    throw error;
  }
}

/**
 * Write JSON file with error handling
 */
async function writeJsonFile(filePath, data) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Failed to write file: ${filePath}`, error.message);
    throw error;
  }
}

/**
 * Remote API Service for Task Master functionality
 * Replaces direct MCP calls with remote server API calls
 */
class TaskMasterService {
  constructor() {
    this.initialized = false;
    this.serverUrl = SERVER_BASE_URL;
    this.projectsDir = PROJECTS_DIR;
    this.init();
  }

  async init() {
    try {
      // Test connection to remote server
      await this.testConnection();
      console.log('✅ Remote TaskMaster server connection established');
      this.initialized = true;
    } catch (error) {
      console.warn('⚠️  Remote server not available, using fallback mode:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Test connection to remote server
   */
  async testConnection() {
    try {
      const response = await makeApiCall('/health');
      if (response.status !== 'ok') {
        throw new Error('Server health check failed');
      }
      return true;
    } catch (error) {
      throw new Error(`Cannot connect to remote server: ${error.message}`);
    }
  }

  // ==================== PROJECT MANAGEMENT ====================

  /**
   * Get all projects (READ-ONLY)
   */
  async getProjects() {
    if (!this.initialized) {
      return this._getFallbackProjects();
    }

    try {
      const result = await makeApiCall('/api/projects');
      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error('Failed to get projects:', error.message);
      return this._getFallbackProjects();
    }
  }

  /**
   * Create new project (WRITE OPERATION)
   */
  async createProject(params = {}) {
    const { id, name, description, template = 'default' } = params;

    if (!this.initialized) {
      return this._getFallbackCreateProject(id, name, description);
    }

    try {
      const result = await makeApiCall('/api/projects', {
        method: 'POST',
        data: {
          id,
          name,
          description,
          template
        }
      });

      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error('Failed to create project:', error.message);
      return this._getFallbackCreateProject(id, name, description);
    }
  }

  /**
   * Get specific project
   */
  async getProject(projectId) {
    if (!this.initialized) {
      return this._getFallbackProject(projectId);
    }

    try {
      const result = await makeApiCall(`/api/projects/${projectId}`);
      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error(`Failed to get project ${projectId}:`, error.message);
      return this._getFallbackProject(projectId);
    }
  }

  /**
   * Get project PRD document (READ-ONLY)
   */
  async getProjectPrd(projectId) {
    if (!this.initialized) {
      return this._getFallbackPrd(projectId);
    }

    try {
      const result = await makeApiCall(`/api/projects/${projectId}/prd/files`);
      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error(`Failed to get PRD for project ${projectId}:`, error.message);
      return this._getFallbackPrd(projectId);
    }
  }

  /**
   * Upload PRD document (WRITE OPERATION)
   */
  async uploadPrd(projectId, prdData) {
    if (!this.initialized) {
      return this._getFallbackUploadPrd(projectId, prdData);
    }

    try {
      const result = await makeApiCall(`/api/projects/${projectId}/prd/upload`, {
        method: 'POST',
        data: prdData
      });

      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error(`Failed to upload PRD for project ${projectId}:`, error.message);
      return this._getFallbackUploadPrd(projectId, prdData);
    }
  }

  /**
   * Parse PRD document and generate tasks (WRITE OPERATION)
   */
  async parsePrd(projectId, params = {}) {
    const { input, numTasks, force = false } = params;

    if (!this.initialized) {
      return this._getFallbackParsePrd(projectId, params);
    }

    try {
      const result = await makeApiCall(`/api/projects/${projectId}/prd/parse`, {
        method: 'POST',
        data: {
          input,
          numTasks,
          force
        }
      });

      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error(`Failed to parse PRD for project ${projectId}:`, error.message);
      return this._getFallbackParsePrd(projectId, params);
    }
  }

  // ==================== TASK MANAGEMENT ====================

  /**
   * Get tasks list (READ-ONLY)
   */
  async getTasks(params = {}) {
    const { projectId, status, withSubtasks, tag } = params;

    if (!this.initialized) {
      return this._getFallbackTasks(projectId);
    }

    try {
      const queryParams = {};
      if (status) queryParams.status = status;
      if (withSubtasks) queryParams.withSubtasks = withSubtasks;
      if (tag) queryParams.tag = tag;

      const result = await makeApiCall(`/api/projects/${projectId}/tasks`, {
        params: queryParams
      });

      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error('Failed to get tasks:', error.message);
      return this._getFallbackTasks(projectId);
    }
  }

  /**
   * Get specific task (READ-ONLY)
   */
  async getTask(params = {}) {
    const { id, projectId, tag } = params;

    if (!this.initialized) {
      return this._getFallbackTask(projectId, id);
    }

    try {
      const queryParams = {};
      if (tag) queryParams.tag = tag;

      const result = await makeApiCall(`/api/projects/${projectId}/tasks/${id}`, {
        params: queryParams
      });

      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error(`Failed to get task ${id}:`, error.message);
      return this._getFallbackTask(projectId, id);
    }
  }

  /**
   * Get task statistics (READ-ONLY)
   */
  async getTaskStats(projectId) {
    if (!this.initialized) {
      return this._getFallbackTaskStats(projectId);
    }

    try {
      const result = await makeApiCall(`/api/projects/${projectId}/tasks/stats`);
      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error(`Failed to get task stats for project ${projectId}:`, error.message);
      return this._getFallbackTaskStats(projectId);
    }
  }

  // ==================== PRODUCT REQUIREMENTS (PR) MANAGEMENT ====================

  /**
   * Get product requirements list (READ-ONLY)
   */
  async getProductRequirements(projectId) {
    if (!this.initialized) {
      return this._getFallbackPrs(projectId);
    }

    try {
      // Try to get from PRD analysis first
      const result = await makeApiCall(`/api/projects/${projectId}/scope/get-requirements-baseline`);
      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error(`Failed to get PRs for project ${projectId}:`, error.message);
      return this._getFallbackPrs(projectId);
    }
  }

  /**
   * Get specific product requirement (READ-ONLY)
   */
  async getProductRequirement(projectId, reqId) {
    if (!this.initialized) {
      return this._getFallbackPr(projectId, reqId);
    }

    try {
      const prsResult = await this.getProductRequirements(projectId);
      if (prsResult.success && prsResult.data.requirements) {
        const requirement = prsResult.data.requirements.find(req => req.id === reqId);
        if (requirement) {
          return {
            success: true,
            data: { requirement },
            mode: 'remote'
          };
        }
      }
      throw new Error(`Requirement ${reqId} not found`);
    } catch (error) {
      console.error(`Failed to get PR ${reqId}:`, error.message);
      return this._getFallbackPr(projectId, reqId);
    }
  }

  /**
   * Get PR statistics (READ-ONLY)
   */
  async getPrStats(projectId) {
    if (!this.initialized) {
      return this._getFallbackPrStats(projectId);
    }

    try {
      const prsResult = await this.getProductRequirements(projectId);
      if (prsResult.success && prsResult.data) {
        const requirements = prsResult.data.requirements || [];
        const stats = {
          total: requirements.length,
          byScope: {
            core: requirements.filter(r => r.scope === 'core').length,
            extended: requirements.filter(r => r.scope === 'extended').length,
            optional: requirements.filter(r => r.scope === 'optional').length
          },
          byPriority: {
            high: requirements.filter(r => r.priority === 'high').length,
            medium: requirements.filter(r => r.priority === 'medium').length,
            low: requirements.filter(r => r.priority === 'low').length
          }
        };
        return {
          success: true,
          data: stats,
          mode: 'remote'
        };
      }
      throw new Error('No requirements data available');
    } catch (error) {
      console.error(`Failed to get PR stats for project ${projectId}:`, error.message);
      return this._getFallbackPrStats(projectId);
    }
  }

  // ==================== CHANGE REQUESTS (CR) MANAGEMENT ====================

  /**
   * Get change requests list (READ-ONLY)
   */
  async getChangeRequests(projectId) {
    if (!this.initialized) {
      return this._getFallbackCrs(projectId);
    }

    try {
      const result = await makeApiCall(`/api/projects/${projectId}/scope/change-requests`);
      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error(`Failed to get CRs for project ${projectId}:`, error.message);
      return this._getFallbackCrs(projectId);
    }
  }

  /**
   * Get specific change request (READ-ONLY)
   */
  async getChangeRequest(projectId, crId) {
    if (!this.initialized) {
      return this._getFallbackCr(projectId, crId);
    }

    try {
      const result = await makeApiCall(`/api/projects/${projectId}/scope/change-requests/${crId}`);
      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error(`Failed to get CR ${crId}:`, error.message);
      return this._getFallbackCr(projectId, crId);
    }
  }

  /**
   * Get CR statistics (READ-ONLY)
   */
  async getCrStats(projectId) {
    if (!this.initialized) {
      return this._getFallbackCrStats(projectId);
    }

    try {
      const crsResult = await this.getChangeRequests(projectId);
      if (crsResult.success && crsResult.data) {
        const changeRequests = crsResult.data.changeRequests || [];
        const stats = {
          total: changeRequests.length,
          byStatus: {
            pending: changeRequests.filter(cr => cr.status === 'pending').length,
            approved: changeRequests.filter(cr => cr.status === 'approved').length,
            rejected: changeRequests.filter(cr => cr.status === 'rejected').length,
            implemented: changeRequests.filter(cr => cr.status === 'implemented').length
          },
          byType: {
            scope_expansion: changeRequests.filter(cr => cr.type === 'scope_expansion').length,
            requirement_change: changeRequests.filter(cr => cr.type === 'requirement_change').length,
            task_modification: changeRequests.filter(cr => cr.type === 'task_modification').length
          }
        };
        return {
          success: true,
          data: stats,
          mode: 'remote'
        };
      }
      throw new Error('No change requests data available');
    } catch (error) {
      console.error(`Failed to get CR stats for project ${projectId}:`, error.message);
      return this._getFallbackCrStats(projectId);
    }
  }

  // ==================== LEGACY METHODS (for backward compatibility) ====================

  /**
   * Get next task (legacy method)
   */
  async getNextTask(params = {}) {
    const { projectId, tag } = params;

    if (!this.initialized) {
      return this._getFallbackNextTask(projectId);
    }

    try {
      const queryParams = {};
      if (tag) queryParams.tag = tag;

      const result = await makeApiCall(`/api/projects/${projectId}/tasks/next`, {
        params: queryParams
      });

      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error('Failed to get next task:', error.message);
      return this._getFallbackNextTask(projectId);
    }
  }

  // ==================== FALLBACK METHODS ====================

  _getFallbackProjects() {
    return {
      success: true,
      data: {
        projects: [
          {
            id: 'demo-project',
            name: 'Demo Project',
            description: 'Fallback demo project',
            createdAt: new Date().toISOString()
          }
        ]
      },
      mode: 'fallback'
    };
  }

  _getFallbackProject(projectId) {
    return {
      success: true,
      data: {
        project: {
          id: projectId,
          name: `Project ${projectId}`,
          description: 'Fallback project data',
          createdAt: new Date().toISOString()
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackCreateProject(projectId, name, description) {
    return {
      success: true,
      data: {
        project: {
          id: projectId,
          name: name || `Project ${projectId}`,
          description: description || 'Fallback project description',
          template: 'default',
          createdAt: new Date().toISOString()
        },
        message: 'Project created successfully (fallback mode)'
      },
      mode: 'fallback'
    };
  }

  _getFallbackPrd(projectId) {
    return {
      success: true,
      data: {
        files: [
          {
            name: 'prd.txt',
            content: 'Fallback PRD content',
            lastModified: new Date().toISOString()
          }
        ]
      },
      mode: 'fallback'
    };
  }

  _getFallbackUploadPrd(projectId, prdData) {
    return {
      success: true,
      data: {
        message: 'PRD uploaded successfully (fallback mode)',
        file: {
          name: prdData.filename || 'prd.txt',
          size: prdData.content ? prdData.content.length : 0,
          uploadedAt: new Date().toISOString()
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackParsePrd(projectId, params) {
    return {
      success: true,
      data: {
        message: 'PRD parsed successfully (fallback mode)',
        tasksGenerated: 3,
        tasks: [
          {
            id: '1',
            title: 'Fallback Task 1',
            description: 'Generated from PRD parsing (fallback)',
            status: 'pending',
            priority: 'medium'
          },
          {
            id: '2',
            title: 'Fallback Task 2',
            description: 'Generated from PRD parsing (fallback)',
            status: 'pending',
            priority: 'medium'
          },
          {
            id: '3',
            title: 'Fallback Task 3',
            description: 'Generated from PRD parsing (fallback)',
            status: 'pending',
            priority: 'medium'
          }
        ]
      },
      mode: 'fallback'
    };
  }

  _getFallbackTasks(projectId) {
    return {
      success: true,
      data: {
        tasks: [
          {
            id: '1',
            title: `Demo Task for ${projectId}`,
            description: 'Fallback task data',
            status: 'pending',
            priority: 'medium',
            dependencies: [],
            subtasks: []
          }
        ],
        meta: {
          total: 1,
          mode: 'fallback'
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackTask(projectId, taskId) {
    return {
      success: true,
      data: {
        task: {
          id: taskId,
          title: `Task ${taskId}`,
          description: 'Fallback task data',
          status: 'pending',
          priority: 'medium',
          dependencies: [],
          subtasks: [],
          details: 'Fallback task details',
          testStrategy: 'Fallback test strategy'
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackTaskStats(projectId) {
    return {
      success: true,
      data: {
        total: 1,
        byStatus: {
          pending: 1,
          in_progress: 0,
          done: 0,
          blocked: 0
        },
        byPriority: {
          high: 0,
          medium: 1,
          low: 0
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackNextTask(projectId) {
    return {
      success: true,
      data: {
        nextTask: {
          id: '1',
          title: 'Next Recommended Task',
          description: 'Fallback next task recommendation',
          status: 'pending',
          priority: 'high',
          reason: 'Fallback recommendation'
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackPrs(projectId) {
    return {
      success: true,
      data: {
        requirements: [
          {
            id: 'req-001',
            title: 'User Authentication',
            description: 'Fallback requirement for user authentication',
            priority: 'high',
            scope: 'core',
            category: 'authentication',
            extractedFrom: 'prd.txt',
            createdAt: new Date().toISOString()
          }
        ],
        metadata: {
          totalRequirements: 1,
          lastAnalyzed: new Date().toISOString(),
          prdVersion: '1.0'
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackPr(projectId, reqId) {
    return {
      success: true,
      data: {
        requirement: {
          id: reqId,
          title: `Requirement ${reqId}`,
          description: 'Fallback requirement data',
          priority: 'medium',
          scope: 'core',
          category: 'general',
          extractedFrom: 'prd.txt',
          createdAt: new Date().toISOString()
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackPrStats(projectId) {
    return {
      success: true,
      data: {
        total: 1,
        byScope: {
          core: 1,
          extended: 0,
          optional: 0
        },
        byPriority: {
          high: 0,
          medium: 1,
          low: 0
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackCrs(projectId) {
    return {
      success: true,
      data: {
        changeRequests: [
          {
            id: 'cr-001',
            type: 'scope_expansion',
            title: 'Add Social Login',
            description: 'Fallback change request for social login feature',
            status: 'pending',
            priority: 'medium',
            relatedTasks: ['task-001'],
            relatedRequirements: ['req-001'],
            createdAt: new Date().toISOString()
          }
        ],
        metadata: {
          totalChangeRequests: 1,
          pendingCount: 1,
          approvedCount: 0
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackCr(projectId, crId) {
    return {
      success: true,
      data: {
        changeRequest: {
          id: crId,
          type: 'scope_expansion',
          title: `Change Request ${crId}`,
          description: 'Fallback change request data',
          status: 'pending',
          priority: 'medium',
          relatedTasks: [],
          relatedRequirements: [],
          createdAt: new Date().toISOString()
        }
      },
      mode: 'fallback'
    };
  }

  _getFallbackCrStats(projectId) {
    return {
      success: true,
      data: {
        total: 1,
        byStatus: {
          pending: 1,
          approved: 0,
          rejected: 0,
          implemented: 0
        },
        byType: {
          scope_expansion: 1,
          requirement_change: 0,
          task_modification: 0
        }
      },
      mode: 'fallback'
    };
  }

  // ==================== LEGACY METHODS (for backward compatibility) ====================

  /**
   * Legacy method: List tags (READ-ONLY)
   */
  async listTags(params = {}) {
    const { projectId } = params;

    if (!this.initialized) {
      return this._getFallbackTags(projectId);
    }

    try {
      const result = await makeApiCall(`/api/projects/${projectId}/tags`);
      return {
        success: true,
        data: result.data || result,
        mode: 'remote'
      };
    } catch (error) {
      console.error('Failed to get tags:', error.message);
      return this._getFallbackTags(projectId);
    }
  }

  _getFallbackTags(projectId) {
    return {
      success: true,
      data: {
        tags: [
          {
            name: 'master',
            description: 'Main task context',
            taskCount: 1,
            completedTasks: 0,
            createdAt: new Date().toISOString(),
            isActive: true
          }
        ],
        meta: {
          mode: 'fallback'
        }
      },
      mode: 'fallback'
    };
  }

}

// 创建单例实例
export const taskMasterService = new TaskMasterService();