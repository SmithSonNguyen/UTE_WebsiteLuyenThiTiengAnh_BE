import { Schema, model, Document, Types } from 'mongoose'

// Interface cho option của câu hỏi
export interface IQuestionOption {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
  vietsub?: string
}

// Interface cho Question document
export interface IQuestion extends Document {
  _id: string
  questionNumber: number
  questionId: string
  part: number
  type: 'listening' | 'reading'
  questionText: string
  options: IQuestionOption[]
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  explanation?: string
  testId: Types.ObjectId
  audioUrl?: string
  imageUrl?: string
  questionGroupId?: Types.ObjectId
  // Cho part 6 - fill in the blank
  blankPosition?: number
  createdAt: Date
  updatedAt: Date
}

// Schema cho option
const QuestionOptionSchema = new Schema<IQuestionOption>(
  {
    label: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D']
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    vietsub: {
      type: String,
      trim: true
    }
  },
  { _id: false }
)

// Schema cho Question
const QuestionSchema = new Schema<IQuestion>(
  {
    questionNumber: {
      type: Number,
      required: true,
      min: 1
    },
    questionId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    part: {
      type: Number,
      required: true,
      min: 1,
      max: 7
    },
    type: {
      type: String,
      required: true,
      enum: ['listening', 'reading']
    },
    questionText: {
      type: String,
      default: '',
      trim: true
    },
    options: {
      type: [QuestionOptionSchema],
      required: true,
      validate: {
        validator: function (options: IQuestionOption[]) {
          // Phải có đúng 4 options A, B, C, D
          if (options.length !== 4) return false

          const labels = options.map((opt) => opt.label).sort()
          return JSON.stringify(labels) === JSON.stringify(['A', 'B', 'C', 'D'])
        },
        message: 'Phải có đúng 4 options với label A, B, C, D'
      }
    },
    correctAnswer: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D']
    },
    explanation: {
      type: String,
      default: '',
      trim: true
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: true
    },
    audioUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: IQuestion, value: string) {
          // Part 1, 2 phải có audioUrl
          const partsRequireAudio = [1, 2]
          if (partsRequireAudio.includes(this.part) && !value) {
            return false
          }
          return true
        },
        message: 'AudioUrl là bắt buộc cho part 1 và 2'
      }
    },
    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: IQuestion, value: string) {
          // Part 1 phải có imageUrl
          if (this.part === 1 && !value) {
            return false
          }
          return true
        },
        message: 'ImageUrl là bắt buộc cho part 1'
      }
    },
    questionGroupId: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionGroup',
      default: null
    },
    // Cho part 6 - fill in the blank
    blankPosition: {
      type: Number,
      min: 1
    }
  },
  {
    timestamps: true,
    collection: 'questions'
  }
)

// Indexes
QuestionSchema.index({ testId: 1, questionNumber: 1 }, { unique: true })
QuestionSchema.index({ questionId: 1 }, { unique: true })
QuestionSchema.index({ testId: 1, part: 1 })
QuestionSchema.index({ questionGroupId: 1 })
QuestionSchema.index({ part: 1 })
QuestionSchema.index({ type: 1 })
QuestionSchema.index({ createdAt: -1 })

// Virtual để populate test
QuestionSchema.virtual('test', {
  ref: 'Test',
  localField: 'testId',
  foreignField: '_id',
  justOne: true
})

// Virtual để populate question group
QuestionSchema.virtual('questionGroup', {
  ref: 'QuestionGroup',
  localField: 'questionGroupId',
  foreignField: '_id',
  justOne: true
})

// Static methods
QuestionSchema.statics.findByTest = function (testId: string | Types.ObjectId) {
  return this.find({ testId }).sort({ questionNumber: 1 })
}

QuestionSchema.statics.findByTestAndPart = function (testId: string | Types.ObjectId, part: number) {
  return this.find({ testId, part }).sort({ questionNumber: 1 })
}

QuestionSchema.statics.findByQuestionGroup = function (questionGroupId: string | Types.ObjectId) {
  return this.find({ questionGroupId }).sort({ questionNumber: 1 })
}

QuestionSchema.statics.findIndividualQuestions = function (testId: string | Types.ObjectId) {
  return this.find({ testId, questionGroupId: null }).sort({ questionNumber: 1 })
}

QuestionSchema.statics.findGroupedQuestions = function (testId: string | Types.ObjectId) {
  return this.find({ testId, questionGroupId: { $ne: null } }).sort({ questionNumber: 1 })
}

QuestionSchema.statics.findListeningQuestions = function (testId: string | Types.ObjectId) {
  return this.find({ testId, type: 'listening' }).sort({ questionNumber: 1 })
}

QuestionSchema.statics.findReadingQuestions = function (testId: string | Types.ObjectId) {
  return this.find({ testId, type: 'reading' }).sort({ questionNumber: 1 })
}

QuestionSchema.statics.findByQuestionId = function (questionId: string) {
  return this.findOne({ questionId })
}

// Instance methods
QuestionSchema.methods.isListening = function () {
  return this.type === 'listening'
}

QuestionSchema.methods.isReading = function () {
  return this.type === 'reading'
}

QuestionSchema.methods.hasAudio = function () {
  return this.audioUrl && this.audioUrl.length > 0
}

QuestionSchema.methods.hasImage = function () {
  return this.imageUrl && this.imageUrl.length > 0
}

QuestionSchema.methods.isGrouped = function () {
  return this.questionGroupId !== null && this.questionGroupId !== undefined
}

QuestionSchema.methods.isIndividual = function () {
  return !this.isGrouped()
}

QuestionSchema.methods.getOptionByLabel = function (label: 'A' | 'B' | 'C' | 'D') {
  return this.options.find((opt: IQuestionOption) => opt.label === label)
}

QuestionSchema.methods.getCorrectOption = function () {
  return this.getOptionByLabel(this.correctAnswer)
}

QuestionSchema.methods.checkAnswer = function (userAnswer: 'A' | 'B' | 'C' | 'D') {
  return this.correctAnswer === userAnswer
}

// Pre-save middleware
QuestionSchema.pre('save', function (next) {
  // Validate type theo part
  const listeningParts = [1, 2, 3, 4]
  const readingParts = [5, 6, 7]

  if (this.type === 'listening' && !listeningParts.includes(this.part)) {
    return next(new Error(`Part ${this.part} không thể có type là listening`))
  }

  if (this.type === 'reading' && !readingParts.includes(this.part)) {
    return next(new Error(`Part ${this.part} không thể có type là reading`))
  }

  // Validate questionGroupId theo part
  const groupedParts = [3, 4, 6, 7]
  const individualParts = [1, 2, 5]

  if (individualParts.includes(this.part) && this.questionGroupId) {
    return next(new Error(`Part ${this.part} không được có questionGroupId`))
  }

  if (groupedParts.includes(this.part) && !this.questionGroupId) {
    return next(new Error(`Part ${this.part} phải có questionGroupId`))
  }

  next()
})

const Question = model<IQuestion>('Question', QuestionSchema)

export default Question
