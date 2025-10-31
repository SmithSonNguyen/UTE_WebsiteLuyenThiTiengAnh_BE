// models/schemas/Payment.schema.ts
import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId
  courseId?: mongoose.Types.ObjectId
  classId?: mongoose.Types.ObjectId
  enrollmentId?: mongoose.Types.ObjectId // Link đến enrollment sau khi tạo

  // Thông tin thanh toán
  amount: number
  currency: string
  paymentMethod: 'vnpay' | 'momo' | 'bank_transfer' | 'cash'

  // VNPay specific fields
  vnpay?: {
    vnp_TxnRef: string // Order ID
    vnp_TransactionNo?: string // VNPay transaction number
    vnp_BankCode?: string
    vnp_CardType?: string
    vnp_PayDate?: Date
    vnp_ResponseCode?: string
    vnp_SecureHash?: string
  }

  // Status tracking
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'

  // Metadata
  orderInfo: string
  ipAddress?: string
  returnUrl?: string

  // Timestamps cho từng giai đoạn
  createdAt: Date
  completedAt?: Date
  refundedAt?: Date

  // Notes và error handling
  notes?: string
  errorMessage?: string

  updatedAt: Date
}

const paymentSchema: Schema<IPayment> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      index: true
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment'
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND'
    },
    paymentMethod: {
      type: String,
      enum: ['vnpay', 'momo', 'bank_transfer', 'cash'],
      required: true
    },

    vnpay: {
      vnp_TxnRef: { type: String, unique: true, sparse: true },
      vnp_TransactionNo: { type: String },
      vnp_BankCode: { type: String },
      vnp_CardType: { type: String },
      vnp_PayDate: { type: Date },
      vnp_ResponseCode: { type: String },
      vnp_SecureHash: { type: String }
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      index: true
    },

    orderInfo: { type: String, required: true },
    ipAddress: { type: String },
    returnUrl: { type: String },

    completedAt: { type: Date },
    refundedAt: { type: Date },

    notes: { type: String },
    errorMessage: { type: String }
  },
  {
    timestamps: true
  }
)

// Indexes
paymentSchema.index({ userId: 1, status: 1 })
paymentSchema.index({ 'vnpay.vnp_TxnRef': 1 })
paymentSchema.index({ createdAt: -1 })

// Virtual để check xem payment có hợp lệ không
paymentSchema.virtual('isValid').get(function () {
  return this.status === 'completed' && this.completedAt != null
})

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema)
export default Payment
