import mongoose, { Document, Schema, Model } from 'mongoose'

// Định nghĩa interface cho profile
interface UserProfile {
  lastname: string
  firstname: string
  email: string
  gender?: string
  birthday: Date
  phone: string
  bio?: string
  avatar?: string
}

// Định nghĩa interface cho User
export interface IUser extends Document {
  password: string
  isVerified: boolean
  isVerifiedForgot: boolean
  otp?: string | null
  otpExpiresAt?: Date | null
  profile: UserProfile
  role: 'guest' | 'registered' | 'paid' | 'free'
  purchasedCourses: string[]
  wishList: string[]
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

// Định nghĩa Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isVerifiedForgot: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },

    profile: {
      lastname: { type: String, required: true },
      firstname: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      gender: { type: String, default: '' },
      birthday: { type: Date, required: true },
      phone: { type: String, default: '', match: [/^\+?[0-9]\d{1,14}$/, 'is not a valid phone number'] },
      bio: { type: String, default: '' },
      avatar: { type: String, default: '' }
    },

    role: {
      type: String,
      enum: ['guest', 'registered', 'paid', 'free'],
      default: 'guest'
    },

    purchasedCourses: [{ type: String }], // Khóa học đã mua
    wishList: [{ type: String }], // Khóa học muốn mua / gợi ý

    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null }
  },
  { timestamps: true }
)

// Middleware: tự động gán role theo purchasedCourses
UserSchema.pre<IUser>('save', function (next) {
  if (this.role !== 'guest') {
    if (this.purchasedCourses && this.purchasedCourses.length > 0) {
      this.role = 'paid'
    } else {
      this.role = 'free'
    }
  }
  next()
})

// Tạo model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema)

export default User
