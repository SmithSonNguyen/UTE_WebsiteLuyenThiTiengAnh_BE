import { Router } from 'express'
import { authUser } from '~/middlewares/usersAuth.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import { dashboardController } from '~/controllers/admin.controllers'

const adminRouter = Router()
export default adminRouter

// Only admin can access
adminRouter.get('/dashboard', authUser(['admin']), dashboardController)
