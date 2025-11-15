import mongoose from 'mongoose'
import Enrollment from '~/models/schemas/Enrollment.schema'
import Class from '~/models/schemas/Class.schema'

export const enrollmentsService = {
  // Lấy lịch học của user, với filter period
  getMySchedule: async (studentId: mongoose.Types.ObjectId) => {
    try {
      // Bước 1: Tìm tất cả enrollments 'enrolled' của student (tất cả classes)
      const enrollments = await Enrollment.find({
        studentId: studentId,
        status: 'enrolled'
      })
        .select('classId')
        .lean()

      if (enrollments.length === 0) {
        return [] // Không enroll class nào → Trả array rỗng
      }

      // Bước 2: Loop qua từng classId, gọi model method để lấy schedule chi tiết
      const schedules: any[] = []
      for (const enrollment of enrollments) {
        try {
          const classSchedule = await Class.getDetailedScheduleForStudent(enrollment.classId, studentId)
          schedules.push(classSchedule)
        } catch (error: any) {
          console.warn(`Lỗi khi lấy schedule cho class ${enrollment.classId}: ${error.message}`)
          // Skip class lỗi, không break toàn bộ (graceful degradation)
        }
      }

      // Bước 3: Sắp xếp schedules theo startDate (để UI dễ đọc, e.g., sắp theo thời gian bắt đầu)
      schedules.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

      return schedules
    } catch (error) {
      throw new Error(`Lỗi khi lấy lịch học: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
