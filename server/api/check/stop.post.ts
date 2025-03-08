import { defineEventHandler, readBody } from 'h3';

// 存储当前活跃的请求控制器
const activeRequests = new Map<string, AbortController>();

// 注册活跃请求
export function registerActiveRequest(id: string, controller: AbortController) {
  activeRequests.set(id, controller);
}

// 移除活跃请求
export function removeActiveRequest(id: string) {
  activeRequests.delete(id);
}

// 获取所有活跃请求ID
export function getActiveRequestIds(): string[] {
  return Array.from(activeRequests.keys());
}

// 终止所有活跃请求
export function abortAllRequests() {
  for (const controller of activeRequests.values()) {
    controller.abort();
  }
  activeRequests.clear();
}

// 终止特定请求
export function abortRequest(id: string) {
  const controller = activeRequests.get(id);
  if (controller) {
    controller.abort();
    activeRequests.delete(id);
    return true;
  }
  return false;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { requestId } = body;
    
    if (requestId) {
      // 终止特定请求
      const success = abortRequest(requestId);
      return { 
        success, 
        message: success ? `已终止请求 ${requestId}` : `未找到请求 ${requestId}` 
      };
    } else {
      // 终止所有请求
      const count = activeRequests.size;
      abortAllRequests();
      return { 
        success: true, 
        message: `已终止所有 ${count} 个活跃请求` 
      };
    }
  } catch (error: unknown) {
    return { 
      success: false, 
      message: `终止请求失败: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}); 