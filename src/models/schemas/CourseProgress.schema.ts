import mongoose, { Document, Schema, Model } from 'mongoose'

// Interface cho document
export interface ICourseProgress extends Document {
  userId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  completedVideoOrders: number[] // Danh sách order của các video đã hoàn thành
  lastVideoOrder: number // Video order đang học gần nhất
  completedAt?: Date // Ngày hoàn thành toàn bộ khoá học
  createdAt: Date
  updatedAt: Date
}

// Schema definition
const courseProgressSchema = new Schema<ICourseProgress>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },
    completedVideoOrders: {
      type: [Number],
      default: []
    },
    lastVideoOrder: {
      type: Number,
      default: 1
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'course_progress'
  }
)

// Compound index: mỗi user chỉ có 1 progress record per course
courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true })

export const CourseProgress: Model<ICourseProgress> = mongoose.model<ICourseProgress>(
  'CourseProgress',
  courseProgressSchema
)

export default CourseProgress
