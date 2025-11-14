import { Router } from 'express'
import {
  getFeaturedCoursesController,
  getDetailedCoursesController,
  getAllCoursesController
} from '~/controllers/courses.controllers'

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
router.get('/:id', getDetailedCoursesController)
