<template>
  <div class="w-full">
    <UCard class="mb-3 border-blue-100 dark:border-blue-900 shadow-sm">
      <template #header>
        <div class="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 -mx-4 -mt-4 px-3 py-2 rounded-t-lg">
          <div class="flex items-center">
            <h3 class="text-lg font-medium text-blue-800 dark:text-blue-300">{{ title }}</h3>
            <UTooltip :text="`文件大小限制为 ${formatFileSize(MAX_FILE_SIZE)}`">
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
            v-if="imageUrl"
            color="red"
            variant="soft"
            icon="i-heroicons-trash"
            @click="clearImage"
          >
            清除
          </UButton>
        </div>
      </template>
      
      <div v-if="imageUrl" class="relative group">
        <img 
          :src="imageUrl" 
          alt="预览图片"
          class="w-full max-h-[400px] object-contain rounded-lg"
        >
        <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <UButton
            color="white"
            variant="solid"
            @click="triggerFileInput"
          >
            更换图片
          </UButton>
        </div>
      </div>
      
      <template v-else>
        <div 
          class="text-center p-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-primary-500 transition-colors"
          @click="triggerFileInput"
          @drop.prevent="handleDrop"
          @dragover.prevent="() => {}"
          @dragenter.prevent="() => {}"
        >
          <UIcon name="i-heroicons-photo" class="text-3xl mb-2" />
          <p>{{ dropzoneText }}</p>
          <UButton color="gray" variant="soft" class="mt-3" icon="i-heroicons-photo" @click.stop="triggerFileInput">
            浏览图片
          </UButton>
        </div>
      </template>
      
      <!-- 显示文件大小错误信息 -->
      <UAlert
        v-if="error"
        color="red"
        :title="error"
        icon="i-heroicons-exclamation-triangle"
        class="mt-4"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: '上传图片'
  },
  dropzoneText: {
    type: String,
    default: '拖放图片到此处或点击选择图片'
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 默认5MB
  }
});

const emit = defineEmits<{
  'update:file': [file: File | null];
  'error': [message: string];
}>();

// 文件大小限制
const MAX_FILE_SIZE = props.maxSize;
// 错误信息
const error = ref('');
// 图片预览URL
const imageUrl = ref('');
// 当前文件
const currentFile = ref<File | null>(null);

// 触发文件选择
const triggerFileInput = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/gif';
  
  input.onchange = (event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      handleFileSelect(target.files[0]);
    }
  };
  
  input.click();
};

// 处理文件选择
const handleFileSelect = (file: File) => {
  if (validateFile(file)) {
    updateFile(file);
  }
};

// 处理拖放
const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (file) {
    handleFileSelect(file);
  }
};

// 验证文件
const validateFile = (file: File): boolean => {
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    error.value = '请上传图片文件';
    emit('error', '请上传图片文件');
    return false;
  }
  
  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    error.value = `图片大小不能超过${formatFileSize(MAX_FILE_SIZE)}`;
    emit('error', `图片大小不能超过${formatFileSize(MAX_FILE_SIZE)}`);
    return false;
  }
  
  error.value = '';
  return true;
};

// 更新文件
const updateFile = (file: File) => {
  // 更新当前文件
  currentFile.value = file;
  // 创建预览URL
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
  imageUrl.value = URL.createObjectURL(file);
  // 触发更新事件
  emit('update:file', file);
};

// 清除图片
const clearImage = () => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
  imageUrl.value = '';
  currentFile.value = null;
  error.value = '';
  emit('update:file', null);
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 组件销毁时清理预览URL
onBeforeUnmount(() => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
});
</script> 