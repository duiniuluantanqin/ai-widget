<template>
  <div class="w-full">
    <UCard class="mb-3 border-blue-100 dark:border-blue-900 shadow-sm">
      <template #header>
        <div class="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 -mx-4 -mt-4 px-3 py-2 rounded-t-lg">
          <div class="flex items-center">
            <h3 class="text-lg font-medium text-blue-800 dark:text-blue-300">{{ title }}</h3>
            <UTooltip :text="`文件总大小限制为 ${formatFileSize(MAX_TOTAL_SIZE)}`">
              <UButton
                color="amber"
                variant="ghost"
                icon="i-heroicons-exclamation-triangle"
                size="xs"
                class="ml-1"
              />
            </UTooltip>
          </div>
          <UButton
            v-if="filesList.length > 0"
            color="red"
            variant="soft"
            icon="i-heroicons-trash"
            @click="clearFiles"
          >
            清空
          </UButton>
        </div>
      </template>
      
      <div class="mb-3">
        <UUpload
          ref="uploader"
          :multiple="multiple"
          :accept="accept"
          :model-value="filesList"
          @update:model-value="handleFileSelect"
          :label="label"
          :help="help"
        />
      </div>
      
      <!-- 显示文件大小错误信息 -->
      <UAlert
        v-if="sizeError"
        color="red"
        :title="sizeError"
        icon="i-heroicons-exclamation-triangle"
        class="mb-4"
      />
      
      <template v-if="filesList.length > 0">
        <div class="space-y-2 mt-4">
          <div class="flex justify-between items-center">
            <h4 class="text-sm font-medium">已上传文件 ({{ filesList.length }})</h4>
            <div class="flex gap-2">
              <UButton
                color="blue"
                variant="soft"
                icon="i-heroicons-plus"
                size="xs"
                @click="openFileDialog"
              >
                继续上传
              </UButton>
            </div>
          </div>
          <ul class="space-y-2 max-h-60 overflow-y-auto">
            <li v-for="(file, index) in filesList" :key="index" class="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div class="flex items-center">
                <UIcon :name="fileIcon" class="mr-2" />
                <span class="text-sm">{{ file.name }} <span class="text-xs text-gray-500">({{ formatFileSize(file.size) }})</span></span>
              </div>
              <UButton
                color="red"
                variant="ghost"
                icon="i-heroicons-x-mark"
                size="xs"
                @click="() => removeFile(index)"
              />
            </li>
          </ul>
          
          <!-- 显示文件总大小 -->
          <div class="text-sm text-right mt-2">
            总大小: <span :class="calculateTotalSize(filesList) > MAX_TOTAL_SIZE ? 'text-red-500 font-bold' : 'text-green-600'">
              {{ formatFileSize(calculateTotalSize(filesList)) }}
            </span>
            <span class="text-gray-500 ml-1">(限制: {{ formatFileSize(MAX_TOTAL_SIZE) }})</span>
          </div>
          
          <!-- 添加拖放区域，允许继续上传 -->
          <div 
            class="mt-3 text-center p-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            @click="openFileDialog"
            @drop.prevent="onFileDrop"
            @dragover.prevent="() => {}"
            @dragenter.prevent="() => {}"
          >
            <div class="flex items-center justify-center">
              <UIcon :name="fileIcon" class="text-xl mr-2" />
              <span>拖放文件到此处或点击继续上传</span>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div 
          class="text-center p-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
          @click="openFileDialog"
          @drop.prevent="onFileDrop"
          @dragover.prevent="() => {}"
          @dragenter.prevent="() => {}"
        >
          <UIcon :name="fileIcon" class="text-3xl mb-2" />
          <p>{{ dropzoneText }}</p>
          <UButton color="gray" variant="soft" class="mt-3" :icon="fileIcon" @click.stop="openFileDialog">
            浏览文件
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';

const props = defineProps({
  files: {
    type: Array as () => File[],
    default: () => []
  },
  accept: {
    type: Array as () => string[],
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: '上传文件'
  },
  label: {
    type: String,
    default: '上传文件'
  },
  help: {
    type: String,
    default: ''
  },
  dropzoneText: {
    type: String,
    default: '拖放文件到此处或点击选择文件'
  }
});

const emit = defineEmits<{
  'update:files': [files: File[]];
  'remove': [index: number];
  'clear': [];
  'size-exceeded': [exceeded: boolean];
  'total-size-change': [totalSize: number];
}>();

// 上传组件的引用
const uploader = ref();
// 获取运行时配置
const config = useRuntimeConfig();
// 文件大小限制（从环境变量读取，默认10KB）
const MAX_TOTAL_SIZE = (Number(config.public.maxFileSizeKB) || 10) * 1024;
// 错误信息
const sizeError = ref('');
// 是否超出大小限制
const isSizeExceeded = ref(false);

// 计算属性，防止直接操作props
const filesList = computed(() => props.files || []);

// 计算总字节数
const totalSize = computed(() => calculateTotalSize(filesList.value));

// 根据accept类型显示不同的图标
const fileIcon = computed(() => {
  const firstAccept = props.accept[0] || '';
  if (firstAccept.startsWith('image/')) {
    return 'i-heroicons-photo';
  }
  return 'i-heroicons-document-text';
});

// 监听文件列表变化，计算总大小并更新状态
watch(filesList, (files) => {
  const size = calculateTotalSize(files);
  isSizeExceeded.value = size > MAX_TOTAL_SIZE;
  
  if (isSizeExceeded.value) {
    sizeError.value = `文件总大小(${formatFileSize(size)})超过限制(${formatFileSize(MAX_TOTAL_SIZE)})，无法进行检查`;
  } else {
    sizeError.value = '';
  }
  
  // 通知父组件大小超限状态
  emit('size-exceeded', isSizeExceeded.value);
  // 通知父组件文件总大小
  emit('total-size-change', size);
}, { immediate: true });

/**
 * 打开文件选择对话框
 */
function openFileDialog() {
  // 尝试触发上传组件的文件选择
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = '.js,.ts,.jsx,.tsx,.vue,.py,.java,.c,.cpp,.h,.hpp,.cs,.php,.rb,.go,.rs,.swift,.kt';
  
  fileInput.onchange = (event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleFileSelect(Array.from(target.files));
    }
  };
  
  fileInput.click();
}

/**
 * 处理文件拖放
 */
function onFileDrop(event: DragEvent) {
  if (event.dataTransfer?.files) {
    handleFileSelect(Array.from(event.dataTransfer.files));
  }
}

/**
 * 计算文件总大小
 */
function calculateTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/**
 * 处理文件选择
 */
function handleFileSelect(files: File[]) {
  // 不直接替换，而是合并现有文件和新文件
  const newFiles = files || [];
  
  // 如果没有新文件，则不做任何操作
  if (newFiles.length === 0) return;
  
  // 合并文件并去重
  const combinedFiles = [...props.files];
  
  // 添加新文件（如果不存在）
  newFiles.forEach(newFile => {
    const fileExists = combinedFiles.some(existingFile => 
      existingFile.name === newFile.name && existingFile.size === newFile.size
    );
    
    if (!fileExists) {
      combinedFiles.push(newFile);
    }
  });
  
  // 更新文件列表 - 无论大小是否超限都更新文件列表
  emit('update:files', combinedFiles);
  
  // 大小检查由watch监听器处理，这里不需要额外处理
}

/**
 * 移除单个文件
 */
function removeFile(index: number) {
  emit('remove', index);
}

/**
 * 清空所有文件
 */
function clearFiles() {
  emit('clear');
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
</script> 