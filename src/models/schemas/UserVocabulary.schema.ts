import mongoose, { Document, Schema, Model } from 'mongoose'
import { ObjectId } from 'mongodb'

export interface IUserVocabulary extends Document {
  userId: ObjectId // ID của user
  word: string // Từ vựng đã dịch
  explanation: string // Nghĩa tiếng Việt sau khi dịch
  sourceLanguage?: string // Ngôn ngữ gốc (optional)
  contextExample?: string // Ví dụ ngữ cảnh (optional)
  tags?: string[] // Tags để phân loại (optional)
  isFavorite?: boolean // Đánh dấu yêu thích
  reviewCount?: number // Số lần ôn tập
  lastReviewedAt?: Date // Lần ôn tập gần nhất
  createdAt: Date
  updatedAt: Date
}

const UserVocabularySchema: Schema<IUserVocabulary> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    word: { type: String, required: true, trim: true },
    explanation: { type: String, required: true },
    sourceLanguage: { type: String, default: 'en' },
    contextExample: { type: String },
    tags: { type: [String], default: [] },
    isFavorite: { type: Boolean, default: false },
    reviewCount: { type: Number, default: 0 },
    lastReviewedAt: { type: Date }
  },
  {
    timestamps: true,
    collection: 'user_vocabularies'
  }
)

// Index để tìm kiếm nhanh
UserVocabularySchema.index({ userId: 1, word: 1 })
UserVocabularySchema.index({ userId: 1, createdAt: -1 })

const UserVocabulary: Model<IUserVocabulary> = mongoose.model<IUserVocabulary>('UserVocabulary', UserVocabularySchema)

export default UserVocabulary
