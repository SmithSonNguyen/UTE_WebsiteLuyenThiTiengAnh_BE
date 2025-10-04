import { Request, Response } from 'express'
import { NextFunction } from 'express-serve-static-core'
import testsService from '~/services/tests.services'
import HTTP_STATUS from '~/constants/httpStatus'

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
