import { exec } from 'child_process';
import path from 'path';
import os from 'os';

/**
 * 打开下载目录
 * 根据操作系统使用不同的命令打开下载目录
 */
export default defineEventHandler(async (event) => {
  try {
    // 获取下载目录
    const downloadDir = process.env.DOWNLOAD_DIR || path.join(os.homedir(), 'Downloads');
    
    // 根据操作系统选择打开目录的命令
    let command = '';
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows
      command = `explorer "${downloadDir}"`;
    } else if (platform === 'darwin') {
      // macOS
      command = `open "${downloadDir}"`;
    } else if (platform === 'linux') {
      // Linux
      command = `xdg-open "${downloadDir}"`;
    } else {
      throw new Error(`不支持的操作系统: ${platform}`);
    }
    
    // 执行命令
    exec(command, (error) => {
      if (error) {
        console.error('打开目录失败:', error);
      }
    });
    
    return {
      success: true,
      directory: downloadDir,
      message: `已打开目录: ${downloadDir}`
    };
  } catch (error: any) {
    console.error('打开下载目录失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}); 