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

      // Tạo date object từ string YYYY-MM-DD ở UTC (đầu ngày)
      const [year, month, day] = sessionDate.split('-').map(Number)
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)) // Fix: Sử dụng Date.UTC

      const attendance = await Attendance.findOne({
        classId: new mongoose.Types.ObjectId(classId),
        sessionDate: date
      })

      if (!attendance) {
        // Nếu chưa có điểm danh cho ngày này, tạo mới với danh sách sinh viên
        const { students } = await this.getClassStudents(classId)

        const newAttendance = new Attendance({
          classId: new mongoose.Types.ObjectId(classId),
          sessionDate: date,
          instructorId: new mongoose.Types.ObjectId(instructorId),
          records: students.map((student) => ({
            studentId: student._id,
            isPresent: false,
            note: '',
            markedAt: new Date(), // Giữ nguyên: markedAt dùng thời gian hiện tại local/UTC tùy server
            markedBy: new mongoose.Types.ObjectId(instructorId)
          })),
          status: 'draft'
        })

        await newAttendance.save()
        return newAttendance
      }

      return attendance
    } catch (error) {
      throw new Error(`Lấy điểm danh thất bại: ${(error as Error).message}`)
    }
  }

  // Lưu điểm danh
  async saveAttendance(
    classId: string,
    sessionDate: string,
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

      // Tạo date object từ string YYYY-MM-DD ở UTC (đầu ngày)
      const [year, month, day] = sessionDate.split('-').map(Number)
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)) // Fix: Sử dụng Date.UTC

      // Tìm attendance hiện tại hoặc tạo mới
      let attendance = await Attendance.findOne({
        classId: new mongoose.Types.ObjectId(classId),
        sessionDate: date
      })

      if (!attendance) {
        attendance = new Attendance({
          classId: new mongoose.Types.ObjectId(classId),
          sessionDate: date,
          instructorId: new mongoose.Types.ObjectId(instructorId),
          records: [],
          status: 'draft'
        })
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
}

const attendanceService = new AttendanceService()
export default attendanceService
