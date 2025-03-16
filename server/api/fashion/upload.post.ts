import { defineEventHandler, readMultipartFormData } from 'h3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  try {
    // 读取上传的文件数据
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
      throw new Error('没有上传文件')
    }

    const file = files[0]
    if (!file.type?.startsWith('image/')) {
      throw new Error('请上传图片文件')
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'fashion')
    await mkdir(uploadDir, { recursive: true })

    // 生成唯一文件名
    const ext = file.filename?.split('.').pop() || 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const filepath = join(uploadDir, filename)

    // 保存文件
    await writeFile(filepath, file.data)

    // 返回文件URL
    return {
      code: 0,
      data: {
        url: `/uploads/fashion/${filename}`,
        filename: file.filename,
        type: file.type
      }
    }
  } catch (error: any) {
    return {
      code: 1,
      message: error.message || '上传失败'
    }
  }
}) 