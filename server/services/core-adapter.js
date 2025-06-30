import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';
import ConfigManager from './config-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger('core-adapter');

class CoreAdapter {
    constructor() {
        this.logger = logger;
        this.scriptsPath = path.join(__dirname, '../../scripts');
        this.configManager = new ConfigManager();
    }

    /**
     * 初始化适配器
     */
    async initialize() {
        await this.configManager.initialize();
    }

    /**
     * 适配现有的parsePRD函数到项目目录
     */
    async parsePRD(projectPath, prdPath, numTasks, options = {}) {
        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
            
            // 设置项目根目录为当前项目路径
            const adaptedOptions = {
                ...options,
                projectRoot: projectPath,
                mcpLog: this.logger,
                outputFormat: 'json'
            };

            // 动态导入现有的parsePRD函数
            const { default: parsePRD } = await import('../../scripts/modules/task-manager/parse-prd.js');
            const result = await parsePRD(prdPath, tasksPath, numTasks, adaptedOptions);
            
            return result;
        } catch (error) {
            this.logger.error('PRD parsing failed', { error: error.message, projectPath });
            throw error;
        }
    }

    /**
     * 适配现有的addTask函数到项目目录
     */
    async addTask(projectPath, title, description, priority = 'medium', options = {}) {
        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');

            // 准备addTask函数的参数
            const prompt = `${title}\n\n${description}`;
            const dependencies = [];

            // 获取项目ID（从路径中提取）
            const projectId = path.basename(projectPath);

            // 获取项目配置
            const projectConfig = await this.configManager.getProjectConfig(projectId);

            const context = {
                projectRoot: projectPath,
                mcpLog: this.logger,
                config: projectConfig,  // 传递配置给原始脚本
                ...options
            };
            const outputFormat = 'json';
            // 让AI生成任务数据
            const manualTaskData = null;
            const useResearch = false;
            const tag = options.tag || null;

            const { default: addTask } = await import('../../scripts/modules/task-manager/add-task.js');
            const result = await addTask(
                tasksPath,
                prompt,
                dependencies,
                priority,
                context,
                outputFormat,
                manualTaskData,
                useResearch,
                tag
            );

            return result;
        } catch (error) {
            this.logger.error('Add task failed', { error: error.message, projectPath });
            throw error;
        }
    }

    /**
     * 适配现有的listTasks函数到项目目录
     */
    async listTasks(projectPath, options = {}) {
        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');

            // 准备listTasks函数的参数
            const statusFilter = options.statusFilter || null;
            const reportPath = null; // 暂时不使用复杂度报告
            const withSubtasks = options.withSubtasks || false;
            const outputFormat = 'json';
            const tag = options.tag || null;
            const context = {
                projectRoot: projectPath,
                mcpLog: this.logger,
                ...options
            };

            const { default: listTasks } = await import('../../scripts/modules/task-manager/list-tasks.js');
            const result = await listTasks(
                tasksPath,
                statusFilter,
                reportPath,
                withSubtasks,
                outputFormat,
                tag,
                context
            );

            return result;
        } catch (error) {
            this.logger.error('List tasks failed', { error: error.message, projectPath });
            throw error;
        }
    }

    /**
     * 适配现有的expandTask函数到项目目录
     */
    async expandTask(projectPath, taskId, numSubtasks, options = {}) {
        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
            
            const adaptedOptions = {
                ...options,
                projectRoot: projectPath,
                mcpLog: this.logger,
                outputFormat: 'json'
            };

            const { default: expandTask } = await import('../../scripts/modules/task-manager/expand-task.js');
            const result = await expandTask(tasksPath, taskId, numSubtasks, adaptedOptions);
            
            return result;
        } catch (error) {
            this.logger.error('Expand task failed', { error: error.message, projectPath });
            throw error;
        }
    }

    /**
     * 适配现有的setTaskStatus函数到项目目录
     */
    async setTaskStatus(projectPath, taskId, status, options = {}) {
        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
            
            const adaptedOptions = {
                ...options,
                projectRoot: projectPath,
                mcpLog: this.logger,
                outputFormat: 'json'
            };

            const { default: setTaskStatus } = await import('../../scripts/modules/task-manager/set-task-status.js');
            const result = await setTaskStatus(tasksPath, taskId, status, adaptedOptions);
            
            return result;
        } catch (error) {
            this.logger.error('Set task status failed', { error: error.message, projectPath });
            throw error;
        }
    }

    /**
     * 适配现有的updateTaskById函数到项目目录
     */
    async updateTaskById(projectPath, taskId, updates, options = {}) {
        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
            
            const adaptedOptions = {
                ...options,
                projectRoot: projectPath,
                mcpLog: this.logger,
                outputFormat: 'json'
            };

            const { default: updateTaskById } = await import('../../scripts/modules/task-manager/update-task-by-id.js');
            const result = await updateTaskById(tasksPath, taskId, updates, adaptedOptions);
            
            return result;
        } catch (error) {
            this.logger.error('Update task failed', { error: error.message, projectPath });
            throw error;
        }
    }

    /**
     * 适配现有的removeTask函数到项目目录
     */
    async removeTask(projectPath, taskId, options = {}) {
        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
            
            const adaptedOptions = {
                ...options,
                projectRoot: projectPath,
                mcpLog: this.logger,
                outputFormat: 'json'
            };

            const { default: removeTask } = await import('../../scripts/modules/task-manager/remove-task.js');
            const result = await removeTask(tasksPath, taskId, adaptedOptions);
            
            return result;
        } catch (error) {
            this.logger.error('Remove task failed', { error: error.message, projectPath });
            throw error;
        }
    }

    /**
     * 适配现有的generateTaskFiles函数到项目目录
     */
    async generateTaskFiles(projectPath, options = {}) {
        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
            const outputDir = path.join(projectPath, '.taskmaster', 'tasks');
            
            const adaptedOptions = {
                ...options,
                projectRoot: projectPath,
                mcpLog: this.logger
            };

            const { default: generateTaskFiles } = await import('../../scripts/modules/task-manager/generate-task-files.js');
            const result = await generateTaskFiles(tasksPath, outputDir, adaptedOptions);
            
            return result;
        } catch (error) {
            this.logger.error('Generate task files failed', { error: error.message, projectPath });
            throw error;
        }
    }

    /**
     * 适配现有的analyzeTaskComplexity函数到项目目录
     */
    async analyzeTaskComplexity(projectPath, taskId, options = {}) {
        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
            
            const adaptedOptions = {
                ...options,
                projectRoot: projectPath,
                mcpLog: this.logger,
                outputFormat: 'json'
            };

            const { default: analyzeTaskComplexity } = await import('../../scripts/modules/task-manager/analyze-task-complexity.js');
            const result = await analyzeTaskComplexity(tasksPath, taskId, adaptedOptions);
            
            return result;
        } catch (error) {
            this.logger.error('Analyze task complexity failed', { error: error.message, projectPath });
            throw error;
        }
    }
}

export default CoreAdapter;
