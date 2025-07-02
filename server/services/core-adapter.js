import path from 'path';
import fs from 'fs/promises';
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
     * 将全局配置转换为原始脚本期望的格式
     */
    _convertToLegacyConfig(globalConfig) {
        // 原始脚本期望 'models' 结构，而不是 'ai' 结构
        return {
            models: {
                main: {
                    provider: globalConfig.ai.main.provider,
                    modelId: globalConfig.ai.main.modelId,
                    maxTokens: globalConfig.ai.main.maxTokens,
                    temperature: globalConfig.ai.main.temperature,
                    model: globalConfig.ai.main.modelId, // 添加model字段以兼容
                    ...(globalConfig.ai.main.baseURL && { baseURL: globalConfig.ai.main.baseURL })
                },
                research: {
                    provider: globalConfig.ai.research?.provider || globalConfig.ai.main.provider,
                    modelId: globalConfig.ai.research?.modelId || globalConfig.ai.main.modelId,
                    maxTokens: globalConfig.ai.research?.maxTokens || globalConfig.ai.main.maxTokens,
                    temperature: globalConfig.ai.research?.temperature || 0.1,
                    model: globalConfig.ai.research?.modelId || globalConfig.ai.main.modelId,
                    ...(globalConfig.ai.research?.baseURL && { baseURL: globalConfig.ai.research.baseURL })
                },
                fallback: {
                    provider: globalConfig.ai.fallback?.provider || globalConfig.ai.main.provider,
                    modelId: globalConfig.ai.fallback?.modelId || globalConfig.ai.main.modelId,
                    maxTokens: globalConfig.ai.fallback?.maxTokens || globalConfig.ai.main.maxTokens,
                    temperature: globalConfig.ai.fallback?.temperature || globalConfig.ai.main.temperature,
                    model: globalConfig.ai.fallback?.modelId || globalConfig.ai.main.modelId,
                    ...(globalConfig.ai.fallback?.baseURL && { baseURL: globalConfig.ai.fallback.baseURL })
                }
            },
            defaults: globalConfig.defaults || {},
            system: globalConfig.system || {},
            global: {
                logLevel: globalConfig.system?.logLevel || "info",
                debug: globalConfig.system?.debug || false,
                defaultSubtasks: globalConfig.defaults?.task?.subtasks || 5,
                defaultPriority: globalConfig.defaults?.task?.priority || "medium",
                projectName: "TaskMaster Project",
                userId: "default-user"
            }
        };
    }

    /**
     * 写入JSON文件
     */
    async _writeJSON(filePath, data) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    /**
     * 删除文件
     */
    async _deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    /**
     * 检查文件是否存在
     */
    async _fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
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
        let tempConfigPath = null;

        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');

            // 准备addTask函数的参数
            const prompt = `${title}\n\n${description}`;
            const dependencies = [];

            // 获取全局配置并转换为原始脚本期望的格式
            const globalConfig = await this.configManager.getGlobalConfig();
            const legacyConfig = this._convertToLegacyConfig(globalConfig);

            // 临时创建配置文件供原始脚本使用
            tempConfigPath = path.join(projectPath, '.taskmaster', 'config.json');
            await this._writeJSON(tempConfigPath, legacyConfig);

            // 创建兼容的logger对象
            const compatibleLogger = {
                info: (msg) => this.logger.info(msg),
                debug: (msg) => this.logger.debug(msg),
                warn: (msg) => this.logger.warn(msg),
                error: (msg) => this.logger.error(msg),
                success: (msg) => this.logger.info(msg)
            };

            const context = {
                projectRoot: projectPath,
                mcpLog: compatibleLogger,
                ...options
            };
            const outputFormat = 'json';

            // 支持手动任务数据，默认使用AI生成
            const manualTaskData = options.useManualData ? {
                title: title,
                description: description,
                details: `Implementation details for: ${title}\n\n${description}`,
                testStrategy: `Test strategy for: ${title}\n\n1. Verify the implementation meets requirements\n2. Test edge cases\n3. Validate expected behavior`,
                dependencies: dependencies
            } : null;

            const useResearch = options.useResearch || false;
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
        } finally {
            // 清理临时配置文件
            if (tempConfigPath) {
                try {
                    await this._deleteFile(tempConfigPath);
                    this.logger.debug(`Cleaned up temporary config file: ${tempConfigPath}`);
                } catch (cleanupError) {
                    this.logger.warn('Failed to cleanup temporary config file', { error: cleanupError.message });
                }
            }
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
            const tag = options.tag || 'main';  // 默认使用main标签
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
        let tempConfigPath = null;

        try {
            const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');

            // 获取全局配置并转换为原始脚本期望的格式
            const globalConfig = await this.configManager.getGlobalConfig();
            const legacyConfig = this._convertToLegacyConfig(globalConfig);

            // 临时创建配置文件供原始脚本使用
            tempConfigPath = path.join(projectPath, '.taskmaster', 'config.json');
            await this._writeJSON(tempConfigPath, legacyConfig);

            this.logger.debug(`Created temporary config file for expandTask: ${tempConfigPath}`);

            // 等待一小段时间确保文件系统同步
            await new Promise(resolve => setTimeout(resolve, 100));

            const useResearch = options.research || false;
            const additionalContext = options.additionalContext || '';
            const force = options.force || false;

            const context = {
                projectRoot: projectPath,
                mcpLog: this.logger,
                outputFormat: 'json',
                tag: 'main',  // 明确指定使用main标签
                ...options
            };

            // 验证任务文件和临时配置文件都存在
            const tasksExists = await this._fileExists(tasksPath);
            const configExists = await this._fileExists(tempConfigPath);

            if (!tasksExists) {
                throw new Error(`Tasks file not found: ${tasksPath}`);
            }
            if (!configExists) {
                throw new Error(`Temporary config file not found: ${tempConfigPath}`);
            }

            this.logger.debug(`Calling expandTask with taskId: ${taskId} (${typeof taskId})`);

            // 预先验证任务是否存在，避免原始脚本中的readJSON问题
            const tasksData = JSON.parse(await fs.readFile(tasksPath, 'utf8'));
            const mainTasks = tasksData.main?.tasks || [];
            const taskExists = mainTasks.some(t => t.id === parseInt(taskId, 10));

            if (!taskExists) {
                throw new Error(`Task ${taskId} not found in project ${path.basename(projectPath)}`);
            }

            this.logger.debug(`Task ${taskId} verified to exist, proceeding with expansion`);

            const { default: expandTask } = await import('../../scripts/modules/task-manager/expand-task.js');
            const result = await expandTask(
                tasksPath,
                taskId,
                numSubtasks,
                useResearch,
                additionalContext,
                context,
                force
            );

            return result;
        } catch (error) {
            this.logger.error('Expand task failed', { error: error.message, projectPath, taskId });
            throw error;
        } finally {
            // 清理临时配置文件
            if (tempConfigPath) {
                try {
                    await this._deleteFile(tempConfigPath);
                    this.logger.debug(`Cleaned up temporary config file: ${tempConfigPath}`);
                } catch (cleanupError) {
                    this.logger.warn('Failed to cleanup temporary config file', { error: cleanupError.message });
                }
            }
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

            // 确保taskId是字符串格式
            const taskIdString = String(taskId);

            const { default: setTaskStatus } = await import('../../scripts/modules/task-manager/set-task-status.js');
            const result = await setTaskStatus(tasksPath, taskIdString, status, adaptedOptions);

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

            // 如果只是状态更新，使用setTaskStatus函数
            if (updates.status && Object.keys(updates).length === 1) {
                return await this.setTaskStatus(projectPath, taskId, updates.status, adaptedOptions);
            }

            // 对于其他更新，构建一个prompt描述更新内容
            const updatePrompt = this.buildUpdatePrompt(updates);

            const { default: updateTaskById } = await import('../../scripts/modules/task-manager/update-task-by-id.js');
            const result = await updateTaskById(tasksPath, taskId, updatePrompt, false, adaptedOptions);

            return result;
        } catch (error) {
            this.logger.error('Update task failed', { error: error.message, projectPath });
            throw error;
        }
    }

    /**
     * 构建更新提示
     */
    buildUpdatePrompt(updates) {
        const updateParts = [];

        if (updates.title) {
            updateParts.push(`Update title to: ${updates.title}`);
        }
        if (updates.description) {
            updateParts.push(`Update description to: ${updates.description}`);
        }
        if (updates.priority) {
            updateParts.push(`Update priority to: ${updates.priority}`);
        }
        if (updates.status) {
            updateParts.push(`Update status to: ${updates.status}`);
        }

        return updateParts.length > 0 ? updateParts.join('\n') : 'Update task';
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
