import { Schema, model, Document } from 'mongoose'

// ─── Sub-interfaces ────────────────────────────────────────────────────────────

/**
 * Mỗi câu hỏi trong đề thi Writing.
 * - Part 1 (Q1–5)  : Viết câu mô tả ảnh → cần imageUrl
 * - Part 2 (Q6–7)  : Phản hồi email    → cần các trường email*
 * - Part 3 (Q8)    : Viết luận         → cần essayPrompt
 */
export interface IWritingQuestion {
  questionNumber: number // 1 – 8
  part: 1 | 2 | 3
  type: 'photo_description' | 'email_response' | 'opinion_essay'

  // Part 1 – Photo description
  imageUrl?: string

  // Part 2 – Email response
  emailFrom?: string
  emailTo?: string
  emailSubject?: string
  emailSent?: string
  emailBody?: string
  emailDirections?: string

  // Part 3 – Opinion essay
  essayPrompt?: string
}

// ─── Main document interface ───────────────────────────────────────────────────

export interface IWritingTest extends Document {
  writingTestId: string // e.g. "writing-001"
  name: string
  description: string
  duration: number // phút, mặc định 60
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  questions: IWritingQuestion[]
  completedCount: number
  createdAt: Date
  updatedAt: Date
}

// ─── Sub-schema: WritingQuestion ───────────────────────────────────────────────

const WritingQuestionSchema = new Schema<IWritingQuestion>(
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
    type: {
      type: String,
      required: true,
      enum: ['photo_description', 'email_response', 'opinion_essay']
    },

    // Part 1
    imageUrl: {
      type: String,
      trim: true,
      default: null
    },

    // Part 2
    emailFrom: { type: String, trim: true, default: null },
    emailTo: { type: String, trim: true, default: null },
    emailSubject: { type: String, trim: true, default: null },
    emailSent: { type: String, trim: true, default: null },
    emailBody: { type: String, trim: true, default: null },
    emailDirections: { type: String, trim: true, default: null },

    // Part 3
    essayPrompt: { type: String, trim: true, default: null }
  },
  { _id: false }
)

// ─── Main schema: WritingTest ──────────────────────────────────────────────────

const WritingTestSchema = new Schema<IWritingTest>(
  {
    writingTestId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: false,
      default: '',
      trim: true,
      maxlength: 500
    },
    duration: {
      type: Number,
      required: true,
      default: 60, // phút
      min: 1
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    questions: {
      type: [WritingQuestionSchema],
      required: true,
      validate: {
        validator: (arr: IWritingQuestion[]) => Array.isArray(arr) && arr.length > 0,
        message: 'Writing test phải có ít nhất 1 câu hỏi'
      }
    },
    completedCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    collection: 'writingtests'
  }
)

// ─── Indexes ───────────────────────────────────────────────────────────────────
WritingTestSchema.index({ writingTestId: 1 })
WritingTestSchema.index({ difficulty: 1 })
WritingTestSchema.index({ createdAt: -1 })

// ─── Statics ───────────────────────────────────────────────────────────────────
WritingTestSchema.statics.findByWritingTestId = function (writingTestId: string) {
  return this.findOne({ writingTestId })
}

// ─── Model ─────────────────────────────────────────────────────────────────────
const WritingTest = model<IWritingTest>('WritingTest', WritingTestSchema)

export default WritingTest
