import express from 'express';
import { createLogger } from '../utils/logger.js';
import { projectListCache } from '../middleware/response-cache.js';
import { ValidationError, NotFoundError } from '../middleware/error-handler.js';

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

// 删除项目
router.delete('/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const projectManager = req.projectManager;
        
        await projectManager.deleteProject(projectId);
        
        res.json({
            success: true,
            data: { deleted: true },
            message: `Project ${projectId} deleted successfully`,
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

export default router;
