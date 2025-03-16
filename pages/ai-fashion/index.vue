<template>
  <UContainer>
    <div class="flex flex-col">
      <!-- 错误提示 -->
      <UAlert
        v-if="error"
        type="error"
        :title="error"
        class="mb-4"
        icon="i-heroicons-exclamation-triangle"
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左侧上传区域 -->
        <div class="space-y-4">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold">上传图片</h2>
                <UButton
                  v-if="imageUrl"
                  color="red"
                  variant="soft"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="clearImage"
                >
                  清除
                </UButton>
              </div>
            </template>

            <div 
              class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center"
              :class="{ 'hover:border-primary-500 cursor-pointer': !imageUrl }"
              @click="!imageUrl && triggerFileInput"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/*"
                @change="handleFileChange"
              >
              
              <template v-if="imageUrl">
                <div class="relative group">
                  <img 
                    :src="imageUrl" 
                    alt="预览图片"
                    class="max-h-[400px] mx-auto rounded-lg shadow-md"
                  >
                  <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <UButton
                      color="white"
                      variant="solid"
                      @click.stop="triggerFileInput"
                    >
                      更换图片
                    </UButton>
                  </div>
                </div>
              </template>
              
              <template v-else>
                <div class="text-center">
                  <UIcon
                    name="i-heroicons-photo"
                    class="mx-auto h-12 w-12 text-gray-400"
                  />
                  <div class="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400">
                    <label
                      class="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500"
                    >
                      <span>点击上传</span>
                    </label>
                    <p class="pl-1">或拖放图片到此处</p>
                  </div>
                  <p class="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG, GIF 格式</p>
                </div>
              </template>
            </div>

            <template #footer>
              <div class="flex justify-between items-center">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  支持拖放上传
                </p>
                <UButton
                  v-if="imageUrl"
                  color="primary"
                  :loading="isLoading"
                  :disabled="isLoading"
                  @click="generateFashion"
                >
                  {{ isLoading ? '生成中...' : '开始生成' }}
                </UButton>
              </div>
            </template>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-medium">生成设置</h3>
            </template>
            
            <div class="space-y-4">
              <UFormGroup label="风格选择">
                <USelect
                  v-model="selectedStyle"
                  :options="styleOptions"
                  placeholder="选择服装风格"
                />
              </UFormGroup>

              <UFormGroup label="场景选择">
                <USelect
                  v-model="selectedScene"
                  :options="sceneOptions"
                  placeholder="选择适用场景"
                />
              </UFormGroup>

              <UFormGroup label="季节">
                <USelect
                  v-model="selectedSeason"
                  :options="seasonOptions"
                  placeholder="选择季节"
                />
              </UFormGroup>
            </div>
          </UCard>
        </div>

        <!-- 右侧结果展示区 -->
        <div class="space-y-4">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold">搭配结果</h2>
                <UButton
                  v-if="results.length > 0"
                  color="primary"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-arrow-down-tray"
                  @click="downloadResults"
                >
                  保存结果
                </UButton>
              </div>
            </template>

            <div v-if="results.length === 0" class="text-center py-12">
              <UIcon
                name="i-heroicons-sparkles"
                class="mx-auto h-12 w-12 text-gray-400"
              />
              <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">暂无结果</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                上传图片并点击"开始生成"来获取搭配建议
              </p>
            </div>

            <div v-else class="space-y-6">
              <div v-for="(result, index) in results" :key="index" class="space-y-4">
                <img 
                  v-if="result.imageUrl" 
                  :src="result.imageUrl" 
                  :alt="`搭配结果${index + 1}`"
                  class="w-full rounded-lg shadow-md"
                >
                <div class="prose dark:prose-invert max-w-none">
                  <h4>搭配建议 {{ index + 1 }}</h4>
                  <p>{{ result.description }}</p>
                </div>
              </div>
            </div>

            <template #footer>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                * 生成的搭配仅供参考
              </p>
            </template>
          </UCard>
        </div>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 文件上传相关
const fileInput = ref<HTMLInputElement | null>(null)
const imageUrl = ref('')
const error = ref('')

// 加载状态
const isLoading = ref(false)

// 结果数组
const results = ref<Array<{imageUrl: string; description: string}>>([])

// 选项数据
const styleOptions = [
  { label: '休闲风格', value: 'casual' },
  { label: '商务正装', value: 'business' },
  { label: '运动风格', value: 'sports' },
  { label: '街头时尚', value: 'street' },
  { label: '优雅复古', value: 'vintage' }
]

const sceneOptions = [
  { label: '日常通勤', value: 'daily' },
  { label: '商务会议', value: 'meeting' },
  { label: '周末休闲', value: 'weekend' },
  { label: '约会', value: 'date' },
  { label: '派对', value: 'party' }
]

const seasonOptions = [
  { label: '春季', value: 'spring' },
  { label: '夏季', value: 'summer' },
  { label: '秋季', value: 'autumn' },
  { label: '冬季', value: 'winter' }
]

// 选中的选项
const selectedStyle = ref('')
const selectedScene = ref('')
const selectedSeason = ref('')

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件改变
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (validateFile(file)) {
      displayImage(file)
    }
  }
}

// 处理拖放
const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file && validateFile(file)) {
    displayImage(file)
  }
}

// 验证文件
const validateFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    error.value = '请上传图片文件'
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = '图片大小不能超过5MB'
    return false
  }
  error.value = ''
  return true
}

// 显示图片
const displayImage = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 清除图片
const clearImage = () => {
  imageUrl.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  results.value = []
}

// 生成搭配
const generateFashion = async () => {
  if (!imageUrl.value) {
    error.value = '请先上传图片'
    return
  }
  
  isLoading.value = true
  try {
    // TODO: 调用API生成搭配建议
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    results.value = [
      {
        imageUrl: imageUrl.value, // 这里应该是生成的新图片
        description: '这套搭配采用了简约大方的设计理念，搭配舒适透气的面料，适合日常穿着。上衣选用柔和的米色，下装搭配深色系，打造出层次感。'
      },
      {
        imageUrl: imageUrl.value, // 这里应该是生成的新图片
        description: '这是一套充满活力的搭配方案，采用了明亮的色彩组合，突出个性化风格。通过巧妙的配饰点缀，提升整体时尚度。'
      }
    ]
  } catch (e) {
    error.value = '生成失败，请重试'
  } finally {
    isLoading.value = false
  }
}

// 下载结果
const downloadResults = () => {
  // TODO: 实现结果下载功能
  const element = document.createElement('a')
  element.href = results.value[0].imageUrl
  element.download = 'fashion-result.png'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}
</script>

<style scoped>
.prose :deep(h4) {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.prose :deep(p) {
  margin-top: 0;
  margin-bottom: 1rem;
}
</style> 