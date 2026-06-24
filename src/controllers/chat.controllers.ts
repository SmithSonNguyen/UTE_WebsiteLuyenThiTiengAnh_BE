import { Request, Response } from 'express'
import { chatService } from '~/services/chat.services'
import HTTP_STATUS from '~/constants/httpStatus'

/**
 * GET /chat/instructors
 * Học viên lấy danh sách giảng viên của các lớp đã đăng ký
 */
export const getMyInstructorsController = async (req: Request, res: Response) => {
  const studentId = (req as any).decoded_authorization?.user_id
  if (!studentId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Unauthorized' })
  }

  const instructors = await chatService.getInstructorsForStudent(studentId)
  return res.status(HTTP_STATUS.OK).json({ result: instructors })
}

/**
 * GET /chat/students
 * Giảng viên lấy danh sách học sinh của các lớp mình dạy
 */
export const getMyStudentsController = async (req: Request, res: Response) => {
  const instructorId = (req as any).decoded_authorization?.user_id
  if (!instructorId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Unauthorized' })
  }

  const students = await chatService.getStudentsForInstructor(instructorId)
  return res.status(HTTP_STATUS.OK).json({ result: students })
}

/**
 * GET /chat/messages/:roomId?page=1&limit=30
 * Lấy lịch sử tin nhắn trong room, validate quyền truy cập
 */
export const getMessagesController = async (req: Request, res: Response) => {
  const userId = (req as any).decoded_authorization?.user_id
  const { roomId } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 30

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Unauthorized' })
  }

  // Kiểm tra userId có thuộc roomId không (roomId = "[id1]_[id2]")
  const parts = roomId.split('_')
  if (parts.length !== 2 || !parts.includes(userId)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Bạn không có quyền truy cập phòng chat này' })
  }

  const messages = await chatService.getMessages(roomId, page, limit)
  return res.status(HTTP_STATUS.OK).json({ result: messages, page, limit })
}

/**
 * POST /chat/mark-read
 * Đánh dấu đã đọc tin nhắn trong room
 */
export const markReadController = async (req: Request, res: Response) => {
  const userId = (req as any).decoded_authorization?.user_id
  const { roomId } = req.body

  if (!userId || !roomId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Thiếu thông tin' })
  }

  await chatService.markMessagesAsRead(roomId, userId)
  return res.status(HTTP_STATUS.OK).json({ message: 'Đã đánh dấu đọc' })
}

/**
 * POST /chat/validate-room
 * Validate student có quyền chat với instructor không
 */
export const validateRoomController = async (req: Request, res: Response) => {
  const userId = (req as any).decoded_authorization?.user_id
  const { otherUserId } = req.body

  if (!userId || !otherUserId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Thiếu thông tin' })
  }

  // Thử cả 2 chiều (student→instructor hoặc instructor→student)
  const isValid =
    (await chatService.validateChatPermission(userId, otherUserId)) ||
    (await chatService.validateChatPermission(otherUserId, userId))

  if (!isValid) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Bạn không có quyền chat với người này' })
  }

  const roomId = chatService.createRoomId(userId, otherUserId)
  return res.status(HTTP_STATUS.OK).json({ result: { roomId } })
}
