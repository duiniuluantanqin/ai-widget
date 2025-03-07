import type { ModelProvider } from '~/types';
import { BaseModel } from './base-model';
import { OpenAICompatibleModel } from './openai-compatible-model';

/**
 * 模型工厂类，用于创建不同的模型实例
 * 支持扩展新的模型类型和提供者
 */
export class ModelFactory {
  /**
   * 创建模型实例
   * @param provider 模型提供者
   * @param apiKey API密钥
   * @param apiUrl API地址
   * @returns 模型实例
   */
  static createModel(provider: ModelProvider, apiKey: string, apiUrl: string): BaseModel {
    switch (provider) {
      case 'deepseek':
      case 'siliconflow':
        return new OpenAICompatibleModel(apiKey, apiUrl);
      default:
        throw new Error(`不支持的模型提供者: ${provider}`);
    }
  }
} 