# Claude Task Master - 部署配置

本目录包含了 Claude Task Master 的各种部署配置文件和脚本。

## 📁 目录结构

```
deployment/
├── README.md                 # 本文件 - 部署说明
├── ecosystem.config.js       # PM2 进程管理配置
├── scripts/                  # 部署脚本目录
│   └── start-services.sh     # 服务启动管理脚本
├── docker/                   # Docker 相关配置
│   ├── Dockerfile           # Docker 镜像构建文件
│   └── docker-compose.yml   # 多容器编排配置
└── nginx/                    # Nginx 配置
    └── nginx.conf           # 反向代理配置
```

## 🚀 使用方法

### 1. 传统部署 (推荐)
使用项目根目录的 npm 脚本：
```bash
npm start              # 生产环境启动
npm run dev           # 开发环境启动
npm run start:all     # 并发启动所有服务
npm run dev:all       # 开发模式启动所有服务
```

### 2. 使用部署脚本
```bash
npm run deploy:start    # 启动所有服务
npm run deploy:dev      # 开发模式
npm run deploy:stop     # 停止服务
npm run deploy:status   # 查看状态

# 或直接使用脚本
./deployment/scripts/start-services.sh start
```

### 3. PM2 生产部署
```bash
# 复制配置到项目根目录
cp deployment/ecosystem.config.js .

# 启动服务
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Docker 容器部署
```bash
# 复制 Docker 文件到项目根目录
cp deployment/docker/Dockerfile .
cp deployment/docker/docker-compose.yml .

# 构建和启动
docker-compose up -d
```

### 5. Nginx 反向代理
```bash
# 复制配置文件
sudo cp deployment/nginx/nginx.conf /etc/nginx/sites-available/claude-task-master
sudo ln -s /etc/nginx/sites-available/claude-task-master /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## ⚠️ 重要说明

### 文件分离原则
- **部署配置与项目代码分离**：避免部署脚本与业务代码混淆
- **使用前需复制**：大部分配置文件需要复制到项目根目录才能使用
- **环境隔离**：开发和生产环境使用不同的配置

### 使用步骤
1. 根据需要选择部署方式
2. 复制相应的配置文件到项目根目录
3. 配置环境变量 (`.env` 文件)
4. 执行部署命令

### 注意事项
1. 确保端口 3000, 3001, 3002 未被占用
2. 检查 `.env` 文件配置
3. 生产环境需要配置 SSL 证书
4. 确保脚本有执行权限

## 📊 服务端口分配

- **3000**: Express API 服务器
- **3001**: MCP 服务器 (可选)
- **3002**: 远程 MCP 服务器 (可选)
- **6379**: Redis 缓存 (Docker 部署)
- **80/443**: Nginx 反向代理 (可选)
