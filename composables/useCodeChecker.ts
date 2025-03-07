import { ref, computed } from 'vue';
import type { CheckResult, CheckType, FileCheckRequest, ModelInfo, ModelParameters, ModelProvider, ProviderInfo } from '~/types';
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
  
  // 模型参数
  const modelParameters = ref<ModelParameters>({
    temperature: 0.3,
    top_p: 0.95,
    max_tokens: 2048
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
  async function callCodeCheckApi(codeContent: string, fileName: string): Promise<{results: string, isValidJson: boolean}> {
    try {
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
      });
      
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
      console.error(`处理文件 ${fileName} 时出错:`, error);
      throw error;
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
      
      // 一次处理一个文件
      for (let i = 0; i < selectedFiles.value.length; i++) {
        const file = selectedFiles.value[i];
        
        try {
          // 更新为处理中状态
          checkResults.value[i] = {
            ...checkResults.value[i],
            status: 'processing'
          };
          
          // 读取文件内容
          const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
          
          // 调用API进行代码检查
          const { results, isValidJson } = await callCodeCheckApi(content, file.name);
          
          // 更新结果
          checkResults.value[i] = {
            ...checkResults.value[i],
            content,
            results,
            isValidJson,
            status: 'success'
          };
        } catch (error) {
          // 处理错误
          checkResults.value[i] = {
            ...checkResults.value[i],
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
      
    } catch (error) {
      console.error('检查过程中出错:', error);
    } finally {
      isProcessing.value = false;
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
      modelParameters: modelParameters.value,
      defaultPrompt: defaultPrompt.value,
      effectivePrompt: effectivePrompt.value,
      hasFiles: hasFiles.value,
      hasResults: hasResults.value,
      providers: providers.value,
      availableModels: availableModels.value
    };
  }

  return {
    // 原始响应式对象
    isProcessing,
    isLoadingModels,
    selectedFiles,
    checkResults,
    currentModelProvider,
    currentModelId,
    currentCheckType,
    customPrompt,
    modelParameters,
    defaultPrompt,
    effectivePrompt,
    hasFiles,
    hasResults,
    providers,
    
    // 计算属性
    availableModels,
    currentProvider,
    
    // 方法
    loadModels,
    addFile,
    addFiles,
    removeFile,
    clearFiles,
    startCheck,
    
    // 新增的setter方法
    setModelProvider,
    setModelId,
    setCheckType,
    setModelParameters,
    setCustomPrompt,
    
    // 获取当前状态
    getState
  };
} 