import type { ProviderInfo, ModelInfo } from '~/types';
import OpenAI from 'openai';

/**
 * 获取模型提供商和模型列表
 * 返回所有支持的模型提供商及其模型列表
 */
export default defineEventHandler(async (event) => {
  try {
    // 获取配置以检查API密钥是否存在
    const config = useRuntimeConfig();
    
    // 检查API密钥是否存在
    const hasDeepseekKey = !!config.deepseekApiKey;
    const hasSiliconflowKey = !!config.siliconflowApiKey;
    
    // 如果没有配置任何API密钥，提供帮助信息
    if (!hasDeepseekKey && !hasSiliconflowKey) {
      console.warn('未找到任何API密钥，请在.env文件中配置以下变量:');
      console.warn('DEEPSEEK_API_KEY=你的DeepSeek API密钥');
      console.warn('DEEPSEEK_API_URL=https://api.deepseek.com');
      console.warn('SILICONFLOW_API_KEY=你的SiliconFlow API密钥');
      console.warn('SILICONFLOW_API_URL=https://api.siliconflow.com');
    }
    
    // 定义提供商列表
    const providers: ProviderInfo[] = [];
    
    // DeepSeek提供商
    if (hasDeepseekKey) {
      try {
        // 创建OpenAI客户端实例用于DeepSeek
        const deepseekClient = new OpenAI({
          apiKey: config.deepseekApiKey as string,
          baseURL: config.deepseekApiUrl as string
        });
        
        // 获取模型列表
        const modelsResponse = await deepseekClient.models.list();
        
        // 转换为我们的模型格式 - 简化信息
        const models: ModelInfo[] = modelsResponse.data.map(model => ({
          id: model.id,
          name: model.id  // 仅保留基本信息
        }));
        
        // 添加到提供商列表
        providers.push({
          id: 'deepseek',
          name: 'DeepSeek',
          models: models.length > 0 ? models : [
            {
              id: 'deepseek-coder',
              name: 'DeepSeek Coder'
            }
          ]
        });
      } catch (error) {
        console.error('获取DeepSeek模型列表失败:', error);
        
        // 添加默认DeepSeek模型
        providers.push({
          id: 'deepseek',
          name: 'DeepSeek',
          models: [
            {
              id: 'deepseek-coder',
              name: 'DeepSeek Coder'
            }
          ]
        });
      }
    }
    
    // Silicon Flow提供商
    if (hasSiliconflowKey) {
      try {
        // 创建OpenAI客户端实例用于SiliconFlow
        const siliconflowClient = new OpenAI({
          apiKey: config.siliconflowApiKey as string,
          baseURL: config.siliconflowApiUrl as string
        });
        
        // 获取模型列表
        const modelsResponse = await siliconflowClient.models.list();
        
        // 转换为我们的模型格式 - 简化信息
        const models: ModelInfo[] = modelsResponse.data.map(model => ({
          id: model.id,
          name: model.id  // 仅保留基本信息
        }));
        
        // 添加到提供商列表
        providers.push({
          id: 'siliconflow',
          name: 'Silicon Flow',
          models: models.length > 0 ? models : [
            {
              id: 'internlm2-chat-7b',
              name: 'InternLM2 Chat'
            }
          ]
        });
      } catch (error) {
        console.error('获取SiliconFlow模型列表失败:', error);
        
        // 添加默认SiliconFlow模型
        providers.push({
          id: 'siliconflow',
          name: 'Silicon Flow',
          models: [
            {
              id: 'internlm2-chat-7b',
              name: 'InternLM2 Chat'
            }
          ]
        });
      }
    }
    
    // 如果没有配置任何提供商或API获取失败
    if (providers.length === 0) {
      // 返回一些示例数据 - 简化信息
      providers.push(
        {
          id: 'deepseek',
          name: 'DeepSeek (示例)',
          models: [
            {
              id: 'deepseek-coder',
              name: 'DeepSeek Coder'
            }
          ]
        },
        {
          id: 'siliconflow',
          name: 'Silicon Flow (示例)',
          models: [
            {
              id: 'internlm2-chat-7b',
              name: 'InternLM2 Chat'
            }
          ]
        }
      );
    }
    
    return {
      providers,
      total: providers.length,
      hasApiKeys: {
        deepseek: hasDeepseekKey,
        siliconflow: hasSiliconflowKey
      }
    };
  } catch (error) {
    console.error('获取模型列表失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}); 