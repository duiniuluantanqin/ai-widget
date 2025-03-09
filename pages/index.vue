<template>
  <div class="container mx-auto px-4 py-8">
    <UContainer>
      <div class="flex flex-col">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold mb-2">代码检查工具</h1>
          <p class="text-gray-600 dark:text-gray-400">基于大语言模型的代码质量检查工具</p>
        </div>
        
        <!-- API错误提示 -->
        <UAlert
          v-if="apiError"
          class="mb-4"
          color="red"
          title="API连接错误"
          :description="apiError"
          icon="i-heroicons-exclamation-triangle"
          closable
          @close="apiError = ''"
        >
          <template #description>
            <p>{{ apiError }}</p>
            <div class="mt-2">
              <UButton size="xs" @click="retryLoadModels">重试</UButton>
            </div>
          </template>
        </UAlert>
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- 左侧设置面板 -->
          <div class="lg:col-span-4">
            <div class="sticky top-4 space-y-4">
              <!-- 模型设置 -->
              <ModelSettings
                :model="state.currentModelProvider"
                :model-id="state.currentModelId"
                :check-type="state.currentCheckType"
                :parameters="state.modelParameters"
                :prompt="state.customPrompt"
                :default-prompt="state.defaultPrompt"
                :providers="state.providers"
                :is-loading="state.isLoadingModels"
                :processing-config="state.processingConfig"
                @update:model="codeChecker.setModelProvider"
                @update:model-id="codeChecker.setModelId"
                @update:check-type="codeChecker.setCheckType"
                @update:parameters="codeChecker.setModelParameters"
                @update:prompt="codeChecker.setCustomPrompt"
                @update:processing-config="handleUpdateProcessingConfig"
              />
              
              <!-- 文件上传 -->
              <FileUploader
                :files="state.selectedFiles"
                @update:files="updateFiles"
                @remove="handleRemoveFile"
                @clear="handleClearFiles"
                @size-exceeded="handleSizeExceeded"
                @total-size-change="handleTotalSizeChange"
              />
              
              <!-- 开始检查按钮 -->
              <div class="flex flex-col">
                <UButton
                  block
                  color="blue"
                  size="lg"
                  :loading="state.isProcessing"
                  :disabled="!state.hasFiles || state.isProcessing || !state.currentModelId || isSizeExceeded"
                  @click="handleStartCheck"
                >
                  <div class="flex items-center justify-center w-full">
                    <span>{{ state.isProcessing ? '处理中...' : (isSizeExceeded ? '文件大小超限' : '开始检查') }}</span>
                    <span v-if="totalFileSize > 0 && !state.isProcessing && !isSizeExceeded" class="text-xs opacity-80 ml-2">
                      (预计花费: {{ estimatedCost }}元)
                    </span>
                  </div>
                </UButton>
              </div>
            </div>
          </div>
          
          <!-- 右侧结果面板 -->
          <div class="lg:col-span-8">
            <ResultsList 
              :results="state.checkResults" 
              :concurrent-tasks="state.processingConfig.concurrentTasks"
              @stop="handleStopCheck"
              @retry-item="retryItem"
            />
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
// 导入组件

// 导入组合函数
import { useCodeChecker } from '~/composables/useCodeChecker';
import { useToast as useNuxtToast } from '#imports';
import type { ModelProvider, CheckType, ModelParameters, ProcessingConfig, CheckResult } from '~/types';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { FileUtils } from '~/utils/file-utils';

const codeChecker = useCodeChecker();
// 获取当前状态
const state = ref(codeChecker.getState());
// 状态更新的计时器ID
let updateTimerId: number | null = null;
// API错误信息
const apiError = ref('');
// 文件大小是否超出限制
const isSizeExceeded = ref(false);
// 文件总大小（字节）
const totalFileSize = ref(0);

// 计算预计花费（元）
const estimatedCost = computed(() => {
  // 每百万字节花费4元，再乘以3
  const costPerMillion = 4 * 10;
  // 计算花费（保留4位小数）
  return Number(((totalFileSize.value / 1000000) * costPerMillion).toFixed(4));
});

// 定期更新状态
function updateState() {
  state.value = codeChecker.getState();
  updateTimerId = window.requestAnimationFrame(updateState);
}

// 加载模型列表
async function loadModels() {
  try {
    apiError.value = ''; // 清除之前的错误
    await codeChecker.loadModels();
    state.value = codeChecker.getState();
    
    // 检查是否成功加载了模型
    if (state.value.providers.length === 0) {
      apiError.value = '无法加载模型列表，请确认API密钥和URL已正确配置。';
    }
  } catch (error) {
    console.error('加载模型失败:', error);
    apiError.value = error instanceof Error ? error.message : '加载模型列表时出错';
  }
}

// 重试加载模型
async function retryLoadModels() {
  await loadModels();
}

// 更新文件 - 使用FileUtils处理文件
function updateFiles(files: File[]) {
  // 不再清空现有文件，而是追加新文件
  
  // 使用FileUtils处理文件
  if (files && files.length > 0) {
    // 过滤并处理文件
    const processedFiles = FileUtils.processFiles(files);
    
    // 依次添加每个文件
    processedFiles.forEach(file => {
      // 检查是否已存在同名文件，避免重复添加
      const fileExists = state.value.selectedFiles.some(existingFile => 
        existingFile.name === file.name && existingFile.size === file.size
      );
      
      if (!fileExists) {
        codeChecker.addFile(file);
      }
    });
    
    // 更新状态
    state.value = codeChecker.getState();
  }
}

// 移除文件
function handleRemoveFile(index: number) {
  codeChecker.removeFile(index);
  state.value = codeChecker.getState();
}

// 清除所有文件
function handleClearFiles() {
  codeChecker.clearFiles();
  state.value = codeChecker.getState();
}

// 更新处理配置
function handleUpdateProcessingConfig(config: any) {
  codeChecker.setProcessingConfig(config as ProcessingConfig);
  state.value = codeChecker.getState();
}

// 开始检查
function handleStartCheck() {
  codeChecker.startCheck();
  state.value = codeChecker.getState();
}

// 终止检查
async function handleStopCheck() {
  // 前端终止处理
  codeChecker.stopCheck();
  state.value = codeChecker.getState();
  
  // 调用后端API终止所有请求
  try {
    const response = await fetch('/api/check/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error(`终止请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
  } catch (error) {
    console.error('终止请求失败:', error);
  }
}

// 添加重试处理方法
async function retryItem(item: CheckResult) {
  // 创建AbortController用于可能的中止
  const controller = new AbortController();
  // 存储当前重试的项目索引和控制器
  let currentRetryIndex = -1;
  
  try {
    // 更新状态为处理中
    const index = state.value.checkResults.findIndex(r => 
      r.fileName === item.fileName
    );
    
    currentRetryIndex = index;
    
    if (index !== -1) {
      // 使用codeChecker更新状态
      codeChecker.updateCheckResult(index, {
        status: 'processing',
        error: undefined
      });
      
      // 更新本地状态
      state.value = codeChecker.getState();
    } else {
      return;
    }
    
    // 检查文件内容是否存在，如果不存在则重新读取
    let fileContent = item.content;
    if (!fileContent) {
      // 查找对应的文件
      const file = state.value.selectedFiles.find(f => f.name === item.fileName);
      if (file) {
        // 读取文件内容
        fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else {
        throw new Error('找不到对应的文件');
      }
    }
    
    // 获取当前模型设置
    const modelSettings = {
      modelProvider: state.value.currentModelProvider,
      modelId: state.value.currentModelId,
      checkType: state.value.currentCheckType,
      parameters: state.value.modelParameters,
      customPrompt: state.value.customPrompt
    };
    
    // 添加终止处理的事件处理
    const stopRetryHandler = () => {
      controller.abort();
      
      // 更新状态为已终止
      if (currentRetryIndex !== -1) {
        // 使用codeChecker更新状态
        codeChecker.updateCheckResult(currentRetryIndex, {
          status: 'error',
          error: '用户终止了处理'
        });
        
        // 更新本地状态
        state.value = codeChecker.getState();
      }
      
      // 移除事件监听器
      window.removeEventListener('stop-retry', stopRetryHandler);
    };
    
    // 添加事件监听器
    window.addEventListener('stop-retry', stopRetryHandler);
    
    // 发送重试请求到正确的接口
    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: fileContent, // 使用重新读取的文件内容
        fileName: item.fileName, // 添加文件名
        checkType: state.value.currentCheckType,
        modelProvider: state.value.currentModelProvider,
        modelId: state.value.currentModelId,
        prompt: state.value.customPrompt || undefined,
        parameters: {
          temperature: state.value.modelParameters.temperature,
          top_p: state.value.modelParameters.top_p,
          max_tokens: state.value.modelParameters.max_tokens,
          presence_penalty: state.value.modelParameters.presence_penalty,
          frequency_penalty: state.value.modelParameters.frequency_penalty
        }
      }),
      signal: controller.signal // 添加信号以支持中止
    });
    
    // 移除事件监听器
    window.removeEventListener('stop-retry', stopRetryHandler);
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 更新结果
    if (index !== -1) {
      // 使用codeChecker更新状态
      codeChecker.updateCheckResult(index, {
        content: fileContent, // 更新文件内容
        results: result.results,
        isValidJson: result.isValidJson,
        status: 'success',
        error: undefined
      });
      
      // 更新本地状态
      state.value = codeChecker.getState();
    }
    
    // 显示成功消息
    const toast = useNuxtToast();
    toast.add({
      title: '重试成功',
      description: '文件已重新处理',
      color: 'green'
    });
  } catch (error) {
    // 移除事件监听器
    window.removeEventListener('stop-retry', () => {});
    
    // 如果是中止错误，显示特定消息
    const isAbortError = error instanceof DOMException && error.name === 'AbortError';
    
    // 更新状态为失败
    const index = state.value.checkResults.findIndex(r => 
      r.fileName === item.fileName
    );
    
    if (index !== -1) {
      // 使用codeChecker更新状态
      codeChecker.updateCheckResult(index, {
        status: 'error',
        error: isAbortError ? '用户终止了处理' : (error instanceof Error ? error.message : '重试失败')
      });
      
      // 更新本地状态
      state.value = codeChecker.getState();
    }
    
    // 显示错误消息，除非是中止错误
    if (!isAbortError) {
      const toast = useNuxtToast();
      toast.add({
        title: '重试失败',
        description: error instanceof Error ? error.message : '重试请求失败',
        color: 'red'
      });
    }
  }
}

// 处理文件大小超限事件
function handleSizeExceeded(exceeded: boolean) {
  isSizeExceeded.value = exceeded;
}

// 处理文件总大小变化事件
function handleTotalSizeChange(size: number) {
  totalFileSize.value = size;
}

// 启动状态更新并加载模型列表
onMounted(async () => {
  updateState();
  // 加载模型列表
  await loadModels();
});

// 清理
onUnmounted(() => {
  if (updateTimerId !== null) {
    window.cancelAnimationFrame(updateTimerId);
  }
});

// 页面元数据
useHead({
  title: '代码检查工具',
  meta: [
    { name: 'description', content: '基于大语言模型的代码质量检查工具' }
  ]
});
</script> 