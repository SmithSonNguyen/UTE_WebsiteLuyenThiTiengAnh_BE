import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IAttendance {
  sessionDate: Date
  status: 'present' | 'absent'
}

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId
  classId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId // For easier querying
  enrollmentDate: Date
  status: 'enrolled' | 'completed' | 'dropped' | 'pending'
  progress: {
    sessionsAttended: number
    totalSessions: number
  }
  attendance: IAttendance[]
  paymentStatus: 'pending' | 'paid' | 'refunded'
  paymentInfo?: {
    amount: number
    paymentDate?: Date
    transactionId?: string
  }
  createdAt: Date
  updatedAt: Date
  calculateAttendance(): void
}

const enrollmentSchema: Schema<IEnrollment> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['enrolled', 'completed', 'dropped', 'pending'],
      default: 'pending'
    },
    progress: {
      sessionsAttended: { type: Number, default: 0, min: 0 },
      totalSessions: { type: Number, required: true, min: 1 }
    },
    attendance: [
      {
        sessionDate: { type: Date, required: true },
        status: {
          type: String,
          enum: ['present', 'absent'],
          required: true
        }
      }
    ],
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentInfo: {
      amount: { type: Number },
      paymentDate: { type: Date },
      transactionId: { type: String }
    }
  },
  { timestamps: true }
)

// Compound indexes
enrollmentSchema.index({ studentId: 1, status: 1 })
enrollmentSchema.index({ classId: 1, status: 1 })
enrollmentSchema.index({ courseId: 1, status: 1 })
enrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true }) // Prevent duplicate enrollments
enrollmentSchema.index({ studentId: 1, 'attendance.sessionDate': 1 }) // Index for attendance queries

// Virtual for completion percentage calculation
enrollmentSchema.virtual('progress.completionPercentage').get(function () {
  return this.progress.totalSessions > 0
    ? Math.round((this.progress.sessionsAttended / this.progress.totalSessions) * 100)
    : 0
})

// Method to automatically calculate attendance
enrollmentSchema.methods.calculateAttendance = function () {
  this.progress.sessionsAttended = this.attendance.filter((a: IAttendance) => a.status === 'present').length
}

// Pre-save hook for automatic calculation and validation
enrollmentSchema.pre('save', function (next) {
  this.calculateAttendance()

  if (this.progress.sessionsAttended > this.progress.totalSessions) {
    next(new Error('Sessions attended cannot exceed total sessions'))
  }
  next()
})

export const Enrollment: Model<IEnrollment> = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema)

export default Enrollment
