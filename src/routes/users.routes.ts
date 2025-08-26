import { Router } from 'express'
import { loginValidator } from '~/middlewares/users.middlewares'
import { loginController } from '~/controllers/users.controllers'
import { wrapRequestHandler } from '~/utils/handlers'
import { registerController } from '~/controllers/users.controllers'

const usersRouter = Router()
export default usersRouter

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
usersRouter.post('/register', registerController)
