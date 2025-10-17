import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IUserProgress extends Document {
  user: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId

  // Tiến độ tổng thể
  overallProgress: {
    completedTopics: number
    totalTopics: number
    completedLessons: number
    totalLessons: number
    completionPercentage: number // Auto-calculated
    totalTimeSpent: number // Total minutes spent
  }

  // Tiến độ từng topic
  topicProgress: {
    topic: mongoose.Types.ObjectId
    completedLessons: number
    totalLessons: number
    completionPercentage: number
    lastAccessedAt?: Date
    timeSpent: number // minutes spent on this topic
  }[]

  // Tiến độ từng lesson
  lessonProgress: {
    lesson: mongoose.Types.ObjectId
    status: 'not_started' | 'in_progress' | 'completed'
    progress: number // 0-100, for video lessons (% watched)
    timeSpent: number // minutes spent on this lesson
    completedAt?: Date
    lastAccessedAt: Date
    attempts?: number // For quiz/exercise lessons
    bestScore?: number // For quiz/exercise lessons
  }[]

  // Thống kê học tập
  learningStats: {
    currentStreak: number // Số ngày học liên tục
    longestStreak: number
    totalStudyDays: number
    averageSessionTime: number // Average minutes per session
    lastStudyDate: Date
  }

  createdAt: Date
  updatedAt: Date
}

const userProgressSchema: Schema<IUserProgress> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },

    overallProgress: {
      completedTopics: { type: Number, default: 0 },
      totalTopics: { type: Number, default: 0 },
      completedLessons: { type: Number, default: 0 },
      totalLessons: { type: Number, default: 0 },
      completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
      totalTimeSpent: { type: Number, default: 0 }
    },

    topicProgress: [
      {
        topic: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
        completedLessons: { type: Number, default: 0 },
        totalLessons: { type: Number, default: 0 },
        completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
        lastAccessedAt: { type: Date },
        timeSpent: { type: Number, default: 0 }
      }
    ],

    lessonProgress: [
      {
        lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
        status: {
          type: String,
          enum: ['not_started', 'in_progress', 'completed'],
          default: 'not_started'
        },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        timeSpent: { type: Number, default: 0 },
        completedAt: { type: Date },
        lastAccessedAt: { type: Date, default: Date.now },
        attempts: { type: Number, default: 0 },
        bestScore: { type: Number, min: 0, max: 100 }
      }
    ],

    learningStats: {
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      totalStudyDays: { type: Number, default: 0 },
      averageSessionTime: { type: Number, default: 0 },
      lastStudyDate: { type: Date }
    }
  },
  { timestamps: true }
)

// Indexes
userProgressSchema.index({ user: 1, course: 1 }, { unique: true })
userProgressSchema.index({ user: 1 })
userProgressSchema.index({ course: 1 })
userProgressSchema.index({ 'lessonProgress.lesson': 1 })
userProgressSchema.index({ 'overallProgress.completionPercentage': -1 })

// Methods để update progress
userProgressSchema.methods.updateOverallProgress = function () {
  const totalCompleted = this.lessonProgress.filter((lp: any) => lp.status === 'completed').length
  this.overallProgress.completedLessons = totalCompleted
  this.overallProgress.totalLessons = this.lessonProgress.length
  this.overallProgress.completionPercentage =
    this.overallProgress.totalLessons > 0 ? Math.round((totalCompleted / this.overallProgress.totalLessons) * 100) : 0

  return this.save()
}

export const UserProgress: Model<IUserProgress> = mongoose.model<IUserProgress>('UserProgress', userProgressSchema)

export default UserProgress
