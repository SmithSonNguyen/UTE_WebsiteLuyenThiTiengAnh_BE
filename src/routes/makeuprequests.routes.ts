import { Router } from 'express'
import { availableMakeupClass } from '~/controllers/makeuprequests.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { requireEnrollment } from '~/middlewares/enrollments.middlewares'

const makeupRequestsRouter = Router()

makeupRequestsRouter.use(accessTokenValidator)

makeupRequestsRouter.get('/available-makeup-classes/:originalClassId/:sessionNumber', availableMakeupClass)

export default makeupRequestsRouter
