import mongoose, { Document, Schema, Model, Types } from 'mongoose'
import Enrollment from './Enrollment.schema'
import MakeupRequest from './MakeupRequest.schema'

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
  getDetailedScheduleForStudent(classId: mongoose.Types.ObjectId, studentId: mongoose.Types.ObjectId): Promise<any>
  getSessionNumberByDate(classId: mongoose.Types.ObjectId, sessionDateStr: string): Promise<number>
  getAvailableMakeupSlotsForSession(
    studentId: mongoose.Types.ObjectId,
    originalClassId: mongoose.Types.ObjectId,
    sessionNumber: number
  ): Promise<{
    slots: Array<{
      classId: mongoose.Types.ObjectId
      classCode: string
      sessionNumber: number
      date: Date
      time: string
      instructorId: mongoose.Types.ObjectId
      instructorName?: string // Assuming User has 'name' field
    }>
    remainingChanges: number
  }>
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

// Static method cập nhật: Lấy thời khóa biểu chi tiết cho một học viên trong lớp
classSchema.statics.getDetailedScheduleForStudent = async function (
  classId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId
): Promise<any> {
  try {
    const cls = await this.findById(classId)
      .populate('courseId', '_id title level description') // Populate tên course và level
      .populate('instructor', 'instructorInfo profile') // Populate tên và email giảng viên

    if (!cls || !['scheduled', 'ongoing'].includes(cls.status)) {
      throw new Error('Class không tồn tại hoặc không hoạt động')
    }

    // Lấy enrollment của student cho class này (để confirm enrolled)
    const Enrollment = mongoose.model('Enrollment')
    const enrollment = await Enrollment.findOne({
      studentId,
      classId: cls._id,
      status: 'enrolled'
    })

    if (!enrollment) {
      throw new Error('Student chưa đăng ký class này')
    }

    // Lấy attendance records của student (từ Attendance collection)
    const Attendance = mongoose.model('Attendance')
    const studentAttendances = await Attendance.aggregate([
      { $match: { classId: cls._id } },
      { $unwind: '$records' },
      { $match: { 'records.studentId': studentId } },
      {
        $project: {
          sessionNumber: 1,
          sessionDate: 1,
          isPresent: '$records.isPresent',
          notes: '$records.notes' // Optional: Để hiển thị notes nếu có
        }
      }
    ])

    // Map để tra cứu nhanh: sessionNumber -> {isPresent, notes}
    const attendanceMap = new Map<number, { isPresent: boolean; notes?: string }>()
    studentAttendances.forEach((att) => {
      attendanceMap.set(att.sessionNumber, { isPresent: att.isPresent, notes: att.notes })
    })
    // Format thời khóa biểu chi tiết
    const { schedule } = cls
    const { days, startTime, endTime, startDate, endDate: originalEndDate, durationWeeks } = schedule
    const daysVN = (cls as any).schedule.daysVN // Sử dụng virtual daysVN cho tên ngày tiếng Việt

    // Tính endDate nếu chưa có
    let effectiveEndDate = originalEndDate
    if (!effectiveEndDate && durationWeeks) {
      effectiveEndDate = new Date(startDate)
      effectiveEndDate.setDate(startDate.getDate() + durationWeeks * 7 - 1)
    }
    if (!effectiveEndDate) {
      throw new Error(`Không thể xác định endDate cho class ${cls.classCode}`)
    }

    // Map ngày tiếng Anh sang index
    const dayIndexMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    }

    // Generate sessions
    const sessions: any[] = []
    // Tìm ngày đầu tiên của tuần chứa startDate (để làm reference)
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() - startDate.getDay()) // Đặt về Sunday của tuần (JS getDay() Sunday=0)

    // Loop qua từng tuần cho đến endDate
    while (weekStart <= effectiveEndDate) {
      // Với mỗi tuần, tính ngày cho từng target day trong 'days'
      days.forEach((day: string, dayIndex: number) => {
        const targetDayOffset = dayIndexMap[day]
        const sessionDate = new Date(weekStart)
        sessionDate.setDate(weekStart.getDate() + targetDayOffset) // Thêm offset để đến ngày target

        // Chỉ push nếu sessionDate >= startDate và <= endDate
        if (sessionDate >= startDate && sessionDate <= effectiveEndDate) {
          const dayVN = daysVN[dayIndex]
          const dateStr = sessionDate.toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: '2-digit',
            year: 'numeric'
          })
          const dateLabel = `${dayVN} ngày ${dateStr}`

          sessions.push({
            dayVN,
            fullDate: dateStr,
            dateLabel,
            isToday: sessionDate.toDateString() === new Date().toDateString()
          })
        }
      })

      // Chuyển sang tuần sau
      weekStart.setDate(weekStart.getDate() + 7)
    }

    // Sắp xếp sessions theo ngày và thêm sessionNumber
    sessions.sort(
      (a, b) =>
        new Date(a.fullDate.split('/').reverse().join('-')).getTime() -
        new Date(b.fullDate.split('/').reverse().join('-')).getTime()
    )
    sessions.forEach((session, index) => {
      session.sessionNumber = index + 1
    })

    // Cập nhật sessions với isAbsent và showMakeupButton (dựa trên attendanceMap)
    sessions.forEach((session) => {
      const sessionNum = session.sessionNumber
      const attRecord = attendanceMap.get(sessionNum)
      if (attRecord) {
        session.isPresent = attRecord.isPresent
        session.isAbsent = !attRecord.isPresent
        session.attendanceNotes = attRecord.notes || null
      } else {
        session.isAbsent = false // Chưa có record → chưa absent
        session.isPresent = null // Unknown
      }
      const sessionDate = new Date(session.fullDate.split('/').reverse().join('-'))
      session.showMakeupButton = session.isAbsent && sessionDate < new Date() // Chỉ show nút nếu past và absent
    })
    // Format dates cho classInfo
    const startDateStr = startDate.toLocaleDateString('vi-VN')
    const effectiveEndDateStr = effectiveEndDate.toLocaleDateString('vi-VN')

    // Info chung cho class (trả về 1 object)
    const classInfo = {
      classCode: cls.classCode,
      classId: cls._id,
      courseId: cls.courseId,
      instructor: cls.instructor,
      time: `${startTime} - ${endTime}`,
      startTime,
      endTime,
      daysVN,
      startDate: startDateStr,
      endDate: effectiveEndDateStr,
      sessionAttended: enrollment.progress.sessionsAttended,
      totalSessions: sessions.length,
      meetLink: schedule.meetLink,
      capacity: `${cls.capacity.currentStudents}/${cls.capacity.maxStudents}`,
      status: cls.status,
      sessions // Có thêm isAbsent, showMakeupButton, isPresent, attendanceNotes
    }

    return classInfo
  } catch (error) {
    throw new Error(`Lỗi khi lấy thời khóa biểu chi tiết: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Thêm vào Class model (models/Class.ts) - Static method để tính sessionNumber từ sessionDate
classSchema.statics.getSessionNumberByDate = async function (
  classId: mongoose.Types.ObjectId,
  sessionDateStr: string // Input: 'YYYY-MM-DD' (e.g., '2025-10-20')
): Promise<number> {
  try {
    // Lấy class để lấy schedule
    const cls = await this.findById(classId).select('schedule')
    if (!cls) {
      throw new Error('Class không tồn tại')
    }

    const { schedule } = cls
    const { days, startDate, endDate: originalEndDate, durationWeeks } = schedule
    const daysVN = (cls as any).schedule.daysVN // Virtual, không dùng ở đây

    // Tính effectiveEndDate
    let effectiveEndDate = originalEndDate
    if (!effectiveEndDate && durationWeeks) {
      effectiveEndDate = new Date(startDate)
      effectiveEndDate.setDate(startDate.getDate() + durationWeeks * 7 - 1)
    }
    if (!effectiveEndDate) {
      throw new Error('Không thể xác định endDate cho class')
    }

    // Parse sessionDateStr thành Date
    const [year, month, day] = sessionDateStr.split('-').map(Number)
    const targetDate = new Date(year, month - 1, day)
    if (targetDate < startDate || targetDate > effectiveEndDate) {
      throw new Error('Ngày không nằm trong lịch lớp học')
    }

    // Map ngày tiếng Anh sang index (0=Sunday, 1=Monday, ...)
    const dayIndexMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    }

    // Generate tất cả sessions (giống logic trước, nhưng không cần attendance)
    const sessions: any[] = []
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() - startDate.getDay()) // Sunday của tuần đầu

    while (weekStart <= effectiveEndDate) {
      days.forEach((day: string, dayIndex: number) => {
        const targetDayOffset = dayIndexMap[day]
        const sessionDate = new Date(weekStart)
        sessionDate.setDate(weekStart.getDate() + targetDayOffset)

        if (sessionDate >= startDate && sessionDate <= effectiveEndDate) {
          const dateStr = sessionDate.toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: '2-digit',
            year: 'numeric'
          })
          const sessionDateKey = sessionDate.toISOString().split('T')[0] // 'YYYY-MM-DD'

          sessions.push({
            sessionDateKey,
            dateStr,
            sessionDate // Date object để sort
          })
        }
      })
      weekStart.setDate(weekStart.getDate() + 7)
    }

    // Sort theo thời gian và tìm index của targetDate (sessionNumber = index + 1)
    sessions.sort((a, b) => a.sessionDate - b.sessionDate)
    const targetIndex = sessions.findIndex((s) => s.sessionDateKey === sessionDateStr)
    if (targetIndex === -1) {
      throw new Error('Ngày không phải là ngày học hợp lệ')
    }

    return targetIndex + 1 // sessionNumber bắt đầu từ 1
  } catch (error) {
    throw new Error(`Lỗi tính sessionNumber: ${error instanceof Error ? error.message : String(error)}`)
  }
}

classSchema.statics.getAvailableMakeupSlotsForSession = async function (
  studentId: mongoose.Types.ObjectId,
  originalClassId: mongoose.Types.ObjectId,
  sessionNumber: number
) {
  try {
    const now = new Date() // Current date
    // Step 1: Validate original class and get courseId
    const originalClass = await this.findById(originalClassId)
      .populate({
        path: 'courseId',
        select: '_id title level' // Minimal populate
      })
      .select('courseId schedule status')

    if (!originalClass) {
      throw new Error('Original class not found')
    }

    if (!['ongoing', 'scheduled'].includes(originalClass.status)) {
      throw new Error('Original class is not active')
    }

    const courseId = originalClass.courseId._id

    // Step 2: Get enrollment for the student in the original class
    const enrollment = await Enrollment.findOne({
      studentId,
      classId: originalClassId,
      status: 'enrolled'
    }).select('makeupChangesCount')

    if (!enrollment) {
      throw new Error('Student is not enrolled in the original class')
    }

    // Step 3: Calculate remaining makeup changes
    const existingMakeups = await MakeupRequest.countDocuments({
      userId: studentId,
      'originalSession.classId': originalClassId,
      status: { $in: ['pending', 'confirmed'] }
    })

    const remainingChanges = Math.max(0, enrollment.makeupChangesCount - existingMakeups)

    if (remainingChanges <= 0) {
      return { slots: [], remainingChanges: 0 }
    }

    // Step 4: Find candidate classes (same course, different class, active, with available capacity)
    const candidateClasses = await this.find({
      _id: { $ne: originalClassId },
      courseId,
      status: { $in: ['ongoing', 'scheduled'] }
    })
      .populate('instructor', 'profile') // Assuming User schema has 'name' field for display
      .select('classCode _id instructor schedule')

    // Step 5: For each candidate class, compute the date for the matching sessionNumber
    const slots: Array<{
      classId: Types.ObjectId
      classCode: string
      sessionNumber: number
      date: Date
      time: string
      instructorId: Types.ObjectId
      instructorName?: string
    }> = []

    const dayIndexMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    }

    for (const cls of candidateClasses) {
      try {
        const { schedule } = cls
        const { days, startTime, endTime, startDate, endDate: originalEndDate, durationWeeks } = schedule

        // Compute effectiveEndDate
        let effectiveEndDate = originalEndDate
        if (!effectiveEndDate && durationWeeks) {
          effectiveEndDate = new Date(startDate)
          effectiveEndDate.setDate(startDate.getDate() + durationWeeks * 7 - 1)
        }
        if (!effectiveEndDate) {
          continue // Cannot determine end date
        }

        if (effectiveEndDate <= now) {
          continue // Class has ended
        }

        // Generate sessions sequentially to find the date for exact sessionNumber
        const weekStart = new Date(startDate)
        weekStart.setDate(startDate.getDate() - startDate.getDay()) // Align to Sunday of start week

        let currentSessionNum = 1
        let targetDate: Date | null = null

        while (weekStart <= effectiveEndDate) {
          for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
            const day = days[dayIndex]
            const targetDayOffset = dayIndexMap[day]
            const sessionDate = new Date(weekStart)
            sessionDate.setDate(weekStart.getDate() + targetDayOffset)

            if (sessionDate >= startDate && sessionDate <= effectiveEndDate) {
              if (currentSessionNum === sessionNumber) {
                targetDate = new Date(sessionDate) // Clone date
                break
              }
              currentSessionNum++
            }
          }

          if (targetDate) {
            break
          }

          // Move to next week
          weekStart.setDate(weekStart.getDate() + 7)
        }

        if (!targetDate || targetDate <= now) {
          continue // No matching session or it's in the past
        }

        // Valid slot found
        const time = `${startTime} - ${endTime}`
        slots.push({
          classId: cls._id,
          classCode: cls.classCode,
          sessionNumber,
          date: targetDate,
          time,
          instructorId: cls.instructor._id,
          instructorName: (cls.instructor as any).profile.lastname + ' ' + (cls.instructor as any).profile.firstname // Safe access after populate
        })
      } catch (error) {
        console.error(`Error processing class ${cls.classCode}:`, error)
        // Skip this class
      }
    }

    // Step 6: Sort slots by date (earliest first)
    slots.sort((a, b) => a.date.getTime() - b.date.getTime())

    return { slots, remainingChanges }
  } catch (error) {
    throw new Error(`Error fetching available makeup slots: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const Class: IClassModel = mongoose.model<IClass, IClassModel>('Class', classSchema)

export default Class
