import { Mutex } from 'async-mutex';
import type { CheckResult, FileCheckRequest } from '~/types';
import { FileUtils } from './file-utils';
import { ModelFactory } from '~/models';

/**
 * 线程管理器
 * 用于并发控制和执行多个文件的代码检查
 */
export class ThreadManager {
  private mutex = new Mutex();
  private results: CheckResult[] = [];
  private maxConcurrent: number;

  /**
   * 构造函数
   * @param maxConcurrent 最大并发数
   */
  constructor(maxConcurrent: number = navigator.hardwareConcurrency || 4) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 处理多个文件检查请求
   * @param requests 检查请求列表
   * @param onProgress 进度回调函数
   * @returns 检查结果列表
   */
  async processFiles(
    requests: FileCheckRequest[],
    onProgress?: (result: CheckResult) => void
  ): Promise<CheckResult[]> {
    this.results = requests.map(req => ({
      fileName: req.file.name,
      content: '', // 将在处理时填充
      checkType: req.checkType,
      modelProvider: req.modelProvider,
      status: 'pending',
      results: ''
    }));

    // 创建任务队列
    const queue = [...requests.keys()];
    const runningTasks = new Set<number>();
    
    // 处理队列
    while (queue.length > 0 || runningTasks.size > 0) {
      // 启动新任务直到达到并发上限
      while (queue.length > 0 && runningTasks.size < this.maxConcurrent) {
        const index = queue.shift()!;
        runningTasks.add(index);
        
        // 不使用await，允许同时启动多个任务
        this.processFile(requests[index], index)
          .then(result => {
            if (onProgress) {
              onProgress(result);
            }
          })
          .finally(() => {
            runningTasks.delete(index);
          });
      }
      
      // 短暂等待以避免CPU占用过高
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.results;
  }

  /**
   * 处理单个文件检查请求
   * @param request 检查请求
   * @param index 结果数组中的索引
   * @returns 检查结果
   */
  private async processFile(request: FileCheckRequest, index: number): Promise<CheckResult> {
    // 更新状态为处理中
    await this.mutex.runExclusive(() => {
      this.results[index].status = 'processing';
    });

    try {
      // 读取文件内容
      const content = await FileUtils.readFileAsText(request.file);
      
      // 创建模型实例并执行检查
      const runtimeConfig = useRuntimeConfig();
      
      let apiKey = '';
      let apiUrl = '';
      
      if (request.modelProvider === 'deepseek') {
        apiKey = runtimeConfig.deepseekApiKey as string || '';
        apiUrl = runtimeConfig.deepseekApiUrl as string || 'https://api.deepseek.com';
      } else if (request.modelProvider === 'siliconflow') {
        apiKey = runtimeConfig.siliconflowApiKey as string || '';
        apiUrl = runtimeConfig.siliconflowApiUrl as string || 'https://api.siliconflow.com';
      }
      
      const model = ModelFactory.createModel(
        request.modelProvider,
        apiKey,
        apiUrl
      );
      
      // 执行代码检查
      const results = await model.checkCode(
        content,
        request.checkType,
        request.customPrompt,
        request.modelParameters
      );
      
      // 更新结果
      await this.mutex.runExclusive(() => {
        this.results[index] = {
          ...this.results[index],
          content,
          results,
          status: 'success'
        };
      });
      
      return this.results[index];
    } catch (error) {
      // 处理错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await this.mutex.runExclusive(() => {
        this.results[index] = {
          ...this.results[index],
          error: errorMessage,
          status: 'error'
        };
      });
      
      return this.results[index];
    }
  }
} 