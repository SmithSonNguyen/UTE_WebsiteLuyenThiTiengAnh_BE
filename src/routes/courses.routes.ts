import { Router } from 'express'
import { getFeaturedCoursesController, getDetailedCoursesController } from '~/controllers/courses.controllers'

const router = Router()
export default router

router.get('/featured', getFeaturedCoursesController)
router.get('/:id', getDetailedCoursesController)
