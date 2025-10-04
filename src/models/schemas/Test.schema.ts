import { Schema, model, Document } from 'mongoose'

// Interface cho section của test
// export interface ITestSection {
//   part: number
//   type: 'listening' | 'reading'
//   questionIds: string[]
//   totalQuestions: number
// }

// Interface cho Test document
export interface ITest extends Document {
  _id: string
  testId: string
  name: string
  description: string
  totalQuestions: number
  maxScore: number
  duration: number // thời gian làm bài tính bằng phút
  completedCount: number
  category: string
  year: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  createdAt: Date
  updatedAt: Date
}
//   sections: ITestSection[]

// Schema cho section
// const TestSectionSchema = new Schema<ITestSection>(
//   {
//     part: {
//       type: Number,
//       required: true,
//       min: 1,
//       max: 7
//     },
//     type: {
//       type: String,
//       required: true,
//       enum: ['listening', 'reading']
//     },
//     questionIds: [
//       {
//         type: String,
//         required: true
//       }
//     ],
//     totalQuestions: {
//       type: Number,
//       required: true,
//       min: 0
//     }
//   },
//   { _id: false }
// )

// Schema cho Test
const TestSchema = new Schema<ITest>(
  {
    testId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 200,
      min: 1
    },
    maxScore: {
      type: Number,
      required: true,
      default: 990,
      min: 1
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    completedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100
    },
    // sections: {
    //   type: [TestSectionSchema],
    //   required: true,
    //   validate: {
    //     validator: function (sections: ITestSection[]) {
    //       // Validate có đủ 7 part
    //       return sections.length === 7 && sections.every((section, index) => section.part === index + 1)
    //     },
    //     message: 'Test phải có đủ 7 part từ 1 đến 7'
    //   }
    // },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    }
  },
  {
    timestamps: true,
    collection: 'tests'
  }
)

// Indexes
TestSchema.index({ testId: 1 })
TestSchema.index({ category: 1 })
TestSchema.index({ difficulty: 1 })
TestSchema.index({ createdAt: -1 })

// Virtual để tính tổng số câu hỏi từ sections
// TestSchema.virtual('calculatedTotalQuestions').get(function () {
//   return this.sections.reduce((total, section) => total + section.totalQuestions, 0)
// })

// Pre-save middleware để validate tổng số câu hỏi
// TestSchema.pre('save', function (next) {
//   const calculatedTotal = this.sections.reduce((total, section) => total + section.totalQuestions, 0)
//   if (calculatedTotal !== this.totalQuestions) {
//     return next(new Error('Tổng số câu hỏi trong sections không khớp với totalQuestions'))
//   }
//   next()
// })

// Static methods
TestSchema.statics.findByTestId = function (testId: string) {
  return this.findOne({ testId })
}

TestSchema.statics.findByCategory = function (category: string) {
  return this.find({ category }).sort({ createdAt: -1 })
}

TestSchema.statics.findByDifficulty = function (difficulty: string) {
  return this.find({ difficulty }).sort({ createdAt: -1 })
}

// Instance methods
TestSchema.methods.incrementCompletedCount = function () {
  this.completedCount += 1
  return this.save()
}

// TestSchema.methods.getPartQuestions = function (part: number) {
//   const section = this.sections.find((s: ITestSection) => s.part === part)
//   return section ? section.questionIds : []
// }

// TestSchema.methods.getTotalListeningQuestions = function () {
//   return this.sections
//     .filter((s: ITestSection) => s.type === 'listening')
//     .reduce((total: number, section: ITestSection) => total + section.totalQuestions, 0)
// }

// TestSchema.methods.getTotalReadingQuestions = function () {
//   return this.sections
//     .filter((s: ITestSection) => s.type === 'reading')
//     .reduce((total: number, section: ITestSection) => total + section.totalQuestions, 0)
// }

const Test = model<ITest>('Test', TestSchema)

export default Test
