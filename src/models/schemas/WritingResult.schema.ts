import mongoose, { Document, Schema, Model } from 'mongoose'

// ─── Sub-interfaces ────────────────────────────────────────────────────────────

/** Phản hồi AI cho từng câu */
export interface IQuestionFeedback {
  questionNumber: number
  strengths: string
  weaknesses: string
  suggestion: string
}

/** Kết quả chấm điểm toàn bộ bài từ AI */
export interface IAIFeedback {
  overallFeedback: string
  questionFeedbacks: IQuestionFeedback[]
}

/** Câu trả lời của người dùng cho 1 câu */
export interface IWritingAnswerItem {
  questionNumber: number
  part: 1 | 2 | 3
  answerText: string
  wordCount: number
}

// ─── Main document interface ───────────────────────────────────────────────────

export interface IWritingResult extends Document {
  userId: mongoose.Types.ObjectId
  writingTestId: string
  answers: IWritingAnswerItem[]
  aiFeedback?: IAIFeedback
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

// ─── Sub-schema: QuestionFeedback ─────────────────────────────────────────────

const QuestionFeedbackSchema = new Schema<IQuestionFeedback>(
  {
    questionNumber: { type: Number, required: true },
    strengths: { type: String, default: '' },
    weaknesses: { type: String, default: '' },
    suggestion: { type: String, default: '' }
  },
  { _id: false }
)

// ─── Sub-schema: AIFeedback ───────────────────────────────────────────────────

const AIFeedbackSchema = new Schema<IAIFeedback>(
  {
    overallFeedback: { type: String, default: '' },
    questionFeedbacks: {
      type: [QuestionFeedbackSchema],
      default: []
    }
  },
  { _id: false }
)

// ─── Sub-schema: WritingAnswerItem ────────────────────────────────────────────

const WritingAnswerItemSchema = new Schema<IWritingAnswerItem>(
  {
    questionNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    part: {
      type: Number,
      required: true,
      enum: [1, 2, 3]
    },
    answerText: {
      type: String,
      default: ''
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
)

// ─── Main schema: WritingResult ───────────────────────────────────────────────

const WritingResultSchema = new Schema<IWritingResult>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    writingTestId: {
      type: String,
      required: true,
      trim: true
    },
    answers: {
      type: [WritingAnswerItemSchema],
      required: true,
      validate: {
        validator: (arr: IWritingAnswerItem[]) => Array.isArray(arr) && arr.length > 0,
        message: 'answers phải là mảng không rỗng'
      }
    },
    // Kết quả AI chấm – optional (nếu user bỏ qua AI grading sẽ không có)
    aiFeedback: {
      type: AIFeedbackSchema,
      default: null
    },
    submittedAt: {
      type: Date,
      required: true,
      default: () => new Date()
    }
  },
  {
    timestamps: true,
    collection: 'writingresults'
  }
)

// ─── Indexes ───────────────────────────────────────────────────────────────────
WritingResultSchema.index({ userId: 1, writingTestId: 1 })
WritingResultSchema.index({ writingTestId: 1 })
WritingResultSchema.index({ createdAt: -1 })

// ─── Model ─────────────────────────────────────────────────────────────────────
const WritingResult: Model<IWritingResult> = mongoose.model<IWritingResult>('WritingResult', WritingResultSchema)

export default WritingResult
