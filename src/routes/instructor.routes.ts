import { Router } from 'express'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  getInstructorProfileController,
  getInstructorClassesController,
  updateInstructorProfileController
} from '~/controllers/instructor.controllers'
import { instructorRoleValidator } from '~/middlewares/instructors.middlewares'
const instructorRouter = Router()
instructorRouter.use(accessTokenValidator)
/**
 * Description: Get instructor profile with statistics
 * Path: /profile
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
instructorRouter.get('/profile', accessTokenValidator, wrapRequestHandler(getInstructorProfileController))

/**
 * Description: Update instructor profile
 * Path: /profile
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateInstructorProfileReqBody
 */
instructorRouter.put('/profile', accessTokenValidator, wrapRequestHandler(updateInstructorProfileController))

/**
 * Description: Get instructor classes with statistics
 * Path: /classes
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
instructorRouter.get('/classes', instructorRoleValidator, wrapRequestHandler(getInstructorClassesController))

export default instructorRouter
