import { Router } from 'express'
import { fulltestController } from '~/controllers/freeentrytest.controllers'

const freeentrytestRouter = Router()

freeentrytestRouter.get('/free-entry-test/full-test', fulltestController)

export default freeentrytestRouter
