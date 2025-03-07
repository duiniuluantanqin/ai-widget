<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-medium">检查结果</h3>
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
    </template>
    
    <div v-if="resultsList.length === 0" class="p-8 text-center text-gray-500">
      <UIcon name="i-heroicons-clipboard-document-check" class="text-3xl mb-2" />
      <p>检查结果将在这里显示</p>
    </div>
    
    <div v-else class="space-y-4">
      <!-- 处理中状态显示 -->
      <template v-if="hasProcessingFiles">
        <UAlert
          color="blue"
          title="正在处理中"
          icon="i-heroicons-clock"
          :description="`正在处理 ${processingCount} 个文件（${concurrentTasks}线程并行），请稍候...`"
          class="mb-4"
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
      
      <!-- 处理完成提示 -->
      <template v-if="isAllProcessed && hasSuccessFiles">
        <UAlert
          color="green"
          title="处理完成"
          icon="i-heroicons-check-circle"
          class="mb-4"
        >
          <template #description>
            <div>
              <p>成功处理 {{ successCount }} 个文件，共发现 {{ totalSuggestions }} 条改进建议。</p>
              <p v-if="totalSuggestions === 0" class="text-sm mt-1">未发现需要改进的地方，代码质量良好！</p>
            </div>
          </template>
        </UAlert>
      </template>
      
      <!-- 失败状态显示 -->
      <template v-if="hasErrorFiles">
        <UAlert
          color="red"
          title="部分文件处理失败"
          icon="i-heroicons-exclamation-triangle"
          :description="`${errorCount} 个文件处理失败`"
          class="mb-4"
        />
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
          <UBadge v-else-if="row.status === 'error'" color="red">失败</UBadge>
        </template>
        
        <template #suggestions-data="{ row }">
          <div v-if="row.status === 'success'" class="text-center">
            <UBadge v-if="getFileSuggestionCount(row) > 0" color="amber">{{ getFileSuggestionCount(row) }}</UBadge>
            <span v-else class="text-green-600">无需改进</span>
          </div>
          <div v-else>-</div>
        </template>
        
        <template #actions-data="{ row, index }">
          <UButton
            v-if="row.status === 'success'"
            color="blue"
            variant="ghost"
            icon="i-heroicons-eye"
            size="xs"
            @click="() => toggleResultDetail(index)"
          >
            查看结果
          </UButton>
          <div v-else-if="row.status === 'error'" class="text-sm text-red-500">
            {{ row.error }}
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
                  <div class="text-center font-mono">{{ row.line }}</div>
                </template>
                
                <template #original-data="{ row }">
                  <div class="bg-gray-50 dark:bg-gray-800 p-1 rounded font-mono text-sm">{{ row.original }}</div>
                </template>
                
                <template #suggestion-data="{ row }">
                  <div class="bg-green-50 dark:bg-green-900/20 p-1 rounded font-mono text-sm">{{ row.suggestion }}</div>
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
            <UAccordion :items="[{ label: '查看源代码', slot: 'source' }]">
              <template #source>
                <pre class="bg-gray-50 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96 text-sm font-mono">{{ selectedResult.content }}</pre>
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
import { computed, ref } from 'vue';

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

const emit = defineEmits(['stop']);

// 计算属性，防止直接操作props
const resultsList = computed(() => props.results || []);
const concurrentTasks = computed(() => props['concurrent-tasks']);

// 状态管理
const showDetailModal = ref(false);
const selectedResultIndex = ref<number | null>(null);

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
 * 下载所有结果
 */
function downloadResults() {
  try {
    // 准备下载内容 - 处理成结构化数据
    const results = resultsList.value
      .filter(r => r.status === 'success')
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
          isJsonFormat: isJson
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
</script> 