/**
 * 处理Service Worker请求
 * 返回空内容，避免Vue Router警告
 */
export default defineEventHandler((event) => {
  // 设置内容类型为javascript
  setResponseHeader(event, 'Content-Type', 'application/javascript');
  
  // 返回空的JavaScript内容
  return '';
}); 