import mongoose, { Document, Schema, Model } from 'mongoose'

export interface ICourse extends Document {
  title: string
  description: string
  type: 'pre-recorded' | 'live-meet'
  price: number
  discountPrice?: number
  discountPercent?: number
  level: 'beginner' | 'intermediate' | 'advanced'
  targetScoreRange?: {
    min: number
    max: number
  }
  rating: {
    average: number
    reviewsCount: number
  }
  studentsCount: number
  features: string[]
  courseStructure: {
    totalSessions: number
    hoursPerSession: number
    totalHours: number
    durationWeeks?: number
    description?: string
  }

  // Thông tin cho pre-recorded courses
  preRecordedContent?: {
    totalTopics: number // Số chủ đề, ví dụ: 10
    totalLessons: number // Số bài học, ví dụ: 54
    totalExercises?: number // Số bài tập thực hành, ví dụ: 150
    accessDuration: number // Thời hạn truy cập (tính bằng tháng), ví dụ: 12
    accessDurationUnit: 'months' | 'days' | 'years' // Đơn vị thời gian
    downloadable?: boolean // Có thể tải về không
    certificate?: boolean // Có cấp chứng chỉ không
    description?: string // Mô tả thêm, ví dụ: "10 chủ đề, 54 bài học"
  }

  instructor?: mongoose.Types.ObjectId // for pre-recorded courses
  thumbnail?: string
  status: 'active' | 'inactive' | 'draft'
  createdAt: Date
  updatedAt: Date
}
const courseSchema: Schema<ICourse> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['pre-recorded', 'live-meet'], required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    discountPercent: { type: Number },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    targetScoreRange: {
      min: { type: Number },
      max: { type: Number }
    },
    rating: {
      average: { type: Number, default: 0 },
      reviewsCount: { type: Number, default: 0 }
    },
    studentsCount: { type: Number, default: 0 },
    features: { type: [String], default: [] },
    courseStructure: {
      totalSessions: { type: Number, required: true, min: 1 },
      hoursPerSession: { type: Number, required: true, min: 0.5 },
      totalHours: {
        type: Number,
        required: true,
        min: 1,
        validate: {
          validator: function (this: ICourse) {
            return (
              this.courseStructure.totalHours ===
              this.courseStructure.totalSessions * this.courseStructure.hoursPerSession
            )
          },
          message: 'totalHours must equal totalSessions * hoursPerSession'
        }
      },
      durationWeeks: { type: Number, min: 1 },
      description: { type: String }
    },

    // Thêm preRecordedContent cho pre-recorded courses
    preRecordedContent: {
      type: {
        totalTopics: { type: Number, required: true, min: 1 },
        totalLessons: { type: Number, required: true, min: 1 },
        totalExercises: { type: Number, min: 0, default: 0 },
        accessDuration: { type: Number, required: true, min: 1 },
        accessDurationUnit: {
          type: String,
          enum: ['months', 'days', 'years'],
          default: 'months',
          required: true
        },
        downloadable: { type: Boolean, default: false },
        certificate: { type: Boolean, default: false },
        description: { type: String }
      },
      required: function (this: ICourse) {
        return this.type === 'pre-recorded'
      },
      validate: {
        validator: function (this: ICourse) {
          // Nếu là pre-recorded thì phải có preRecordedContent
          if (this.type === 'pre-recorded') {
            return this.preRecordedContent != null
          }
          // Nếu là live-meet thì không được có preRecordedContent
          if (this.type === 'live-meet') {
            return this.preRecordedContent == null
          }
          return true
        },
        message: 'preRecordedContent is required for pre-recorded courses and should not exist for live-meet courses'
      }
    },
    instructor: { type: mongoose.Types.ObjectId },
    thumbnail: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' }
  },
  { timestamps: true }
)

courseSchema.index({ status: 1, type: 1 })
courseSchema.index({ 'rating.average': -1, studentsCount: -1 }) // Index để sort featured courses
courseSchema.index({ level: 1, type: 1 })
courseSchema.index({ 'preRecordedContent.accessDuration': 1, type: 1 }) // Index cho query theo thời hạn

// Middleware để auto-calculate preRecordedContent stats
courseSchema.methods.updatePreRecordedStats = async function () {
  if (this.type !== 'pre-recorded') return this

  const Topic = mongoose.model('Topic')
  const Lesson = mongoose.model('Lesson')

  const topics = await Topic.find({ course: this._id, status: 'active' })
  const lessons = await Lesson.find({ course: this._id, status: 'active' })
  const exercises = await Lesson.find({
    course: this._id,
    'content.type': { $in: ['quiz', 'exercise'] },
    status: 'active'
  })

  if (this.preRecordedContent) {
    this.preRecordedContent.totalTopics = topics.length
    this.preRecordedContent.totalLessons = lessons.length
    this.preRecordedContent.totalExercises = exercises.length
    this.preRecordedContent.description = `${topics.length} chủ đề, ${lessons.length} bài học`
  }

  return this.save()
}

// Middleware để auto-calculate courseStructure từ lessons
courseSchema.pre('save', function () {
  // Auto-calculate totalHours nếu chưa có
  if (this.courseStructure && this.courseStructure.totalSessions && this.courseStructure.hoursPerSession) {
    this.courseStructure.totalHours = this.courseStructure.totalSessions * this.courseStructure.hoursPerSession
  }
})

export const Course: Model<ICourse> = mongoose.model<ICourse>('Course', courseSchema)

export default Course
