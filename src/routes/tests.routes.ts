import { Router } from 'express'
import {
  getAllTestsController,
  getAllQuestionsOptimized,
  getFilteredTestsController,
  saveUserAnswersController,
  getTestResultController
} from '~/controllers/tests.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const testsRouter = Router()

testsRouter.get('/', wrapRequestHandler(getAllTestsController))
testsRouter.get('/filtered', wrapRequestHandler(getFilteredTestsController))
testsRouter.get('/:testId/questions', wrapRequestHandler(getAllQuestionsOptimized))
testsRouter.get('/:testId/result', accessTokenValidator, wrapRequestHandler(getTestResultController))
testsRouter.post('/:testId', accessTokenValidator, wrapRequestHandler(saveUserAnswersController))

export default testsRouter
