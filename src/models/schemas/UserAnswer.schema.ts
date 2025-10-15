import mongoose, { Document, Schema, Model } from 'mongoose'

// Interface cho từng câu trả lời
export interface IUserAnswerItem {
  number: number
  answer: string
  isCorrect?: boolean
  part?: number
}

// Interface cho toàn bộ document user answer
export interface IUserAnswer extends Document {
  userId: mongoose.Types.ObjectId
  testId: string
  answers: IUserAnswerItem[]
  createdAt: Date
  updatedAt: Date
}

// Schema cho từng phần tử trong mảng answers
const UserAnswerItemSchema = new Schema<IUserAnswerItem>({
  number: { type: Number, required: true },
  answer: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: null },
  part: { type: Number, required: false, min: 1, max: 7 }
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
      type: String,
      required: true
    },
    answers: {
      type: [UserAnswerItemSchema],
      required: true,
      validate: {
        validator: (arr: IUserAnswerItem[]) => Array.isArray(arr) && arr.length > 0,
        message: 'answers must be a non-empty array'
      }
    }
  },
  { timestamps: true, collection: 'useranswer' } // tên collection cố định
)

// Tạo model
const UserAnswer: Model<IUserAnswer> = mongoose.model<IUserAnswer>('UserAnswer', UserAnswerSchema)

export default UserAnswer
