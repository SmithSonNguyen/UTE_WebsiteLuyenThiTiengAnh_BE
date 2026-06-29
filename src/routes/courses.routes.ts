import { Router } from 'express'
import {
  getFeaturedCoursesController,
  getDetailedCoursesController,
  getAllCoursesController,
  getMyEnrolledCoursesController,
  getMyEnrolledCoursesVideoController,
  getCourseProgressController,
  updateCourseProgressController
} from '~/controllers/courses.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const router = Router()
export default router

/**
 * Description: Get all courses with filters and pagination
 * Path: /courses
 * Method: GET
 * Query: ?page=1&limit=12&type=pre-recorded&level=beginner&status=active
 */
router.get('/', getAllCoursesController)

router.get('/featured', getFeaturedCoursesController)
router.get('/my-enrolled-courses', accessTokenValidator, wrapRequestHandler(getMyEnrolledCoursesController))
router.get('/enrolled/:id', accessTokenValidator, wrapRequestHandler(getMyEnrolledCoursesVideoController))

// Course progress routes (phải đặt trước /:id để tránh conflict)
router.get('/progress/:courseId', accessTokenValidator, wrapRequestHandler(getCourseProgressController))
router.post('/progress/:courseId/complete-video', accessTokenValidator, wrapRequestHandler(updateCourseProgressController))

router.get('/:id', getDetailedCoursesController)
