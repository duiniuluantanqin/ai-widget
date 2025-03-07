import type { CheckType } from '~/types';

/**
 * 大语言模型基类
 * 提供通用的接口定义和基础实现
 */
export abstract class BaseModel {
  constructor(protected apiKey: string, protected apiUrl: string) {}

  /**
   * 执行代码检查的方法
   * @param code 代码内容
   * @param checkType 检查类型
   * @param prompt 自定义提示语
   * @param params 模型参数
   * @param modelId 模型ID或名称
   */
  abstract checkCode(
    code: string,
    checkType: CheckType,
    prompt: string,
    params: {
      temperature: number;
      top_p: number;
      max_tokens: number;
    },
    modelId?: string
  ): Promise<string>;
} 