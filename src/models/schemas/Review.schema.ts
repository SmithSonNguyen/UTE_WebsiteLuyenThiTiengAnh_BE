// models/Review.ts
import { Schema, model, models, Document } from 'mongoose'
import Course from '~/models/schemas/Course.schema' // Adjust path

export interface IReview extends Document {
  user: {
    type: Schema.Types.ObjectId
    ref: 'User'
  }
  course: {
    type: Schema.Types.ObjectId
    ref: 'Course'
  }
  rating: number
  comment: string
  helpfulCount: number
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    helpfulCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)

// Index để tối ưu query theo course
reviewSchema.index({ course: 1, createdAt: -1 })

// Tạo model trước để sử dụng trong helper
const ReviewModel = models.Review || model<IReview>('Review', reviewSchema)

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
// Helper function để recalculate rating cho course (sử dụng ReviewModel đã định nghĩa)
const recalculateCourseRating = async (courseId: string) => {
  const allReviews = await ReviewModel.find({ course: courseId }).select('rating')
  const totalReviews = allReviews.length
  const sumRatings = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0)
  const newAverage = totalReviews > 0 ? sumRatings / totalReviews : 0

  const course = await Course.findById(courseId)
  if (!course) return

  course.rating.average = halfEvenRound(newAverage)
  course.rating.reviewsCount = totalReviews
  await course.save()
}

// Middleware post-save để cập nhật rating của course khi review mới được tạo
reviewSchema.post('save', async function (doc: IReview) {
  try {
    // Tính incremental cho save mới (hiệu quả hơn recalculate)
    const course = await Course.findById(doc.course)
    if (!course) return

    const newAverage =
      (course.rating.average * course.rating.reviewsCount + doc.rating) / (course.rating.reviewsCount + 1)

    course.rating.average = halfEvenRound(newAverage)
    course.rating.reviewsCount += 1

    await course.save()
  } catch (error) {
    console.error('Error updating course rating after review save:', error)
  }
})

// Middleware post-deleteOne để cập nhật khi xóa review (sử dụng post để recalculate sau khi xóa)
reviewSchema.post('deleteOne', { document: false, query: true }, async function (result, next) {
  try {
    // Lấy courseId từ query filter
    const filter = this.getQuery()
    if (!filter || !filter.course || Array.isArray(filter.course)) return next()

    const courseId = filter.course.toString()
    await recalculateCourseRating(courseId)
    next()
  } catch (error) {
    console.error('Error updating course rating after review delete:', error)
    next(error as Error)
  }
})

// Middleware post-update để handle update (findOneAndUpdate, updateOne, etc.)
reviewSchema.post('findOneAndUpdate', async function (error: any, doc: IReview, next: any) {
  if (error) return next(error)
  if (!doc || !doc.course) return next()

  try {
    await recalculateCourseRating(doc.course.toString())
    next()
  } catch (err) {
    console.error('Error updating course rating after review update:', err)
    next(err)
  }
})

reviewSchema.post('updateOne', { document: false, query: true }, async function (error: any, next: any) {
  if (error) return next(error)

  try {
    // Để lấy doc sau update, dùng post('updateOne') với query, nhưng cần recalculate dựa trên course từ filter
    const filter = this.getQuery()
    if (!filter || !filter.course || Array.isArray(filter.course)) return next()

    const courseId = filter.course.toString()
    await recalculateCourseRating(courseId)
    next()
  } catch (err) {
    console.error('Error updating course rating after review update:', err)
    next(err)
  }
})

export default ReviewModel
