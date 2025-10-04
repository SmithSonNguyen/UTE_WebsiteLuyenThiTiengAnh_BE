import { Router } from 'express'
import {
  getAllTestsController,
  getAllQuestionsOptimized,
  getFilteredTestsController
} from '~/controllers/tests.controllers'
import { wrapRequestHandler } from '~/utils/handlers'
const testsRouter = Router()

testsRouter.get('/', wrapRequestHandler(getAllTestsController))
testsRouter.get('/filtered', wrapRequestHandler(getFilteredTestsController))
testsRouter.get('/:testId/questions', wrapRequestHandler(getAllQuestionsOptimized))

export default testsRouter
