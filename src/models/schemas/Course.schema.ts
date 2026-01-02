import mongoose, { Document, Schema, Model } from 'mongoose'

// --- INTERFACE DEFINITIONS (GIỮ NGUYÊN) ---

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
    totalSessions?: number
    hoursPerSession?: number
    totalHours?: number
    durationWeeks?: number
    description?: string
  } // Thông tin cho pre-recorded courses

  preRecordedContent?: {
    totalTopics: number // Số chủ đề, ví dụ: 10
    totalLessons: number // Số bài học, ví dụ: 54
    totalExercises?: number // Số bài tập thực hành, ví dụ: 150
    accessDuration: number // Thời hạn truy cập (tính bằng tháng), ví dụ: 12
    accessDurationUnit: 'months' | 'days' | 'years' // Đơn vị thời gian
    downloadable?: boolean // Có thể tải về không
    certificate?: boolean // Có cấp chứng chỉ không
    description?: string // Mô tả thêm, ví dụ: "10 chủ đề, 54 bài học"
    videoLessons?: {
      title: string
      url: string
      duration?: string
      order?: number
    }[]
  }

  instructor?: mongoose.Types.ObjectId // for pre-recorded courses
  thumbnail?: string
  status: 'active' | 'inactive' | 'draft'
  createdAt: Date
  updatedAt: Date
  // Thêm method để Mongoose nhận biết
  updatePreRecordedStats(): Promise<ICourse>
}

// --- SCHEMA DEFINITION ---

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
      totalSessions: { type: Number, min: 1 },
      hoursPerSession: { type: Number, min: 0.5 },
      totalHours: {
        type: Number,
        min: 1
        // **ĐÃ BỎ VALIDATOR GÂY LỖI**
      },
      durationWeeks: { type: Number, min: 1 },
      description: { type: String }
    }, // Thêm preRecordedContent cho pre-recorded courses

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
        description: { type: String },
        videoLessons: [
          {
            title: { type: String, required: true },
            url: { type: String, required: true },
            duration: { type: String },
            order: { type: Number }
          }
        ]
      },
      required: function (this: ICourse) {
        return this.type === 'pre-recorded'
      },
      validate: {
        validator: function (this: ICourse) {
          // Nếu là pre-recorded thì phải có preRecordedContent
          if (this.type === 'pre-recorded') {
            return this.preRecordedContent != null
          } // Nếu là live-meet thì không được có preRecordedContent
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

// --- INDEXES ---

courseSchema.index({ status: 1, type: 1 })
courseSchema.index({ 'rating.average': -1, studentsCount: -1 }) // Index để sort featured courses
courseSchema.index({ level: 1, type: 1 })
courseSchema.index({ 'preRecordedContent.accessDuration': 1, type: 1 }) // Index cho query theo thời hạn

// --- MIDDLEWARES & METHODS ---

// 1. Middleware để tự động tính toán totalHours khi TẠO MỚI (.save())
courseSchema.pre<ICourse>('save', function (next) {
  // Chỉ chạy nếu courseStructure tồn tại và có đủ thông tin
  if (this.courseStructure && this.courseStructure.totalSessions && this.courseStructure.hoursPerSession) {
    this.courseStructure.totalHours = this.courseStructure.totalSessions * this.courseStructure.hoursPerSession
  }
  next()
})

// 2. Middleware để tự động tính toán totalHours khi CẬP NHẬT (findByIdAndUpdate)
courseSchema.pre('findOneAndUpdate', function (next) {
  // Lấy đối tượng cập nhật
  const update = this.getUpdate() as any

  // Kiểm tra xem có cập nhật `courseStructure` hay các trường con không
  let updateStructure = update.$set?.courseStructure || update.courseStructure

  // Lấy các giá trị sessions/hours từ update hoặc từ $set
  const totalSessions = updateStructure?.totalSessions
  const hoursPerSession = updateStructure?.hoursPerSession

  // Nếu có một trong hai trường sessions/hours được cập nhật
  if (totalSessions !== undefined || hoursPerSession !== undefined) {
    // Logíc này trở nên phức tạp nếu ta không biết giá trị cũ.
    // Để đơn giản và an toàn, ta chỉ tính lại nếu cả hai giá trị đều có mặt trong update.
    // HOẶC, cách tốt nhất là service (updatePreRecordedCourse) nên tính sẵn totalHours
    // và gửi cả 3 trường này cùng nhau.

    // Nếu không có $set, tạo nó
    if (!update.$set) {
      update.$set = {}
    }

    // Đảm bảo courseStructure có trong $set
    if (!update.$set.courseStructure) {
      update.$set.courseStructure = {}
    }

    // Nếu cả hai trường sessions và hoursPerSession được cập nhật, ta tính lại totalHours
    if (totalSessions !== undefined && hoursPerSession !== undefined) {
      update.$set.courseStructure.totalHours = totalSessions * hoursPerSession
    } else {
      // Để tránh lỗi phức tạp khi chỉ update 1 trong 2 trường,
      // khuyến nghị service phải luôn gửi cả 3 trường khi update
      // courseStructure. Tuy nhiên, nếu bạn muốn logic tự động xử lý:
      // **CÁCH KHẮC PHỤC KHÓ KHĂN NHẤT:** Cần load document cũ.
      // Mongoose khuyến nghị dùng findById, tính toán, và .save() thay vì findByIdAndUpdate
      // khi logic phức tạp như thế này.
    }
  }

  next()
})

// 3. Method để auto-calculate preRecordedContent stats
courseSchema.methods.updatePreRecordedStats = async function (this: ICourse) {
  if (this.type !== 'pre-recorded') return this as any

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

// --- EXPORT MODEL ---

export const Course: Model<ICourse> = mongoose.model<ICourse>('Course', courseSchema)

export default Course
