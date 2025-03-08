<template>
  <UCard class="mb-4 border-blue-100 dark:border-blue-900 shadow-sm">
    <template #header>
      <div class="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 -mx-4 -mt-4 px-4 py-3 rounded-t-lg">
        <h3 class="text-lg font-medium text-blue-800 dark:text-blue-300">模型与检查设置</h3>
        <UTooltip text="模型参数会影响检查结果的质量和风格">
          <UButton
            color="blue"
            variant="ghost"
            icon="i-heroicons-information-circle"
            size="xs"
          />
        </UTooltip>
      </div>
    </template>
    
    <div class="space-y-5 pt-2">
      <!-- 模型提供商和模型选择 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- 模型提供商选择 -->
        <div>
          <div class="flex justify-between mb-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">厂商</label>
            <UBadge v-if="isLoading" color="blue" size="sm">加载中...</UBadge>
          </div>
          <USelect
            v-model="modelProviderValue"
            :loading="isLoading"
            :options="providerOptions"
            option-attribute="name"
            value-attribute="id"
            size="md"
            class="w-full"
            placeholder="选择模型提供商"
          />
          <div v-if="userInfo" class="mt-1 text-xs text-gray-600 dark:text-gray-400 flex items-center">
            <UIcon name="i-heroicons-credit-card" class="mr-1 h-3 w-3" />
            <span>余额: {{ userInfo.totalBalance }} {{ userInfo.unit }}</span>
          </div>
        </div>
        
        <!-- 模型选择 -->
        <div>
          <div class="flex justify-between mb-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">模型</label>
            <span v-if="modelOptions.length === 0 && !isLoading" class="text-xs text-amber-500">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
              未找到模型
            </span>
          </div>
          <USelect
            v-model="modelIdValue"
            :loading="isLoading"
            :options="modelOptions"
            option-attribute="name"
            value-attribute="id"
            :disabled="modelOptions.length === 0"
            size="md"
            class="w-full"
            placeholder="选择模型"
          />
        </div>
      </div>
      
      <!-- 检查类型选择 -->
      <div>
        <div class="flex justify-between mb-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">检查类型 (可多选)</label>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <UCheckbox
            v-model="checkTypesValue.spelling"
            label="拼写检查"
            name="check-spelling" 
            class="border border-blue-100 dark:border-blue-800 rounded-md p-2 hover:bg-blue-50 dark:hover:bg-blue-900"
          >
            <template #label>
              <div class="flex items-center">
                <UIcon name="i-heroicons-document-text" class="mr-2 text-blue-500" />
                <span>拼写检查</span>
              </div>
            </template>
          </UCheckbox>
          
          <UCheckbox
            v-model="checkTypesValue.bugs"
            label="BUG检查"
            name="check-bugs"
            class="border border-red-100 dark:border-red-800 rounded-md p-2 hover:bg-red-50 dark:hover:bg-red-900"
          >
            <template #label>
              <div class="flex items-center">
                <UIcon name="i-heroicons-bug-ant" class="mr-2 text-red-500" />
                <span>BUG检查</span>
              </div>
            </template>
          </UCheckbox>
        </div>
        
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          可同时选择多种检查类型，系统会按顺序执行所有选择的检查
        </p>
      </div>
      
      <!-- 模型参数 -->
      <div class="border border-indigo-100 dark:border-indigo-900 rounded-md mt-2 overflow-hidden">
        <div 
          class="flex justify-between items-center p-3 cursor-pointer bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800"
          @click="isParametersOpen = !isParametersOpen"
        >
          <div class="flex items-center">
            <UIcon name="i-heroicons-adjustments-horizontal" class="mr-2 text-indigo-600 dark:text-indigo-400" />
            <span class="font-medium text-indigo-700 dark:text-indigo-300">模型参数设置</span>
          </div>
          <UIcon 
            :name="isParametersOpen ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
            class="text-indigo-500 dark:text-indigo-400"
          />
        </div>
          
        <div v-if="isParametersOpen" class="p-3 space-y-3 bg-white dark:bg-gray-900">
          <!-- 随机性 (temperature) -->
          <div class="grid grid-cols-2 gap-3 items-center">
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">随机性 (temperature)</div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">值越大，回复越随机</p>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="range"
                v-model.number="parametersValue.temperature"
                :min="0"
                :max="1"
                :step="0.1"
                class="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer dark:bg-blue-800"
                @input="(e) => updateParameter('temperature', e)"
              />
              <span class="text-sm tabular-nums w-10 text-right text-blue-600 dark:text-blue-400 font-medium">{{ parametersValue.temperature.toFixed(1) }}</span>
            </div>
          </div>

          <!-- 核采样 (top_p) -->
          <div class="grid grid-cols-2 gap-3 items-center">
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">核采样 (top_p)</div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">与随机性类似，但不要和随机性一起更改</p>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="range"
                v-model.number="parametersValue.top_p"
                :min="0"
                :max="1"
                :step="0.1"
                class="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer dark:bg-blue-800"
                @input="(e) => updateParameter('top_p', e)"
              />
              <span class="text-sm tabular-nums w-10 text-right text-blue-600 dark:text-blue-400 font-medium">{{ parametersValue.top_p.toFixed(1) }}</span>
            </div>
          </div>

          <!-- 单次回复限制 (max_tokens) -->
          <div class="grid grid-cols-2 gap-3 items-center">
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">单次回复限制 (max_tokens)</div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">单次交互所用的最大 Token 数</p>
            </div>
            <div class="flex items-center gap-2">
              <UInput
                v-model="parametersValue.max_tokens"
                type="number"
                :min="256"
                :max="4096"
                :step="10"
                size="sm"
                class="w-full"
              />
              <span class="text-sm tabular-nums w-10 text-right text-blue-600 dark:text-blue-400 font-medium">{{ parametersValue.max_tokens }}</span>
            </div>
          </div>

          <!-- 话题新鲜度 (presence_penalty) -->
          <div class="grid grid-cols-2 gap-3 items-center">
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">话题新鲜度 (presence_penalty)</div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">值越大，越容易产生新话题</p>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="range"
                v-model.number="parametersValue.presence_penalty"
                :min="-2"
                :max="2"
                :step="0.1"
                class="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer dark:bg-purple-800"
                @input="(e) => updateParameter('presence_penalty', e)"
              />
              <span class="text-sm tabular-nums w-10 text-right text-purple-600 dark:text-purple-400 font-medium">{{ parametersValue.presence_penalty.toFixed(1) }}</span>
            </div>
          </div>

          <!-- 频率惩罚度 (frequency_penalty) -->
          <div class="grid grid-cols-2 gap-3 items-center">
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">频率惩罚度 (frequency_penalty)</div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">值越大，越有可能降低重复字词</p>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="range"
                v-model.number="parametersValue.frequency_penalty"
                :min="-2"
                :max="2"
                :step="0.1"
                class="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer dark:bg-purple-800"
                @input="(e) => updateParameter('frequency_penalty', e)"
              />
              <span class="text-sm tabular-nums w-10 text-right text-purple-600 dark:text-purple-400 font-medium">{{ parametersValue.frequency_penalty.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 多线程处理配置 -->
      <div class="border border-green-100 dark:border-green-900 rounded-md mt-4 overflow-hidden">
        <div 
          class="flex justify-between items-center p-3 cursor-pointer bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800"
          @click="isThreadConfigOpen = !isThreadConfigOpen"
        >
          <div class="flex items-center">
            <UIcon name="i-heroicons-cpu-chip" class="mr-2 text-green-600 dark:text-green-400" />
            <span class="font-medium text-green-700 dark:text-green-300">检查参数设置</span>
          </div>
          <UIcon 
            :name="isThreadConfigOpen ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
            class="text-green-500 dark:text-green-400"
          />
        </div>
          
        <div v-if="isThreadConfigOpen" class="p-3 space-y-3 bg-white dark:bg-gray-900">
          <!-- 线程数 -->
          <div class="grid grid-cols-2 gap-3 items-center">
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">线程数</div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">同时处理的文件数量</p>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="range"
                v-model.number="processingConfigValue.concurrentTasks"
                :min="1"
                :max="20"
                :step="1"
                class="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer dark:bg-green-800"
                @input="(e) => updateProcessingConfig('concurrentTasks', e)"
              />
              <span class="text-sm tabular-nums w-10 text-right text-green-600 dark:text-green-400 font-medium">{{ processingConfigValue.concurrentTasks }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { ModelProvider, CheckType, ModelParameters, ProcessingConfig, ProviderInfo } from '~/types';
import { DEFAULT_PROMPTS } from '~/types';
import { computed, ref, watch, onMounted } from 'vue';

const props = defineProps({
  model: {
    type: String as () => ModelProvider,
    default: 'deepseek'
  },
  modelId: {
    type: String,
    default: ''
  },
  checkType: {
    type: String as () => CheckType,
    default: 'spelling'
  },
  parameters: {
    type: Object as () => ModelParameters,
    default: () => ({
      temperature: 0.1,
      top_p: 1.0,
      max_tokens: 4000,
      presence_penalty: 0.0,
      frequency_penalty: 0.0
    })
  },
  prompt: {
    type: String,
    default: ''
  },
  defaultPrompt: {
    type: String,
    default: ''
  },
  providers: {
    type: Array as () => ProviderInfo[],
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  processingConfig: {
    type: Object as () => ProcessingConfig,
    default: () => ({
      concurrentTasks: 2
    })
  }
});

const emit = defineEmits<{
  'update:model': [value: ModelProvider];
  'update:modelId': [value: string];
  'update:checkType': [value: CheckType];
  'update:parameters': [value: ModelParameters];
  'update:prompt': [value: string];
  'update:processingConfig': [value: ProcessingConfig];
}>();

// 安全获取数字，防止undefined
function safeNumber(value?: number): number {
  return typeof value === 'number' ? value : 0;
}

// 确保参数总是有值
const safeParameters = computed(() => {
  const defaultParams = {
    temperature: 0.1,
    top_p: 1.0,
    max_tokens: 4000,
    presence_penalty: 0.0,
    frequency_penalty: 0.0
  };
  
  if (!props.parameters) {
    return defaultParams;
  }
  
  return {
    temperature: safeNumber(props.parameters.temperature) ?? defaultParams.temperature,
    top_p: safeNumber(props.parameters.top_p) ?? defaultParams.top_p,
    max_tokens: safeNumber(props.parameters.max_tokens) ?? defaultParams.max_tokens,
    presence_penalty: safeNumber(props.parameters.presence_penalty) ?? defaultParams.presence_penalty,
    frequency_penalty: safeNumber(props.parameters.frequency_penalty) ?? defaultParams.frequency_penalty
  };
});

// 提供商选项
const providerOptions = computed(() => props.providers);

// 当前选中的提供商
const currentProvider = computed(() => 
  props.providers.find(p => p.id === props.model)
);

// 当前提供商的模型列表
const modelOptions = computed(() => 
  currentProvider.value?.models || []
);

// 当前选中的模型
const selectedModel = computed(() => 
  modelOptions.value.find(m => m.id === props.modelId)
);

// 模型提供商
const modelProviderValue = computed({
  get: () => props.model,
  set: (value: ModelProvider) => {
    emit('update:model', value);
    // 当选择厂商后，获取用户信息
    fetchUserInfo(value);
  }
});

// 模型ID
const modelIdValue = computed({
  get: () => props.modelId,
  set: (value: string) => emit('update:modelId', value)
});

// 检查类型多选值
const checkTypesValue = ref({
  spelling: props.checkType === 'spelling',
  bugs: props.checkType === 'bugs'
});

// 参数面板展开状态
const isParametersOpen = ref(true);
// 多线程配置面板展开状态
const isThreadConfigOpen = ref(true);

// 监听多选值变化，更新checkType
watch(checkTypesValue, (newVal) => {
  // 至少保持一项被选中
  if (!newVal.spelling && !newVal.bugs) {
    checkTypesValue.value.spelling = true;
    return;
  }
  
  // 当前只支持设置一个类型，取第一个被选中的
  if (newVal.spelling) {
    emit('update:checkType', 'spelling');
  } else if (newVal.bugs) {
    emit('update:checkType', 'bugs');
  }
}, { deep: true });

// 检查类型 - 兼容旧版，当外部checkType变化时更新多选状态
watch(() => props.checkType, (newType) => {
  checkTypesValue.value = {
    spelling: newType === 'spelling',
    bugs: newType === 'bugs'
  };
});

// 模型参数
const parametersValue = computed({
  get: () => safeParameters.value,
  set: (value: ModelParameters) => emit('update:parameters', value)
});

// 更新参数方法
function updateParameter(key: keyof ModelParameters, event: Event) {
  const target = event.target as HTMLInputElement;
  const numValue = parseFloat(target.value);
  if (!isNaN(numValue)) {
    const newParams = { ...parametersValue.value };
    newParams[key] = numValue;
    emit('update:parameters', newParams);
  }
}

// 自定义提示语 - 仍然保留但不在UI中显示
const promptValue = computed({
  get: () => props.prompt,
  set: (value: string) => emit('update:prompt', value)
});

function resetParameters() {
  parametersValue.value = {
    temperature: 0.1,
    top_p: 1.0,
    max_tokens: 4000,
    presence_penalty: 0.0,
    frequency_penalty: 0.0
  };
}

// 处理配置
const processingConfigValue = computed({
  get: () => props.processingConfig,
  set: (value: ProcessingConfig) => emit('update:processingConfig', value)
});

// 用户信息
const userInfo = ref<{
  provider: ModelProvider;
  totalBalance: number;
  unit: string;
  status: string;
} | null>(null);

// 获取用户信息
async function fetchUserInfo(provider: ModelProvider) {
  try {
    userInfo.value = null;
    const response = await fetch(`/api/user/info?provider=${provider}`);
    
    if (!response.ok) {
      console.error('获取用户信息失败:', response.statusText);
      return;
    }
    
    const data = await response.json();
    userInfo.value = data;
  } catch (error) {
    console.error('获取用户信息出错:', error);
  }
}

// 更新处理配置方法
function updateProcessingConfig(key: keyof ProcessingConfig, event: Event) {
  const target = event.target as HTMLInputElement;
  const numValue = parseInt(target.value);
  if (!isNaN(numValue)) {
    const newConfig = { ...processingConfigValue.value };
    newConfig[key] = numValue;
    emit('update:processingConfig', newConfig);
  }
}

// 组件挂载时获取用户信息
onMounted(() => {
  if (props.model) {
    fetchUserInfo(props.model);
  }
});
</script> 