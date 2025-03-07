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
                @update:model="codeChecker.setModelProvider"
                @update:model-id="codeChecker.setModelId"
                @update:check-type="codeChecker.setCheckType"
                @update:parameters="codeChecker.setModelParameters"
                @update:prompt="codeChecker.setCustomPrompt"
              />
              
              <!-- 文件上传 -->
              <FileUploader
                :files="state.selectedFiles"
                @update:files="updateFiles"
                @remove="handleRemoveFile"
                @clear="handleClearFiles"
              />
              
              <!-- 开始检查按钮 -->
              <UButton
                block
                color="blue"
                size="lg"
                :loading="state.isProcessing"
                :disabled="!state.hasFiles || state.isProcessing || !state.currentModelId"
                @click="handleStartCheck"
              >
                {{ state.isProcessing ? '处理中...' : '开始检查' }}
              </UButton>
            </div>
          </div>
          
          <!-- 右侧结果面板 -->
          <div class="lg:col-span-8">
            <ResultsList :results="state.checkResults" />
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
// 导入组合函数
import { useCodeChecker } from '~/composables/useCodeChecker';
import type { ModelProvider, CheckType, ModelParameters } from '~/types';
import { ref, onMounted, onUnmounted } from 'vue';
import { FileUtils } from '~/utils/file-utils';

const codeChecker = useCodeChecker();
// 获取当前状态
const state = ref(codeChecker.getState());
// 状态更新的计时器ID
let updateTimerId: number | null = null;
// API错误信息
const apiError = ref('');

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
  // 清空现有文件
  codeChecker.clearFiles();
  
  // 使用FileUtils处理文件
  if (files && files.length > 0) {
    // 过滤并处理文件
    const processedFiles = FileUtils.processFiles(files);
    
    // 依次添加每个文件
    processedFiles.forEach(file => {
      codeChecker.addFile(file);
    });
    
    console.log('文件已添加:', processedFiles.length, '个文件');
  }
  
  // 更新状态
  state.value = codeChecker.getState();
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

// 开始检查
function handleStartCheck() {
  codeChecker.startCheck();
  state.value = codeChecker.getState();
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