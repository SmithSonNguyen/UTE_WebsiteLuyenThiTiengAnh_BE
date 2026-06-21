import { Request, Response, NextFunction } from 'express'
import { explainQuestionStream, QuestionPayload } from '~/services/ai.services'
import HTTP_STATUS from '~/constants/httpStatus'

/**
 * POST /ai/explain
 * Body: QuestionPayload
 * Response: Server-Sent Events stream
 */
export const explainQuestionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = req.body as QuestionPayload

    // Validate tối thiểu
    if (!question || typeof question.part !== 'number') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin câu hỏi. Cần ít nhất trường "part".'
      })
    }

    await explainQuestionStream(question, res)
  } catch (error) {
    next(error)
  }
}
