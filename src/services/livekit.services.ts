// src/services/livekit.service.ts
import { AccessToken } from 'livekit-server-sdk'
import { checkUserInClass } from './enrollments.services'
import { LiveKitTokenRequest } from '~/interfaces/livekit.interface'

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!
const LIVEKIT_URL = process.env.LIVEKIT_URL!

export interface LiveKitTokenPayload {
  token: string
  serverUrl: string
  roomName: string
}

export const generateLiveKitTokenService = async (
  user: any, // req.decoded_authorization
  body: LiveKitTokenRequest & { instructorId?: string }
): Promise<LiveKitTokenPayload> => {
  const { roomName, classId, sessionNumber, instructorId } = body

  if (!roomName || !classId || !sessionNumber) {
    throw new Error('Thiếu thông tin roomName, classId hoặc sessionNumber')
  }

  if (!user || !user.user_id) {
    throw new Error('Chưa xác thực')
  }

  // Kiểm tra quyền tham gia lớp
  const isEnrolled = await checkUserInClass(user.user_id, classId)
  if (!isEnrolled) {
    throw new Error('Bạn chưa đăng ký lớp học này')
  }

  // Tạo Access Token
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: user.user_id,
    metadata: JSON.stringify({
      classId,
      sessionNumber,
      role: user.role || 'student'
    })
  })

  // Phân biệt giảng viên
  const isInstructor = (instructorId && user.user_id === instructorId) || user.role === 'instructor'

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isInstructor, // Giảng viên có quyền moderator
    canUpdateOwnMetadata: true
  })

  const token = await at.toJwt()

  return {
    token,
    serverUrl: LIVEKIT_URL,
    roomName
  }
}
