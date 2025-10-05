import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IFreeEntryTest extends Document {
  part: number // 1 → 7
  number?: number
  questionText?: string // có thể rỗng
  options: string[]
  answer: string
  mediaUrl?: string
  imageUrl?: string
}

export const FreeEntryTestSchema: Schema<IFreeEntryTest> = new Schema({
  part: { type: Number, required: true, min: 1, max: 7 },
  number: { type: Number },
  questionText: { type: String, required: false, default: '' },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0,
      message: 'Options must be a non-empty array of strings'
    }
  },
  answer: { type: String, required: true },
  mediaUrl: { type: String },
  imageUrl: { type: String }
})

// Model
const FreeEntryTest: Model<IFreeEntryTest> = mongoose.model<IFreeEntryTest>(
  'FreeEntryTest',
  FreeEntryTestSchema,
  'freeentrytests' // tên collection trùng với trong MongoDB
)

export default FreeEntryTest
