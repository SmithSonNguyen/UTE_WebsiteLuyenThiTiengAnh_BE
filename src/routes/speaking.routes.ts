// routes/speaking.routes.ts
import { Router } from 'express'
import {
  gradeSpeakingController,
  getSpeakingHistoryController,
  getAllSpeakingHistoryController
} from '~/controllers/speaking.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const speakingRouter = Router()

/**
 * POST /speaking/grade
 * Chấm điểm TOEIC Speaking bằng Groq AI → tự động lưu vào MongoDB
 */
speakingRouter.post('/grade', accessTokenValidator, wrapRequestHandler(gradeSpeakingController))

/**
 * GET /speaking/history/:testId
 * Lấy lịch sử làm bài của user cho 1 đề Speaking cụ thể
 */
speakingRouter.get('/history/:testId', accessTokenValidator, wrapRequestHandler(getSpeakingHistoryController))

/**
 * GET /speaking/all-history
 * Lấy danh sách tất cả đề Speaking user đã làm (không kèm answers array)
 */
speakingRouter.get('/all-history', accessTokenValidator, wrapRequestHandler(getAllSpeakingHistoryController))

export default speakingRouter
