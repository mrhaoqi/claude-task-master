/**
 * PRD需求分析器
 * 用于提取PRD中的核心需求点，建立需求基线
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { generateObjectService } from '../../scripts/modules/ai-services-unified.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('prd-analyzer');

// PRD需求点数据结构
const PrdRequirementSchema = z.object({
  id: z.string().describe('需求唯一标识符'),
  title: z.string().describe('需求标题'),
  description: z.string().describe('需求详细描述'),
  category: z.enum(['functional', 'non-functional', 'technical', 'business']).describe('需求类别'),
  priority: z.enum(['high', 'medium', 'low']).describe('需求优先级'),
  scope: z.enum(['core', 'extended', 'optional']).describe('需求范围'),
  keywords: z.array(z.string()).describe('关键词列表'),
  dependencies: z.array(z.string()).describe('依赖的其他需求ID')
});

// PRD分析结果结构
const PrdAnalysisSchema = z.object({
  requirements: z.array(PrdRequirementSchema),
  metadata: z.object({
    projectName: z.string().optional(),
    version: z.string().optional(),
    analyzedAt: z.string(),
    totalRequirements: z.number(),
    coreRequirements: z.number(),
    extendedRequirements: z.number(),
    optionalRequirements: z.number()
  })
});

export class PrdAnalyzer {
  constructor() {
    this.logger = logger;
  }

  /**
   * 分析PRD文件，提取需求点
   */
  async analyzePrd(projectPath, prdFilePath) {
    try {
      this.logger.info('Starting PRD analysis', { projectPath, prdFilePath });

      // 读取PRD文件内容
      const prdContent = await fs.readFile(prdFilePath, 'utf8');
      
      // 使用AI分析PRD内容
      const analysis = await this._analyzeWithAI(prdContent, prdFilePath);
      
      // 保存分析结果
      const analysisPath = await this._saveAnalysis(projectPath, analysis);
      
      this.logger.info('PRD analysis completed', { 
        analysisPath, 
        requirementsCount: analysis.requirements.length 
      });

      return {
        success: true,
        data: analysis,
        analysisPath
      };

    } catch (error) {
      this.logger.error('PRD analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 使用AI分析PRD内容
   */
  async _analyzeWithAI(prdContent, prdFilePath) {
    const systemPrompt = `你是一个专业的需求分析师。请分析提供的PRD文档，提取出所有的功能需求和非功能需求。

对于每个需求，请：
1. 分配唯一的ID（使用格式：REQ-001, REQ-002等）
2. 提取清晰的标题和描述
3. 分类为功能性、非功能性、技术性或业务性需求
4. 评估优先级（高、中、低）
5. 确定范围（核心、扩展、可选）
6. 提取关键词
7. 识别需求间的依赖关系

重点关注：
- 明确的功能描述
- 用户故事和用例
- 技术要求和约束
- 性能和质量要求
- 集成和接口需求

请确保需求提取的完整性和准确性，这将作为项目范围控制的基线。`;

    const userPrompt = `请分析以下PRD文档，提取所有需求点：

文件路径: ${prdFilePath}

PRD内容:
${prdContent}

**重要：必须严格按照以下JSON格式返回结果：**

示例输出：
{
  "requirements": [
    {
      "id": "REQ-001",
      "title": "用户注册功能",
      "description": "系统需要支持用户通过邮箱注册账户，包括邮箱验证和密码设置功能",
      "category": "functional",
      "priority": "high",
      "scope": "core",
      "keywords": ["用户注册", "邮箱验证", "账户管理"],
      "dependencies": []
    },
    {
      "id": "REQ-002",
      "title": "数据库性能要求",
      "description": "系统响应时间必须小于2秒，支持1000+并发用户",
      "category": "non-functional",
      "priority": "high",
      "scope": "core",
      "keywords": ["性能", "响应时间", "并发"],
      "dependencies": ["REQ-001"]
    },
    {
      "id": "REQ-003",
      "title": "API接口设计",
      "description": "提供RESTful API接口供第三方集成，包含认证和授权机制",
      "category": "technical",
      "priority": "medium",
      "scope": "extended",
      "keywords": ["API", "REST", "认证", "授权"],
      "dependencies": ["REQ-001"]
    }
  ],
  "metadata": {
    "projectName": "示例项目",
    "version": "1.0.0",
    "analyzedAt": "2025-07-15T10:00:00.000Z",
    "totalRequirements": 3,
    "coreRequirements": 2,
    "extendedRequirements": 1,
    "optionalRequirements": 0
  }
}

字段说明：
- category: 只能是 "functional", "non-functional", "technical", "business" 之一
- priority: 只能是 "high", "medium", "low" 之一
- scope: 只能是 "core", "extended", "optional" 之一
- dependencies: 数组，包含依赖的其他需求ID
- metadata中的数字字段必须准确计算

请严格按照上述JSON格式和示例返回分析结果。确保：
1. 每个需求都有完整的字段信息
2. category字段只能是: functional, non-functional, technical, business 中的一个
3. priority字段只能是: high, medium, low 中的一个
4. scope字段只能是: core, extended, optional 中的一个
5. metadata中的数字字段要准确计算
6. 返回有效的JSON格式，不要包含任何其他文本
7. 只返回JSON数据，不要添加任何解释或前缀

你的输出将被直接解析为JSON，所以必须是有效的JSON格式。`;

    try {
      // 检查是否处于测试模式
      const isTestMode = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';

      if (isTestMode) {
        this.logger.info('Running in test mode, using mock AI response');
        // 返回模拟数据用于测试
        return this._getMockAnalysisResult(prdFilePath);
      }

      this.logger.info('Calling AI service for PRD analysis');

      // 捕获原始响应
      let rawResponse;
      try {
        rawResponse = await generateObjectService({
          role: 'main',
          schema: PrdAnalysisSchema,
          objectName: 'prd_analysis',
          systemPrompt,
          prompt: userPrompt,
          commandName: 'analyze-prd',
          outputType: 'json'
        });
      } catch (aiError) {
        this.logger.error('AI service call failed', {
          error: aiError.message,
          stack: aiError.stack
        });

        // 尝试记录错误详情
        if (aiError.response) {
          this.logger.error('AI error response:', JSON.stringify(aiError.response, null, 2));
        }

        throw aiError;
      }

      const response = rawResponse;

      // 详细打印AI返回的原始响应
      this.logger.info('=== AI Service Raw Response ===');
      this.logger.info(`Response type: ${typeof response}`);
      this.logger.info(`Response keys: ${response ? Object.keys(response).join(', ') : 'N/A'}`);

      if (response) {
        this.logger.info('Full response structure:');
        this._prettyPrintObject(response, 'response');

        if (response.data) {
          this.logger.info('Response.data type:', typeof response.data);
          this.logger.info('Response.data structure:');
          this._prettyPrintObject(response.data, 'response.data');

          // 如果data是字符串，尝试解析为JSON
          if (typeof response.data === 'string') {
            this.logger.info('Attempting to parse response.data as JSON...');
            try {
              const parsed = JSON.parse(response.data);
              this.logger.info('Successfully parsed JSON:');
              this._prettyPrintObject(parsed, 'parsed JSON');
            } catch (parseError) {
              this.logger.error('Failed to parse response.data as JSON:', parseError.message);
              this.logger.info('Raw string content (first 500 chars):');
              this.logger.info(response.data.substring(0, 500));
              if (response.data.length > 500) {
                this.logger.info(`... (truncated, total length: ${response.data.length})`);
              }
            }
          }
        } else {
          this.logger.warn('Response.data is missing or null');
        }

        if (response.error) {
          this.logger.error('Response contains error:');
          this._prettyPrintObject(response.error, 'response.error');
        }

        // 检查其他可能的字段
        const otherKeys = Object.keys(response).filter(key => !['data', 'error'].includes(key));
        if (otherKeys.length > 0) {
          this.logger.info('Other response fields:', otherKeys.join(', '));
          otherKeys.forEach(key => {
            this.logger.info(`${key}:`, response[key]);
          });
        }
      } else {
        this.logger.error('Response is null or undefined');
      }
      this.logger.info('=== End AI Response Debug ===');

      // 检查响应格式
      if (!response || (!response.data && !response.mainResult)) {
        this.logger.error('AI service returned invalid response format - missing response.data or response.mainResult');
        throw new Error('AI service returned invalid response format');
      }

      // 获取实际数据 - 优先使用mainResult，回退到data
      const analysis = response.mainResult || response.data;

      // 确保analysis有基本结构
      if (!analysis.requirements) {
        analysis.requirements = [];
      }

      // 初始化或更新元数据
      analysis.metadata = {
        ...(analysis.metadata || {}),
        analyzedAt: new Date().toISOString(),
        totalRequirements: analysis.requirements.length,
        coreRequirements: analysis.requirements.filter(r => r.scope === 'core').length,
        extendedRequirements: analysis.requirements.filter(r => r.scope === 'extended').length,
        optionalRequirements: analysis.requirements.filter(r => r.scope === 'optional').length
      };

      return analysis;

    } catch (error) {
      this.logger.error('AI analysis failed', { error: error.message });
      throw new Error(`PRD AI analysis failed: ${error.message}`);
    }
  }

  /**
   * 保存分析结果
   */
  async _saveAnalysis(projectPath, analysis) {
    const analysisDir = path.join(projectPath, '.taskmaster', 'analysis');
    await fs.mkdir(analysisDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const analysisPath = path.join(analysisDir, `prd-requirements-${timestamp}.json`);

    await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2), 'utf8');

    // 同时保存为最新版本
    const latestPath = path.join(analysisDir, 'prd-requirements-latest.json');
    await fs.writeFile(latestPath, JSON.stringify(analysis, null, 2), 'utf8');

    return analysisPath;
  }

  /**
   * 美化打印对象，用于调试
   */
  _prettyPrintObject(obj, label = 'object') {
    try {
      const jsonStr = JSON.stringify(obj, null, 2);
      this.logger.info(`${label} (${typeof obj}):`);

      // 如果JSON太长，分行打印
      if (jsonStr.length > 1000) {
        this.logger.info(`${label} is large (${jsonStr.length} chars), printing first 1000 chars:`);
        this.logger.info(jsonStr.substring(0, 1000));
        this.logger.info('... (truncated)');
      } else {
        this.logger.info(jsonStr);
      }
    } catch (error) {
      this.logger.error(`Failed to stringify ${label}:`, error.message);
      this.logger.info(`${label} toString():`, obj.toString());
    }
  }

  /**
   * 获取项目的PRD需求基线
   */
  async getRequirementsBaseline(projectPath) {
    try {
      const latestPath = path.join(projectPath, '.taskmaster', 'analysis', 'prd-requirements-latest.json');
      const content = await fs.readFile(latestPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // 没有分析结果
      }
      throw error;
    }
  }

  /**
   * 根据关键词匹配需求
   */
  matchRequirements(requirements, keywords) {
    const matches = [];
    
    for (const requirement of requirements) {
      let score = 0;
      
      // 检查标题匹配
      for (const keyword of keywords) {
        if (requirement.title.toLowerCase().includes(keyword.toLowerCase())) {
          score += 3;
        }
        if (requirement.description.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2;
        }
        if (requirement.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))) {
          score += 1;
        }
      }
      
      if (score > 0) {
        matches.push({
          requirement,
          score,
          matchedKeywords: keywords.filter(k => 
            requirement.title.toLowerCase().includes(k.toLowerCase()) ||
            requirement.description.toLowerCase().includes(k.toLowerCase()) ||
            requirement.keywords.some(rk => rk.toLowerCase().includes(k.toLowerCase()))
          )
        });
      }
    }
    
    // 按匹配分数排序
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * 检查需求覆盖度
   */
  checkRequirementsCoverage(requirements, tasks) {
    const coverage = {
      total: requirements.length,
      covered: 0,
      uncovered: [],
      coverage_percentage: 0
    };

    for (const requirement of requirements) {
      const iscovered = tasks.some(task => 
        task.prdRequirementIds && task.prdRequirementIds.includes(requirement.id)
      );

      if (iscovered) {
        coverage.covered++;
      } else {
        coverage.uncovered.push(requirement);
      }
    }

    coverage.coverage_percentage = (coverage.covered / coverage.total * 100).toFixed(2);
    return coverage;
  }
}

export default PrdAnalyzer;
