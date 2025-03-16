<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">欢迎使用 AI 助手</h1>
        <p class="text-xl text-gray-600 dark:text-gray-400 mb-12">选择您需要使用的功能</p>
      </div>
      
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
        <!-- 代码检查卡片 -->
        <div 
          class="bg-white dark:bg-gray-800 overflow-hidden shadow-xl rounded-lg p-6 hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
          @click="navigateTo('/code-checker')"
        >
          <div class="text-center">
            <div class="h-12 w-12 mx-auto mb-4">
              <!-- 代码图标 -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-indigo-600 dark:text-indigo-400">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">代码检查</h2>
            <p class="text-gray-600 dark:text-gray-400">使用AI助手检查和优化您的代码</p>
          </div>
        </div>

        <!-- AI换装卡片 -->
        <div 
          class="bg-white dark:bg-gray-800 overflow-hidden shadow-xl rounded-lg p-6 hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
          @click="navigateTo('/ai-fashion')"
        >
          <div class="text-center">
            <div class="h-12 w-12 mx-auto mb-4">
              <!-- 时尚图标 -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-pink-600 dark:text-pink-400">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15.5458C21 19.2458 17.866 22.0001 14 22.0001C10.134 22.0001 7 19.2458 7 15.5458C7 11.8458 14 2.00006 14 2.00006C14 2.00006 21 11.8458 21 15.5458Z" />
              </svg>
            </div>
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">AI换装</h2>
            <p class="text-gray-600 dark:text-gray-400">智能时尚搭配助手</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.grid {
  transition: all 0.3s ease;
}
</style> 