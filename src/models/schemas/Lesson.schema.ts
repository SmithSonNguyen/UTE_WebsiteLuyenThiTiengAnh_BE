import mongoose, { Document, Schema, Model } from 'mongoose'

export interface ILesson extends Document {
  course: mongoose.Types.ObjectId // Reference đến Course
  topic: mongoose.Types.ObjectId // Reference đến Topic
  title: string // Tên bài học, ví dụ: "Chiến lược làm bài Part 1"
  description?: string // Mô tả bài học
  orderIndex: number // Thứ tự trong topic (1, 2, 3...)

  // Nội dung bài học
  content: {
    type: 'video' | 'reading' | 'quiz' | 'exercise' | 'document'

    // Cho video lessons
    videoUrl?: string
    videoDuration?: number // Duration in seconds
    videoThumbnail?: string

    // Cho reading/document lessons
    textContent?: string // HTML content
    documentUrl?: string // PDF, DOC files

    // Cho quiz/exercise
    quizId?: mongoose.Types.ObjectId // Reference đến Quiz collection
    exerciseData?: any // Embedded exercise data
  }

  // Metadata
  duration: number // Estimated completion time in minutes
  difficulty: 'easy' | 'medium' | 'hard'

  // Settings
  isPreview: boolean // Có thể xem trước miễn phí không
  isRequired: boolean // Bài học bắt buộc

  // Resources
  attachments?: {
    name: string
    url: string
    type: 'pdf' | 'doc' | 'audio' | 'image' | 'other'
    size?: number // in bytes
  }[]

  status: 'active' | 'inactive' | 'draft'
  createdAt: Date
  updatedAt: Date
}

const lessonSchema: Schema<ILesson> = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    topic: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    title: { type: String, required: true },
    description: { type: String },
    orderIndex: { type: Number, required: true, min: 1 },

    content: {
      type: {
        type: String,
        enum: ['video', 'reading', 'quiz', 'exercise', 'document'],
        required: true
      },

      // Video content
      videoUrl: { type: String },
      videoDuration: { type: Number, min: 0 }, // seconds
      videoThumbnail: { type: String },

      // Text/Document content
      textContent: { type: String },
      documentUrl: { type: String },

      // Interactive content
      quizId: { type: Schema.Types.ObjectId, ref: 'Quiz' },
      exerciseData: { type: Schema.Types.Mixed }
    },

    duration: { type: Number, required: true, min: 1 }, // minutes
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },

    isPreview: { type: Boolean, default: false },
    isRequired: { type: Boolean, default: true },

    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, enum: ['pdf', 'doc', 'audio', 'image', 'other'], required: true },
        size: { type: Number }
      }
    ],

    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' }
  },
  { timestamps: true }
)

// Indexes
lessonSchema.index({ topic: 1, orderIndex: 1 }) // Query lessons theo topic và thứ tự
lessonSchema.index({ course: 1, topic: 1 })
lessonSchema.index({ course: 1, isPreview: 1 }) // Query preview lessons
lessonSchema.index({ 'content.type': 1 })

// Ensure unique orderIndex per topic
lessonSchema.index({ topic: 1, orderIndex: 1 }, { unique: true })

// Middleware để update Topic stats khi lesson thay đổi
lessonSchema.post('save', async function () {
  const Topic = mongoose.model('Topic')
  const topic = await Topic.findById(this.topic)
  if (topic) {
    await topic.updateStats()
  }
})

lessonSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Topic = mongoose.model('Topic')
    const topic = await Topic.findById(doc.topic)
    if (topic) {
      await topic.updateStats()
    }
  }
})

lessonSchema.post('deleteOne', async function () {
  const Topic = mongoose.model('Topic')
  const topic = await Topic.findById(this.getQuery()._id)
  if (topic) {
    await topic.updateStats()
  }
})

export const Lesson: Model<ILesson> = mongoose.model<ILesson>('Lesson', lessonSchema)

export default Lesson
