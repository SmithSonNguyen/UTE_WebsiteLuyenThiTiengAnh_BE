import { Router } from 'express'
import { fulltestController } from '~/controllers/freeentrytest.controllers'

const freeentrytestRouter = Router()

freeentrytestRouter.get('/free-entry-test/fulltest', fulltestController)

export default freeentrytestRouter
