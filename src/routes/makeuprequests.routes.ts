import { Router } from 'express'
import {
  availableMakeupClass,
  registerMakeupClass,
  getMakeupRequests,
  cancelMakeupRequest
} from '~/controllers/makeuprequests.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'

const makeupRequestsRouter = Router()

makeupRequestsRouter.use(accessTokenValidator)

makeupRequestsRouter.get('/available-makeup-classes/:originalClassId/:sessionNumber', availableMakeupClass)
makeupRequestsRouter.post('/', registerMakeupClass)
makeupRequestsRouter.get('/', getMakeupRequests)
makeupRequestsRouter.delete('/:makeupRequestId', cancelMakeupRequest)

export default makeupRequestsRouter
