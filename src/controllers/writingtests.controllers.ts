import { Request, Response, NextFunction } from 'express'
import writingTestsService from '~/services/writingtests.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { TokenPayload } from '~/models/requests/User.requests'
import { IWritingAnswerItem } from '~/models/schemas/WritingResult.schema'
import { IAIFeedback } from '~/models/schemas/WritingResult.schema'

// ─── GET /writing-tests ────────────────────────────────────────────────────────

/**
 * Lấy danh sách tất cả đề thi writing (không bao gồm câu hỏi chi tiết).
 */
export const getAllWritingTestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tests = await writingTestsService.getAllWritingTests()
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách đề thi writing thành công',
      result: tests
    })
  } catch (error) {
    console.error('❌ Error in getAllWritingTestsController:', error)
    next(error)
  }
}

// ─── GET /writing-tests/:writingTestId ────────────────────────────────────────

/**
 * Lấy chi tiết 1 đề thi writing (bao gồm 8 câu hỏi đầy đủ).
 */
export const getWritingTestByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { writingTestId } = req.params

    const test = await writingTestsService.getWritingTestById(writingTestId)

    if (!test) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: `Không tìm thấy đề thi với ID: ${writingTestId}`
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy đề thi writing thành công',
      result: test
    })
  } catch (error) {
    console.error('❌ Error in getWritingTestByIdController:', error)
    next(error)
  }
}

// ─── POST /writing-tests/:writingTestId/submit ────────────────────────────────

/**
 * Nộp bài thi writing.
 *
 * Body expected:
 * {
 *   answers: IWritingAnswerItem[],    // bắt buộc
 *   aiFeedback?: IAIFeedback          // optional – FE gửi sau khi AI chấm xong
 * }
 */
export const submitWritingTestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { writingTestId } = req.params
    const { answers, aiFeedback } = req.body as {
      answers: IWritingAnswerItem[]
      aiFeedback?: IAIFeedback
    }

    // Validation cơ bản
    if (!user_id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Bạn cần đăng nhập để nộp bài' })
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'answers phải là mảng không rỗng'
      })
    }

    // Validate từng answer item
    const validAnswers: IWritingAnswerItem[] = answers
      .filter((a) => typeof a.questionNumber === 'number' && [1, 2, 3].includes(a.part))
      .map((a) => ({
        questionNumber: a.questionNumber,
        part: a.part,
        answerText: a.answerText ?? '',
        wordCount: typeof a.wordCount === 'number' ? a.wordCount : 0
      }))

    if (validAnswers.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Không có câu trả lời hợp lệ. Mỗi answer cần có questionNumber và part (1|2|3).'
      })
    }

    // Kiểm tra đề thi tồn tại
    const test = await writingTestsService.getWritingTestById(writingTestId)
    if (!test) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: `Không tìm thấy đề thi với ID: ${writingTestId}`
      })
    }

    const { result, isNew } = await writingTestsService.submitWritingTest(
      user_id,
      writingTestId,
      validAnswers,
      aiFeedback ?? null
    )

    return res.status(HTTP_STATUS.OK).json({
      message: isNew ? 'Nộp bài thành công!' : 'Cập nhật bài làm thành công!',
      result
    })
  } catch (error) {
    console.error('❌ Error in submitWritingTestController:', error)
    next(error)
  }
}

// ─── GET /writing-tests/:writingTestId/result ─────────────────────────────────

/**
 * Lấy kết quả bài làm writing của user hiện tại cho 1 đề thi.
 */
export const getWritingResultController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { writingTestId } = req.params

    if (!user_id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Bạn cần đăng nhập' })
    }

    const result = await writingTestsService.getWritingResult(user_id, writingTestId)

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Bạn chưa làm bài thi này'
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy kết quả bài thi writing thành công',
      result
    })
  } catch (error) {
    console.error('❌ Error in getWritingResultController:', error)
    next(error)
  }
}

// ─── GET /writing-tests/history (user's writing history) ─────────────────────

/**
 * Lấy toàn bộ lịch sử bài làm writing của user hiện tại.
 */
export const getUserWritingHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload

    if (!user_id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Bạn cần đăng nhập' })
    }

    const history = await writingTestsService.getUserWritingHistory(user_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy lịch sử bài thi writing thành công',
      result: history
    })
  } catch (error) {
    console.error('❌ Error in getUserWritingHistoryController:', error)
    next(error)
  }
}
