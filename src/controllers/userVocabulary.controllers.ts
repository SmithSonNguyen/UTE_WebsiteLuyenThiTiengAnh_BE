import { Request, Response, NextFunction } from 'express'
import { TokenPayload } from '../models/requests/User.requests'
import HTTP_STATUS from '../constants/httpStatus'
import userVocabularyService from '~/services/userVocabulary.services'

/**
 * POST: Lưu từ vựng mới sau khi dịch
 * Body: { word, explanation, sourceLanguage?, contextExample?, tags? }
 */
export const saveUserVocabularyController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { word, explanation, sourceLanguage, contextExample, tags } = req.body

    // Validation
    if (!word || !explanation) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields: word, explanation'
      })
    }

    const result = await userVocabularyService.saveUserVocabulary({
      userId: user_id,
      word,
      explanation,
      sourceLanguage,
      contextExample,
      tags
    })

    return res.status(result.isNew ? HTTP_STATUS.CREATED : HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result.data
    })
  } catch (error: any) {
    console.error('Error saving user vocabulary:', error)
    next(error)
  }
}

/**
 * GET: Lấy danh sách từ vựng của user
 * Query params: page, limit, search, tags, isFavorite, sortBy, sortOrder
 */
export const getUserVocabulariesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { page = '1', limit = '20', search, tags, isFavorite, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const result = await userVocabularyService.getUserVocabularies({
      userId: user_id,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      tags: tags ? (tags as string).split(',') : undefined,
      isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
      sortBy: sortBy as 'createdAt' | 'word',
      sortOrder: sortOrder as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error: any) {
    console.error('Error fetching user vocabularies:', error)
    next(error)
  }
}

/**
 * DELETE: Xóa từ vựng
 */
export const deleteUserVocabularyController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { vocabularyId } = req.params

    if (!vocabularyId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing vocabularyId'
      })
    }

    await userVocabularyService.deleteUserVocabulary(user_id, vocabularyId)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Vocabulary deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting user vocabulary:', error)

    if (error.message === 'Vocabulary not found or unauthorized') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message
      })
    }

    next(error)
  }
}

/**
 * PATCH: Toggle favorite status
 */
export const toggleFavoriteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { vocabularyId } = req.params

    if (!vocabularyId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing vocabularyId'
      })
    }

    const result = await userVocabularyService.toggleFavorite(user_id, vocabularyId)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result.data
    })
  } catch (error: any) {
    console.error('Error toggling favorite:', error)

    if (error.message === 'Vocabulary not found or unauthorized') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message
      })
    }

    next(error)
  }
}

/**
 * PATCH: Cập nhật review count
 */
export const updateReviewCountController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { vocabularyId } = req.params

    if (!vocabularyId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing vocabularyId'
      })
    }

    const result = await userVocabularyService.updateReviewCount(user_id, vocabularyId)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result.data
    })
  } catch (error: any) {
    console.error('Error updating review count:', error)

    if (error.message === 'Vocabulary not found or unauthorized') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message
      })
    }

    next(error)
  }
}

/**
 * GET: Lấy thống kê từ vựng của user
 */
export const getUserVocabularyStatsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload

    const stats = await userVocabularyService.getUserVocabularyStats(user_id)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Error fetching vocabulary stats:', error)
    next(error)
  }
}
