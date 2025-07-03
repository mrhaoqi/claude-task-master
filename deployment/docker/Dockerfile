# Claude Task Master Dockerfile
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    bash \
    git \
    && rm -rf /var/cache/apk/*

# 复制package文件
COPY package*.json ./

# 安装npm依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建必要目录
RUN mkdir -p projects logs temp

# 设置权限
RUN chmod +x bin/task-master.js \
    && chmod +x mcp-server/server.js \
    && chown -R node:node /app

# 切换到非root用户
USER node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["npm", "start"]
