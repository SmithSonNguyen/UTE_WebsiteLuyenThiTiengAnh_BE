import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IMessage extends Document {
  roomId: string // "[smallerId]_[largerId]" - sorted ObjectId strings
  senderId: mongoose.Types.ObjectId
  receiverId: mongoose.Types.ObjectId
  content: string
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

// Index để query nhanh theo roomId + createdAt
MessageSchema.index({ roomId: 1, createdAt: -1 })
// Index để đếm unread nhanh
MessageSchema.index({ receiverId: 1, isRead: 1 })

// Helper static: Tạo roomId chuẩn từ 2 userId (sort để đảm bảo unique)
MessageSchema.statics.createRoomId = (userIdA: string, userIdB: string): string => {
  return [userIdA.toString(), userIdB.toString()].sort().join('_')
}

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema)

export default Message
