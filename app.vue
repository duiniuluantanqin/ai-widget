<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="w-full py-2 px-3 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto flex justify-between items-center">
        <!-- 左侧项目名称和logo -->
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400 mr-2">
            <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-3.08"></path>
            <path d="M18 14h-7"></path>
            <path d="M18 18h-7"></path>
            <path d="M8 6h1"></path>
            <path d="M8 10h1"></path>
            <path d="M8 14h1"></path>
            <path d="M8 18h1"></path>
          </svg>
          <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-200">AI工具箱</h1>
        </div>
        
        <!-- 右侧链接 -->
        <div class="flex items-center space-x-4">
          <UColorModeButton class="mr-2" />
          <UButton
            variant="solid"
            size="sm"
            class="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-3 py-1 rounded-md shadow-sm hover:shadow-md transition-all transform hover:scale-105"
            @click="showRechargeModal = true"
          >
            <div class="flex items-center">
              <UIcon name="i-heroicons-gift" class="mr-1.5 h-4 w-4" />
              <span>薅羊毛</span>
            </div>
          </UButton>
          <a 
            href="https://github.com/duiniuluantanqin/code-checker" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            <span>源码</span>
          </a>
        </div>
      </div>
    </header>
    <NuxtPage />
    
    <!-- 添加充值对话框 -->
    <UModal v-model="showRechargeModal">
      <UCard class="border-blue-200 dark:border-blue-800">
        <template #header>
          <div class="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 -mx-4 -mt-4 px-4 py-3 rounded-t-lg">
            <h3 class="text-lg font-medium text-blue-800 dark:text-blue-300">限时福利</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="showRechargeModal = false"
            />
          </div>
        </template>
        
        <div class="py-4 space-y-5">
          <div class="text-center">
            <UIcon name="i-heroicons-gift" class="h-14 w-14 mx-auto text-blue-500 mb-3" />
            <h4 class="text-xl font-medium mb-3 text-blue-700 dark:text-blue-300">双赢福利</h4>
            <p class="text-gray-700 dark:text-gray-300 text-base">
              通过我的链接注册硅基流动，双方都会获得<span class="text-red-500 font-bold text-lg">14块钱</span>！
            </p>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              <UIcon name="i-heroicons-heart" class="inline-block mr-1 text-red-500" />
              我会将获得的奖励全部作为福利回馈给大家使用
            </p>
          </div>
          
          <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <p class="text-sm mb-3 font-medium flex items-center">
              <UIcon name="i-heroicons-cursor-arrow-rays" class="mr-2 text-blue-600 dark:text-blue-400" />
              点击下方链接直接注册：
            </p>
            <a 
              :href="inviteLink" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="block p-3 bg-blue-100 dark:bg-blue-800 rounded-md text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors text-center font-medium shadow-sm hover:shadow"
            >
              硅基流动注册链接
            </a>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p class="text-sm mb-3 font-medium flex items-center">
              <UIcon name="i-heroicons-clipboard-document" class="mr-2 text-gray-600 dark:text-gray-400" />
              或复制链接分享给朋友：
            </p>
            <div class="flex">
              <UInput
                :model-value="inviteLink"
                readonly
                class="flex-1"
              />
              <UButton
                color="blue"
                class="ml-2"
                @click="copyInviteLink"
              >
                复制
              </UButton>
            </div>
          </div>
          
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
            <p class="text-sm text-amber-800 dark:text-amber-300 flex items-start">
              <UIcon name="i-heroicons-information-circle" class="mr-2 h-5 w-5 flex-shrink-0 text-amber-500" />
              <span>
                <strong>提示：</strong>成功注册后请刷新页面，即可看到账户金额发生变化。
              </span>
            </p>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="blue"
              variant="soft"
              @click="showRechargeModal = false"
            >
              关闭
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 充值模态框状态
const showRechargeModal = ref(false)
// 邀请链接
const inviteLink = ref(`https://cloud.siliconflow.cn/i/5sSwk5jh`)

// 复制邀请链接
function copyInviteLink() {
  navigator.clipboard.writeText(inviteLink.value)
    .then(() => {
      // 可以添加复制成功的提示
      alert('链接已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败:', err)
    })
}
</script>

<style>
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    'Helvetica Neue', sans-serif;
}
</style>
