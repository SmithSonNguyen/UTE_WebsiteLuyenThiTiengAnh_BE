import mongoose, { Document, Schema, Model } from 'mongoose'

// Định nghĩa cấu trúc của từng câu hỏi nhỏ trong mảng questions
export interface ISubQuestion {
  number: number
  questionText: string
  options: string[]
  answer: string
}

// Định nghĩa cấu trúc của toàn bộ document question
export interface IQuestion extends Document {
  part: number // 1 → 7
  mediaUrl?: string
  imageUrl?: string[]
  testId: string
  type: 'listening' | 'reading'
  explanation?: string
  paragraph?: string
  questions: ISubQuestion[] // mảng chứa các câu hỏi con
}

// Schema con cho từng phần tử trong mảng questions
const SubQuestionSchema = new Schema<ISubQuestion>({
  number: { type: Number, required: true },
  questionText: { type: String, required: false, default: '' }, // ❗ cho phép rỗng
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr: string[]) => Array.isArray(arr) && arr.length === 4,
      message: 'Options must be an array with exactly 4 elements'
    }
  },
  answer: { type: String, required: false, default: '' } // ❗ cho phép rỗng
})

// Schema chính cho collection "questions"
const QuestionSchema = new Schema<IQuestion>({
  part: { type: Number, required: true, min: 1, max: 7 },
  mediaUrl: { type: String, required: false },
  imageUrl: {
    type: [String],
    required: false,
    validate: {
      validator: (arr: string[]) => Array.isArray(arr),
      message: 'imageUrl must be an array of strings'
    }
  },
  testId: { type: String, required: true },
  type: { type: String, enum: ['listening', 'reading'], required: true },
  explanation: { type: String, required: false, default: '' },
  paragraph: { type: String, required: false, default: '' },
  questions: {
    type: [SubQuestionSchema],
    required: true,
    validate: {
      validator: (arr: ISubQuestion[]) => Array.isArray(arr) && arr.length > 0,
      message: 'questions must be a non-empty array'
    }
  }
})

// Tạo model
const Question: Model<IQuestion> = mongoose.model<IQuestion>(
  'Question',
  QuestionSchema,
  'questions' // tên collection trong MongoDB
)

export default Question
