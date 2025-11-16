import mongoose, { Schema, Document, Model } from 'mongoose'

// Interfaces for type safety
interface IOriginalSession {
  classId: mongoose.Types.ObjectId
  sessionNumber: number
  date: Date
  attendanceId?: mongoose.Types.ObjectId
}

interface IMakeupSlot {
  classId: mongoose.Types.ObjectId
  sessionNumber: number
  date: Date
  time: string
  instructorId: mongoose.Types.ObjectId
}

export interface IMakeupRequest extends Document {
  userId: mongoose.Types.ObjectId
  originalSession: IOriginalSession
  makeupSlot: IMakeupSlot
  status: 'pending' | 'confirmed'
  registeredAt: Date
  confirmedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const makeupRequestSchema: Schema<IMakeupRequest> = new Schema(
  {
    // Thông tin người dùng đăng ký
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true // Để query nhanh theo user
    },
    // Buổi học gốc bị miss (người dùng vắng)
    originalSession: {
      classId: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        required: true
      },
      sessionNumber: {
        type: Number,
        required: true,
        min: 1
      },
      date: {
        type: Schema.Types.Date,
        required: true
      },
      attendanceId: {
        // ID của record điểm danh để update sau
        type: Schema.Types.ObjectId,
        ref: 'Attendance',
        required: false
      }
    },
    // Buổi học bù được chọn
    makeupSlot: {
      classId: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        required: true
      },
      sessionNumber: {
        type: Number,
        required: true,
        min: 1
      },
      date: {
        type: Schema.Types.Date,
        required: true
      },
      time: {
        type: String, // e.g., "18:00 - 20:00"
        required: true
      },
      instructorId: {
        type: Schema.Types.ObjectId,
        ref: 'Instructor',
        required: true
      }
    },
    // Trạng thái yêu cầu
    status: {
      type: String,
      enum: ['pending', 'confirmed'],
      default: 'pending'
    },
    // Thời gian
    registeredAt: {
      type: Schema.Types.Date,
      default: Date.now
    },
    confirmedAt: {
      type: Schema.Types.Date,
      required: false
    },
    // Ghi chú thêm (tùy chọn)
    notes: {
      type: String,
      maxlength: 500,
      required: false
    }
  },
  {
    timestamps: true // Tự động thêm createdAt/updatedAt nếu chưa có
  }
)

// Index để query hiệu quả
makeupRequestSchema.index({ userId: 1, status: 1 })
makeupRequestSchema.index({ 'originalSession.classId': 1, 'originalSession.sessionNumber': 1 })
makeupRequestSchema.index({ 'makeupSlot.classId': 1, date: 1 })

// Middleware để update updatedAt
makeupRequestSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

// Type-safe model
const MakeupRequest: Model<IMakeupRequest> = mongoose.model<IMakeupRequest>('MakeupRequest', makeupRequestSchema)

export default MakeupRequest
