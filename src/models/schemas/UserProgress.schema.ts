import mongoose, { Schema, Model, HydratedDocument } from 'mongoose'

// Interface cho subdocuments
interface IQuizResult {
  score: number
  totalQuestions: number
  percentage: number
  completedAt: Date
}

interface IVocabularyProgress {
  lessonId: number
  lessonTitle: string
  progress: number
  completed: boolean
  unlocked: boolean
  totalWords: number
  quizResults: IQuizResult[]
  lastAccessedAt: Date
  timeSpent: number
}

interface ILearningStats {
  totalLessonsCompleted: number
  totalWordsLearned: number
  currentStreak: number
  longestStreak: number
  totalStudyDays: number
  lastStudyDate: Date | null
  totalTimeSpent: number
}

// Interface chính cho document
export interface IUserProgress {
  userId: string
  vocabularyProgress: IVocabularyProgress[]
  learningStats: ILearningStats
  createdAt: Date
  updatedAt: Date
}

// Interface cho instance methods
export interface IUserProgressMethods {
  updateLessonProgress(
    lessonId: number,
    lessonTitle: string,
    quizScore: number,
    totalQuestions: number,
    totalWords: number
  ): Promise<HydratedDocument<IUserProgress, IUserProgressMethods>>
  updateStreak(): void
  getLessonProgress(lessonId: number): IVocabularyProgress | undefined
  getUnlockedLessons(): IVocabularyProgress[]
}

// Interface cho static methods
interface IUserProgressModel extends Model<IUserProgress, IUserProgressMethods> {
  initializeUserProgress(
    userId: string,
    totalLessons?: number
  ): Promise<HydratedDocument<IUserProgress, IUserProgressMethods>>
}

// Type alias cho document đã được hydrate
export type UserProgressDocument = HydratedDocument<IUserProgress, IUserProgressMethods>

const userProgressSchema = new Schema<IUserProgress, IUserProgressModel, IUserProgressMethods>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },

    vocabularyProgress: [
      {
        lessonId: { type: Number, required: true },
        lessonTitle: { type: String, required: true },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        completed: { type: Boolean, default: false },
        unlocked: { type: Boolean, default: false },
        totalWords: { type: Number, default: 0 },
        quizResults: [
          {
            score: { type: Number, required: true },
            totalQuestions: { type: Number, required: true },
            percentage: { type: Number, required: true },
            completedAt: { type: Date, default: Date.now }
          }
        ],
        lastAccessedAt: { type: Date, default: Date.now },
        timeSpent: { type: Number, default: 0 }
      }
    ],

    learningStats: {
      totalLessonsCompleted: { type: Number, default: 0 },
      totalWordsLearned: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      totalStudyDays: { type: Number, default: 0 },
      lastStudyDate: { type: Date, default: null },
      totalTimeSpent: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    collection: 'user_progress'
  }
)

// Indexes
userProgressSchema.index({ userId: 1 }, { unique: true })
userProgressSchema.index({ 'vocabularyProgress.lessonId': 1 })
userProgressSchema.index({ 'learningStats.totalLessonsCompleted': -1 })

// Instance methods
userProgressSchema.methods.updateLessonProgress = async function (
  this: UserProgressDocument,
  lessonId: number,
  lessonTitle: string,
  quizScore: number,
  totalQuestions: number,
  totalWords: number
) {
  const percentage = Math.round((quizScore / totalQuestions) * 100)
  const completed = percentage >= 80 || quizScore >= 5

  const lessonIndex = this.vocabularyProgress.findIndex((vp) => vp.lessonId === lessonId)

  const quizResult: IQuizResult = {
    score: quizScore,
    totalQuestions,
    percentage,
    completedAt: new Date()
  }

  if (lessonIndex >= 0) {
    this.vocabularyProgress[lessonIndex].progress = Math.max(this.vocabularyProgress[lessonIndex].progress, percentage)
    this.vocabularyProgress[lessonIndex].completed = completed
    this.vocabularyProgress[lessonIndex].lastAccessedAt = new Date()
    this.vocabularyProgress[lessonIndex].quizResults.push(quizResult)
  } else {
    this.vocabularyProgress.push({
      lessonId,
      lessonTitle,
      progress: percentage,
      completed,
      unlocked: true,
      totalWords,
      quizResults: [quizResult],
      lastAccessedAt: new Date(),
      timeSpent: 0
    })
  }

  if (completed) {
    const nextLessonIndex = this.vocabularyProgress.findIndex((vp) => vp.lessonId === lessonId + 1)
    if (nextLessonIndex >= 0) {
      this.vocabularyProgress[nextLessonIndex].unlocked = true
    }

    this.learningStats.totalLessonsCompleted = this.vocabularyProgress.filter((vp) => vp.completed).length
    this.learningStats.totalWordsLearned = this.vocabularyProgress.reduce(
      (sum, vp) => sum + (vp.completed ? vp.totalWords : 0),
      0
    )
  }

  this.updateStreak()
  return this.save()
}

userProgressSchema.methods.updateStreak = function (this: UserProgressDocument) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (this.learningStats.lastStudyDate) {
    const lastStudy = new Date(this.learningStats.lastStudyDate)
    lastStudy.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return
    } else if (diffDays === 1) {
      this.learningStats.currentStreak += 1
      this.learningStats.totalStudyDays += 1
    } else {
      this.learningStats.currentStreak = 1
      this.learningStats.totalStudyDays += 1
    }
  } else {
    this.learningStats.currentStreak = 1
    this.learningStats.totalStudyDays = 1
  }

  if (this.learningStats.currentStreak > this.learningStats.longestStreak) {
    this.learningStats.longestStreak = this.learningStats.currentStreak
  }

  this.learningStats.lastStudyDate = today
}

userProgressSchema.methods.getLessonProgress = function (this: UserProgressDocument, lessonId: number) {
  return this.vocabularyProgress.find((vp) => vp.lessonId === lessonId)
}

userProgressSchema.methods.getUnlockedLessons = function (this: UserProgressDocument) {
  return this.vocabularyProgress.filter((vp) => vp.unlocked)
}

// Static method
userProgressSchema.statics.initializeUserProgress = async function (
  this: IUserProgressModel,
  userId: string,
  totalLessons: number = 50
) {
  const existingProgress = await this.findOne({ userId })
  if (existingProgress) {
    return existingProgress
  }

  const vocabularyProgress: IVocabularyProgress[] = []
  for (let i = 1; i <= totalLessons; i++) {
    vocabularyProgress.push({
      lessonId: i,
      lessonTitle: `Lesson ${i}`,
      progress: 0,
      completed: false,
      unlocked: i === 1,
      totalWords: 0,
      quizResults: [],
      lastAccessedAt: new Date(),
      timeSpent: 0
    })
  }

  const newProgress = new this({
    userId,
    vocabularyProgress,
    learningStats: {
      totalLessonsCompleted: 0,
      totalWordsLearned: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalStudyDays: 0,
      lastStudyDate: null,
      totalTimeSpent: 0
    }
  })

  return newProgress.save()
}

export const UserProgress = mongoose.model<IUserProgress, IUserProgressModel>('UserProgress', userProgressSchema)

export default UserProgress
