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

// Import user vocabulary controllers
import {
  saveUserVocabularyController,
  getUserVocabulariesController,
  deleteUserVocabularyController,
  toggleFavoriteController,
  updateReviewCountController,
  getUserVocabularyStatsController
} from '~/controllers/userVocabulary.controllers'
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

// POST: Lưu từ vựng sau khi dịch
// POST /lessons/my-vocabulary
// Body: { word, explanation, sourceLanguage?, contextExample?, tags? }
lessonsRouter.post('/my-vocabulary', accessTokenValidator, wrapRequestHandler(saveUserVocabularyController))

// GET: Lấy danh sách từ vựng đã lưu của user
// GET /lessons/my-vocabulary
// Query: ?page=1&limit=20&search=hello&tags=common,important&isFavorite=true&sortBy=createdAt&sortOrder=desc
lessonsRouter.get('/my-vocabulary', accessTokenValidator, wrapRequestHandler(getUserVocabulariesController))

// GET: Lấy thống kê từ vựng của user
// GET /lessons/my-vocabulary/stats
lessonsRouter.get('/my-vocabulary/stats', accessTokenValidator, wrapRequestHandler(getUserVocabularyStatsController))

// DELETE: Xóa từ vựng
// DELETE /lessons/my-vocabulary/:vocabularyId
lessonsRouter.delete(
  '/my-vocabulary/:vocabularyId',
  accessTokenValidator,
  wrapRequestHandler(deleteUserVocabularyController)
)

// PATCH: Toggle favorite status
// PATCH /lessons/my-vocabulary/:vocabularyId/favorite
lessonsRouter.patch(
  '/my-vocabulary/:vocabularyId/favorite',
  accessTokenValidator,
  wrapRequestHandler(toggleFavoriteController)
)

// PATCH: Cập nhật review count
// PATCH /lessons/my-vocabulary/:vocabularyId/review
lessonsRouter.patch(
  '/my-vocabulary/:vocabularyId/review',
  accessTokenValidator,
  wrapRequestHandler(updateReviewCountController)
)
export default lessonsRouter
