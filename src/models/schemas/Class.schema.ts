import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IClass extends Document {
  courseId: mongoose.Types.ObjectId
  classCode: string // Mã lớp tự động: B001, I001, A001
  classId: string
  instructor: mongoose.Types.ObjectId
  schedule: {
    // Chỉ cho live-meet classes
    days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[]
    meetLink: string
    startTime: string // e.g., '19:00' (HH:MM format)
    endTime: string // e.g., '20:00' (HH:MM format)
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

interface IClassModel extends Model<IClass> {
  findByLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<IClass[]>
  getNextClassCode(courseLevel: 'beginner' | 'intermediate' | 'advanced'): Promise<string>
}

const classSchema: Schema<IClass> = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    classCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    classId: { type: String, required: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schedule: {
      days: [
        {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true
        }
      ],
      meetLink: { type: String, required: true },
      startTime: { type: String, required: true }, // e.g., '19:00'
      endTime: { type: String, required: true }, // e.g., '20:00'
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
classSchema.pre('save', async function (next) {
  try {
    // Validation checks
    if (this.schedule.endDate && this.schedule.endDate <= this.schedule.startDate) {
      return next(new Error('End date must be after start date'))
    }
    if (this.capacity.currentStudents > this.capacity.maxStudents) {
      return next(new Error('Current students cannot exceed max students'))
    }

    // Auto-generate classCode if it's a new document
    if (this.isNew && !this.classCode) {
      const Course = mongoose.model('Course')
      const course = await Course.findById(this.courseId)

      if (!course) {
        return next(new Error('Course not found'))
      }

      // Generate class code based on course level
      const levelPrefix: Record<string, string> = {
        beginner: 'B',
        intermediate: 'I',
        advanced: 'A'
      }

      const prefix = levelPrefix[course.level as string]
      if (!prefix) {
        return next(new Error('Invalid course level'))
      }

      // Find the highest existing class code with this prefix
      const lastClass = await mongoose
        .model('Class')
        .findOne({ classCode: new RegExp(`^${prefix}\\d+$`) })
        .sort({ classCode: -1 })
        .exec()

      let nextNumber = 1
      if (lastClass && lastClass.classCode) {
        const lastNumber = parseInt(lastClass.classCode.substring(1))
        nextNumber = lastNumber + 1
      }

      // Format: B001, I001, A001, etc.
      this.classCode = `${prefix}${nextNumber.toString().padStart(3, '0')}`
    }

    next()
  } catch (error) {
    next(error as Error)
  }
})

// Virtual để lấy days tiếng Việt
classSchema.virtual('schedule.daysVN').get(function () {
  const dayMap = {
    Monday: 'Thứ 2',
    Tuesday: 'Thứ 3',
    Wednesday: 'Thứ 4',
    Thursday: 'Thứ 5',
    Friday: 'Thứ 6',
    Saturday: 'Thứ 7',
    Sunday: 'Chủ nhật'
  }

  return this.schedule.days.map((day) => dayMap[day])
})

// Static methods
classSchema.statics.findByLevel = function (level: 'beginner' | 'intermediate' | 'advanced') {
  const levelPrefix: Record<string, string> = {
    beginner: 'B',
    intermediate: 'I',
    advanced: 'A'
  }

  const prefix = levelPrefix[level]
  return this.find({ classCode: new RegExp(`^${prefix}\\d+$`) })
}

classSchema.statics.getNextClassCode = async function (courseLevel: 'beginner' | 'intermediate' | 'advanced') {
  const levelPrefix: Record<string, string> = {
    beginner: 'B',
    intermediate: 'I',
    advanced: 'A'
  }

  const prefix = levelPrefix[courseLevel]
  const lastClass = await this.findOne({ classCode: new RegExp(`^${prefix}\\d+$`) })
    .sort({ classCode: -1 })
    .exec()

  let nextNumber = 1
  if (lastClass && lastClass.classCode) {
    const lastNumber = parseInt(lastClass.classCode.substring(1))
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

export const Class: IClassModel = mongoose.model<IClass, IClassModel>('Class', classSchema)

export default Class
