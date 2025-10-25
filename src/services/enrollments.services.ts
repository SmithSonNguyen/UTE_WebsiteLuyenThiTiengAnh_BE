import mongoose from 'mongoose'
import Enrollment from '~/models/schemas/Enrollment.schema'

export const enrollmentsService = {
  // Lấy lịch học của user, với filter period
  getMySchedule: async (userId: mongoose.Types.ObjectId, period: string = 'all') => {
    // Query enrollments của user, populate full info
    const enrollments = await Enrollment.find({
      studentId: userId,
      status: 'enrolled' // Chỉ enrolled
    })
      .populate({
        path: 'classId',
        select: 'classCode schedule instructor status capacity',
        populate: [
          { path: 'courseId', select: 'title level description resources' },
          { path: 'instructor', select: 'profile.firstname profile.lastname profile.email' }
        ]
      })
      //   .populate('courseId', 'name level') // Backup nếu cần
      .lean()
      .sort({ 'classId.schedule.startDate': 1 }) // Sort theo ngày bắt đầu

    // Filter theo period
    let filtered = enrollments
    if (period === 'week') {
      const now = new Date()
      const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000) // Đầu tuần
      filtered = enrollments.filter((e) => (e.classId as any).schedule.startDate >= weekStart)
    } else if (period === 'month') {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = enrollments.filter((e) => (e.classId as any).schedule.startDate >= monthStart)
    }

    return filtered
  }
}
