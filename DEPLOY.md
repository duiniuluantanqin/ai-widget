# 自动部署流水线使用说明

本项目使用GitHub Actions实现自动化部署。当推送一个新的tag到GitHub仓库时，将自动触发部署流程。

## 前提条件

1. 拥有一台可以通过SSH访问的服务器
2. 服务器上已安装Node.js、npm和PM2
3. 服务器上已配置好Git，并有权限拉取代码仓库

## 设置GitHub Secrets

在GitHub仓库中，需要设置以下Secrets用于部署：

1. 打开你的GitHub仓库
2. 点击 "Settings" -> "Secrets and variables" -> "Actions"
3. 点击 "New repository secret" 添加以下secrets:

### 服务器连接信息
- `SERVER_HOST`: 服务器IP地址或域名
- `SERVER_USERNAME`: SSH登录用户名
- `SERVER_SSH_KEY`: SSH私钥（不是密码）

### 环境变量（根据.env.example）
- `DEEPSEEK_API_KEY`: Deepseek API密钥
- `DEEPSEEK_API_URL`: Deepseek API URL
- `SILICONFLOW_API_KEY`: Siliconflow API密钥
- `SILICONFLOW_API_URL`: Siliconflow API URL
- `MAX_FILE_SIZE_KB`: 最大文件大小（KB）

## 如何获取SSH私钥

如果你还没有SSH密钥对，可以按照以下步骤生成：

1. 在本地终端运行：`ssh-keygen -t rsa -b 4096`
2. 将生成的公钥（通常在`~/.ssh/id_rsa.pub`）添加到服务器的`~/.ssh/authorized_keys`文件中
3. 将私钥（通常在`~/.ssh/id_rsa`）的内容复制到GitHub的`SERVER_SSH_KEY` secret中

## 修改部署脚本

在`.github/workflows/deploy.yml`文件中，你需要修改以下内容：

```yaml
script: |
  cd /path/to/your/app  # 修改为你的应用在服务器上的实际路径
  # ...其余部分保持不变
```

## 触发部署

要触发自动部署，只需创建并推送一个新的tag：

```bash
# 确保你的更改已提交
git add .
git commit -m "准备发布新版本"
git push

# 创建并推送tag
git tag v1.0.0  # 创建一个新tag
git push origin v1.0.0  # 推送tag到GitHub
```

## 部署流程

1. GitHub Actions检出代码
2. 获取推送的Tag名称
3. 设置Node.js环境
4. 安装依赖
5. 构建应用
6. 通过SSH连接到服务器
7. 备份现有的.env文件（如果存在）
8. 拉取指定Tag的代码
9. 安装依赖并构建
10. 创建或更新.env文件
11. 使用PM2重启或启动应用

## 部署脚本的特点

1. **错误处理**：使用`set -e`确保任何命令失败时脚本停止执行
2. **版本控制**：直接检出指定的Tag版本，而不是简单地拉取最新代码
3. **环境变量管理**：使用heredoc语法创建.env文件，更加清晰
4. **智能PM2管理**：检查应用是否已在PM2中运行，并相应地选择reload或start
5. **部署反馈**：在部署的各个阶段提供清晰的日志信息

## 故障排除

如果部署失败，可以在GitHub仓库的Actions标签页查看详细的日志信息。常见问题包括：

1. **SSH连接失败**：检查SERVER_HOST、SERVER_USERNAME和SERVER_SSH_KEY是否正确
2. **Git操作失败**：确保服务器上的Git已正确配置，并有权限拉取代码
3. **Node.js或npm错误**：检查服务器上的Node.js版本是否兼容
4. **PM2错误**：确保PM2已正确安装并可用

如果需要手动部署，可以按照以下步骤操作：

```bash
cd /path/to/your/app
git fetch --tags
git checkout <tag-name>
npm ci
npm run build
pm2 reload nuxt-app || pm2 start .output/server/index.mjs --name "nuxt-app"
``` 