import mongoose, { Document, Schema, Model } from 'mongoose'

// Định nghĩa interface cho profile
interface UserProfile {
  lastname: string
  firstname: string
  email: string
  gender?: string
  birthday: Date
  bio?: string
  avatar?: string
}

// Định nghĩa interface cho User (Document trong MongoDB)
export interface IUser extends Document {
  password: string
  isVerified: boolean
  isVerifiedForgot: boolean
  otp?: string | null
  otpExpiresAt?: Date | null
  profile: UserProfile
  createdAt: Date
  updatedAt: Date
}

// Định nghĩa Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isVerifiedForgot: { type: Boolean, default: false }, // Đánh dấu đã xác thực OTP quên mật khẩu
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    profile: {
      lastname: { type: String, required: true },
      firstname: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      gender: { type: String, default: '' }, // Giới tính
      birthday: { type: Date, required: true }, // Ngày sinh
      bio: { type: String, default: '' },
      avatar: { type: String, default: '' } // Đường dẫn ảnh đại diện
    }
  },
  { timestamps: true }
)

// Tạo model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema)

export default User
