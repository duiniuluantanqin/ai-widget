import OpenAI from 'openai';
import type { CheckType } from '~/types';
import { BaseModel } from './base-model';
import { DEFAULT_PROMPTS } from '~/types';

/**
 * 兼容OpenAI接口的模型实现
 * 适用于Deepseek、SiliconFlow等兼容OpenAI接口的模型
 */
export class OpenAICompatibleModel extends BaseModel {
  private client: OpenAI;

  constructor(apiKey: string, apiUrl: string) {
    super(apiKey, apiUrl);
    
    // 创建OpenAI客户端，添加dangerouslyAllowBrowser选项
    // 注意：在生产环境中应确保只在服务器端使用
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: apiUrl,
      dangerouslyAllowBrowser: true // 在开发环境中使用，生产环境应当移除
    });
  }

  /**
   * 执行代码检查
   * @param code 代码内容
   * @param checkType 检查类型
   * @param prompt 自定义提示语(可选)
   * @param params 模型参数
   * @param modelId 模型ID或名称
   * @param abortController 用于终止请求的控制器
   * @returns 检查结果
   */
  async checkCode(
    code: string,
    checkType: CheckType,
    prompt: string = DEFAULT_PROMPTS[checkType],
    params: {
      temperature: number;
      top_p: number;
      max_tokens: number;
      presence_penalty?: number;
      frequency_penalty?: number;
    },
    modelId: string = 'default',
    abortController?: AbortController
  ): Promise<string> {
    try {
      const finalPrompt = `${prompt}\n\n代码内容:\n\`\`\`\n${code}\n\`\`\``;
      
      const response = await this.client.chat.completions.create({
        model: modelId, // 使用指定的模型ID
        messages: [
          {
            role: 'system',
            content: '你是一个专业的代码审查助手，专注于发现代码问题并提供改进建议。'
          },
          {
            role: 'user',
            content: finalPrompt
          }
        ],
        temperature: params.temperature,
        top_p: params.top_p,
        max_tokens: params.max_tokens,
        presence_penalty: params.presence_penalty || 0,
        frequency_penalty: params.frequency_penalty || 0,
      }, { signal: abortController?.signal });

      return response.choices[0]?.message.content || '未能获取有效结果';
    } catch (error) {
      // 如果是因为请求被终止而失败，抛出特定错误
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求已被用户终止');
      }
      
      console.error('模型API调用失败:', error);
      throw new Error(`API调用失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 