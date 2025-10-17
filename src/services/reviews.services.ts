// services/ReviewsService.ts
import { Types } from 'mongoose'
import Review, { IReview } from '~/models/schemas/Review.schema'

interface GetReviewsOptions {
  sort: string
  limit: number
  page: number
}

interface ReviewStats {
  average: number
  reviewsCount: number
  ratingDistribution: Array<{ _id: number; count: number }>
}

// Custom type cho populated review (user là single object với profile populated)
type RawPopulatedReview = Omit<IReview, 'user'> & {
  user: {
    profile: {
      firstname: string
      lastname: string
      avatar?: string
    }
    // Các fields khác của user nếu cần
  }
}

// Final type sau khi transform
type PopulatedReview = Omit<IReview, 'user'> & {
  user: {
    name: string
    avatar?: string
  }
}

export class ReviewsService {
  async getReviewsByCourse(
    courseId: string,
    options: GetReviewsOptions
  ): Promise<{
    reviews: PopulatedReview[] // Explicit array type
    stats: ReviewStats
    hasMore: boolean
  }> {
    // Validate courseId
    if (!Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid course ID')
    }

    const { sort, limit, page } = options
    const skip = (page - 1) * limit

    // Xác định sort order
    const sortOptions: any = {}
    if (sort === 'newest') {
      sortOptions.createdAt = -1
    } else if (sort === 'oldest') {
      sortOptions.createdAt = 1
    } else if (sort === 'highest') {
      sortOptions.rating = -1
    } else if (sort === 'lowest') {
      sortOptions.rating = 1
    }

    // Lấy reviews với populate profile từ user (sử dụng type assertion để fix lean/populate typing)
    const reviewsQuery = Review.find({ course: new Types.ObjectId(courseId) })
      .populate<{
        path: 'user'
        select: 'profile' // Chỉ populate profile sub-object
      }>('user', 'profile') // Explicit populate type cho profile
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean()

    const rawReviews = (await reviewsQuery) as unknown as RawPopulatedReview[]

    // Transform rawReviews để tạo name từ firstname + lastname
    const reviews: PopulatedReview[] = rawReviews.map((review) => ({
      ...review,
      user: {
        name: `${review.user.profile.lastname} ${review.user.profile.firstname}`.trim(),
        avatar: review.user.profile.avatar
      }
    }))

    // Tính tổng quan rating (sửa lookup bằng let để hardcode courseId, và bỏ unwind/group để giữ array trực tiếp)
    const aggregateResult = await Review.aggregate([
      { $match: { course: new Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          reviewsCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'reviews',
          let: { courseId: new Types.ObjectId(courseId) },
          pipeline: [
            { $match: { $expr: { $eq: ['$course', '$$courseId'] } } },
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 }
              }
            }
          ],
          as: 'ratingDistribution'
        }
      }
    ])

    const rawStats = aggregateResult[0] || { average: 0, reviewsCount: 0, ratingDistribution: [] }
    const stats: ReviewStats = {
      average: rawStats.average || 0,
      reviewsCount: rawStats.reviewsCount || 0,
      ratingDistribution: (rawStats.ratingDistribution as Array<{ _id: number; count: number }>) || [] // Cast và default empty array
    }

    return {
      reviews,
      stats,
      hasMore: page * limit < stats.reviewsCount
    }
  }
}
