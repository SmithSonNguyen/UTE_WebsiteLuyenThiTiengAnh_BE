import mongoose, { Document, Schema, Model } from 'mongoose'

// Interface cho từng câu trả lời
export interface IUserAnswerItem {
  number: number
  answer: string | null
  isCorrect?: boolean
  part?: number
  questionText?: string
  options?: string[]
  imageUrl?: string | string[]
  mediaUrl?: string
  paragraph?: string
  explanation?: string
}

// Interface cho toàn bộ document user answer
export interface IUserAnswer extends Document {
  userId: mongoose.Types.ObjectId
  testId: string
  answers: IUserAnswerItem[]
  // total mark/score assigned after frontend grading
  mark?: number
  // number of correct answers the user got
  rightAnswerNumber?: number
  createdAt: Date
  updatedAt: Date
}

// Schema cho từng phần tử trong mảy answers
const UserAnswerItemSchema = new Schema<IUserAnswerItem>({
  number: { type: Number, required: true },
  answer: { type: String, required: false, default: null },
  isCorrect: { type: Boolean, default: null },
  part: { type: Number, required: false, min: 1, max: 7 },
  questionText: { type: String, required: false, default: null },
  options: { type: [String], required: false, default: [] },
  imageUrl: { type: Schema.Types.Mixed, required: false, default: null }, // string hoặc [string]
  mediaUrl: { type: String, required: false, default: null },
  paragraph: { type: String, required: false, default: null },
  explanation: { type: String, required: false, default: null }
})

// Schema chính cho UserAnswer
const UserAnswerSchema = new Schema<IUserAnswer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    testId: {
      type: String
    },
    answers: {
      type: [UserAnswerItemSchema],
      required: true,
      validate: {
        validator: (arr: IUserAnswerItem[]) => Array.isArray(arr) && arr.length > 0,
        message: 'answers must be a non-empty array'
      }
    },
    // optional mark stored after frontend grading (number)
    mark: {
      type: Number,
      required: false,
      default: null,
      min: 0
    },
    // optional number of correct answers
    rightAnswerNumber: {
      type: Number,
      required: false,
      default: null,
      min: 0
    }
  },
  { timestamps: true, collection: 'useranswer' }
)

// Tạo model
const UserAnswer: Model<IUserAnswer> = mongoose.model<IUserAnswer>('UserAnswer', UserAnswerSchema)

export default UserAnswer
