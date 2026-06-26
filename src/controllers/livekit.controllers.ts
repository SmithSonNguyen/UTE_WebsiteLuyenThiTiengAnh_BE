// src/controllers/livekit.controller.ts
import { Request, Response } from 'express'
import { generateLiveKitTokenService } from '~/services/livekit.services'
import { LiveKitTokenRequest } from '~/interfaces/livekit.interface'

export const generateLiveKitToken = async (req: Request, res: Response) => {
  try {
    const body = req.body as LiveKitTokenRequest & { instructorId?: string }
    const user = req.decoded_authorization

    const result = await generateLiveKitTokenService(user, body)

    res.status(200).json(result)
  } catch (error: any) {
    console.error('LiveKit Token Error:', error)

    // Xử lý lỗi có ý nghĩa
    if (error.message.includes('chưa đăng ký')) {
      return res.status(403).json({ error: error.message })
    }
    if (error.message.includes('Chưa xác thực')) {
      return res.status(401).json({ error: error.message })
    }
    if (error.message.includes('Thiếu thông tin')) {
      return res.status(400).json({ error: error.message })
    }

    res.status(500).json({ error: 'Lỗi server khi tạo token LiveKit' })
  }
}
