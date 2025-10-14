import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IClass extends Document {
  courseId: mongoose.Types.ObjectId
  className: string
  instructor: mongoose.Types.ObjectId
  schedule: {
    // Chỉ cho live-meet classes
    days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[]
    time: string // e.g., '19:00' (HH:MM format)
    timezone: string // e.g., 'Asia/Ho_Chi_Minh'
    meetLink: string
    startDate: Date
    endDate?: Date
    durationWeeks?: number
  }
  capacity: {
    maxStudents: number
    currentStudents: number
  }
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const classSchema: Schema<IClass> = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    className: { type: String, required: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schedule: {
      days: [
        {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true
        }
      ],
      time: { type: String, required: true },
      timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
      meetLink: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      durationWeeks: { type: Number, min: 1 }
    },
    capacity: {
      maxStudents: { type: Number, required: true, min: 1 },
      currentStudents: { type: Number, default: 0, min: 0 }
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  },
  { timestamps: true }
)

// Indexes
classSchema.index({ courseId: 1, status: 1 })
classSchema.index({ instructor: 1, status: 1 })
classSchema.index({ 'schedule.startDate': 1, status: 1 })

// Validation: endDate must be after startDate
classSchema.pre('save', function (next) {
  if (this.schedule.endDate && this.schedule.endDate <= this.schedule.startDate) {
    next(new Error('End date must be after start date'))
  }
  if (this.capacity.currentStudents > this.capacity.maxStudents) {
    next(new Error('Current students cannot exceed max students'))
  }
  next()
})

export const Class: Model<IClass> = mongoose.model<IClass>('Class', classSchema)

export default Class