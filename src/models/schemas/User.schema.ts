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

interface InstructorInfo {
  position?: string
  specialization?: string
  experience?: string
  education?: string
  joinDate?: Date
  certificate?: { name: string; url: string }[]
}

// Định nghĩa interface cho User
export interface IUser extends Document {
  password: string
  isVerified: boolean
  isVerifiedForgot: boolean
  otp?: string | null
  otpExpiresAt?: Date | null
  profile: UserProfile
  instructorInfo: InstructorInfo
  role: 'guest' | 'instructor' | 'admin'
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
      avatar: {
        type: String,
        default: 'https://res.cloudinary.com/dfinxo4uj/image/upload/v1761221144/default_avatar_gidgqw.png'
      },
      linkSocial: { type: String, default: '' }
    },

    instructorInfo: {
      position: { type: String, default: '' },
      specialization: { type: String, default: '' },
      experience: { type: String, default: '' },
      education: { type: String, default: '' },
      joinDate: { type: Date, default: Date.now },
      certificate: { type: [{ name: String, url: String }], default: [] }
    },

    role: {
      type: String,
      enum: ['guest', 'instructor', 'admin'],
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
