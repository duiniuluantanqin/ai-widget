/**
 * 文件读取工具类
 * 提供文件读取和内容处理的工具方法
 */
export class FileUtils {
  /**
   * 将File对象读取为文本内容
   * @param file File对象
   * @returns 文件内容
   */
  static async readFileAsText(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          resolve(event.target.result);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取出错'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * 检查文件是否为可接受的代码文件
   * @param file 要检查的文件
   * @returns 是否为可接受的代码文件
   */
  static isAcceptableCodeFile(file: File): boolean {
    // 检查文件扩展名
    const acceptableExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.vue', 
      '.py', '.java', '.c', '.cpp', '.h', '.hpp', 
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt'
    ];
    
    // 检查MIME类型
    const acceptableMimeTypes = [
      'text/plain', 'text/javascript', 'text/typescript',
      'application/javascript', 'application/x-javascript',
      'application/typescript'
    ];
    
    // 从文件名获取扩展名
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    return (
      acceptableExtensions.includes(fileExtension) ||
      acceptableMimeTypes.includes(file.type) ||
      file.type.startsWith('text/')  // 一般文本文件也接受
    );
  }

  /**
   * 将多个文件对象处理为文件数组
   * @param fileList FileList对象或类似对象
   * @returns 文件数组
   */
  static processFiles(fileList: FileList | File[]): File[] {
    // 转换为数组
    const files = Array.isArray(fileList) ? fileList : Array.from(fileList);
    
    // 只返回可接受的代码文件
    return files.filter(file => FileUtils.isAcceptableCodeFile(file));
  }
} 