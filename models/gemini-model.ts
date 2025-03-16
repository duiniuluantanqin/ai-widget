import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { BaseModel } from './base-model';

interface FileInfo {
  name: string;
  type: string;
  content: Buffer | ArrayBuffer;
}

/**
 * Gemini 模型实现
 * 支持图片编辑等特殊功能
 */
export class GeminiModel extends BaseModel {
  private genAI: any;
  private fileManager: any;
  private model: any;

  constructor(apiKey: string) {
    super(apiKey, '');
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
    
    // 初始化图片生成模型
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
    });
  }

  /**
   * 上传文件到 Gemini
   * @param file 文件信息
   * @returns 上传后的文件信息
   */
  private async uploadToGemini(file: FileInfo): Promise<any> {
    try {
      const uploadResult = await this.fileManager.uploadFile(file.content, {
        mimeType: file.type,
        displayName: file.name,
      });
      console.log(`已上传文件 ${uploadResult.file.displayName}，URI: ${uploadResult.file.name}`);
      return uploadResult.file;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw new Error(`文件上传失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 编辑图片
   * @param file 图片文件信息
   * @param prompt 编辑提示
   * @param params 生成参数
   * @returns 编辑结果
   */
  async editImage(
    file: FileInfo,
    prompt: string,
    params: {
      temperature?: number;
      topP?: number;
      topK?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<string> {
    try {
      // 上传文件
      const uploadedFile = await this.uploadToGemini(file);

      // 配置生成参数
      const generationConfig = {
        temperature: params.temperature ?? 0.15,
        topP: params.topP ?? 0.95,
        topK: params.topK ?? 40,
        maxOutputTokens: params.maxOutputTokens ?? 8192,
        responseMimeType: "text/plain",
      };

      // 创建聊天会话
      const chatSession = this.model.startChat({
        generationConfig,
        history: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  mimeType: uploadedFile.mimeType,
                  fileUri: uploadedFile.uri,
                },
              },
              { text: prompt + '\n' },
            ],
          },
        ],
      });

      // 发送消息并获取响应
      const result = await chatSession.sendMessage(prompt);
      return result.response.text();
    } catch (error) {
      console.error('图片编辑失败:', error);
      throw new Error(`图片编辑失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 实现基类的抽象方法
  async checkCode(): Promise<string> {
    throw new Error('Gemini 模型不支持代码检查功能');
  }
} 