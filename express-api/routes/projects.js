import express from 'express';
import { createLogger } from '../utils/logger.js';
import { projectListCache } from '../middleware/response-cache.js';
import { ValidationError, NotFoundError } from '../middleware/error-handler.js';
import { projectValidator } from '../middleware/project-validator.js';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const logger = createLogger('projects-router');

// 获取所有项目（带缓存）
router.get('/', projectListCache(), async (req, res, next) => {
    try {
        const projectManager = req.projectManager;
        const projects = projectManager.listProjects();
        
        res.json({
            success: true,
            data: projects,
            count: projects.length,
            requestId: req.requestId
        });
        
    } catch (error) {
        next(error);
    }
});

// 创建新项目
router.post('/', async (req, res, next) => {
    try {
        const { id, name, description, template } = req.body;
        
        // 验证必需字段
        if (!id || !name) {
            throw new ValidationError('Project ID and name are required');
        }
        
        const projectManager = req.projectManager;
        const project = await projectManager.createProject(
            id,
            name,
            description || '',
            template || 'default'
        );

        // 获取项目配置信息
        const projectsConfig = projectManager.configManager.getProjectsConfig();
        const projectInfo = projectsConfig.projects[id];

        res.status(201).json({
            success: true,
            data: {
                id: project.id,
                name: projectInfo.name,
                description: projectInfo.description,
                template: projectInfo.template,
                created: projectInfo.createdAt,
                lastAccessed: project.lastAccessed
            },
            message: `Project ${id} created successfully`,
            requestId: req.requestId
        });
        
    } catch (error) {
        if (error.message.includes('already exists')) {
            next(new ValidationError(error.message));
        } else if (error.message.includes('Invalid project ID')) {
            next(new ValidationError(error.message));
        } else {
            next(error);
        }
    }
});

// 获取单个项目
router.get('/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const projectManager = req.projectManager;

        const project = await projectManager.ensureProject(projectId);
        const config = await projectManager.getProjectConfig(projectId);

        res.json({
            success: true,
            data: {
                id: project.id,
                name: config.project?.name || projectId,
                description: config.project?.description || '',
                template: config.project?.template || 'default',
                created: config.project?.createdAt || new Date().toISOString(),
                updated: config.project?.lastAccessed || new Date().toISOString(),
                lastAccessed: project.lastAccessed,
                ai: config.ai,
                defaults: config.defaults,
                system: config.system
            },
            requestId: req.requestId
        });
        
    } catch (error) {
        if (error.message.includes('not found')) {
            next(new NotFoundError(error.message));
        } else {
            next(error);
        }
    }
});

// 更新项目
router.put('/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { name, description, settings, models, tags } = req.body;
        
        const projectManager = req.projectManager;
        const project = await projectManager.ensureProject(projectId);
        
        // 更新配置
        const updatedConfig = { ...project.config };
        
        if (name) updatedConfig.projectInfo.name = name;
        if (description !== undefined) updatedConfig.projectInfo.description = description;
        if (settings) updatedConfig.settings = { ...updatedConfig.settings, ...settings };
        if (models) updatedConfig.models = { ...updatedConfig.models, ...models };
        if (tags) updatedConfig.tags = { ...updatedConfig.tags, ...tags };
        
        await projectManager.saveProjectConfig(projectId, updatedConfig);
        
        // 更新缓存
        project.config = updatedConfig;
        
        res.json({
            success: true,
            data: {
                id: project.id,
                name: updatedConfig.projectInfo.name,
                description: updatedConfig.projectInfo.description,
                template: updatedConfig.projectInfo.template,
                created: updatedConfig.projectInfo.created,
                updated: updatedConfig.projectInfo.updated,
                lastAccessed: project.lastAccessed
            },
            message: `Project ${projectId} updated successfully`,
            requestId: req.requestId
        });
        
    } catch (error) {
        if (error.message.includes('not found')) {
            next(new NotFoundError(error.message));
        } else {
            next(error);
        }
    }
});

// 初始化项目（用于MCP工具）
router.post('/:projectId/initialize', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { force = false } = req.body;

        const projectManager = req.projectManager;

        // 检查项目是否已存在
        const exists = projectManager.projectExists(projectId);
        if (exists && !force) {
            return res.json({
                success: true,
                data: {
                    initialized: false,
                    message: 'Project already exists'
                },
                message: `Project ${projectId} already initialized`,
                requestId: req.requestId
            });
        }

        // 创建或重新初始化项目
        const { name, description, template } = req.body;
        const project = await projectManager.ensureProject(
            projectId,
            name || projectId,
            description || '',
            template || 'default'
        );

        res.json({
            success: true,
            data: {
                id: project.id,
                initialized: true,
                path: project.path,
                config: project.config
            },
            message: `Project ${projectId} initialized successfully`,
            requestId: req.requestId
        });

    } catch (error) {
        next(error);
    }
});

// 删除项目
router.delete('/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { deleteFiles = false } = req.body;
        const projectManager = req.projectManager;

        await projectManager.deleteProject(projectId, { deleteFiles });

        // 清理项目相关缓存
        const { clearProjectCache } = await import('../middleware/response-cache.js');
        clearProjectCache(projectId);

        res.json({
            success: true,
            data: {
                deleted: true,
                deleteFiles,
                projectId
            },
            message: deleteFiles
                ? `Project ${projectId} and all files deleted successfully`
                : `Project ${projectId} deleted successfully (files preserved)`,
            requestId: req.requestId
        });

    } catch (error) {
        if (error.message.includes('not found')) {
            next(new NotFoundError(error.message));
        } else {
            next(error);
        }
    }
});

// 分析项目复杂度
router.post('/:projectId/analyze', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { detailed = false } = req.body;
        const projectManager = req.projectManager;

        // 验证项目是否存在
        const project = projectManager.getProject(projectId);
        if (!project) {
            throw new NotFoundError(`Project ${projectId} not found`);
        }

        const result = await projectManager.coreAdapter.analyzeProjectComplexity(
            projectId,
            { detailed }
        );

        res.json({
            success: true,
            data: result,
            message: `Project ${projectId} complexity analyzed`,
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        next(error);
    }
});

// 生成复杂度报告
router.get('/:projectId/reports/complexity', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { format = 'json' } = req.query;
        const projectManager = req.projectManager;

        // 验证项目是否存在
        const project = projectManager.getProject(projectId);
        if (!project) {
            throw new NotFoundError(`Project ${projectId} not found`);
        }

        const result = await projectManager.coreAdapter.generateComplexityReport(
            projectId,
            { format }
        );

        res.json({
            success: true,
            data: result,
            message: `Complexity report generated for project ${projectId}`,
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        next(error);
    }
});

// 下载项目的IDE配置文件
router.get('/:projectId/ide-config/:ideType?', async (req, res, next) => {
    try {
        const { projectId, ideType } = req.params;
        const projectManager = req.projectManager;

        // 验证项目是否存在
        const project = projectManager.getProject(projectId);
        if (!project) {
            throw new NotFoundError(`Project ${projectId} not found`);
        }

        const projectPath = project.path;

        // 所有支持的IDE配置目录
        const ideDirectories = [
            '.claude',
            '.clinerules',
            '.cursor',
            '.github',
            '.ide',
            '.roo',
            '.trae',
            '.vscode',
            '.windsurf'
        ];

        // 创建ZIP文件
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        let filename;
        let foundConfigs = [];

        if (ideType) {
            // 下载特定IDE配置
            const ideDir = `.${ideType}`;
            if (!ideDirectories.includes(ideDir)) {
                throw new ValidationError(`Unsupported IDE type: ${ideType}. Supported types: ${ideDirectories.map(d => d.substring(1)).join(', ')}`);
            }

            const ideConfigDir = path.join(projectPath, ideDir);
            if (!fs.existsSync(ideConfigDir)) {
                throw new NotFoundError(`IDE configuration for ${ideType} not found in project ${projectId}`);
            }

            archive.directory(ideConfigDir, ideDir);
            filename = `${projectId}-${ideType}-config.zip`;
            foundConfigs.push(ideType);

        } else {
            // 下载所有存在的IDE配置
            for (const ideDir of ideDirectories) {
                const ideConfigDir = path.join(projectPath, ideDir);
                if (fs.existsSync(ideConfigDir)) {
                    archive.directory(ideConfigDir, ideDir);
                    foundConfigs.push(ideDir.substring(1));
                }
            }

            if (foundConfigs.length === 0) {
                throw new NotFoundError(`No IDE configurations found in project ${projectId}`);
            }

            filename = `${projectId}-ide-configs.zip`;
        }

        // 设置响应头
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // 管道输出到响应
        archive.pipe(res);

        // 完成归档
        await archive.finalize();

        logger.info(`IDE config downloaded`, {
            projectId,
            ideType: ideType || 'all',
            foundConfigs,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Download IDE config failed', {
            error: error.message,
            projectId: req.params.projectId,
            ideType: req.params.ideType,
            requestId: req.requestId
        });

        if (error.message.includes('not found')) {
            next(new NotFoundError(error.message));
        } else {
            next(error);
        }
    }
});

// 验证项目依赖关系 - 只检查，不修复
router.post('/:projectId/dependencies/validate', projectValidator, async (req, res, next) => {
    try {
        const { projectId } = req.params;

        logger.debug('Validate dependencies request', {
            projectId,
            requestId: req.requestId
        });

        const result = await req.projectManager.coreAdapter.validateDependencies(
            projectId,
            req.body
        );

        // 根据验证结果返回适当的状态码
        const statusCode = result.success ? 200 : 422; // 422 Unprocessable Entity for validation failures

        res.status(statusCode).json({
            success: result.success,
            data: result.data,
            message: result.message,
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Error validating dependencies:', {
            error: error.message,
            projectId: req.params.projectId,
            requestId: req.requestId
        });
        next(error);
    }
});

// 修复项目依赖关系
router.post('/:projectId/dependencies/fix', projectValidator, async (req, res, next) => {
    try {
        const { projectId } = req.params;

        logger.debug('Fix dependencies request', {
            projectId,
            requestId: req.requestId
        });

        const result = await req.projectManager.coreAdapter.fixDependencies(
            projectId,
            req.body
        );

        res.json({
            success: true,
            data: result,
            message: 'Dependencies fixed successfully',
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Error fixing dependencies:', {
            error: error.message,
            projectId: req.params.projectId,
            requestId: req.requestId
        });
        next(error);
    }
});

// 获取项目标签列表
router.get('/:projectId/tags', projectValidator, async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { showMetadata = false } = req.query;

        logger.debug('List tags request', {
            projectId,
            showMetadata,
            requestId: req.requestId
        });

        const result = await req.projectManager.coreAdapter.listTags(
            projectId,
            { showMetadata: showMetadata === 'true' }
        );

        res.json({
            success: true,
            data: result.data,
            message: 'Tags retrieved successfully',
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Error listing tags:', {
            error: error.message,
            projectId: req.params.projectId,
            requestId: req.requestId
        });
        next(error);
    }
});

// 添加项目标签
router.post('/:projectId/tags', projectValidator, async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { tagName, description, copyFromCurrent = false, copyFromTag, fromBranch = false } = req.body;

        // 验证必需字段
        if (!tagName && !fromBranch) {
            throw new ValidationError('Tag name is required when not creating from branch');
        }

        logger.debug('Add tag request', {
            projectId,
            tagName,
            description,
            copyFromCurrent,
            copyFromTag,
            fromBranch,
            requestId: req.requestId
        });

        const result = await req.projectManager.coreAdapter.addTag(
            projectId,
            {
                tagName,
                description,
                copyFromCurrent,
                copyFromTag,
                fromBranch
            }
        );

        res.json({
            success: true,
            data: result.data,
            message: result.message || 'Tag added successfully',
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Error adding tag:', {
            error: error.message,
            projectId: req.params.projectId,
            requestId: req.requestId
        });
        next(error);
    }
});

// 使用项目标签（切换到指定标签）
router.post('/:projectId/tags/:tagName/use', projectValidator, async (req, res, next) => {
    try {
        const { projectId, tagName } = req.params;

        logger.debug('Use tag request', {
            projectId,
            tagName,
            requestId: req.requestId
        });

        const result = await req.projectManager.coreAdapter.useTag(
            projectId,
            tagName
        );

        res.json({
            success: true,
            data: result.data,
            message: result.message || `Switched to tag "${tagName}"`,
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Error using tag:', {
            error: error.message,
            projectId: req.params.projectId,
            tagName: req.params.tagName,
            requestId: req.requestId
        });
        next(error);
    }
});

// 删除项目标签
router.delete('/:projectId/tags/:tagName', projectValidator, async (req, res, next) => {
    try {
        const { projectId, tagName } = req.params;
        const { yes = false } = req.body;

        logger.debug('Delete tag request', {
            projectId,
            tagName,
            yes,
            requestId: req.requestId
        });

        const result = await req.projectManager.coreAdapter.deleteTag(
            projectId,
            tagName,
            { yes }
        );

        res.json({
            success: true,
            data: result.data,
            message: result.message || `Tag "${tagName}" deleted successfully`,
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Error deleting tag:', {
            error: error.message,
            projectId: req.params.projectId,
            tagName: req.params.tagName,
            requestId: req.requestId
        });
        next(error);
    }
});

// 重命名项目标签
router.put('/:projectId/tags/:tagName/rename', projectValidator, async (req, res, next) => {
    try {
        const { projectId, tagName } = req.params;
        const { newName } = req.body;

        if (!newName) {
            throw new ValidationError('New tag name is required');
        }

        logger.debug('Rename tag request', {
            projectId,
            oldName: tagName,
            newName,
            requestId: req.requestId
        });

        const result = await req.projectManager.coreAdapter.renameTag(
            projectId,
            tagName,
            newName
        );

        res.json({
            success: true,
            data: result.data,
            message: result.message || `Tag renamed from "${tagName}" to "${newName}"`,
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Error renaming tag:', {
            error: error.message,
            projectId: req.params.projectId,
            oldName: req.params.tagName,
            newName: req.body.newName,
            requestId: req.requestId
        });
        next(error);
    }
});

// 复制项目标签
router.post('/:projectId/tags/:sourceName/copy', projectValidator, async (req, res, next) => {
    try {
        const { projectId, sourceName } = req.params;
        const { targetName, description } = req.body;

        if (!targetName) {
            throw new ValidationError('Target tag name is required');
        }

        logger.debug('Copy tag request', {
            projectId,
            sourceName,
            targetName,
            description,
            requestId: req.requestId
        });

        const result = await req.projectManager.coreAdapter.copyTag(
            projectId,
            sourceName,
            targetName,
            { description }
        );

        res.json({
            success: true,
            data: result.data,
            message: result.message || `Tag copied from "${sourceName}" to "${targetName}"`,
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Error copying tag:', {
            error: error.message,
            projectId: req.params.projectId,
            sourceName: req.params.sourceName,
            targetName: req.body.targetName,
            requestId: req.requestId
        });
        next(error);
    }
});

// AI驱动的项目研究
router.post('/:projectId/research', projectValidator, async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const {
            query,
            taskIds,
            filePaths,
            customContext,
            includeProjectTree = false,
            detailLevel = 'medium',
            saveTo,
            saveToFile = false
        } = req.body;

        if (!query) {
            throw new ValidationError('Research query is required');
        }

        logger.debug('Research request', {
            projectId,
            query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
            taskIds,
            filePaths,
            detailLevel,
            includeProjectTree,
            saveTo,
            saveToFile,
            requestId: req.requestId
        });

        const result = await req.projectManager.coreAdapter.performResearch(
            projectId,
            {
                query,
                taskIds,
                filePaths,
                customContext,
                includeProjectTree,
                detailLevel,
                saveTo,
                saveToFile
            }
        );

        res.json({
            success: true,
            data: result.data,
            message: result.message || 'Research completed successfully',
            projectId,
            requestId: req.requestId
        });

    } catch (error) {
        logger.error('Error performing research:', {
            error: error.message,
            projectId: req.params.projectId,
            query: req.body.query?.substring(0, 100),
            requestId: req.requestId
        });
        next(error);
    }
});

export default router;
