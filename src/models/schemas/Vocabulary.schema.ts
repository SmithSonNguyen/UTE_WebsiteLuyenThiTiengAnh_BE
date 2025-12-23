import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IVocabulary extends Document {
  _id: number // ID dạng số
  vocab: string // Từ vựng & Phiên âm
  explanation_en: string // Giải thích (EN)
  meaning_vi: string // Từ loại & Nghĩa (VI)
  example_en: string // Ví dụ (EN)
  example_vi: string // Ví dụ (VI)
  lesson: number // Lesson
  createdAt: Date
  updatedAt: Date
}

const VocabularySchema: Schema<IVocabulary> = new Schema(
  {
    _id: { type: Number, required: true },
    vocab: { type: String, required: true },
    explanation_en: { type: String, required: false },
    meaning_vi: { type: String, required: false },
    example_en: { type: String, required: false },
    example_vi: { type: String, required: false },
    lesson: { type: Number, required: true }
  },
  { timestamps: true, collection: 'vocabularies', _id: false }
)

const Vocabulary: Model<IVocabulary> = mongoose.model<IVocabulary>('Vocabulary', VocabularySchema)

export default Vocabulary
