import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import CoreAdapter from '../services/core-adapter.js';
import { projectValidator } from '../middleware/project-validator.js';
import { prdFileLockMiddleware } from '../middleware/file-lock.js';
import { ValidationError } from '../middleware/error-handler.js';

const router = express.Router({ mergeParams: true });
const logger = createLogger('prd-router');
const coreAdapter = new CoreAdapter();

// 项目验证中间件
router.use(projectValidator);

// 解析PRD时需要文件锁
router.use('/parse', prdFileLockMiddleware());

// 解析PRD生成任务
router.post('/parse', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { 
            prdContent, 
            prdFilePath, 
            numTasks, 
            useResearch = false,
            force = false,
            append = false 
        } = req.body;
        
        if (!prdContent && !prdFilePath) {
            throw new ValidationError('Either prdContent or prdFilePath must be provided');
        }
        
        const project = req.project;
        let actualPrdPath;
        
        if (prdContent) {
            // 如果提供了内容，保存到临时文件
            const tempFileName = `temp_prd_${Date.now()}.txt`;
            actualPrdPath = path.join(project.path, '.taskmaster', 'docs', tempFileName);
            await fs.writeFile(actualPrdPath, prdContent, 'utf8');
        } else {
            // 使用提供的文件路径
            actualPrdPath = path.join(project.path, '.taskmaster', 'docs', prdFilePath);
            
            // 检查文件是否存在
            try {
                await fs.access(actualPrdPath);
            } catch (error) {
                throw new ValidationError(`PRD file not found: ${prdFilePath}`);
            }
        }
        
        const options = {
            force,
            append,
            research: useResearch
        };
        
        const result = await coreAdapter.parsePRD(
            project.path,
            actualPrdPath,
            numTasks || 10,
            options
        );
        
        // 如果是临时文件，删除它
        if (prdContent) {
            try {
                await fs.unlink(actualPrdPath);
            } catch (error) {
                logger.warn('Failed to delete temporary PRD file', { 
                    file: actualPrdPath, 
                    error: error.message 
                });
            }
        }
        
        res.json({
            success: true,
            data: result,
            message: 'PRD parsed successfully',
            projectId,
            requestId: req.requestId
        });
        
    } catch (error) {
        next(error);
    }
});

// 更新PRD文档（PUT方法）
router.put('/', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { filename, content } = req.body;

        if (!content) {
            throw new ValidationError('Content is required');
        }

        const project = req.project;
        const docsDir = path.join(project.path, '.taskmaster', 'docs');

        // 确保docs目录存在
        await fs.mkdir(docsDir, { recursive: true });

        // 使用提供的文件名，或默认为prd.md
        const actualFilename = filename || 'prd.md';
        const filePath = path.join(docsDir, actualFilename);

        // 写入文件
        await fs.writeFile(filePath, content, 'utf8');

        logger.info(`PRD document updated: ${filePath}`);

        res.json({
            success: true,
            data: {
                filename: actualFilename,
                path: filePath,
                size: content.length,
                updatedAt: new Date().toISOString()
            },
            message: `PRD document updated successfully`,
            requestId: req.requestId
        });

    } catch (error) {
        next(error);
    }
});

// 上传PRD文件
router.post('/upload', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { filename, content } = req.body;
        
        if (!filename || !content) {
            throw new ValidationError('Filename and content are required');
        }
        
        // 验证文件扩展名
        const allowedExtensions = ['.txt', '.md', '.markdown'];
        const ext = path.extname(filename).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            throw new ValidationError('Only .txt, .md, and .markdown files are supported');
        }
        
        const project = req.project;
        const docsDir = path.join(project.path, '.taskmaster', 'docs');
        const filePath = path.join(docsDir, filename);
        
        // 确保docs目录存在
        await fs.mkdir(docsDir, { recursive: true });
        
        // 保存文件
        await fs.writeFile(filePath, content, 'utf8');
        
        res.json({
            success: true,
            data: {
                filename,
                path: path.relative(project.path, filePath),
                size: Buffer.byteLength(content, 'utf8')
            },
            message: 'PRD file uploaded successfully',
            projectId,
            requestId: req.requestId
        });
        
    } catch (error) {
        next(error);
    }
});

// 列出PRD文件
router.get('/files', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = req.project;
        const docsDir = path.join(project.path, '.taskmaster', 'docs');
        
        try {
            const files = await fs.readdir(docsDir);
            const prdFiles = [];
            
            for (const file of files) {
                const filePath = path.join(docsDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isFile() && /\.(txt|md|markdown)$/i.test(file)) {
                    prdFiles.push({
                        filename: file,
                        path: path.relative(project.path, filePath),
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    });
                }
            }
            
            res.json({
                success: true,
                data: prdFiles,
                count: prdFiles.length,
                projectId,
                requestId: req.requestId
            });
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                // docs目录不存在，返回空列表
                res.json({
                    success: true,
                    data: [],
                    count: 0,
                    projectId,
                    requestId: req.requestId
                });
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        next(error);
    }
});

// 获取PRD文件内容
router.get('/files/:filename', async (req, res, next) => {
    try {
        const { projectId, filename } = req.params;
        const project = req.project;
        const filePath = path.join(project.path, '.taskmaster', 'docs', filename);
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const stats = await fs.stat(filePath);
            
            res.json({
                success: true,
                data: {
                    filename,
                    content,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                },
                projectId,
                requestId: req.requestId
            });
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new ValidationError(`PRD file not found: ${filename}`);
            }
            throw error;
        }
        
    } catch (error) {
        next(error);
    }
});

// 删除PRD文件
router.delete('/files/:filename', async (req, res, next) => {
    try {
        const { projectId, filename } = req.params;
        const project = req.project;
        const filePath = path.join(project.path, '.taskmaster', 'docs', filename);
        
        try {
            await fs.unlink(filePath);
            
            res.json({
                success: true,
                data: { deleted: true },
                message: `PRD file ${filename} deleted successfully`,
                projectId,
                requestId: req.requestId
            });
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new ValidationError(`PRD file not found: ${filename}`);
            }
            throw error;
        }
        
    } catch (error) {
        next(error);
    }
});

export default router;
