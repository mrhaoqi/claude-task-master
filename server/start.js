#!/usr/bin/env node

import TaskMasterServer from './app.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('startup');

async function main() {
    try {
        // 配置服务器
        const config = {
            port: process.env.PORT || 3000,
            host: process.env.HOST || '0.0.0.0',
            projectsDir: process.env.PROJECTS_DIR || './projects'
        };

        logger.info('Starting TaskMaster Remote Server...', config);

        // 创建并启动服务器
        const server = new TaskMasterServer(config);
        
        // 优雅关闭处理
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, shutting down gracefully...');
            await server.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, shutting down gracefully...');
            await server.stop();
            process.exit(0);
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', { error: error.message, stack: error.stack });
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection', { reason, promise });
            process.exit(1);
        });

        // 启动服务器
        await server.start();
        
        logger.info('TaskMaster Remote Server is ready!');
        logger.info(`Health check: http://${config.host}:${config.port}/health`);
        logger.info(`API docs: http://${config.host}:${config.port}/`);

    } catch (error) {
        logger.error('Failed to start server', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

// 运行主函数
main();
