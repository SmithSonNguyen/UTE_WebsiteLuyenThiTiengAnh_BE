import Attendance from '~/models/schemas/Attendance.schema'
import Enrollment from '~/models/schemas/Enrollment.schema'
import { Class } from '~/models/schemas/Class.schema'
import mongoose from 'mongoose'

interface IEnrollmentWithStudent {
  studentId: {
    _id: string
    profile: {
      firstname: string
      lastname: string
      email: string
      phone?: string
    }
  }
  enrollmentDate: Date
  progress: any
}

class AttendanceService {
  // Kiểm tra xem ngày được chọn có nằm trong lịch dạy của lớp không
  private async validateClassSchedule(classId: string, sessionDate: string) {
    const classInfo = await Class.findById(classId, 'schedule')
    if (!classInfo) {
      throw new Error('Class not found')
    }

    // Parse ngày được chọn
    const [year, month, day] = sessionDate.split('-').map(Number)
    const selectedDate = new Date(Date.UTC(year, month - 1, day))

    // Lấy thứ trong tuần (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = selectedDate.getUTCDay()

    // Mapping từ number sang string tiếng Anh và tiếng Việt
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayNamesVN = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

    const selectedDayName = dayNames[dayOfWeek]
    const selectedDayNameVN = dayNamesVN[dayOfWeek]

    // Kiểm tra xem thứ được chọn có trong lịch dạy không
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
    type ValidDay = (typeof validDays)[number]

    if (!classInfo.schedule.days.includes(selectedDayName as ValidDay)) {
      // Chuyển đổi lịch dạy sang tiếng Việt
      const scheduleDaysVN = classInfo.schedule.days.map((day: string) => {
        const dayIndex = dayNames.indexOf(day)
        return dayIndex !== -1 ? dayNamesVN[dayIndex] : day
      })

      throw new Error(
        `Lớp học không có lịch dạy vào ${selectedDayNameVN}. Lịch dạy của lớp vào: ${scheduleDaysVN.join(', ')}`
      )
    }

    // Kiểm tra xem ngày có nằm trong khoảng thời gian của khóa học không
    const startDate = new Date(classInfo.schedule.startDate)
    const endDate = classInfo.schedule.endDate ? new Date(classInfo.schedule.endDate) : null

    // So sánh chỉ phần ngày (không tính giờ)
    const selectedDateOnly = new Date(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate()
    )
    const startDateOnly = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())

    if (selectedDateOnly < startDateOnly) {
      throw new Error(
        `Ngày được chọn (${sessionDate}) trước ngày bắt đầu khóa học (${startDate.toISOString().split('T')[0]})`
      )
    }

    if (endDate) {
      const endDateOnly = new Date(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())

      if (selectedDateOnly > endDateOnly) {
        throw new Error(
          `Ngày được chọn (${sessionDate}) sau ngày kết thúc khóa học (${endDate.toISOString().split('T')[0]})`
        )
      }
    }

    return true
  }

  // Lấy danh sách sinh viên trong lớp (từ enrollment)
  async getClassStudents(classId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        throw new Error('Invalid class ID')
      }

      // Lấy thông tin lớp học
      const classInfo = await Class.findById(classId).populate('courseId', 'title level')
      if (!classInfo) {
        throw new Error('Class not found')
      }

      // Lấy danh sách sinh viên đã đăng ký và thanh toán
      const enrollments = await Enrollment.find({
        classId: new mongoose.Types.ObjectId(classId),
        status: { $in: ['enrolled', 'completed'] },
        paymentStatus: 'paid'
      }).populate('studentId', 'profile')

      const students = (enrollments as unknown as IEnrollmentWithStudent[]).map((enrollment) => ({
        _id: enrollment.studentId._id,
        studentId: enrollment.studentId._id,
        name: `${enrollment.studentId.profile.firstname} ${enrollment.studentId.profile.lastname}`,
        email: enrollment.studentId.profile.email,
        phone: enrollment.studentId.profile.phone || 'Chưa có',
        enrollmentDate: enrollment.enrollmentDate,
        progress: enrollment.progress
      }))

      const populatedClass = classInfo as any
      return {
        classInfo: {
          _id: classInfo._id,
          classCode: classInfo.classCode,
          courseTitle: populatedClass.courseId.title,
          level: populatedClass.courseId.level
        },
        students,
        totalStudents: students.length
      }
    } catch (error) {
      throw new Error(`Lấy danh sách sinh viên thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy điểm danh theo lớp và ngày
  async getAttendanceByDate(classId: string, sessionDate: string, instructorId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        throw new Error('Invalid class ID')
      }

      // Kiểm tra xem ngày được chọn có nằm trong lịch dạy của lớp không
      await this.validateClassSchedule(classId, sessionDate)

      // Tạo date object từ string YYYY-MM-DD ở UTC (đầu ngày)
      const [year, month, day] = sessionDate.split('-').map(Number)
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

      const attendance = await Attendance.findOne({
        classId: new mongoose.Types.ObjectId(classId),
        sessionDate: date
      })

      if (!attendance) {
        console.log('📝 [getAttendanceByDate] No existing attendance, creating new...')

        // ✅ FIX: Tính sessionNumber TRƯỚC KHI tạo attendance
        const ClassModel = mongoose.model('Class') as any
        const sessionNumber = await ClassModel.getSessionNumberByDate(new mongoose.Types.ObjectId(classId), sessionDate)

        console.log('📊 [getAttendanceByDate] Calculated sessionNumber:', sessionNumber)

        // Nếu chưa có điểm danh cho ngày này, tạo mới với danh sách sinh viên
        const { students } = await this.getClassStudents(classId)

        const newAttendance = new Attendance({
          classId: new mongoose.Types.ObjectId(classId),
          sessionNumber, // ✅ THÊM sessionNumber vào đây
          sessionDate: date,
          instructorId: new mongoose.Types.ObjectId(instructorId),
          records: students.map((student) => ({
            studentId: student._id,
            isPresent: false,
            note: '',
            markedAt: new Date(),
            markedBy: new mongoose.Types.ObjectId(instructorId)
          })),
          status: 'draft'
        })

        await newAttendance.save()
        console.log('✅ [getAttendanceByDate] Created new attendance with sessionNumber:', newAttendance.sessionNumber)

        return newAttendance
      }

      return attendance
    } catch (error) {
      throw new Error(`${(error as Error).message}`)
    }
  }

  // Lưu điểm danh (cập nhật với sessionNumber)
  async saveAttendance(
    classId: string,
    sessionDate: string, // 'YYYY-MM-DD'
    instructorId: string,
    attendanceData: Array<{
      studentId: string
      isPresent: boolean
      note?: string
    }>
  ) {
    try {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        throw new Error('Invalid class ID')
      }

      // Kiểm tra xem ngày được chọn có nằm trong lịch dạy của lớp không
      await this.validateClassSchedule(classId, sessionDate)

      // FIXED: Tính sessionNumber trước khi tạo attendance
      const ClassModel = mongoose.model('Class') as any
      const sessionNumber = await ClassModel.getSessionNumberByDate(
        new mongoose.Types.ObjectId(classId),
        sessionDate // 'YYYY-MM-DD'
      )

      // Tạo date object từ string YYYY-MM-DD ở UTC (đầu ngày)
      const [year, month, day] = sessionDate.split('-').map(Number)
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)) // Fix: Sử dụng Date.UTC

      // Tìm attendance hiện tại hoặc tạo mới
      let attendance = await Attendance.findOne({
        classId: new mongoose.Types.ObjectId(classId),
        sessionDate: date
      })

      console.log('📝 [saveAttendance] Session Number:', sessionNumber)

      if (!attendance) {
        attendance = new Attendance({
          classId: new mongoose.Types.ObjectId(classId),
          sessionNumber, // FIXED: Set sessionNumber tính từ hàm
          sessionDate: date,
          instructorId: new mongoose.Types.ObjectId(instructorId),
          records: [],
          status: 'draft'
        })
      } else {
        // Nếu update existing, cũng set sessionNumber nếu chưa có
        attendance.sessionNumber = sessionNumber
      }

      // Cập nhật records
      attendance.records = attendanceData.map((record) => ({
        studentId: new mongoose.Types.ObjectId(record.studentId),
        isPresent: record.isPresent,
        note: record.note || '',
        markedAt: new Date(), // Giữ nguyên
        markedBy: new mongoose.Types.ObjectId(instructorId)
      }))

      // Đánh dấu là finalized
      attendance.status = 'finalized'

      await attendance.save()

      // 🔄 Sync enrollment progress for all students in this class
      console.log('🔄 [saveAttendance] Syncing enrollment progress...')
      await this.syncEnrollmentProgress(classId)

      // Populate để trả về thông tin đầy đủ
      await attendance.populate([
        { path: 'records.studentId', select: 'profile' },
        { path: 'classId', select: 'classCode courseId' }
      ])

      return attendance
    } catch (error) {
      throw new Error(`Lưu điểm danh thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy lịch sử điểm danh của lớp
  async getAttendanceHistory(classId: string, fromDate?: string, toDate?: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        throw new Error('Invalid class ID')
      }

      interface QueryType {
        classId: mongoose.Types.ObjectId
        status: string
        sessionDate?: {
          $gte?: Date
          $lte?: Date
        }
      }

      const query: QueryType = {
        classId: new mongoose.Types.ObjectId(classId),
        status: 'finalized'
      }

      if (fromDate || toDate) {
        query.sessionDate = {}
        if (fromDate) {
          const [year, month, day] = fromDate.split('-').map(Number)
          const from = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)) // Fix: Sử dụng Date.UTC cho đầu ngày
          query.sessionDate.$gte = from
        }
        if (toDate) {
          const [year, month, day] = toDate.split('-').map(Number)
          const to = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)) // Fix: Sử dụng Date.UTC cho cuối ngày
          query.sessionDate.$lte = to
        }
      }

      const attendanceHistory = await Attendance.find(query)
        .populate([
          { path: 'records.studentId', select: 'profile' },
          { path: 'classId', select: 'classCode courseId' }
        ])
        .sort({ sessionDate: -1 })

      return attendanceHistory
    } catch (error) {
      throw new Error(`Lấy lịch sử điểm danh thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy tổng quan điểm danh của lớp
  async getClassAttendanceOverview(classId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        throw new Error('Invalid class ID')
      }

      const totalSessions = await Attendance.countDocuments({
        classId: new mongoose.Types.ObjectId(classId),
        status: 'finalized'
      })

      const attendanceStats = await Attendance.aggregate([
        { $match: { classId: new mongoose.Types.ObjectId(classId), status: 'finalized' } },
        { $unwind: '$records' },
        {
          $group: {
            _id: '$records.studentId',
            attendedSessions: { $sum: { $cond: ['$records.isPresent', 1, 0] } },
            totalSessions: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: '$student' },
        {
          $project: {
            studentId: '$_id',
            name: { $concat: ['$student.profile.firstname', ' ', '$student.profile.lastname'] },
            email: '$student.profile.email',
            attendedSessions: 1,
            totalSessions: 1,
            attendanceRate: {
              $cond: [
                { $gt: ['$totalSessions', 0] },
                { $multiply: [{ $divide: ['$attendedSessions', '$totalSessions'] }, 100] },
                0
              ]
            }
          }
        },
        { $sort: { attendanceRate: -1 } }
      ])

      return {
        totalSessions,
        studentsStats: attendanceStats
      }
    } catch (error) {
      throw new Error(`Lấy tổng quan điểm danh lớp thất bại: ${(error as Error).message}`)
    }
  }

  // 🔄 Sync enrollment progress cho tất cả sinh viên trong lớp
  private async syncEnrollmentProgress(classId: string) {
    try {
      const enrollments = await Enrollment.find({
        classId: new mongoose.Types.ObjectId(classId),
        status: { $in: ['enrolled', 'completed'] },
        paymentStatus: 'paid'
      })

      console.log(`📊 [syncEnrollmentProgress] Found ${enrollments.length} enrollments to sync`)

      // Sync attendance cho từng enrollment
      const syncPromises = enrollments.map(async (enrollment) => {
        try {
          const result = await enrollment.syncAttendanceFromRecords()
          console.log(`✅ Synced student ${enrollment.studentId}: ${result.sessionsAttended}`)
          return result
        } catch (error) {
          console.error(`❌ Failed to sync student ${enrollment.studentId}:`, error)
          return null
        }
      })

      const results = await Promise.allSettled(syncPromises)
      const successCount = results.filter((r) => r.status === 'fulfilled' && r.value !== null).length

      console.log(`✅ [syncEnrollmentProgress] Successfully synced ${successCount}/${enrollments.length} enrollments`)

      return {
        total: enrollments.length,
        synced: successCount,
        failed: enrollments.length - successCount
      }
    } catch (error) {
      console.error('❌ [syncEnrollmentProgress] Error:', error)
      throw new Error(`Sync enrollment progress failed: ${(error as Error).message}`)
    }
  }
}

const attendanceService = new AttendanceService()
export default attendanceService
