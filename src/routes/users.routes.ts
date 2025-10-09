import { Router } from 'express'
import {
  accessTokenValidator,
  loginValidator,
  registerValidation,
  refreshTokenValidator,
  updateProfileValidator
} from '~/middlewares/users.middlewares'
import {
  getMeController,
  loginController,
  refreshTokenController,
  registerController,
  getUploadSignatureController,
  updateProfileController
} from '~/controllers/users.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()
export default usersRouter

usersRouter.post('/register', registerValidation, wrapRequestHandler(registerController))
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 *
 * Desciption: Get my profile
 * Path: /me
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 */
usersRouter.get('/me', wrapRequestHandler(getMeController)) // Đang thiếu accessTokenValidator

usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/**
 * Description: Get upload signature for Cloudinary
 * Path: /upload-signature
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 */
usersRouter.get('/upload-signature', wrapRequestHandler(getUploadSignatureController))

/**
 * Description: Update user profile
 * Path: /update-profile
 * Method: PUT
 * Headers: { Authorization: Bearer <access_token> }
 * Body: { lastname?, firstname?, birthday?, bio?, avatar? }
 */
usersRouter.put('/update-profile', updateProfileValidator, wrapRequestHandler(updateProfileController))
