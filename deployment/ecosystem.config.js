module.exports = {
  apps: [
    {
      name: 'claude-task-master-api',
      script: 'server/start.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug'
      },
      error_file: 'logs/api-err.log',
      out_file: 'logs/api-out.log',
      log_file: 'logs/api-combined.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'projects'],
      merge_logs: true
    },
    {
      name: 'claude-task-master-mcp',
      script: 'mcp-server/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug'
      },
      error_file: 'logs/mcp-err.log',
      out_file: 'logs/mcp-out.log',
      log_file: 'logs/mcp-combined.log',
      time: true,
      max_memory_restart: '300M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'projects'],
      merge_logs: true
    },
    {
      name: 'claude-task-master-remote',
      script: 'mcp-remote/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug'
      },
      error_file: 'logs/remote-err.log',
      out_file: 'logs/remote-out.log',
      log_file: 'logs/remote-combined.log',
      time: true,
      max_memory_restart: '300M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'projects'],
      merge_logs: true
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/mrhaoqi/claude-task-master.git',
      path: '/opt/claude-task-master',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    },
    development: {
      user: 'deploy',
      host: ['dev-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/mrhaoqi/claude-task-master.git',
      path: '/opt/claude-task-master-dev',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env development',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    }
  }
};
