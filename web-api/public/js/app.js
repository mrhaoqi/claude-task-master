/**
 * Task Master Web API - Frontend Application
 * 主前端应用程序，处理所有用户交互和API调用
 */

class TaskMasterApp {
    constructor() {
        this.config = {
            apiKey: 'test-api-key-123',
            baseUrl: 'http://localhost:3002'  // Web API服务端口
        };
        this.currentProject = null;
        this.selectedFile = null;
        
        this.init();
    }

    /**
     * 初始化应用程序
     */
    init() {
        this.loadConfig();
        this.setupEventListeners();
        this.initializeTabs();
        this.testConnection();
        this.loadProjects();
    }

    /**
     * 加载配置
     */
    loadConfig() {
        // 使用默认配置，不再需要API密钥
        this.config.baseUrl = 'http://localhost:3002';
        this.config.apiKey = 'test-api-key-123'; // 保持兼容性
    }

    /**
     * 保存API密钥（带时间戳）
     */
    saveApiKeyWithTimestamp(apiKey) {
        const keyData = {
            apiKey: apiKey,
            timestamp: Date.now()
        };
        localStorage.setItem('taskmaster_api_key_data', JSON.stringify(keyData));
    }

    /**
     * 保存配置
     */
    saveConfig() {
        // 配置已经在loadConfig中设置，无需保存
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 配置保存
        document.getElementById('saveConfigBtn')?.addEventListener('click', () => {
            this.saveConfig();
            this.showAlert('配置已保存', 'success');
        });

        // 连接测试
        document.getElementById('testConnectionBtn')?.addEventListener('click', () => {
            this.testConnection();
        });

        // 项目管理
        document.getElementById('createProjectBtn')?.addEventListener('click', () => {
            this.showCreateProjectForm();
        });

        document.getElementById('refreshProjectsBtn')?.addEventListener('click', () => {
            this.loadProjects();
        });

        // PRD文档上传
        document.getElementById('prdFileInput')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        document.getElementById('uploadPrdBtn')?.addEventListener('click', () => {
            this.uploadPrdFile();
        });

        // 拖拽上传
        this.setupFileUpload();
    }

    /**
     * 初始化标签页功能
     */
    initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const panes = document.querySelectorAll('.tab-pane');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // 移除所有活动状态
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));
                
                // 添加活动状态
                tab.classList.add('active');
                document.getElementById(targetTab).classList.add('active');

                // 根据标签页加载相应数据
                this.onTabChange(targetTab);
            });
        });
    }

    /**
     * 标签页切换处理
     */
    onTabChange(tabId) {
        switch (tabId) {
            case 'projects':
                this.loadProjects();
                break;
            case 'prd':
                if (this.currentProject) {
                    this.loadPrd(this.currentProject);
                }
                break;
            case 'tasks':
                if (this.currentProject) {
                    this.loadTasks(this.currentProject);
                }
                break;
            case 'prs':
                if (this.currentProject) {
                    this.loadPrs(this.currentProject);
                }
                break;
            case 'crs':
                if (this.currentProject) {
                    this.loadCrs(this.currentProject);
                }
                break;
        }
    }

    /**
     * API请求函数
     */
    async apiRequest(endpoint, options = {}) {
        this.saveConfig();
        
        const url = `${this.config.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.config.apiKey
            }
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        if (options.headers) {
            requestOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }
        
        try {
            this.showLoading(true);
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 显示/隐藏加载指示器
     */
    showLoading(show) {
        // 简化的加载指示器，可以在控制台看到
        if (show) {
            console.log('Loading...');
        } else {
            console.log('Loading complete');
        }
    }

    /**
     * 显示通知
     */
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('.tab-pane.active') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    /**
     * 测试连接
     */
    async testConnection() {
        try {
            const data = await this.apiRequest('/health');
            
            const statusIndicator = document.getElementById('statusIndicator');
            const systemStatus = document.getElementById('systemStatus');

            if (data.success) {
                if (statusIndicator) {
                    statusIndicator.textContent = '✅ 已连接';
                    statusIndicator.className = 'status-indicator status-connected';
                }

                if (systemStatus) {
                    systemStatus.innerHTML = `
                        <div class="alert alert-success">
                            <strong>✅ 连接成功!</strong><br>
                            状态: ${data.status}<br>
                            时间: ${new Date(data.timestamp).toLocaleString()}<br>
                            版本: ${data.version}
                        </div>
                    `;
                }

                this.showAlert('连接测试成功!', 'success');
            } else {
                throw new Error('健康检查失败');
            }
        } catch (error) {
            const statusIndicator = document.getElementById('statusIndicator');
            const systemStatus = document.getElementById('systemStatus');

            if (statusIndicator) {
                statusIndicator.textContent = '❌ 连接失败';
                statusIndicator.className = 'status-indicator alert-error';
            }

            if (systemStatus) {
                systemStatus.innerHTML = `
                    <div class="alert alert-error">
                        <strong>❌ 连接失败!</strong><br>
                        错误: ${error.message}
                    </div>
                `;
            }

            this.showAlert(`连接失败: ${error.message}`, 'error');
        }
    }

    /**
     * 加载项目列表
     */
    async loadProjects() {
        try {
            const data = await this.apiRequest('/api/projects');
            this.displayProjects(data.data.projects || []);
            this.showAlert('项目列表加载成功!', 'success');
        } catch (error) {
            this.showAlert(`加载项目失败: ${error.message}`, 'error');
        }
    }

    /**
     * 显示项目列表
     */
    displayProjects(projects) {
        const container = document.getElementById('projectsContainer');
        
        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-center">暂无项目</p>';
            return;
        }
        
        let html = '<div class="projects-grid">';
        
        projects.forEach(project => {
            html += `
                <div class="project-card" data-project-id="${project.id}">
                    <div class="project-header">
                        <h3>${project.name}</h3>
                        <span class="project-id">#${project.id}</span>
                    </div>
                    <div class="project-description">
                        ${project.description || '暂无描述'}
                    </div>
                    <div class="project-stats">
                        <span>任务: ${project.taskCount || 0}</span>
                        <span>需求: ${project.prCount || 0}</span>
                        <span>变更: ${project.crCount || 0}</span>
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-primary" onclick="app.selectProject('${project.id}')">
                            选择项目
                        </button>
                        <button class="btn btn-secondary" onclick="app.viewProjectDetails('${project.id}')">
                            查看详情
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * 选择项目
     */
    selectProject(projectId) {
        this.currentProject = projectId;
        this.showAlert(`已选择项目: ${projectId}`, 'success');

        // 更新项目选择器显示
        const projectSelector = document.getElementById('currentProject');
        if (projectSelector) {
            projectSelector.textContent = projectId;
        }

        // 自动切换到任务标签页
        const taskTab = document.querySelector('[data-tab="tasks"]');
        if (taskTab) {
            taskTab.click();
        }
    }

    /**
     * 查看项目详情 - 跳转到PRD文档页面
     */
    async viewProjectDetails(projectId) {
        try {
            // 选择项目
            this.selectProject(projectId);

            // 切换到PRD文档标签页
            this.switchTab('prd');

            this.showAlert('已跳转到项目PRD文档页面', 'success');
        } catch (error) {
            this.showAlert(`跳转失败: ${error.message}`, 'error');
        }
    }

    /**
     * 显示创建项目表单
     */
    showCreateProjectForm() {
        const modal = document.getElementById('createProjectModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    /**
     * 隐藏创建项目表单
     */
    hideCreateProjectForm() {
        const modal = document.getElementById('createProjectModal');
        if (modal) {
            modal.style.display = 'none';
            // 清空表单
            document.getElementById('projectId').value = '';
            document.getElementById('projectName').value = '';
            document.getElementById('projectDescription').value = '';
        }
    }

    /**
     * 创建项目
     */
    async createProject() {
        try {
            const projectData = {
                id: document.getElementById('projectId').value.trim(),
                name: document.getElementById('projectName').value.trim(),
                description: document.getElementById('projectDescription').value.trim()
            };

            if (!projectData.id || !projectData.name) {
                this.showAlert('项目ID和名称不能为空', 'error');
                return;
            }

            const data = await this.apiRequest('/api/projects', {
                method: 'POST',
                body: JSON.stringify(projectData)
            });

            this.showAlert('项目创建成功!', 'success');
            this.hideCreateProjectForm();
            this.loadProjects();
        } catch (error) {
            this.showAlert(`创建项目失败: ${error.message}`, 'error');
        }
    }

    /**
     * 加载任务列表
     */
    async loadTasks(projectId) {
        if (!projectId) {
            this.showAlert('请先选择项目', 'warning');
            return;
        }

        try {
            const data = await this.apiRequest(`/api/projects/${projectId}/tasks`);
            this.displayTasks(data.data.tasks || []);
            this.showAlert('任务列表加载成功!', 'success');
        } catch (error) {
            this.showAlert(`加载任务失败: ${error.message}`, 'error');
        }
    }

    /**
     * 显示任务列表
     */
    displayTasks(tasks) {
        const container = document.getElementById('tasksContainer');

        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="text-center">暂无任务</p>';
            return;
        }

        // 按状态分组任务
        const groupedTasks = {
            'pending': [],
            'in_progress': [],
            'done': [],
            'blocked': []
        };

        tasks.forEach(task => {
            const status = task.status || 'pending';
            if (groupedTasks[status]) {
                groupedTasks[status].push(task);
            }
        });

        let html = '';

        // 状态配置
        const statusConfig = {
            'pending': { title: '📋 待处理', color: '#ffc107' },
            'in_progress': { title: '🔄 进行中', color: '#007bff' },
            'done': { title: '✅ 已完成', color: '#28a745' },
            'blocked': { title: '🚫 阻塞', color: '#dc3545' }
        };

        Object.keys(statusConfig).forEach(status => {
            const config = statusConfig[status];
            const statusTasks = groupedTasks[status];

            if (statusTasks.length > 0) {
                html += `
                    <div class="task-group">
                        <div class="task-group-header" style="background-color: ${config.color}">
                            <h4>${config.title}</h4>
                            <span class="task-count">${statusTasks.length} 个任务</span>
                        </div>
                        <div class="task-list">
                `;

                statusTasks.forEach(task => {
                    html += `
                        <div class="task-item" data-task-id="${task.id}">
                            <div class="task-header">
                                <span class="task-id">#${task.id}</span>
                                <span class="task-priority priority-${task.priority || 'medium'}">
                                    ${this.getPriorityText(task.priority)}
                                </span>
                            </div>
                            <div class="task-title">${task.title}</div>
                            <div class="task-description">${task.description || ''}</div>
                            <div class="task-actions">
                                <button class="btn btn-sm btn-info" onclick="app.viewTaskDetails('${task.id}')">
                                    查看详情
                                </button>
                            </div>
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    }

    /**
     * 获取优先级文本
     */
    getPriorityText(priority) {
        const priorityMap = {
            'high': '高',
            'medium': '中',
            'low': '低'
        };
        return priorityMap[priority] || '中';
    }

    /**
     * 查看任务详情
     */
    async viewTaskDetails(taskId) {
        try {
            const data = await this.apiRequest(`/api/projects/${this.currentProject}/tasks/${taskId}`);
            this.showTaskDetailsModal(data.data);
        } catch (error) {
            this.showAlert(`获取任务详情失败: ${error.message}`, 'error');
        }
    }

    /**
     * 设置文件上传功能
     */
    setupFileUpload() {
        const uploadArea = document.getElementById('fileUploadArea');
        if (!uploadArea) return;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files } });
            }
        });
    }

    /**
     * 处理文件选择
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            this.showAlert('文件大小不能超过10MB', 'error');
            return;
        }

        const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
        const allowedExtensions = ['.txt', '.md', '.pdf', '.doc', '.docx'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            this.showAlert('请选择支持的文件格式 (.txt, .md, .pdf, .doc, .docx)', 'error');
            return;
        }

        this.selectedFile = file;
        document.getElementById('uploadPrdBtn').disabled = false;

        const uploadArea = document.getElementById('fileUploadArea');
        uploadArea.innerHTML = `
            <div class="file-selected">
                <h4>📄 已选择文件</h4>
                <p>${file.name} (${(file.size / 1024).toFixed(1)} KB)</p>
            </div>
        `;

        this.showAlert(`文件 "${file.name}" 已选择`, 'success');
    }

    /**
     * 上传PRD文件
     */
    async uploadPrdFile() {
        if (!this.selectedFile) {
            this.showAlert('请先选择文件', 'error');
            return;
        }

        if (!this.currentProject) {
            this.showAlert('请先选择项目', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', this.selectedFile);

            const data = await this.apiRequest(`/api/projects/${this.currentProject}/upload-prd`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.config.apiKey
                    // 不设置 Content-Type，让浏览器自动设置
                },
                body: formData
            });

            this.showAlert('PRD文件上传成功!', 'success');
            this.showUploadResult(data.data);
        } catch (error) {
            this.showAlert(`PRD文件上传失败: ${error.message}`, 'error');
        }
    }

    /**
     * 显示上传结果
     */
    showUploadResult(data) {
        const container = document.getElementById('uploadResultContainer');
        if (container) {
            container.innerHTML = `
                <div class="upload-result">
                    <h4>📋 上传结果</h4>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
        }
    }

    /**
     * 显示任务详情模态框
     */
    showTaskDetailsModal(taskData) {
        const modal = document.getElementById('taskDetailsModal');
        const content = document.getElementById('taskDetailsContent');

        if (modal && content) {
            content.innerHTML = `
                <div class="task-details">
                    <h4>任务 #${taskData.id}</h4>
                    <div class="detail-item">
                        <strong>标题:</strong> ${taskData.title || '无'}
                    </div>
                    <div class="detail-item">
                        <strong>描述:</strong> ${taskData.description || '无'}
                    </div>
                    <div class="detail-item">
                        <strong>状态:</strong> ${taskData.status || '未知'}
                    </div>
                    <div class="detail-item">
                        <strong>优先级:</strong> ${this.getPriorityText(taskData.priority)}
                    </div>
                    ${taskData.dependencies ? `
                        <div class="detail-item">
                            <strong>依赖:</strong> ${taskData.dependencies.join(', ')}
                        </div>
                    ` : ''}
                    ${taskData.details ? `
                        <div class="detail-item">
                            <strong>实现细节:</strong>
                            <pre>${taskData.details}</pre>
                        </div>
                    ` : ''}
                </div>
            `;
            modal.style.display = 'flex';
        }
    }

    /**
     * 隐藏任务详情模态框
     */
    hideTaskDetailsModal() {
        const modal = document.getElementById('taskDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 显示项目详情模态框
     */
    showProjectDetailsModal(projectData) {
        const modal = document.getElementById('projectDetailsModal');
        const content = document.getElementById('projectDetailsContent');

        if (modal && content) {
            content.innerHTML = `
                <div class="project-details">
                    <h4>项目 ${projectData.name}</h4>
                    <div class="detail-item">
                        <strong>ID:</strong> ${projectData.id}
                    </div>
                    <div class="detail-item">
                        <strong>描述:</strong> ${projectData.description || '无'}
                    </div>
                    <div class="detail-item">
                        <strong>任务数量:</strong> ${projectData.taskCount || 0}
                    </div>
                    <div class="detail-item">
                        <strong>需求数量:</strong> ${projectData.prCount || 0}
                    </div>
                    <div class="detail-item">
                        <strong>变更数量:</strong> ${projectData.crCount || 0}
                    </div>
                    <div class="detail-item">
                        <strong>创建时间:</strong> ${projectData.createdAt ? new Date(projectData.createdAt).toLocaleString() : '未知'}
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        }
    }

    /**
     * 隐藏项目详情模态框
     */
    hideProjectDetailsModal() {
        const modal = document.getElementById('projectDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 加载产品需求列表
     */
    async loadPrs(projectId) {
        if (!projectId) {
            this.showAlert('请先选择项目', 'warning');
            return;
        }

        try {
            const data = await this.apiRequest(`/api/projects/${projectId}/prs`);
            this.displayPrs(data.data.requirements || []);
            this.showAlert('产品需求列表加载成功!', 'success');
        } catch (error) {
            this.showAlert(`加载产品需求失败: ${error.message}`, 'error');
        }
    }

    /**
     * 显示产品需求列表
     */
    displayPrs(prs) {
        const container = document.getElementById('requirementsContainer');
        if (!container) return;

        if (!prs || prs.length === 0) {
            container.innerHTML = '<p class="text-center">暂无产品需求</p>';
            return;
        }

        let html = '<div class="prs-list">';

        prs.forEach(pr => {
            html += `
                <div class="pr-item">
                    <div class="pr-header">
                        <h4>${pr.title || `需求 #${pr.id}`}</h4>
                        <span class="pr-id">#${pr.id}</span>
                    </div>
                    <div class="pr-description">
                        ${pr.description || '暂无描述'}
                    </div>
                    <div class="pr-actions">
                        <button class="btn btn-sm btn-info" onclick="app.viewPrDetails('${pr.id}')">
                            查看详情
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * 加载变更请求列表
     */
    async loadCrs(projectId) {
        if (!projectId) {
            this.showAlert('请先选择项目', 'warning');
            return;
        }

        try {
            const data = await this.apiRequest(`/api/projects/${projectId}/crs`);
            this.displayCrs(data.data.changeRequests || []);
            this.showAlert('变更请求列表加载成功!', 'success');
        } catch (error) {
            this.showAlert(`加载变更请求失败: ${error.message}`, 'error');
        }
    }

    /**
     * 显示变更请求列表
     */
    displayCrs(crs) {
        const container = document.getElementById('changesContainer');
        if (!container) return;

        if (!crs || crs.length === 0) {
            container.innerHTML = '<p class="text-center">暂无变更请求</p>';
            return;
        }

        let html = '<div class="crs-list">';

        crs.forEach(cr => {
            html += `
                <div class="cr-item">
                    <div class="cr-header">
                        <h4>${cr.title || `变更 #${cr.id}`}</h4>
                        <span class="cr-id">#${cr.id}</span>
                    </div>
                    <div class="cr-description">
                        ${cr.description || '暂无描述'}
                    </div>
                    <div class="cr-actions">
                        <button class="btn btn-sm btn-info" onclick="app.viewCrDetails('${cr.id}')">
                            查看详情
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * 加载PRD文档
     */
    async loadPrd(projectId) {
        if (!projectId) {
            this.showAlert('请先选择项目', 'warning');
            return;
        }

        const container = document.getElementById('prdContainer');
        if (!container) return;

        container.innerHTML = '<div class="loading">正在加载PRD文档...</div>';

        try {
            // 获取PRD文档
            const data = await this.apiRequest(`/api/projects/${projectId}/prd`);
            this.displayPrd(data.data || {}, projectId);
        } catch (error) {
            container.innerHTML = `<div class="alert alert-error">加载PRD文档失败: ${error.message}</div>`;
        }
    }

    /**
     * 显示PRD文档
     */
    displayPrd(prdData, projectId) {
        const container = document.getElementById('prdContainer');
        if (!container) return;

        const prdFiles = prdData.files || [];

        if (!prdFiles || prdFiles.length === 0) {
            container.innerHTML = `
                <div class="text-center">
                    <p>该项目暂无PRD文档</p>
                    <p class="text-muted">您可以通过TaskMaster核心工具上传PRD文档</p>
                </div>
            `;
            return;
        }

        let html = '<div class="prd-content">';
        html += '<h3>📄 PRD文档</h3>';

        // 显示第一个PRD文件的内容
        const firstFile = prdFiles[0];
        if (firstFile) {
            const modifiedDate = new Date(firstFile.lastModified).toLocaleString('zh-CN');

            html += `
                <div class="prd-file-info">
                    <h4>📄 ${firstFile.name}</h4>
                    <p class="text-muted">最后修改: ${modifiedDate}</p>
                </div>
                <div class="prd-file-content">
                    <pre style="white-space: pre-wrap; font-family: inherit; background: #f8f9fa; padding: 1rem; border-radius: 4px; border: 1px solid #dee2e6;">${this.escapeHtml(firstFile.content)}</pre>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * 查看PRD文件内容
     */
    async viewPrdFile(projectId, filename) {
        const contentId = `prd-content-${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const contentDiv = document.getElementById(contentId);

        if (!contentDiv) return;

        // 如果已经显示，则隐藏
        if (contentDiv.style.display !== 'none') {
            contentDiv.style.display = 'none';
            return;
        }

        contentDiv.innerHTML = '<div class="loading">正在加载文档内容...</div>';
        contentDiv.style.display = 'block';

        try {
            const response = await fetch(`${this.config.baseUrl}/api/projects/${projectId}/prd/files/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.data ? data.data.content : data.content || '';

            contentDiv.innerHTML = `
                <div class="prd-content-display">
                    <pre style="white-space: pre-wrap; font-family: inherit; background: #f8f9fa; padding: 15px; border-radius: 4px; border: 1px solid #dee2e6;">${this.escapeHtml(content)}</pre>
                </div>
            `;
        } catch (error) {
            contentDiv.innerHTML = `<div class="alert alert-error">加载文档内容失败: ${error.message}</div>`;
        }
    }

    /**
     * 下载PRD文件
     */
    downloadPrdFile(projectId, filename) {
        const url = `${this.config.baseUrl}/api/projects/${projectId}/prd/files/${filename}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用程序
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new TaskMasterApp();
});
