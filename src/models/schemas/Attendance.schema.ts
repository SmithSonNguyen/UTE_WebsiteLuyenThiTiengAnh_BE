import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IAttendanceRecord {
  studentId: mongoose.Types.ObjectId
  isPresent: boolean
  note?: string
  markedAt: Date
  markedBy: mongoose.Types.ObjectId // instructor who marked
}

export interface IAttendance extends Document {
  classId: mongoose.Types.ObjectId
  sessionDate: Date
  instructorId: mongoose.Types.ObjectId

  records: IAttendanceRecord[]

  statistics: {
    totalStudents: number
    presentCount: number
    absentCount: number
  }

  status: 'draft' | 'finalized' // draft: đang điểm danh, finalized: đã hoàn thành
  createdAt: Date
  updatedAt: Date
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPresent: {
    type: Boolean,
    required: true,
    default: false
  },
  note: {
    type: String,
    maxlength: 200,
    trim: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  markedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

const attendanceSchema: Schema<IAttendance> = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    sessionDate: {
      type: Date,
      required: true
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    records: [attendanceRecordSchema],

    statistics: {
      totalStudents: { type: Number, default: 0, min: 0 },
      presentCount: { type: Number, default: 0, min: 0 },
      absentCount: { type: Number, default: 0, min: 0 }
    },

    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft'
    }
  },
  {
    timestamps: true,
    collection: 'attendances'
  }
)

// Middleware để tự động tính statistics trước khi save
attendanceSchema.pre('save', function () {
  this.statistics.totalStudents = this.records.length
  this.statistics.presentCount = this.records.filter((r) => r.isPresent).length
  this.statistics.absentCount = this.statistics.totalStudents - this.statistics.presentCount
})

// Indexes để tối ưu query performance
attendanceSchema.index({ classId: 1, sessionDate: 1 }, { unique: true }) // Unique per class per day
attendanceSchema.index({ instructorId: 1, sessionDate: 1 }) // Query by instructor and date
attendanceSchema.index({ 'records.studentId': 1 }) // Query student attendance
attendanceSchema.index({ classId: 1, sessionNumber: 1 }) // Query by session number
attendanceSchema.index({ status: 1 }) // Query by status
attendanceSchema.index({ sessionDate: 1 }) // Query by date range

// Static methods
attendanceSchema.statics.findByClass = function (classId: mongoose.Types.ObjectId) {
  return this.find({ classId }).sort({ sessionDate: -1 })
}

attendanceSchema.statics.findByClassAndDate = function (classId: mongoose.Types.ObjectId, sessionDate: Date) {
  return this.findOne({ classId, sessionDate })
}

attendanceSchema.statics.getAttendanceHistory = function (
  classId: mongoose.Types.ObjectId,
  fromDate?: Date,
  toDate?: Date
) {
  const query: any = { classId }

  if (fromDate || toDate) {
    query.sessionDate = {}
    if (fromDate) query.sessionDate.$gte = fromDate
    if (toDate) query.sessionDate.$lte = toDate
  }

  return this.find(query).sort({ sessionDate: -1 })
}

attendanceSchema.statics.getStudentAttendanceInClass = function (
  studentId: mongoose.Types.ObjectId,
  classId: mongoose.Types.ObjectId
) {
  return this.find(
    {
      classId,
      'records.studentId': studentId
    },
    {
      sessionDate: 1,
      'records.$': 1
    }
  ).sort({ sessionDate: 1 })
}

// Đếm số buổi sinh viên đã tham gia trong lớp
attendanceSchema.statics.countStudentAttendedSessions = function (
  studentId: mongoose.Types.ObjectId,
  classId: mongoose.Types.ObjectId
) {
  return this.countDocuments({
    classId,
    records: {
      $elemMatch: {
        studentId: studentId,
        isPresent: true
      }
    }
  })
}

// Đếm tổng số buổi học đã diễn ra trong lớp
attendanceSchema.statics.countTotalSessionsInClass = function (classId: mongoose.Types.ObjectId) {
  return this.countDocuments({ classId, status: 'finalized' })
}

// Lấy thống kê chi tiết của sinh viên trong lớp
attendanceSchema.statics.getStudentAttendanceStats = async function (
  studentId: mongoose.Types.ObjectId,
  classId: mongoose.Types.ObjectId
) {
  const attendedSessions = await this.countDocuments({
    classId,
    records: {
      $elemMatch: {
        studentId: studentId,
        isPresent: true
      }
    }
  })

  const totalSessions = await this.countDocuments({ classId, status: 'finalized' })

  const attendanceRecords = await this.find(
    {
      classId,
      'records.studentId': studentId
    },
    {
      sessionDate: 1,
      sessionNumber: 1,
      topic: 1,
      'records.$': 1
    }
  ).sort({ sessionDate: 1 })

  const absentSessions = totalSessions - attendedSessions
  const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0

  // Tính consecutive absences (số buổi nghỉ liên tiếp gần nhất)
  let consecutiveAbsences = 0
  for (let i = attendanceRecords.length - 1; i >= 0; i--) {
    const record = attendanceRecords[i].records[0]
    if (!record.isPresent) {
      consecutiveAbsences++
    } else {
      break
    }
  }

  return {
    studentId,
    classId,
    attendedSessions,
    absentSessions,
    totalSessions,
    attendanceRate,
    consecutiveAbsences,
    attendanceHistory: attendanceRecords.map((session: any) => ({
      sessionDate: session.sessionDate,
      sessionNumber: session.sessionNumber,
      topic: session.topic,
      isPresent: session.records[0].isPresent,
      note: session.records[0].note
    }))
  }
}

// Instance methods
attendanceSchema.methods.markStudent = function (
  studentId: mongoose.Types.ObjectId,
  isPresent: boolean,
  markedBy: mongoose.Types.ObjectId,
  note?: string
) {
  const existingRecord = this.records.find(
    (record: IAttendanceRecord) => record.studentId.toString() === studentId.toString()
  )

  if (existingRecord) {
    existingRecord.isPresent = isPresent
    existingRecord.note = note || ''
    existingRecord.markedAt = new Date()
    existingRecord.markedBy = markedBy
  } else {
    this.records.push({
      studentId,
      isPresent,
      note: note || '',
      markedAt: new Date(),
      markedBy
    })
  }
}

attendanceSchema.methods.finalizeAttendance = function () {
  this.status = 'finalized'
  return this.save()
}

attendanceSchema.methods.getAttendanceRate = function () {
  return this.statistics.attendanceRate
}

export const Attendance: Model<IAttendance> = mongoose.model<IAttendance>('Attendance', attendanceSchema)

export default Attendance
