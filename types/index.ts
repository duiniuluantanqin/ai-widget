// 模型类型定义
export type ModelProvider = 'deepseek' | 'siliconflow';

// 检查类型定义
export type CheckType = 'spelling' | 'bugs';

// 模型信息类型 - 简化
export interface ModelInfo {
  id: string;
  name: string;
}

// 模型提供商信息 - 简化
export interface ProviderInfo {
  id: ModelProvider;
  name: string;
  models: ModelInfo[];
}

// 模型参数类型
export interface ModelParameters {
  temperature: number;
  top_p: number;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
}

// 处理配置类型
export interface ProcessingConfig {
  concurrentTasks: number; // 同时处理的文件数量
  timeout: number; // API请求超时时间（毫秒）
}

// 文件检查请求类型
export interface FileCheckRequest {
  file: File;
  checkType: CheckType;
  modelProvider: ModelProvider;
  modelId?: string; // 添加模型ID
  modelParameters: ModelParameters;
  customPrompt?: string;
}

// API响应类型
export interface CheckResponse {
  fileName: string;
  results: string;
  status: 'success' | 'error';
  error?: string;
}

// 检查结果类型
export interface CheckResult {
  fileName: string;
  content: string;
  checkType: CheckType;
  modelProvider: ModelProvider;
  results: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  isValidJson?: boolean; // 添加此字段标识结果是否为有效JSON
  requestId?: string; // 添加请求ID，用于终止特定请求
}

// 检查结果项目类型 - 用于解析后的结果项
export interface CheckResultItem {
  line: number;
  original: string;
  suggestion: string;
}

// 默认提示语定义
export const DEFAULT_PROMPTS: Record<CheckType, string> = {
  spelling: '请检查以下代码中的拼写错误和命名问题。必须以JSON数组格式返回结果，数组中每个对象表示一个问题。' +
    '每个问题对象必须包含三个字段：line（行号，数字）、original（有问题的原始代码，字符串）、suggestion（修改建议，字符串）。' +
    '例如：[{"line": 5, "original": "functoin calc()", "suggestion": "function calc()"}]。' +
    '无需返回整行代码，只需要返回拼错的单词或短语。' +
    '如果代码中未发现任何拼写错误或命名问题，则返回空数组 []。' + 
    '请勿返回任何额外的文本说明，只返回符合上述要求的JSON数组。',
  
  bugs: '请检查以下代码中的潜在bug、逻辑错误和安全问题。必须以JSON数组格式返回结果，数组中每个对象表示一个问题。' +
    '每个问题对象必须包含三个字段：line（行号，数字）、original（有问题的原始代码，字符串）、suggestion（修改建议，字符串）。' +
    '例如：[{"line": 12, "original": "if(x = 5)", "suggestion": "if(x == 5) // 使用等于比较而非赋值"}]。' +
    '如果没有发现问题，请返回空数组 []。如果代码中未发现任何拼写错误或命名问题，则返回空数组 []。' + 
    '请勿返回任何额外的文本说明，只返回符合上述要求的JSON数组。',
}; 