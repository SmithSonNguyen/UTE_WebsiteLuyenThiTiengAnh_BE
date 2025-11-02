import { Router } from 'express'
import { getSixHundredNewVocabularyController } from '~/controllers/lessons.controllers'
import { sixHundredNewVocabularyValidator } from '../middlewares/lessons.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

// Import progress controllers
import {
  getUserProgress,
  getLessons,
  getLessonProgress,
  updateQuizProgress,
  initializeProgress,
  getLearningStats,
  updateLessonTime,
  resetProgress
} from '~/controllers/userprogress.controllers'

const lessonsRouter = Router()

// ==========================================
// VOCABULARY ROUTES (Existing)
// ==========================================

// Public route - get vocabulary data
lessonsRouter.get(
  '/six-hundred-new-vocabulary',
  sixHundredNewVocabularyValidator,
  wrapRequestHandler(getSixHundredNewVocabularyController)
)

// ==========================================
// USER PROGRESS ROUTES (New - Require Auth)
// ==========================================

// GET: Lấy toàn bộ progress của user
// GET /lessons/progress
lessonsRouter.get('/progress', accessTokenValidator, wrapRequestHandler(getUserProgress))

// GET: Lấy danh sách lessons với trạng thái unlock
// GET /lessons/progress/lessons
lessonsRouter.get('/progress/lessons', accessTokenValidator, wrapRequestHandler(getLessons))

// GET: Lấy learning stats
// GET /lessons/progress/stats
lessonsRouter.get('/progress/stats', accessTokenValidator, wrapRequestHandler(getLearningStats))

// GET: Lấy progress của một lesson cụ thể
// GET /lessons/progress/lessons/:lessonId
lessonsRouter.get('/progress/lessons/:lessonId', accessTokenValidator, wrapRequestHandler(getLessonProgress))

// POST: Cập nhật progress sau khi hoàn thành quiz
// POST /lessons/progress/quiz
// Body: { lessonId, lessonTitle, score, totalQuestions, totalWords }
lessonsRouter.post('/progress/quiz', accessTokenValidator, wrapRequestHandler(updateQuizProgress))

// POST: Khởi tạo progress cho user mới
// POST /lessons/progress/initialize
// Body: { totalLessons?: number }
lessonsRouter.post('/progress/initialize', accessTokenValidator, wrapRequestHandler(initializeProgress))

// PATCH: Cập nhật thời gian học cho lesson
// PATCH /lessons/progress/lessons/:lessonId/time
// Body: { timeSpent: number } (in minutes)
lessonsRouter.patch('/progress/lessons/:lessonId/time', accessTokenValidator, wrapRequestHandler(updateLessonTime))

// DELETE: Reset progress (for testing/development only)
// DELETE /lessons/progress/reset
lessonsRouter.delete('/progress/reset', accessTokenValidator, wrapRequestHandler(resetProgress))

export default lessonsRouter
