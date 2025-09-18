import { Router } from 'express'
import { getSixHundredNewVocabularyController } from '~/controllers/lessons.controllers'
import { sixHundredNewVocabularyValidator } from '../middlewares/lessons.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const lessonsRouter = Router()
export default lessonsRouter

lessonsRouter.get(
  '/six-hundred-new-vocabulary',
  sixHundredNewVocabularyValidator,
  wrapRequestHandler(getSixHundredNewVocabularyController)
)
