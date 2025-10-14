// controllers/ReviewsController.ts
import { Request, Response } from 'express'
import { ReviewsService } from '~/services/reviews.services'

const reviewsService = new ReviewsService()

// Helper: Half-even rounding to 1 decimal (giống Mongo $round[,1])
const halfEvenRound = (num: number, decimals: number = 1): number => {
  const factor = Math.pow(10, decimals)
  const shifted = num * factor
  const rounded = Math.round(shifted) // JS Math.round là half-up, nhưng để half-even, adjust cho half case
  // Để chính xác half-even: Nếu fractional ==0.5 và integer part even, round down; else up.
  const integerPart = Math.floor(shifted)
  const fractional = shifted - integerPart
  if (fractional === 0.5) {
    // Half case: Round to nearest even
    return integerPart % 2 === 0 ? integerPart / factor : (integerPart + 1) / factor
  }
  return Math.round(shifted) / factor
}

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params
    const { sort = 'newest', limit = '10', page = '1' } = req.query

    const options = {
      sort: sort as string,
      limit: Number(limit),
      page: Number(page)
    }

    const result = await reviewsService.getReviewsByCourse(courseId, options)

    // Explicit typing cho response
    const responseData = {
      reviews: result.reviews,
      average: halfEvenRound(result.stats.average || 0), // Giờ khớp Mongo: 4.25 → 4.2
      reviewsCount: result.stats.reviewsCount,
      ratingDistribution: result.stats.ratingDistribution,
      hasMore: result.hasMore
    }

    res.json(responseData)
  } catch (error) {
    console.error('Error in ReviewsController.getReviews:', error)
    res.status(500).json({ message: 'Lỗi khi lấy đánh giá', error: (error as Error).message })
  }
}
