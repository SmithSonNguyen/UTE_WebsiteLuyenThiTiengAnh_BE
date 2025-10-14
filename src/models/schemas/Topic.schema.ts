import mongoose, { Document, Schema, Model } from 'mongoose'

export interface ITopic extends Document {
  course: mongoose.Types.ObjectId // Reference đến Course
  title: string // Tên chủ đề, ví dụ: "TOEIC Listening Part 1"
  description?: string // Mô tả chủ đề
  orderIndex: number // Thứ tự chủ đề trong khóa học (1, 2, 3...)

  // Thống kê về chủ đề này
  stats: {
    totalLessons: number // Số bài học trong chủ đề này
    totalDuration: number // Tổng thời lượng (phút)
    estimatedHours: number // Ước tính số giờ hoàn thành
  }

  // Mục tiêu học tập của chủ đề
  learningObjectives: string[] // Các mục tiêu học tập

  // Điều kiện tiên quyết
  prerequisites?: mongoose.Types.ObjectId[] // Reference đến các Topic khác (nếu có)

  status: 'active' | 'inactive' | 'draft'
  createdAt: Date
  updatedAt: Date
}

const topicSchema: Schema<ITopic> = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    description: { type: String },
    orderIndex: { type: Number, required: true, min: 1 },

    stats: {
      totalLessons: { type: Number, default: 0, min: 0 },
      totalDuration: { type: Number, default: 0, min: 0 }, // in minutes
      estimatedHours: { type: Number, default: 0, min: 0 }
    },

    learningObjectives: { type: [String], default: [] },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' }
  },
  { timestamps: true }
)

// Indexes
topicSchema.index({ course: 1, orderIndex: 1 }) // Query topics theo course và thứ tự
topicSchema.index({ course: 1, status: 1 })

// Ensure unique orderIndex per course
topicSchema.index({ course: 1, orderIndex: 1 }, { unique: true })

// Middleware để auto-calculate stats
topicSchema.methods.updateStats = async function () {
  const Lesson = mongoose.model('Lesson')
  const lessons = await Lesson.find({ topic: this._id, status: 'active' })

  this.stats.totalLessons = lessons.length
  this.stats.totalDuration = lessons.reduce((total, lesson) => total + lesson.duration, 0)
  this.stats.estimatedHours = Math.round((this.stats.totalDuration / 60) * 10) / 10 // Round to 1 decimal

  return this.save()
}

export const Topic: Model<ITopic> = mongoose.model<ITopic>('Topic', topicSchema)

export default Topic
