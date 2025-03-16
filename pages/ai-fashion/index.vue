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
          <ImageUploader
            v-model:file="currentFile"
            title="上传图片"
            dropzoneText="拖放服装图片到此处或点击选择图片"
            :maxSize="5 * 1024 * 1024"
            @error="handleError"
          />

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
import { ref, watch } from 'vue'
import ImageUploader from '~/components/ImageUploader.vue'

// 文件上传相关
const currentFile = ref<File | null>(null)
const error = ref('')
const isUploading = ref(false)

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

// 处理上传错误
const handleError = (message: string) => {
  error.value = message
}

// 监听文件变化
watch(currentFile, async (newFile) => {
  if (newFile) {
    isUploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', newFile)

      const response = await fetch('/api/fashion/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.code === 0) {
        results.value = [] // 清空之前的结果
        error.value = '' // 清除错误信息
      } else {
        throw new Error(result.message)
      }
    } catch (e: any) {
      error.value = e.message || '上传失败'
    } finally {
      isUploading.value = false
    }
  } else {
    // 文件被清除
    results.value = []
  }
})

// 生成搭配
const generateFashion = async () => {
  if (!currentFile.value) {
    error.value = '请先上传图片'
    return
  }
  
  isLoading.value = true
  try {
    // TODO: 调用API生成搭配建议
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 创建预览URL
    const imageUrl = URL.createObjectURL(currentFile.value)
    
    results.value = [
      {
        imageUrl: imageUrl,
        description: '这套搭配采用了简约大方的设计理念，搭配舒适透气的面料，适合日常穿着。上衣选用柔和的米色，下装搭配深色系，打造出层次感。'
      },
      {
        imageUrl: imageUrl,
        description: '这是一套充满活力的搭配方案，采用了明亮的色彩组合，突出个性化风格。通过巧妙的配饰点缀，提升整体时尚度。'
      }
    ]
  } catch (e: any) {
    error.value = '生成失败，请重试'
  } finally {
    isLoading.value = false
  }
}

// 下载结果
const downloadResults = () => {
  if (results.value.length > 0 && currentFile.value) {
    const element = document.createElement('a')
    element.href = results.value[0].imageUrl
    element.download = `fashion-result-${currentFile.value.name}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
}

// 监听上传状态
watch(isUploading, (newValue) => {
  if (newValue) {
    const toast = useToast()
    toast.add({
      title: '上传中',
      description: '请稍候...',
      icon: 'i-heroicons-arrow-path',
      color: 'blue',
      timeout: 1000
    })
  }
})
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