import { Request, Response, NextFunction } from 'express'
import UserProgress, { IUserProgress, UserProgressDocument } from '../models/schemas/UserProgress.schema'
import { TokenPayload } from '../models/requests/User.requests'
import HTTP_STATUS from '../constants/httpStatus'

// Type helper để làm rõ kiểu trả về từ Mongoose
type UserProgressDoc = UserProgressDocument | null

// ✅ GET: Lấy toàn bộ progress của user
export const getUserProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lấy userId từ decoded_authorization
    const { user_id } = req.decoded_authorization as TokenPayload

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing userId'
      })
    }

    let progress: UserProgressDoc = await UserProgress.findOne({ userId: user_id })

    // Nếu chưa có progress, tự động khởi tạo
    if (!progress) {
      progress = await UserProgress.initializeUserProgress(user_id, 50)
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: progress
    })
  } catch (error: any) {
    console.error('Error fetching user progress:', error)
    next(error)
  }
}

// ✅ GET: Lấy danh sách lessons với trạng thái unlock
export const getLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing userId'
      })
    }

    let progress: UserProgressDoc = await UserProgress.findOne({ userId: user_id })

    if (!progress) {
      progress = await UserProgress.initializeUserProgress(user_id, 50)
    }

    // Format data giống frontend
    const lessons = progress.vocabularyProgress.map((vp) => ({
      id: vp.lessonId,
      title: vp.lessonTitle,
      progress: vp.progress,
      completed: vp.completed,
      unlocked: vp.unlocked,
      totalWords: vp.totalWords,
      lastAccessedAt: vp.lastAccessedAt,
      quizAttempts: vp.quizResults.length,
      bestScore: vp.quizResults.length > 0 ? Math.max(...vp.quizResults.map((qr) => qr.percentage)) : 0
    }))

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: lessons
    })
  } catch (error: any) {
    console.error('Error fetching lessons:', error)
    next(error)
  }
}

// ✅ GET: Lấy progress của một lesson cụ thể
export const getLessonProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { lessonId } = req.params

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing userId'
      })
    }

    const progress: UserProgressDoc = await UserProgress.findOne({ userId: user_id })

    if (!progress) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User progress not found'
      })
    }

    const lessonProgress = progress.getLessonProgress(parseInt(lessonId))

    if (!lessonProgress) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Lesson progress not found'
      })
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: lessonProgress
    })
  } catch (error: any) {
    console.error('Error fetching lesson progress:', error)
    next(error)
  }
}

// ✅ POST: Cập nhật progress sau khi hoàn thành quiz
export const updateQuizProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { lessonId, lessonTitle, score, totalQuestions, totalWords } = req.body

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing userId'
      })
    }

    // Validate input
    if (!lessonId || score === undefined || !totalQuestions) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields: lessonId, score, totalQuestions'
      })
    }

    let progress: UserProgressDoc = await UserProgress.findOne({ userId: user_id })

    // Nếu chưa có progress, tạo mới
    if (!progress) {
      progress = await UserProgress.initializeUserProgress(user_id, 50)
    }

    // Update lesson progress
    await progress.updateLessonProgress(
      lessonId,
      lessonTitle || `Lesson ${lessonId}`,
      score,
      totalQuestions,
      totalWords || 0
    )

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        lessonProgress: progress.getLessonProgress(lessonId),
        learningStats: progress.learningStats,
        nextLessonUnlocked: score >= 5 || score / totalQuestions >= 0.8
      }
    })
  } catch (error: any) {
    console.error('Error updating progress:', error)
    next(error)
  }
}

// ✅ POST: Khởi tạo progress cho user mới
export const initializeProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { totalLessons = 50 } = req.body

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing userId'
      })
    }

    const progress = await UserProgress.initializeUserProgress(user_id, totalLessons)

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User progress initialized',
      data: progress
    })
  } catch (error: any) {
    console.error('Error initializing progress:', error)
    next(error)
  }
}

// ✅ GET: Lấy learning stats
export const getLearningStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing userId'
      })
    }

    const progress: UserProgressDoc = await UserProgress.findOne({ userId: user_id })

    if (!progress) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User progress not found'
      })
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: progress.learningStats
    })
  } catch (error: any) {
    console.error('Error fetching learning stats:', error)
    next(error)
  }
}

// ✅ PATCH: Cập nhật thời gian học cho lesson
export const updateLessonTime = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { lessonId } = req.params
    const { timeSpent } = req.body // minutes

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing userId'
      })
    }

    if (!timeSpent || timeSpent <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid timeSpent value'
      })
    }

    const progress: UserProgressDoc = await UserProgress.findOne({ userId: user_id })

    if (!progress) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User progress not found'
      })
    }

    const lessonIndex = progress.vocabularyProgress.findIndex((vp) => vp.lessonId === parseInt(lessonId))

    if (lessonIndex < 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Lesson not found'
      })
    }

    // Update time spent
    progress.vocabularyProgress[lessonIndex].timeSpent += timeSpent
    progress.vocabularyProgress[lessonIndex].lastAccessedAt = new Date()
    progress.learningStats.totalTimeSpent += timeSpent

    await progress.save()

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Time updated successfully',
      data: {
        lessonTimeSpent: progress.vocabularyProgress[lessonIndex].timeSpent,
        totalTimeSpent: progress.learningStats.totalTimeSpent
      }
    })
  } catch (error: any) {
    console.error('Error updating time:', error)
    next(error)
  }
}

// ✅ DELETE: Reset progress của user (for testing)
export const resetProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing userId'
      })
    }

    await UserProgress.deleteOne({ userId: user_id })

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User progress reset successfully'
    })
  } catch (error: any) {
    console.error('Error resetting progress:', error)
    next(error)
  }
}
