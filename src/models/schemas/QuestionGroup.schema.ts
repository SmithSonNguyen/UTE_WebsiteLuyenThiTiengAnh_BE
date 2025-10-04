import { Schema, model, Document, Types } from 'mongoose'

// Interface cho QuestionGroup document
export interface IQuestionGroup extends Document {
  _id: string
  part: number
  groupNumber: number
  audioUrl?: string
  images?: string[]
  testId: Types.ObjectId
  groupType: 'listening' | 'reading'
  createdAt: Date
  updatedAt: Date
}

// Schema cho QuestionGroup
const QuestionGroupSchema = new Schema<IQuestionGroup>(
  {
    part: {
      type: Number,
      required: true,
      min: 1,
      max: 7
    },
    groupNumber: {
      type: Number,
      required: true,
      min: 1
    },
    audioUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: IQuestionGroup, value: string) {
          // Nếu là listening group thì phải có audioUrl
          if (this.groupType === 'listening' && !value) {
            return false
          }
          return true
        },
        message: 'AudioUrl là bắt buộc cho listening group'
      }
    },
    images: {
      type: [String],
      default: []
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: true
    },
    groupType: {
      type: String,
      required: true,
      enum: ['listening', 'reading']
    }
  },
  {
    timestamps: true,
    collection: 'question_groups'
  }
)

// Indexes
QuestionGroupSchema.index({ testId: 1, part: 1, groupNumber: 1 }, { unique: true })
QuestionGroupSchema.index({ testId: 1 })
QuestionGroupSchema.index({ part: 1 })
QuestionGroupSchema.index({ groupType: 1 })
QuestionGroupSchema.index({ createdAt: -1 })

// Virtual để populate test
QuestionGroupSchema.virtual('test', {
  ref: 'Test',
  localField: 'testId',
  foreignField: '_id',
  justOne: true
})

// Static methods
QuestionGroupSchema.statics.findByTest = function (testId: string | Types.ObjectId) {
  return this.find({ testId }).sort({ part: 1, groupNumber: 1 })
}

QuestionGroupSchema.statics.findByTestAndPart = function (testId: string | Types.ObjectId, part: number) {
  return this.find({ testId, part }).sort({ groupNumber: 1 })
}

QuestionGroupSchema.statics.findByTestPartAndGroup = function (
  testId: string | Types.ObjectId,
  part: number,
  groupNumber: number
) {
  return this.findOne({ testId, part, groupNumber })
}

QuestionGroupSchema.statics.findListeningGroups = function (testId: string | Types.ObjectId) {
  return this.find({ testId, groupType: 'listening' }).sort({ part: 1, groupNumber: 1 })
}

QuestionGroupSchema.statics.findReadingGroups = function (testId: string | Types.ObjectId) {
  return this.find({ testId, groupType: 'reading' }).sort({ part: 1, groupNumber: 1 })
}

// Instance methods
QuestionGroupSchema.methods.isListening = function () {
  return this.groupType === 'listening'
}

QuestionGroupSchema.methods.isReading = function () {
  return this.groupType === 'reading'
}

QuestionGroupSchema.methods.hasAudio = function () {
  return this.audioUrl && this.audioUrl.length > 0
}

QuestionGroupSchema.methods.hasImages = function () {
  return this.images && this.images.length > 0
}

QuestionGroupSchema.methods.hasPassage = function () {
  return this.passage && this.passage.length > 0
}

QuestionGroupSchema.methods.getGroupIdentifier = function () {
  return `Part ${this.part} - Group ${this.groupNumber}`
}

// Pre-save middleware
QuestionGroupSchema.pre('save', function (next) {
  // Validate part và groupType
  const listeningParts = [3, 4]
  const readingParts = [6, 7]

  if (this.groupType === 'listening' && !listeningParts.includes(this.part)) {
    return next(new Error(`Part ${this.part} không thể có groupType là listening`))
  }

  if (this.groupType === 'reading' && !readingParts.includes(this.part)) {
    return next(new Error(`Part ${this.part} không thể có groupType là reading`))
  }

  next()
})

const QuestionGroup = model<IQuestionGroup>('QuestionGroup', QuestionGroupSchema)

export default QuestionGroup
