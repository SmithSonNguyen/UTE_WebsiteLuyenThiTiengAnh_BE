import { Router } from 'express'
import { registerController } from '~/controllers/users.controllers'

const usersRouter = Router()
export default usersRouter

usersRouter.post('/register', registerController)
