import { Class, IClass } from '~/models/schemas/Class.schema'
import Enrollment from '~/models/schemas/Enrollment.schema'
import mongoose from 'mongoose'

class ClassService {
  // Tạo lớp học mới
  async createClass(payload: Partial<IClass>) {
    try {
      const newClass = await Class.create(payload)
      return await newClass.populate([
        { path: 'courseId', select: 'title level description' },
        { path: 'instructor', select: 'name email' }
      ])
    } catch (error) {
      throw new Error(`Tạo lớp học thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy danh sách lớp học theo level
  async getClassesByLevel(level: 'beginner' | 'intermediate' | 'advanced') {
    try {
      const classes = await Class.findByLevel(level)
      return await Class.populate(classes, [
        { path: 'courseId', select: 'title level description' },
        { path: 'instructor', select: 'name email' }
      ])
    } catch (error) {
      throw new Error(`Lấy lớp học theo level thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy tất cả lớp học với pagination
  async getAllClasses(options: { page: number; limit: number; status?: string; courseId?: string }) {
    try {
      const { page, limit, status, courseId } = options
      const skip = (page - 1) * limit

      interface FilterOptions {
        status?: string
        courseId?: string
      }
      const filter: FilterOptions = {}
      if (status) {
        filter.status = status
      }
      if (courseId) {
        filter.courseId = courseId
      }

      const [classes, total] = await Promise.all([
        Class.find(filter)
          .populate([
            { path: 'courseId', select: 'title level description' },
            { path: 'instructor', select: 'name email' }
          ])
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Class.countDocuments(filter)
      ])

      return {
        classes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    } catch (error) {
      throw new Error(`Lấy danh sách lớp học thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy chi tiết lớp học
  async getClassDetail(classId: string) {
    try {
      const classDetail = await Class.findById(classId).populate([
        { path: 'courseId', select: 'title level description duration price' },
        { path: 'instructor', select: 'name email avatar bio' }
      ])
      return classDetail
    } catch (error) {
      throw new Error(`Lấy chi tiết lớp học thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy thông tin lớp học cho học viên (bao gồm enrollment status)
  async getClassForStudent(classId: string, studentId?: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        throw new Error('Invalid class ID')
      }

      // Lấy thông tin lớp học cơ bản
      const classDetail = await Class.findById(classId)
        .populate([
          {
            path: 'courseId',
            select:
              'title level description duration price discountPrice discountPercent type rating studentsCount resources'
          },
          {
            path: 'instructor',
            select: 'profile'
          }
        ])
        .lean()

      if (!classDetail) {
        throw new Error('Class not found')
      }

      let enrollmentInfo = null
      let hasAccess = false
      // Nếu có studentId, kiểm tra enrollment status
      if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
        const enrollment = await Enrollment.findOne({
          studentId: new mongoose.Types.ObjectId(studentId),
          classId: new mongoose.Types.ObjectId(classId),
          status: { $in: ['enrolled', 'completed'] },
          paymentStatus: 'paid'
        }).lean()

        if (enrollment) {
          enrollmentInfo = {
            enrollmentId: enrollment._id,
            enrollmentDate: enrollment.enrollmentDate,
            status: enrollment.status,
            progress: enrollment.progress,
            paymentInfo: enrollment.paymentInfo
          }
          hasAccess = true
        }
      }

      // Tính toán thông tin bổ sung cho lớp học
      const currentDate = new Date()
      const startDate = new Date(classDetail.schedule.startDate!)
      const durationWeeks = classDetail.schedule.durationWeeks || 0

      // Tính ngày kết thúc
      // Tính ngày kết thúc
      let effectiveEndDate: Date

      if (classDetail.schedule.endDate) {
        // Nếu DB đã có endDate → dùng luôn
        effectiveEndDate = new Date(classDetail.schedule.endDate)
      } else {
        // Nếu chưa có endDate → tính theo durationWeeks
        effectiveEndDate = new Date(startDate)
        effectiveEndDate.setDate(startDate.getDate() + durationWeeks * 7 - 1)
      }

      // Ghi đè vào schedule trước khi return
      classDetail.schedule.endDate = effectiveEndDate

      // // Tính số buổi học
      // const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      // const totalSessions = totalWeeks * classDetail.schedule.days.length

      // // Status của lớp học
      // let classStatus: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' = classDetail.status
      // if (currentDate < startDate) {
      //   classStatus = 'scheduled'
      // } else if (currentDate > endDate) {
      //   classStatus = 'completed'
      // } else {
      //   classStatus = 'ongoing'
      // }

      // Tính số chỗ còn lại
      // const spotsLeft = classDetail.capacity.maxStudents - classDetail.capacity.currentStudents

      return {
        ...classDetail,

        enrollment: enrollmentInfo,
        hasAccess
        // canEnroll: !enrollmentInfo && spotsLeft > 0 && currentDate < startDate,
        // status: {
        //   sessionsAttended: enrollmentInfo?.progress.sessionsAttended || 0,
        //   totalSessions,
        //   totalWeeks,
        //   spotsLeft,
        //   progressPercent: enrollmentInfo
        //     ? Math.round((enrollmentInfo.progress.sessionsAttended / enrollmentInfo.progress.totalSessions) * 100)
        //     : 0
        // },
        // computedStatus: classStatus,
        // timeInfo: {
        //   isUpcoming: currentDate < startDate,
        //   isOngoing: currentDate >= startDate && currentDate <= endDate,
        //   isCompleted: currentDate > endDate,
        //   daysUntilStart:
        //     currentDate < startDate
        //       ? Math.ceil((startDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000))
        //       : 0
        // }
      }
    } catch (error) {
      throw new Error(`Lấy thông tin lớp học cho học viên thất bại: ${(error as Error).message}`)
    }
  }

  // Cập nhật lớp học
  async updateClass(classId: string, payload: Partial<IClass>) {
    try {
      const updatedClass = await Class.findByIdAndUpdate(classId, payload, {
        new: true,
        runValidators: true
      }).populate([
        { path: 'courseId', select: 'title level description' },
        { path: 'instructor', select: 'name email' }
      ])

      if (!updatedClass) {
        throw new Error('Không tìm thấy lớp học')
      }

      return updatedClass
    } catch (error) {
      throw new Error(`Cập nhật lớp học thất bại: ${(error as Error).message}`)
    }
  }

  // Xóa lớp học
  async deleteClass(classId: string) {
    try {
      const deletedClass = await Class.findByIdAndDelete(classId)
      if (!deletedClass) {
        throw new Error('Không tìm thấy lớp học')
      }
      return deletedClass
    } catch (error) {
      throw new Error(`Xóa lớp học thất bại: ${(error as Error).message}`)
    }
  }

  // Đăng ký vào lớp học
  async enrollClass(classId: string, userId: string) {
    try {
      const classInfo = await Class.findById(classId)
      if (!classInfo) {
        throw new Error('Không tìm thấy lớp học')
      }

      if (classInfo.capacity.currentStudents >= classInfo.capacity.maxStudents) {
        throw new Error('Lớp học đã đầy')
      }

      // TODO: Add logic to associate userId with class
      console.log(`Enrolling user ${userId} to class ${classId}`)

      // Tăng số lượng học viên hiện tại
      const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { $inc: { 'capacity.currentStudents': 1 } },
        { new: true }
      )

      return updatedClass
    } catch (error) {
      throw new Error(`Đăng ký lớp học thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy mã lớp học tiếp theo
  async getNextClassCode(level: 'beginner' | 'intermediate' | 'advanced') {
    try {
      return await Class.getNextClassCode(level)
    } catch (error) {
      throw new Error(`Lấy mã lớp học tiếp theo thất bại: ${(error as Error).message}`)
    }
  }

  // Tìm lớp học theo mã lớp
  async getClassByCode(classCode: string) {
    try {
      const classInfo = await Class.findOne({ classCode }).populate([
        { path: 'courseId', select: 'title level description' },
        { path: 'instructor', select: 'name email' }
      ])
      return classInfo
    } catch (error) {
      throw new Error(`Tìm lớp học theo mã thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy danh sách lớp học sắp khai giảng của khóa học
  async getUpcomingClassesByCourse(courseId: string) {
    try {
      const currentDate = new Date()
      // Full query
      const upcomingClasses = await Class.find({
        courseId,
        status: { $in: ['scheduled', 'ongoing'] },
        'schedule.startDate': { $gte: currentDate }
      })
        .populate([
          { path: 'courseId', select: 'title level description type price' },
          { path: 'instructor', select: 'name email' }
        ])
        .sort({ 'schedule.startDate': 1 })
        .lean()

      return upcomingClasses
    } catch (error) {
      console.error('Debug error:', error)
      throw new Error(`Lấy lớp học sắp khai giảng thất bại: ${(error as Error).message}`)
    }
  }
  // Lấy danh sách lớp học sắp khai giảng theo level
  async getUpcomingClassesByLevel(level: 'beginner' | 'intermediate' | 'advanced') {
    try {
      const currentDate = new Date()

      const upcomingClasses = await Class.find({
        status: { $in: ['scheduled', 'ongoing'] },
        'schedule.startDate': { $gte: currentDate }
      })
        .populate([
          { path: 'courseId', select: 'title level description type price' },
          { path: 'instructor', select: 'name email' }
        ])
        .sort({ 'schedule.startDate': 1 })
        .lean()

      // Filter theo level của course
      interface PopulatedClass extends IClass {
        courseId: {
          level: string
          title: string
          description: string
          type: string
          price: number
        }
      }
      const filteredClasses = (upcomingClasses as PopulatedClass[]).filter(
        (classItem) => classItem.courseId?.level === level
      )

      return filteredClasses
    } catch (error) {
      throw new Error(`Lấy lớp học sắp khai giảng theo level thất bại: ${(error as Error).message}`)
    }
  }

  //Cập nhật link lớp học
  async updateClassLink(classId: string, meetLink: string) {
    try {
      const updatedClass = await Class.findByIdAndUpdate(classId, { 'schedule.meetLink': meetLink }, { new: true })
      return { meetLink: updatedClass?.schedule.meetLink }
    } catch (error) {
      throw new Error(`Cập nhật link lớp học thất bại: ${(error as Error).message}`)
    }
  }

  // Lấy tất cả lịch khai giảng cho các khóa học live-meet
  async getAllUpcomingLiveClasses() {
    try {
      const currentDate = new Date()

      const upcomingClasses = await Class.find({
        status: { $in: ['scheduled', 'ongoing'] },
        'schedule.startDate': { $gte: currentDate }
      })
        .populate([
          {
            path: 'courseId',
            select: 'title level description type price targetScoreRange',
            match: { type: 'live-meet' } // Chỉ lấy live-meet courses
          },
          {
            path: 'instructor',
            select: 'profile.firstname profile.lastname profile.email'
          }
        ])
        .sort({ 'schedule.startDate': 1 })
        .lean()

      // Filter out classes where courseId is null (not live-meet)
      const liveClasses = upcomingClasses.filter((classItem) => classItem.courseId !== null)

      return liveClasses
    } catch (error) {
      throw new Error(`Lấy lịch khai giảng thất bại: ${(error as Error).message}`)
    }
  }
}

const classService = new ClassService()
export default classService
