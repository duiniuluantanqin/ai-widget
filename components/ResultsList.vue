<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-medium">检查结果</h3>
        <div class="flex items-center space-x-2">
          <div v-if="showSavedTip" class="text-green-600 flex items-center text-xs">
            <UIcon name="i-heroicons-check-circle" class="mr-0.5 h-3 w-3" />
            <span>已保存</span>
            <span class="text-blue-500 ml-1 cursor-pointer hover:underline" @click="openDownloadDirectory">打开目录</span>
          </div>
          <UButton
            v-if="resultsList.length > 0"
            color="blue"
            variant="soft"
            icon="i-heroicons-cloud-arrow-down"
            @click="downloadResults"
          >
            下载结果
          </UButton>
        </div>
      </div>
    </template>
    
    <div v-if="resultsList.length === 0" class="p-6 text-center text-gray-500">
      <UIcon name="i-heroicons-clipboard-document-check" class="text-3xl mb-2" />
      <p>检查结果将在这里显示</p>
    </div>
    
    <div v-else class="space-y-3">
      <!-- 处理中状态显示 -->
      <template v-if="hasProcessingFiles">
        <UAlert
          color="blue"
          title="正在处理中"
          icon="i-heroicons-clock"
          :description="`正在处理 ${processingCount} 个文件（${concurrentTasks}线程并行），请稍候...`"
          class="mb-3"
        >
          <template #description>
            <div class="flex justify-between items-center">
              <span>正在处理 {{ processingCount }} 个文件（{{ concurrentTasks }}线程并行），请稍候...</span>
              <UButton
                color="red"
                variant="soft"
                size="sm"
                icon="i-heroicons-stop"
                @click="$emit('stop')"
              >
                终止处理
              </UButton>
            </div>
          </template>
        </UAlert>
      </template>
      
      <!-- 处理完成提示（整合成功和失败的汇总信息） -->
      <template v-if="isAllProcessed">
        <UAlert
          :color="hasErrorFiles ? (hasSuccessFiles ? 'amber' : 'red') : 'green'"
          :title="hasErrorFiles ? (hasSuccessFiles ? '处理部分完成' : '处理失败') : '处理完成'"
          :icon="hasErrorFiles ? (hasSuccessFiles ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-x-circle') : 'i-heroicons-check-circle'"
          class="mb-4"
        >
          <template #description>
            <div>
              <p v-if="hasSuccessFiles && hasErrorFiles">
                成功处理 {{ successCount }} 个文件，{{ errorCount }} 个文件处理失败，共发现 {{ totalSuggestions }} 条改进建议。
              </p>
              <p v-else-if="hasSuccessFiles">
                成功处理 {{ successCount }} 个文件，共发现 {{ totalSuggestions }} 条改进建议。
              </p>
              <p v-else-if="hasErrorFiles">
                {{ errorCount }} 个文件处理失败。
              </p>
              <p v-if="hasSuccessFiles && totalSuggestions === 0" class="text-sm mt-1">未发现需要改进的地方，代码质量良好！</p>
            </div>
          </template>
        </UAlert>
        
        <!-- 单独的更换模型提示 -->
        <UAlert
          v-if="hasErrorFiles"
          color="amber"
          title="提示：请尝试更换模型。"
          icon="i-heroicons-light-bulb"
          class="mb-4"
        >
        </UAlert>
      </template>
      
      <!-- 结果列表 -->
      <UTable
        :rows="resultsList"
        :columns="[
          { key: 'fileName', label: '文件名' },
          { key: 'status', label: '状态' },
          { key: 'suggestions', label: '建议数量' },
          { key: 'actions', label: '操作' }
        ]"
      >
        <template #fileName-data="{ row }">
          <div>{{ row.fileName }}</div>
        </template>
        
        <template #status-data="{ row }">
          <UBadge v-if="row.status === 'pending'" color="gray">等待中</UBadge>
          <UBadge v-else-if="row.status === 'processing'" color="blue">处理中</UBadge>
          <UBadge v-else-if="row.status === 'success'" color="green">成功</UBadge>
          <UBadge v-else-if="row.status === 'error' && row.error === '模型返回的结果不是有效的JSON格式'" color="amber">异常</UBadge>
          <UBadge v-else-if="row.status === 'error' || row.status === 'failed'" color="red">失败</UBadge>
        </template>
        
        <template #suggestions-data="{ row }">
          <div v-if="row.status === 'success'" class="text-center">
            <UBadge v-if="getFileSuggestionCount(row) > 0" color="amber">{{ getFileSuggestionCount(row) }}</UBadge>
            <span v-else class="text-green-600">无需改进</span>
          </div>
          <div v-else-if="row.status === 'error' && row.results && row.error === '模型返回的结果不是有效的JSON格式'" class="text-center">
            <UBadge color="amber">格式异常</UBadge>
          </div>
          <div v-else>-</div>
        </template>
        
        <template #actions-data="{ row, index }">
          <UButton
            v-if="row.status === 'success' || (row.status === 'error' && row.results && row.error === '模型返回的结果不是有效的JSON格式')"
            color="blue"
            variant="ghost"
            icon="i-heroicons-eye"
            size="xs"
            @click="() => toggleResultDetail(index)"
          >
            查看结果
          </UButton>
          <UButton
            v-if="row.status === 'success' || (row.status === 'error' && row.results && row.error === '模型返回的结果不是有效的JSON格式')"
            color="blue"
            variant="soft"
            icon="i-heroicons-arrow-path"
            size="xs"
            class="ml-2"
            @click="() => retryItem(row)"
          >
            重新检查
          </UButton>
          <div v-else-if="row.status === 'processing'" class="flex items-center">
            <UButton
              color="red"
              variant="soft"
              icon="i-heroicons-stop"
              size="xs"
              @click="() => stopRetryItem(row)"
            >
              终止
            </UButton>
          </div>
          <div v-else-if="row.status === 'error' || row.status === 'failed'" class="flex items-center">
            <span class="text-sm text-red-500 mr-2">{{ row.error || '处理失败' }}</span>
            <UButton
              color="blue"
              variant="soft"
              icon="i-heroicons-arrow-path"
              size="xs"
              @click="() => retryItem(row)"
            >
              重试
            </UButton>
          </div>
        </template>
      </UTable>
      
      <!-- 详细结果弹窗 -->
      <UModal v-model="showDetailModal" :ui="{ width: 'max-w-5xl' }">
        <UCard v-if="selectedResult">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium">{{ selectedResult.fileName }} 检查结果</h3>
              <div class="flex items-center space-x-2">
                <UBadge :color="selectedResult.checkType === 'spelling' ? 'amber' : 'red'">
                  {{ selectedResult.checkType === 'spelling' ? '拼写检查' : 'BUG检查' }}
                </UBadge>
                <UBadge :color="selectedResult.modelProvider === 'deepseek' ? 'blue' : 'indigo'">
                  {{ selectedResult.modelProvider }}
                </UBadge>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <!-- JSON解析成功的情况：显示结构化表格 -->
            <div v-if="isJsonParsed && parsedResults.length > 0">
              <UTable :rows="parsedResults" :columns="resultColumns">
                <template #line-data="{ row }">
                  <UButton
                    variant="ghost"
                    color="blue"
                    size="xs"
                    class="text-center font-mono"
                    @click="scrollToLine(row.line)"
                  >
                    {{ row.line }}
                  </UButton>
                </template>
                
                <template #original-data="{ row }">
                  <div 
                    class="bg-gray-50 dark:bg-gray-800 p-1 rounded font-mono text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" 
                    @click="scrollToLine(row.line)"
                  >
                    {{ row.original }}
                  </div>
                </template>
                
                <template #suggestion-data="{ row }">
                  <div 
                    class="bg-green-50 dark:bg-green-900/20 p-1 rounded font-mono text-sm cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30" 
                    @click="scrollToLine(row.line)"
                  >
                    {{ row.suggestion }}
                  </div>
                </template>
              </UTable>
            </div>
            
            <!-- JSON解析成功但没有问题的情况 -->
            <div v-else-if="isJsonParsed && parsedResults.length === 0" class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 text-xl mb-2" />
              <p>未发现任何问题</p>
            </div>
            
            <!-- JSON解析失败的情况：显示原始模型返回 -->
            <div v-else class="space-y-2">
              <UAlert
                title="无法解析为JSON格式"
                color="amber"
                icon="i-heroicons-exclamation-triangle"
                description="模型返回的结果不是有效的JSON格式。以下是原始返回内容:"
                class="mb-2"
              />
              
              <div class="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <pre class="whitespace-pre-wrap font-mono text-sm">{{ selectedResult.results }}</pre>
              </div>
              
              <p class="text-xs text-gray-500 mt-2">
                提示: 您可以尝试调整模型参数或提示词，使模型输出标准的JSON格式。
              </p>
            </div>
            
            <!-- 源代码展示 -->
            <UAccordion :items="[{ label: '查看源代码', slot: 'source', defaultOpen: true }]">
              <template #source>
                <div class="relative">
                  <div ref="codeContainer" class="bg-gray-50 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96 text-sm font-mono">
                    <table class="w-full border-collapse">
                      <tbody>
                        <tr v-for="(line, index) in sourceCodeLines" :key="index" :class="{ 'bg-yellow-100 dark:bg-yellow-900/30': highlightedLines.includes(index + 1) }">
                          <td class="text-right pr-4 text-gray-500 select-none w-10" :id="`line-${index + 1}`">{{ index + 1 }}</td>
                          <td class="whitespace-pre">{{ line }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </template>
            </UAccordion>
            
            <!-- 原始结果显示 -->
            <UAccordion :items="[{ label: '原始返回内容', slot: 'raw' }]">
              <template #raw>
                <pre class="bg-gray-50 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96 text-sm font-mono">{{ selectedResult.results }}</pre>
              </template>
            </UAccordion>
          </div>
        </UCard>
      </UModal>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { CheckResult, CheckResultItem } from '~/types';
import { computed, ref, watch, nextTick } from 'vue';

const props = defineProps({
  results: {
    type: Array as () => CheckResult[],
    default: () => []
  },
  'concurrent-tasks': {
    type: Number,
    default: 2
  }
});

const emit = defineEmits(['stop', 'select-result', 'retry-item']);

// 计算属性，防止直接操作props
const resultsList = computed(() => props.results || []);
const concurrentTasks = computed(() => props['concurrent-tasks']);

// 状态管理
const showDetailModal = ref(false);
const selectedResultIndex = ref<number | null>(null);
const showSavedTip = ref(false);

// 计算属性
const processingCount = computed(() => resultsList.value.filter(r => r.status === 'pending' || r.status === 'processing').length);
const errorCount = computed(() => resultsList.value.filter(r => r.status === 'error').length);
const successCount = computed(() => resultsList.value.filter(r => r.status === 'success').length);
const hasProcessingFiles = computed(() => processingCount.value > 0);
const hasErrorFiles = computed(() => errorCount.value > 0);
const hasSuccessFiles = computed(() => successCount.value > 0);

// 计算所有成功处理的文件中的改进建议总数
const totalSuggestions = computed(() => {
  let count = 0;
  
  resultsList.value.forEach(result => {
    if (result.status === 'success') {
      try {
        // 尝试解析JSON结果
        if (result.isValidJson !== false) {
          const parsed = JSON.parse(result.results);
          if (Array.isArray(parsed)) {
            count += parsed.length;
          } else if (typeof parsed === 'object' && parsed !== null) {
            // 单个对象也算一条建议
            count += 1;
          }
        }
      } catch (e) {
        // 解析失败，不计入建议数
      }
    }
  });
  
  return count;
});

// 是否所有文件都已处理完成（无论成功或失败）
const isAllProcessed = computed(() => {
  return resultsList.value.length > 0 && 
         !hasProcessingFiles.value && 
         (hasSuccessFiles.value || hasErrorFiles.value);
});

// 监听处理完成状态，自动保存结果
watch(isAllProcessed, (newValue) => {
  if (newValue && hasSuccessFiles.value) {
    // 当所有文件处理完成且有成功处理的文件时，自动保存结果
    autoSaveResults();
  }
}, { immediate: false });

// 结果列定义
const resultColumns = [
  { key: 'line', label: '行号' },
  { key: 'original', label: '原始代码' },
  { key: 'suggestion', label: '建议修改' }
];

// 选中的结果详情
const selectedResult = computed(() => {
  if (selectedResultIndex.value === null) return null;
  return resultsList.value[selectedResultIndex.value];
});

// 解析状态：标记是否成功解析为JSON
const isJsonParsed = computed(() => {
  if (!selectedResult.value) return true;
  return selectedResult.value.isValidJson !== false;
});

// 解析后的结果项
const parsedResults = computed<CheckResultItem[]>(() => {
  if (!selectedResult.value || selectedResult.value.status !== 'success') return [];
  
  // 如果已知不是有效的JSON，则不尝试解析
  if (selectedResult.value.isValidJson === false) {
    return [];
  }
  
  try {
    const results = JSON.parse(selectedResult.value.results);
    // 确认结果是数组格式
    if (Array.isArray(results)) {
      return results;
    } else if (typeof results === 'object') {
      // 处理单个对象格式
      return [results];
    }
    return [];
  } catch (e) {
    console.error('解析结果失败:', e);
    return [];
  }
});

// 原始结果文本
const rawResultsText = computed(() => {
  if (!selectedResult.value) return '';
  return selectedResult.value.results;
});

// 源代码相关
const codeContainer = ref<HTMLElement | null>(null);
const highlightedLines = ref<number[]>([]);
const sourceCodeLines = computed(() => {
  if (!selectedResult.value?.content) return [];
  return selectedResult.value.content.split('\n');
});

// 自动高亮问题行
watch(() => parsedResults.value, (newResults) => {
  if (newResults && newResults.length > 0) {
    // 收集所有问题行
    highlightedLines.value = newResults.map(item => item.line).filter(line => typeof line === 'number');
    
    // 如果有问题行，自动滚动到第一个问题行
    if (highlightedLines.value.length > 0) {
      nextTick(() => {
        scrollToLine(highlightedLines.value[0]);
      });
    }
  } else {
    highlightedLines.value = [];
  }
}, { immediate: true });

/**
 * 滚动到指定行并高亮显示
 */
function scrollToLine(lineNumber: number) {
  nextTick(() => {
    const lineElement = document.getElementById(`line-${lineNumber}`);
    if (lineElement && codeContainer.value) {
      // 滚动到指定行，并使其位于容器中间
      const containerHeight = codeContainer.value.clientHeight;
      const lineTop = lineElement.offsetTop;
      codeContainer.value.scrollTop = lineTop - containerHeight / 2;
      
      // 移除之前的高亮效果
      const previousHighlighted = codeContainer.value.querySelector('.active-highlight');
      if (previousHighlighted) {
        previousHighlighted.classList.remove('active-highlight');
      }
      
      // 添加持久高亮效果
      lineElement.parentElement?.classList.add('active-highlight');
      
      // 添加闪烁动画效果
      lineElement.parentElement?.classList.add('flash-highlight');
      setTimeout(() => {
        lineElement.parentElement?.classList.remove('flash-highlight');
      }, 2000);
    }
  });
}

/**
 * 切换结果详情显示
 */
function toggleResultDetail(index: number) {
  selectedResultIndex.value = index;
  showDetailModal.value = true;
  
  // 触发解析逻辑
  const _ = parsedResults.value;
}

/**
 * 自动保存所有结果到下载目录
 */
async function autoSaveResults() {
  try {
    // 准备下载内容 - 处理成结构化数据
    const results = resultsList.value
      .filter(r => r.status === 'success' || (r.status === 'error' && r.results && r.error === '模型返回的结果不是有效的JSON格式'))
      .map(r => {
        // 尝试解析JSON结果
        let parsedItems = [];
        let isJson = true;
        
        try {
          parsedItems = JSON.parse(r.results);
          if (!Array.isArray(parsedItems)) {
            parsedItems = [parsedItems];
          }
        } catch (e) {
          isJson = false;
          parsedItems = [];
        }
        
        return {
          fileName: r.fileName,
          checkType: r.checkType,
          modelProvider: r.modelProvider,
          results: isJson ? parsedItems : r.results, // 如果解析失败，返回原始文本
          isJsonFormat: isJson,
          status: r.status
        }
      });
    
    // 调用后端API保存结果
    const response = await fetch('/api/results/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ results })
    });
    
    if (!response.ok) {
      throw new Error(`保存失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('结果已保存到服务器:', data.filePath);
    
    // 显示已保存提示（不会自动消失）
    showSavedTip.value = true;
  } catch (error) {
    console.error('自动保存结果失败:', error);
    // 如果后端保存失败，可以考虑回退到前端下载方式
    downloadResults();
  }
}

/**
 * 下载所有结果
 */
function downloadResults() {
  try {
    // 准备下载内容 - 处理成结构化数据
    const results = resultsList.value
      .filter(r => r.status === 'success' || (r.status === 'error' && r.results && r.error === '模型返回的结果不是有效的JSON格式'))
      .map(r => {
        // 尝试解析JSON结果
        let parsedItems = [];
        let isJson = true;
        
        try {
          parsedItems = JSON.parse(r.results);
          if (!Array.isArray(parsedItems)) {
            parsedItems = [parsedItems];
          }
        } catch (e) {
          isJson = false;
          parsedItems = [];
        }
        
        return {
          fileName: r.fileName,
          checkType: r.checkType,
          modelProvider: r.modelProvider,
          results: isJson ? parsedItems : r.results, // 如果解析失败，返回原始文本
          isJsonFormat: isJson,
          status: r.status
        }
      });
    
    // 创建Blob对象
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    
    // 创建URL并触发下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `code-check-results-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    // 清理
    URL.revokeObjectURL(url);
    
    // 显示已保存提示（不会自动消失）
    showSavedTip.value = true;
  } catch (error) {
    console.error('下载结果失败:', error);
  }
}

/**
 * 获取单个文件的建议数量
 */
function getFileSuggestionCount(result: CheckResult): number {
  if (result.status !== 'success') return 0;
  
  try {
    // 尝试解析JSON结果
    if (result.isValidJson !== false) {
      const parsed = JSON.parse(result.results);
      if (Array.isArray(parsed)) {
        return parsed.length;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // 单个对象也算一条建议
        return 1;
      }
    }
  } catch (e) {
    // 解析失败，不计入建议数
  }
  
  return 0;
}

/**
 * 重试处理失败的项目
 */
function retryItem(item: CheckResult) {
  console.log('触发重试事件:', item.fileName);
  emit('retry-item', item);
}

/**
 * 终止重试处理
 */
function stopRetryItem(item: CheckResult) {
  console.log('触发终止重试事件:', item.fileName);
  // 触发自定义事件以终止重试
  window.dispatchEvent(new CustomEvent('stop-retry'));
  
  // 调用后端API终止处理
  if (item.requestId) {
    stopProcessingRequest(item.requestId);
  } else {
    // 如果没有特定的请求ID，终止所有请求
    stopAllProcessingRequests();
  }
}

/**
 * 终止所有处理请求
 */
async function stopAllProcessingRequests() {
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
    console.log('终止所有请求结果:', data.message);
  } catch (error) {
    console.error('终止所有请求失败:', error);
  }
}

/**
 * 终止特定处理请求
 */
async function stopProcessingRequest(requestId: string) {
  try {
    const response = await fetch('/api/check/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requestId })
    });
    
    if (!response.ok) {
      throw new Error(`终止请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('终止请求结果:', data.message);
  } catch (error) {
    console.error('终止请求失败:', error);
  }
}

/**
 * 打开下载目录
 */
async function openDownloadDirectory() {
  try {
    const response = await fetch('/api/results/open-directory');
    
    if (!response.ok) {
      throw new Error(`打开目录失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('已打开目录:', data.directory);
  } catch (error) {
    console.error('打开下载目录失败:', error);
  }
}
</script>

<style scoped>
.flash-highlight {
  animation: flash 2s ease-out;
}

.active-highlight {
  background-color: rgba(59, 130, 246, 0.2); /* 蓝色背景，低透明度 */
  border-left: 3px solid rgb(59, 130, 246); /* 蓝色左边框 */
}

@keyframes flash {
  0% { background-color: rgba(250, 204, 21, 0.8); }
  100% { background-color: inherit; }
}
</style> 