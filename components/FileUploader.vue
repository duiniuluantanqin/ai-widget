<template>
  <div class="w-full">
    <UCard class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium">上传文件</h3>
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
      
      <div class="mb-4">
        <UUpload
          ref="uploader"
          :multiple="true"
          :accept="['text/plain', 'text/javascript', 'text/typescript', '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt']"
          :model-value="filesList"
          @update:model-value="handleFileSelect"
          label="上传源代码文件"
          help="支持多种编程语言文件，支持多选"
        />
      </div>
      
      <template v-if="filesList.length > 0">
        <div class="space-y-2 mt-4">
          <h4 class="text-sm font-medium">已上传文件 ({{ filesList.length }})</h4>
          <ul class="space-y-2 max-h-60 overflow-y-auto">
            <li v-for="(file, index) in filesList" :key="index" class="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div class="flex items-center">
                <UIcon name="i-heroicons-document-text" class="mr-2" />
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
          <UIcon name="i-heroicons-document-arrow-up" class="text-3xl mb-2" />
          <p>拖放文件到此处或点击选择文件</p>
          <UButton color="gray" variant="soft" class="mt-3" icon="i-heroicons-folder-open" @click.stop="openFileDialog">
            浏览文件
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  files: {
    type: Array as () => File[],
    default: () => []
  }
});

const emit = defineEmits<{
  'update:files': [files: File[]];
  'remove': [index: number];
  'clear': [];
}>();

// 上传组件的引用
const uploader = ref();

// 计算属性，防止直接操作props
const filesList = computed(() => props.files || []);

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
 * 处理文件选择
 */
function handleFileSelect(files: File[]) {
  emit('update:files', files || []);
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