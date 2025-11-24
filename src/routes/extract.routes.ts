import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handlers'
import { extractArticleController } from '~/controllers/extract.controllers'

const extractRouter = Router()

extractRouter.get('/', wrapRequestHandler(extractArticleController))

export default extractRouter
