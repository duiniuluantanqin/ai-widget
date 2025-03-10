// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    // 服务器端密钥
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    deepseekApiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
    siliconflowApiKey: process.env.SILICONFLOW_API_KEY || '',
    siliconflowApiUrl: process.env.SILICONFLOW_API_URL || 'https://api.siliconflow.com',
    // 客户端可访问的密钥
    public: {
      apiBase: '/api',
      maxFileSizeKB: parseInt(process.env.MAX_FILE_SIZE_KB || '10')
    }
  },
  // 路由选项
  routeRules: {
    '/serviceWorker.js': { static: true },
  },
  sourcemap: {
    server: true,
    client: true
  }
})
