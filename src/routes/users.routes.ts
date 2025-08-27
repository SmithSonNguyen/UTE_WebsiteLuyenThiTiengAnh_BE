import { Router } from 'express'
import { accessTokenValidator, loginValidator } from '~/middlewares/users.middlewares'
import { getMeController, loginController } from '~/controllers/users.controllers'
import { wrapRequestHandler } from '~/utils/handlers'
import { registerController } from '~/controllers/users.controllers'

const usersRouter = Router()
export default usersRouter

usersRouter.post('/register', registerController)
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 *
 * Desciption: Get my profile
 * Path: /me
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 */
usersRouter.get('/me', wrapRequestHandler(getMeController)) // Đang thiếu accessTokenValidator
