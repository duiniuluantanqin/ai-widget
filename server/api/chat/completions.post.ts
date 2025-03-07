import { ModelFactory } from '~/models';
import type { CheckType, ModelProvider } from '~/types';
import { DEFAULT_PROMPTS } from '~/types';

/**
 * 聊天完成API
 * 处理代码检查请求并返回结果
 */
export default defineEventHandler(async (event) => {
  try {
    // 获取请求体
    const body = await readBody(event);
    
    // 提取参数
    const { 
      code, 
      checkType, 
      modelProvider, 
      modelId,
      prompt, 
      parameters 
    } = body as {
      code: string;
      checkType: CheckType;
      modelProvider: ModelProvider;
      modelId?: string;
      prompt?: string;
      parameters: {
        temperature: number;
        top_p: number;
        max_tokens: number;
      };
    };
    
    // 验证参数
    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少代码内容'
      });
    }
    
    if (!checkType) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少检查类型'
      });
    }
    
    if (!modelProvider) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少模型提供者'
      });
    }
    
    // 获取配置
    const config = useRuntimeConfig();
    
    // 根据模型提供者获取对应的API密钥和URL
    let apiKey = '';
    let apiUrl = '';
    let modelName = modelId || 'default'; // 使用指定的模型ID或默认模型
    
    if (modelProvider === 'deepseek') {
      apiKey = config.deepseekApiKey as string || '';
      apiUrl = config.deepseekApiUrl as string || 'https://api.deepseek.com';
    } else if (modelProvider === 'siliconflow') {
      apiKey = config.siliconflowApiKey as string || '';
      apiUrl = config.siliconflowApiUrl as string || 'https://api.siliconflow.com';
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: `不支持的模型提供者: ${modelProvider}`
      });
    }
    
    // 检查API密钥
    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: `缺少${modelProvider}的API密钥`
      });
    }
    
    // 创建模型实例
    const model = ModelFactory.createModel(modelProvider, apiKey, apiUrl);
    
    // 获取最终使用的提示词
    const actualPrompt = prompt || DEFAULT_PROMPTS[checkType];
    
    // 打印请求和提示词信息，用于调试
    console.log('---- 代码检查请求 ----');
    console.log(`模型提供者: ${modelProvider}`);
    console.log(`模型ID: ${modelName}`);
    console.log(`检查类型: ${checkType}`);
    console.log(`参数: ${JSON.stringify(parameters)}`);
    console.log('\n---- 完整提示词 ----');
    console.log(actualPrompt);
    console.log('\n---- 代码内容 (前50个字符) ----');
    console.log(code.substring(0, 50) + (code.length > 50 ? '...' : ''));
    console.log('------------------------');
    
    // 执行代码检查
    const results = await model.checkCode(
      code,
      checkType,
      actualPrompt,
      parameters,
      modelName // 传递模型ID/名称
    );
    
    // 打印模型返回的原始结果，用于调试
    console.log('\n---- 模型原始返回结果 ----');
    console.log(results);
    console.log('------------------------');
    
    // 尝试验证结果是否为有效JSON，但即使不是也返回原始结果
    let formattedResults = results;
    let isValidJson = false;
    
    try {
      // 尝试解析结果 - 确保是有效的JSON
      const jsonResult = JSON.parse(results);
      // 确保结果是数组格式
      if (!Array.isArray(jsonResult)) {
        // 如果返回的不是数组，尝试将其包装为数组
        formattedResults = JSON.stringify([jsonResult]);
      } else {
        // 如果已经是数组，重新格式化以确保格式正确
        formattedResults = JSON.stringify(jsonResult);
      }
      isValidJson = true;
    } catch (error) {
      // 如果无法解析为JSON，尝试从文本中提取JSON
      const jsonMatch = results.match(/\[.*\]/s) || results.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          // 尝试解析提取出的JSON部分
          const extractedJson = JSON.parse(jsonMatch[0]);
          formattedResults = JSON.stringify(
            Array.isArray(extractedJson) ? extractedJson : [extractedJson]
          );
          isValidJson = true;
        } catch (e) {
          // 如果仍然无法解析，返回原始结果
          formattedResults = results;
          isValidJson = false;
        }
      } else {
        // 如果无法提取JSON，返回原始结果
        formattedResults = results;
        isValidJson = false;
      }
    }
    
    // 返回结果
    return {
      status: 'success',
      results: formattedResults,
      isValidJson: isValidJson,
      originalResults: isValidJson ? undefined : results // 如果不是有效JSON，也返回原始结果
    };
  } catch (error: any) {
    // 错误处理
    console.error('API处理错误:', error);
    
    if (error.statusCode) {
      // 已创建的HTTP错误
      throw error;
    } else {
      // 其他错误
      throw createError({
        statusCode: 500,
        statusMessage: error instanceof Error ? error.message : '服务器内部错误'
      });
    }
  }
}); 