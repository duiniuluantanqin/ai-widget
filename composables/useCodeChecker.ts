import { ref, computed } from 'vue';
import type { CheckResult, CheckType, FileCheckRequest, ModelInfo, ModelParameters, ModelProvider, ProcessingConfig, ProviderInfo } from '~/types';
import { DEFAULT_PROMPTS } from '~/types';
import { ThreadManager } from '~/utils';

/**
 * 代码检查组合函数
 * 提供文件上传、代码检查和结果管理功能
 */
export function useCodeChecker() {
  // 状态
  const isProcessing = ref(false);
  const isLoadingModels = ref(false);
  const selectedFiles = ref<File[]>([]);
  const checkResults = ref<CheckResult[]>([]);
  const currentModelProvider = ref<ModelProvider>('deepseek');
  const currentModelId = ref<string>('');
  const currentCheckType = ref<CheckType>('spelling');
  const customPrompt = ref<string>('');
  const providers = ref<ProviderInfo[]>([]);
  // 处理控制标志
  const shouldContinueProcessing = ref(true);
  
  // 存储活动请求的控制器
  const activeAbortControllers = new Map<number, AbortController>();
  
  // 模型参数
  const modelParameters = ref<ModelParameters>({
    temperature: 0.0,
    top_p: 1.0,
    max_tokens: 4000,
    presence_penalty: 0.0,
    frequency_penalty: 0.0
  });
  
  // 处理配置
  const processingConfig = ref<ProcessingConfig>({
    concurrentTasks: 10 // 默认同时处理10个文件
  });

  // 计算属性
  const defaultPrompt = computed(() => DEFAULT_PROMPTS[currentCheckType.value]);
  const effectivePrompt = computed(() => customPrompt.value || defaultPrompt.value);
  const hasFiles = computed(() => selectedFiles.value.length > 0);
  const hasResults = computed(() => checkResults.value.length > 0);
  const currentProvider = computed(() => providers.value.find(p => p.id === currentModelProvider.value));
  const availableModels = computed(() => currentProvider.value?.models || []);
  
  /**
   * 调用API检查代码
   * @param codeContent 代码内容
   * @param fileName 文件名
   * @returns 检查结果
   */
  async function callCodeCheckApi(codeContent: string, fileName: string, fileIndex: number): Promise<{results: string, isValidJson: boolean}> {
    try {
      // 创建AbortController
      const controller = new AbortController();
      // 存储控制器以便后续可以中止请求
      activeAbortControllers.set(fileIndex, controller);
      
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeContent,
          checkType: currentCheckType.value,
          modelProvider: currentModelProvider.value,
          modelId: currentModelId.value,
          prompt: customPrompt.value || undefined,
          parameters: modelParameters.value
        }),
        signal: controller.signal // 添加信号以支持中止
      });
      
      // 请求完成后移除控制器
      activeAbortControllers.delete(fileIndex);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.statusMessage || 
          `API请求失败: ${response.status} ${response.statusText}`
        );
      }
      
      const data = await response.json();
      return {
        results: data.results,
        isValidJson: data.isValidJson
      };
    } catch (error) {
      // 移除控制器
      activeAbortControllers.delete(fileIndex);
      
      // 如果是中止错误，则抛出特定错误
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('请求已被用户终止');
      }
      
      console.error(`处理文件 ${fileName} 时出错:`, error);
      throw error;
    }
  }
  
  /**
   * 处理单个文件
   * @param fileIndex 文件索引
   */
  async function processFile(fileIndex: number): Promise<void> {
    // 如果处理已被终止，则直接返回
    if (!shouldContinueProcessing.value) return;
    
    const file = selectedFiles.value[fileIndex];
    
    try {
      // 更新为处理中状态
      checkResults.value[fileIndex] = {
        ...checkResults.value[fileIndex],
        status: 'processing'
      };
      
      // 读取文件内容
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      
      // 如果处理已被终止，则不继续调用API
      if (!shouldContinueProcessing.value) {
        checkResults.value[fileIndex] = {
          ...checkResults.value[fileIndex],
          status: 'error',
          error: '用户终止了处理'
        };
        return;
      }
      
      // 调用API进行代码检查
      const { results, isValidJson } = await callCodeCheckApi(content, file.name, fileIndex);
      
      // 如果处理已被终止，则不更新结果
      if (!shouldContinueProcessing.value) {
        checkResults.value[fileIndex] = {
          ...checkResults.value[fileIndex],
          status: 'error',
          error: '用户终止了处理'
        };
        return;
      }
      
      // 更新结果
      checkResults.value[fileIndex] = {
        ...checkResults.value[fileIndex],
        content,
        results,
        isValidJson,
        status: 'success'
      };
    } catch (error) {
      // 处理错误
      checkResults.value[fileIndex] = {
        ...checkResults.value[fileIndex],
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 加载模型提供商和模型列表
   */
  async function loadModels() {
    isLoadingModels.value = true;
    
    try {
      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      providers.value = data.providers || [];
      
      // 如果有提供商但没有选择
      if (providers.value.length > 0 && !currentModelProvider.value) {
        currentModelProvider.value = providers.value[0].id;
      }
      
      // 如果有模型但没有选择
      if (availableModels.value.length > 0 && !currentModelId.value) {
        currentModelId.value = availableModels.value[0].id;
      }
    } catch (error) {
      console.error('加载模型列表失败:', error);
    } finally {
      isLoadingModels.value = false;
    }
  }
  
  /**
   * 添加单个文件
   * @param file 文件对象
   */
  function addFile(file: File) {
    if (!file) return;
    selectedFiles.value = [...selectedFiles.value, file];
  }
  
  /**
   * 添加文件
   * @param files 文件列表
   */
  function addFiles(files: FileList | null) {
    if (!files) return;
    
    // 转换FileList为数组并添加到已选文件列表
    const newFiles = Array.from(files);
    selectedFiles.value = [...selectedFiles.value, ...newFiles];
  }
  
  /**
   * 移除文件
   * @param index 文件索引
   */
  function removeFile(index: number) {
    selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index);
    
    // 如果有相应的检查结果也一并删除
    if (checkResults.value[index]) {
      checkResults.value = checkResults.value.filter((_, i) => i !== index);
    }
  }
  
  /**
   * 清空所有文件
   */
  function clearFiles() {
    selectedFiles.value = [];
    checkResults.value = [];
  }
  
  /**
   * 开始检查
   */
  async function startCheck() {
    if (!hasFiles.value || isProcessing.value) return;
    
    isProcessing.value = true;
    shouldContinueProcessing.value = true; // 重置处理控制标志
    checkResults.value = [];
    
    try {
      // 为每个文件创建初始的结果对象
      checkResults.value = selectedFiles.value.map(file => ({
        fileName: file.name,
        content: '',  // 会在处理时填充
        checkType: currentCheckType.value,
        modelProvider: currentModelProvider.value, 
        status: 'pending',
        results: '',
        isValidJson: true  // 默认假设是有效的JSON
      }));
      
      // 创建文件索引数组
      const fileIndices = Array.from({ length: selectedFiles.value.length }, (_, i) => i);
      
      // 使用并行处理
      await processFilesInParallel(fileIndices, processingConfig.value.concurrentTasks);
      
    } catch (error) {
      console.error('检查过程中出错:', error);
    } finally {
      isProcessing.value = false;
    }
  }

  /**
   * 终止检查
   */
  function stopCheck() {
    if (isProcessing.value) {
      shouldContinueProcessing.value = false;
      
      // 中止所有活动的API请求
      activeAbortControllers.forEach((controller, index) => {
        console.log(`中止文件索引 ${index} 的请求`);
        controller.abort();
      });
      
      // 清空控制器映射
      activeAbortControllers.clear();
      
      // 将所有pending状态的任务标记为已终止
      checkResults.value.forEach(result => {
        if (result.status === 'pending' || result.status === 'processing') {
          result.status = 'error';
          result.error = '用户终止了处理';
        }
      });
      
      // 重置处理状态
      isProcessing.value = false;
      
      console.log('用户终止了处理，已中止所有活动请求');
    }
  }

  /**
   * 设置模型提供者
   */
  function setModelProvider(provider: ModelProvider) {
    currentModelProvider.value = provider;
    
    // 自动选择第一个可用模型
    if (availableModels.value.length > 0) {
      currentModelId.value = availableModels.value[0].id;
    } else {
      currentModelId.value = '';
    }
  }
  
  /**
   * 设置模型ID
   */
  function setModelId(modelId: string) {
    currentModelId.value = modelId;
  }

  /**
   * 设置检查类型
   */
  function setCheckType(type: CheckType) {
    currentCheckType.value = type;
  }

  /**
   * 设置模型参数
   */
  function setModelParameters(params: ModelParameters) {
    modelParameters.value = params;
  }

  /**
   * 设置自定义提示语
   */
  function setCustomPrompt(prompt: string) {
    customPrompt.value = prompt;
  }
  
  /**
   * 设置处理配置
   */
  function setProcessingConfig(config: Partial<ProcessingConfig>) {
    processingConfig.value = {
      ...processingConfig.value,
      ...config
    };
  }

  /**
   * 获取当前状态
   */
  function getState() {
    return {
      isProcessing: isProcessing.value,
      isLoadingModels: isLoadingModels.value,
      selectedFiles: selectedFiles.value,
      checkResults: checkResults.value,
      currentModelProvider: currentModelProvider.value,
      currentModelId: currentModelId.value,
      currentCheckType: currentCheckType.value,
      customPrompt: customPrompt.value,
      defaultPrompt: defaultPrompt.value,
      modelParameters: modelParameters.value,
      processingConfig: processingConfig.value,
      providers: providers.value,
      hasFiles: hasFiles.value,
      hasResults: hasResults.value
    };
  }

  /**
   * 并行处理多个文件
   * @param fileIndices 文件索引数组
   * @param concurrentTasks 并行任务数
   */
  async function processFilesInParallel(fileIndices: number[], concurrentTasks: number): Promise<void> {
    // 创建任务队列
    const queue = [...fileIndices];
    const activePromises = new Map<number, Promise<void>>();
    
    // 处理队列中的任务
    async function processQueue() {
      // 检查是否应该继续处理
      if (!shouldContinueProcessing.value) {
        // 清空队列
        queue.length = 0;
        // 不等待活动任务完成，直接返回
        return;
      }
      
      // 当队列为空且没有活动任务时，处理完成
      if (queue.length === 0 && activePromises.size === 0) {
        return;
      }
      
      // 当队列不为空且活动任务数小于并行任务数时，启动新任务
      while (queue.length > 0 && activePromises.size < concurrentTasks && shouldContinueProcessing.value) {
        const fileIndex = queue.shift()!;
        
        // 创建处理任务
        const promise = processFile(fileIndex).finally(() => {
          // 任务完成后从活动任务中移除
          activePromises.delete(fileIndex);
          // 继续处理队列，但只有在应该继续处理时才继续
          if (shouldContinueProcessing.value) {
            return processQueue();
          }
        });
        
        // 添加到活动任务
        activePromises.set(fileIndex, promise);
      }
      
      // 等待任意一个任务完成，但只有在应该继续处理时才等待
      if (activePromises.size > 0 && shouldContinueProcessing.value) {
        await Promise.race(activePromises.values());
      }
    }
    
    // 开始处理队列
    try {
      await processQueue();
    } catch (error) {
      console.error('并行处理过程中出错:', error);
      // 确保在出错时也能重置处理状态
      shouldContinueProcessing.value = false;
    }
  }

  /**
   * 更新单个检查结果
   * @param index 结果索引
   * @param result 新的结果对象
   */
  function updateCheckResult(index: number, result: Partial<CheckResult>) {
    if (index >= 0 && index < checkResults.value.length) {
      checkResults.value[index] = {
        ...checkResults.value[index],
        ...result
      };
    }
  }

  return {
    // 状态
    isProcessing,
    isLoadingModels,
    selectedFiles,
    checkResults,
    currentModelProvider,
    currentModelId,
    currentCheckType,
    customPrompt,
    providers,
    modelParameters,
    processingConfig,
    
    // 计算属性
    defaultPrompt,
    effectivePrompt,
    hasFiles,
    hasResults,
    
    // 方法
    loadModels,
    addFile,
    addFiles,
    removeFile,
    clearFiles,
    startCheck,
    stopCheck,
    setModelProvider,
    setModelId,
    setCheckType,
    setModelParameters,
    setCustomPrompt,
    setProcessingConfig,
    getState,
    processFilesInParallel,
    updateCheckResult
  };
} 