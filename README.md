# 代码检查工具 (Code Checker)

[🌐 在线演示](http://bull.ossrs.net)

基于大语言模型的代码质量检查工具，可检查代码中的拼写错误、命名问题和潜在的BUG等。

## 功能特点

- 🧠 利用大模型进行代码检查，支持多种模型提供者（DeepSeek、SiliconFlow等）
- 🔍 支持多种检查类型（拼写和命名、BUG检查等）
- 📊 直观展示检查结果，支持下载结果报告
- 📝 支持自定义提示语和模型参数
- 🚀 支持多文件上传和并发处理
- 💻 美观、易用的现代UI界面

## 技术栈

- [Nuxt 3](https://nuxt.com/) - 全栈Vue框架
- [Nuxt UI](https://ui.nuxt.com/) - UI组件库
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [OpenAI SDK](https://github.com/openai/openai-node) - 用于调用兼容的LLM API

## 环境要求

- [Node.js 16.x](https://nodejs.org/zh-cn/download) 或更高版本
- 有效的API密钥（DeepSeek, SiliconFlow等）

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建`.env`文件并设置以下变量：

```
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
SILICONFLOW_API_KEY=your_siliconflow_api_key
SILICONFLOW_API_URL=https://api.siliconflow.cn/v1
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

- `components/` - Vue组件
- `composables/` - 组合函数
- `models/` - 模型相关代码
- `pages/` - 页面组件
- `server/` - 服务器API
- `types/` - 类型定义
- `utils/` - 工具函数

## 扩展指南

### 添加新的检查类型

1. 在`types/index.ts`中的`CheckType`类型中添加新类型
2. 在`DEFAULT_PROMPTS`对象中为新类型添加默认提示语
3. 在前端组件中添加对应的UI选项

### 添加新的模型提供者

1. 在`types/index.ts`中的`ModelProvider`类型中添加新提供者
2. 如果新提供者兼容OpenAI API，可以直接在`model-factory.ts`中添加支持
3. 如需特殊处理，可以创建新的模型类并继承`BaseModel`

## 贡献

欢迎提交问题和改进建议！

## 许可证

[MIT](LICENSE)
