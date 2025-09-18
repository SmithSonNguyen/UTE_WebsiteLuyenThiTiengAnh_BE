import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IVocabulary extends Document {
  index: number // STT
  word: string // Từ vựng & Phiên âm
  explanation: string // Giải thích (EN)
  typeAndMeaning: string // Từ loại & Nghĩa (VI)
  exampleEn: string // Ví dụ (EN)
  exampleVi: string // Ví dụ (VI)
  lesson: number // Lesson
  createdAt: Date
  updatedAt: Date
}

const VocabularySchema: Schema<IVocabulary> = new Schema(
  {
    index: { type: Number, required: true },
    word: { type: String, required: true },
    explanation: { type: String, required: true },
    typeAndMeaning: { type: String, required: true },
    exampleEn: { type: String, required: true },
    exampleVi: { type: String, required: true },
    lesson: { type: Number, required: true }
  },
  { timestamps: true, collection: 'vocabularies' }
)

const Vocabulary: Model<IVocabulary> = mongoose.model<IVocabulary>('Vocabulary', VocabularySchema)

export default Vocabulary
