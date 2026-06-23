// models/schemas/SpeakingResult.schema.ts
import mongoose, { Schema, Document } from 'mongoose'
import { ObjectId } from 'mongodb'

// ── Sub-schema: Điểm + Nhận xét của 1 tiêu chí ──────────────────────────────
const AiScoreDetailSchema = new Schema(
  {
    score:   { type: Number, default: null, min: 0, max: 100 },
    comment: { type: String, default: '' }
  },
  { _id: false }
)

// ── Sub-schema: Kết quả 1 câu hỏi Speaking ───────────────────────────────────
const SpeakingAnswerSchema = new Schema(
  {
    questionId:   { type: Number, required: true },
    partNumber:   { type: Number, required: true, min: 1, max: 5 },
    partTitle:    { type: String, default: '' },

    // Input từ user
    transcript:   { type: String, default: '' },
    audioUrl:     { type: String, default: null },

    // Kết quả AI
    aiGraded:      { type: Boolean, default: false },
    aiMarkdown:    { type: String, default: '' },       // toàn bộ markdown từ Groq
    totalScore:    { type: Number, default: null },     // 0-100
    etsScoreLevel: { type: Number, default: null },     // 1-8
    etsPointScore: { type: String, default: null },     // vd: "3/3"

    // Điểm thành phần
    scoreBreakdown: {
      pronunciation: { type: AiScoreDetailSchema, default: null },
      grammar:       { type: AiScoreDetailSchema, default: null },
      fluency:       { type: AiScoreDetailSchema, default: null },
      relevance:     { type: AiScoreDetailSchema, default: null }
    },

    correctedVersion: { type: String, default: null },
    sampleAnswer:     { type: String, default: null },
    answeredAt:       { type: Date, default: null }
  },
  { _id: false }
)

// ── Main Interface ────────────────────────────────────────────────────────────
export interface ISpeakingResult extends Document {
  userId:         ObjectId
  testId:         string
  testName:       string
  answers:        any[]
  totalQuestions: number
  answeredCount:  number
  gradedCount:    number
  overallScore:   number | null
  status:         'in_progress' | 'completed' | 'abandoned'
  startedAt:      Date
  completedAt:    Date | null
  createdAt:      Date
  updatedAt:      Date
}

// ── Main Schema ───────────────────────────────────────────────────────────────
const SpeakingResultSchema = new Schema<ISpeakingResult>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    testId:   { type: String, required: true },
    testName: { type: String, default: '' },

    answers:        { type: [SpeakingAnswerSchema], default: [] },

    totalQuestions: { type: Number, default: 11 },
    answeredCount:  { type: Number, default: 0 },
    gradedCount:    { type: Number, default: 0 },
    overallScore:   { type: Number, default: null },

    status:      { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
    startedAt:   { type: Date, default: Date.now },
    completedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    collection: 'speaking_results'
  }
)

// ── Indexes ───────────────────────────────────────────────────────────────────
// Compound unique: 1 user = 1 bài/đề (dùng upsert khi lưu)
SpeakingResultSchema.index({ userId: 1, testId: 1 }, { unique: true })

// Lịch sử gần đây của user
SpeakingResultSchema.index({ userId: 1, createdAt: -1 })

// Leaderboard theo đề thi
SpeakingResultSchema.index({ testId: 1, overallScore: -1 })

export default mongoose.model<ISpeakingResult>('SpeakingResult', SpeakingResultSchema)
