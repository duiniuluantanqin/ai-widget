import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 保存结果到服务器下载目录
 * 将检查结果保存到服务器的下载目录
 */
export default defineEventHandler(async (event) => {
  try {
    // 获取请求体
    const body = await readBody(event);
    
    // 验证请求体
    if (!body || !body.results) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少结果数据'
      });
    }
    
    // 获取下载目录
    const downloadDir = process.env.DOWNLOAD_DIR || path.join(os.homedir(), 'Downloads');
    
    // 确保目录存在
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    // 创建文件名
    const fileName = `code-check-results-${new Date().toISOString().slice(0, 10)}.json`;
    const filePath = path.join(downloadDir, fileName);
    
    // 将结果写入文件
    fs.writeFileSync(filePath, JSON.stringify(body.results, null, 2), 'utf8');
    
    // 返回成功信息
    return {
      success: true,
      filePath,
      message: `结果已保存到 ${filePath}`
    };
  } catch (error: any) {
    console.error('保存结果失败:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}); 