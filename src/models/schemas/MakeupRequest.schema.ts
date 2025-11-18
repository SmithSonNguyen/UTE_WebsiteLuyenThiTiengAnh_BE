import mongoose, { Schema, Document, Model } from 'mongoose'

// Interfaces for type safety
interface IOriginalSession {
  classId: mongoose.Types.ObjectId
  sessionNumber: number
  date: Date
  attendanceId: mongoose.Types.ObjectId
}

interface IMakeupSlot {
  classId: mongoose.Types.ObjectId
  sessionNumber: number
  date: Date
  time: string
}

export interface IMakeupRequest extends Document {
  userId: mongoose.Types.ObjectId
  originalSession: IOriginalSession
  makeupSlot: IMakeupSlot
  status: 'scheduled' | 'completed'
  registeredAt: Date
  confirmedAt?: Date
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
        required: true
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
      }
    },
    // Trạng thái yêu cầu
    status: {
      type: String,
      enum: ['scheduled', 'completed'],
      default: 'scheduled'
    },
    // Thời gian
    registeredAt: {
      type: Schema.Types.Date,
      default: Date.now
    },
    confirmedAt: {
      type: Schema.Types.Date,
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

// Type-safe model
const MakeupRequest: Model<IMakeupRequest> = mongoose.model<IMakeupRequest>('MakeupRequest', makeupRequestSchema)

export default MakeupRequest
