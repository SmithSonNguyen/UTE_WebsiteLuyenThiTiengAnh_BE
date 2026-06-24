import { Router } from 'express'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  getMyInstructorsController,
  getMyStudentsController,
  getMessagesController,
  markReadController,
  validateRoomController
} from '~/controllers/chat.controllers'

const chatRouter = Router()

// Tất cả routes đều cần xác thực
chatRouter.use(accessTokenValidator)

/**
 * GET /chat/instructors
 * Học viên lấy danh sách giảng viên theo lớp đã đăng ký
 */
chatRouter.get('/instructors', wrapRequestHandler(getMyInstructorsController))

/**
 * GET /chat/students
 * Giảng viên lấy danh sách học sinh của các lớp mình dạy
 */
chatRouter.get('/students', wrapRequestHandler(getMyStudentsController))

/**
 * GET /chat/messages/:roomId
 * Lấy lịch sử chat (phân trang)
 */
chatRouter.get('/messages/:roomId', wrapRequestHandler(getMessagesController))

/**
 * POST /chat/mark-read
 * Đánh dấu tin nhắn đã đọc
 */
chatRouter.post('/mark-read', wrapRequestHandler(markReadController))

/**
 * POST /chat/validate-room
 * Validate quyền chat (student ↔ instructor)
 */
chatRouter.post('/validate-room', wrapRequestHandler(validateRoomController))

export default chatRouter
