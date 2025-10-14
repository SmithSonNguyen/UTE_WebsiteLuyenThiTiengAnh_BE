import { Router } from 'express'
import { getReviews } from '~/controllers/reviews.controllers'

const reviewsRouter = Router()
export default reviewsRouter

reviewsRouter.get('/:courseId', getReviews)
