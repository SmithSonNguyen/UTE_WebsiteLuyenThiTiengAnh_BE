import { Request, Response } from 'express'
import { NextFunction } from 'express-serve-static-core'
import testsService from '~/services/tests.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { TokenPayload } from '~/models/requests/User.requests'

// Interface cho query parameters
interface TestQueryParams {
  category?: string
  year?: string
  search?: string
  difficulty?: string
  page?: string
  limit?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const getAllTestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tests = await testsService.getAllTests()
    res.json({
      message: 'Get all tests successfully',
      result: tests
    })
  } catch (error) {
    console.error('Error getting all tests:', error)
    next(error)
  }
}

export const getFilteredTestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      category,
      year,
      search,
      difficulty,
      page = '1',
      limit = '12',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as TestQueryParams

    const result = await testsService.getFilteredTests({
      category,
      year,
      search,
      difficulty,
      page,
      limit,
      sortBy,
      sortOrder
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách đề thi thành công',
      result: result.tests,
      pagination: result.pagination,
      filters: result.filters
    })
  } catch (error) {
    console.error('Error getting filtered tests:', error)
    next(error)
  }
}

export const getAllQuestionsOptimized = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testId } = req.params
    const sections = await testsService.getAllQuestionsOptimized(testId)
    res.json({
      message: 'Get all questions successfully',
      result: sections
    })
  } catch (error) {
    console.error('Error getting all questions:', error)
    next(error)
  }
}

export const saveUserAnswersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lấy userId từ decoded_authorization (đã được set bởi accessTokenValidator)
    const { user_id } = req.decoded_authorization as TokenPayload
    const { testId } = req.params
    const { answers, mark, rightAnswerNumber } = req.body

    // Validation
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Answers must be a non-empty array'
      })
    }

    // Validate và lọc bỏ các phần tử không hợp lệ
    const validAnswers = answers
      .filter((answer) => {
        // Hỗ trợ cả 2 cấu trúc: {number, answer} và {questionNumber, userAnswer}
        const number = answer.number || answer.questionNumber
        const answerText = answer.answer || answer.userAnswer

        return answer && typeof number === 'number' && typeof answerText === 'string' && answerText.trim() !== ''
      })
      .map((answer) => ({
        // Chuẩn hóa về cấu trúc backend mong đợi
        number: answer.number || answer.questionNumber,
        answer: answer.answer || answer.userAnswer,
        isCorrect: answer.isCorrect,
        part: answer.part
      }))

    if (validAnswers.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'No valid answers provided. Each answer must have number and answer fields.'
      })
    }

    if (mark !== undefined && (typeof mark !== 'number' || mark < 0)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Invalid mark value'
      })
    }

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing userId' })
    }

    const savedAnswers = await testsService.saveUserAnswers(
      user_id,
      testId,
      validAnswers,
      mark ?? null,
      rightAnswerNumber ?? null
    )

    res.status(HTTP_STATUS.OK).json({
      message: savedAnswers.isNew ? 'User answers created successfully' : 'User answers updated successfully',
      result: savedAnswers
    })
  } catch (error) {
    console.error('Error saving user answers:', error)
    next(error)
  }
}

export const getTestResultController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lấy userId từ decoded_authorization (đã được set bởi accessTokenValidator)
    const { user_id } = req.decoded_authorization as TokenPayload
    const { testId } = req.params

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing userId' })
    }

    // // Kiểm tra user đã submit chưa
    // const userSubmission = await UserAnswer.findOne({
    //   userId: new Types.ObjectId(userId),
    //   testId
    // })

    // if (!userSubmission) {
    //   return res.status(HTTP_STATUS.NOT_FOUND).json({
    //     message: 'No submission found. Please submit your answers first.'
    //   })
    // }

    // Lấy đáp án đúng
    const correctAnswers = await testsService.getAllAnswers(testId)

    res.status(HTTP_STATUS.OK).json({
      message: 'Get test result successfully',
      result: {
        // userAnswers: userSubmission.answers,
        correctAnswers
        // mark: userSubmission.mark,
        // rightAnswerNumber: userSubmission.rightAnswerNumber,
        // submittedAt: userSubmission.updatedAt || userSubmission.createdAt
      }
    })
  } catch (error) {
    console.error('Error getting test result:', error)
    next(error)
  }
}
