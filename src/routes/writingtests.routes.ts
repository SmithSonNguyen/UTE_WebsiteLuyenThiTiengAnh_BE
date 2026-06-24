import { Router } from 'express'
import {
  getAllWritingTestsController,
  getWritingTestByIdController,
  submitWritingTestController,
  getWritingResultController,
  getUserWritingHistoryController
} from '~/controllers/writingtests.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const writingTestsRouter = Router()

/**
 * GET /writing-tests
 * Lấy danh sách tất cả đề thi writing (public).
 */
writingTestsRouter.get('/', wrapRequestHandler(getAllWritingTestsController))

/**
 * GET /writing-tests/history
 * Lấy lịch sử bài làm writing của user (yêu cầu đăng nhập).
 * Phải đứng TRƯỚC /:writingTestId để tránh bị match nhầm.
 */
writingTestsRouter.get('/history', accessTokenValidator, wrapRequestHandler(getUserWritingHistoryController))

/**
 * GET /writing-tests/:writingTestId
 * Lấy chi tiết 1 đề thi (bao gồm câu hỏi) – public.
 */
writingTestsRouter.get('/:writingTestId', wrapRequestHandler(getWritingTestByIdController))

/**
 * POST /writing-tests/:writingTestId/submit
 * Nộp bài thi writing (yêu cầu đăng nhập).
 * Body: { answers: IWritingAnswerItem[], aiFeedback?: IAIFeedback }
 */
writingTestsRouter.post('/:writingTestId/submit', accessTokenValidator, wrapRequestHandler(submitWritingTestController))

/**
 * GET /writing-tests/:writingTestId/result
 * Lấy kết quả bài làm của user cho đề thi này (yêu cầu đăng nhập).
 */
writingTestsRouter.get(
  '/:writingTestId/result',
  accessTokenValidator,
  wrapRequestHandler(getWritingResultController)
)

export default writingTestsRouter
