// services/admin.services.ts
import Payment from '~/models/schemas/Payment.schema'
import User from '~/models/schemas/User.schema'
import Course from '~/models/schemas/Course.schema'
import Enrollment from '~/models/schemas/Enrollment.schema'
import Class from '~/models/schemas/Class.schema'
import { hashPassword } from '~/utils/crypto'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import mongoose from 'mongoose'

class AdminService {
  /**
   * Lấy thống kê tổng quan dashboard
   */
  async getOverviewDashboard() {
    try {
      // 1. Tính tổng doanh thu từ payments đã completed
      const totalRevenueResult = await Payment.aggregate([
        {
          $match: {
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total_revenue: { $sum: '$amount' }
          }
        }
      ])

      const total_revenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total_revenue : 0

      // 2. Đếm tổng số users
      const total_users = await User.countDocuments()

      // 3. Đếm tổng số courses
      const total_courses = await Course.countDocuments()

      // 4. Đếm tổng số enrollments
      const total_enrollments = await Enrollment.countDocuments()

      // 5. Đếm số payments thành công
      const total_completed_payments = await Payment.countDocuments({
        status: 'completed'
      })

      // 6. Đếm số payments đang pending
      const total_pending_payments = await Payment.countDocuments({
        status: 'pending'
      })

      // 7. Đếm số payments thất bại
      const total_failed_payments = await Payment.countDocuments({
        status: 'failed'
      })

      // 8. Lấy top 5 khóa học bán chạy nhất
      const topCourses = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            courseId: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$courseId',
            total_sales: { $sum: '$amount' },
            enrollment_count: { $sum: 1 }
          }
        },
        {
          $sort: { total_sales: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: 'courses', // Collection name trong MongoDB
            localField: '_id',
            foreignField: '_id',
            as: 'course_info'
          }
        },
        {
          $unwind: {
            path: '$course_info',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            course_name: '$course_info.title',
            course_thumbnail: '$course_info.thumbnail',
            course_price: '$course_info.price',
            total_sales: 1,
            enrollment_count: 1
          }
        }
      ])

      // 9. Thống kê doanh thu theo tháng (12 tháng gần nhất)
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

      const monthlyRevenue = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: {
              $gte: twelveMonthsAgo
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$completedAt' },
              month: { $month: '$completedAt' }
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            revenue: 1,
            count: 1,
            month_name: {
              $let: {
                vars: {
                  monthsInString: [
                    '',
                    'Tháng 1',
                    'Tháng 2',
                    'Tháng 3',
                    'Tháng 4',
                    'Tháng 5',
                    'Tháng 6',
                    'Tháng 7',
                    'Tháng 8',
                    'Tháng 9',
                    'Tháng 10',
                    'Tháng 11',
                    'Tháng 12'
                  ]
                },
                in: { $arrayElemAt: ['$$monthsInString', '$_id.month'] }
              }
            }
          }
        }
      ])

      // 10. Thống kê payments theo trạng thái
      const paymentsByStatus = await Payment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total_amount: { $sum: '$amount' }
          }
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            count: 1,
            total_amount: 1
          }
        }
      ])

      // 11. Thống kê theo phương thức thanh toán
      const paymentsByMethod = await Payment.aggregate([
        {
          $match: {
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            total_amount: { $sum: '$amount' }
          }
        },
        {
          $project: {
            _id: 0,
            payment_method: '$_id',
            count: 1,
            total_amount: 1
          }
        }
      ])

      // 12. Lấy 10 giao dịch gần nhất
      const recentPayments = await Payment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'fullName email')
        .populate('courseId', 'title')
        .populate('classId', 'classCode')
        .select('amount status paymentMethod createdAt completedAt orderInfo')
        .lean()

      // 13. Tính tỷ lệ chuyển đổi (conversion rate)
      const conversion_rate =
        total_completed_payments > 0 && total_users > 0
          ? ((total_completed_payments / total_users) * 100).toFixed(2)
          : '0.00'

      // 14. Tính average order value (AOV)
      const average_order_value =
        total_completed_payments > 0 ? Math.round(total_revenue / total_completed_payments) : 0

      return {
        overview: {
          total_revenue,
          total_users,
          total_courses,
          total_enrollments,
          total_completed_payments,
          total_pending_payments,
          total_failed_payments,
          conversion_rate: parseFloat(conversion_rate),
          average_order_value
        },
        top_courses: topCourses,
        monthly_revenue: monthlyRevenue,
        payments_by_status: paymentsByStatus,
        payments_by_method: paymentsByMethod,
        recent_payments: recentPayments
      }
    } catch (error) {
      console.error('❌ Error in getOverviewDashboard:', error)
      throw error
    }
  }

  /**
   * Lấy thống kê chi tiết theo khoảng thời gian
   */
  async getRevenueByDateRange(startDate: Date, endDate: Date) {
    try {
      const revenue = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$completedAt' },
              month: { $month: '$completedAt' },
              day: { $dayOfMonth: '$completedAt' }
            },
            daily_revenue: { $sum: '$amount' },
            daily_count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day'
              }
            },
            revenue: '$daily_revenue',
            count: '$daily_count'
          }
        }
      ])

      const totalRevenue = revenue.reduce((sum, item) => sum + item.revenue, 0)
      const totalTransactions = revenue.reduce((sum, item) => sum + item.count, 0)

      return {
        daily_revenue: revenue,
        summary: {
          total_revenue: totalRevenue,
          total_transactions: totalTransactions,
          average_daily_revenue: revenue.length > 0 ? Math.round(totalRevenue / revenue.length) : 0,
          start_date: startDate,
          end_date: endDate
        }
      }
    } catch (error) {
      console.error('❌ Error in getRevenueByDateRange:', error)
      throw error
    }
  }

  /**
   * Lấy top students (theo số tiền đã chi)
   */
  async getTopStudents(limit: number = 10) {
    try {
      const topStudents = await Payment.aggregate([
        {
          $match: {
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$userId',
            total_spent: { $sum: '$amount' },
            total_courses: { $sum: 1 }
          }
        },
        {
          $sort: { total_spent: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user_info'
          }
        },
        {
          $unwind: {
            path: '$user_info',
            preserveNullAndEmptyArrays: true // giữ lại nếu không tìm thấy user (tốt hơn cho debug)
          }
        },
        {
          $project: {
            userId: '$_id',
            fullName: {
              $trim: {
                input: { $concat: ['$user_info.profile.lastname', ' ', '$user_info.profile.firstname'] }
              }
            },
            email: '$user_info.profile.email',
            avatar: '$user_info.profile.avatar',
            total_spent: 1,
            total_courses: 1,
            // Không cần _id của group nữa nếu không muốn expose
            _id: 0
          }
        },
        // Optional: thêm match để loại bỏ những user không tồn tại (nếu có)
        {
          $match: { email: { $ne: null } }
        }
      ])

      return topStudents
    } catch (error) {
      console.error('Error in getTopStudents:', error)
      throw error
    }
  }

  async getAllInstructors() {
    try {
      const instructors = await User.find({ role: 'instructor' })
        .select('-password -otp -otpExpiresAt -isVerifiedForgot')
        .sort({ 'instructorInfo.joinDate': -1 })
        .lean()

      // Đếm số lớp đang dạy cho mỗi instructor
      const instructorsWithStats = await Promise.all(
        instructors.map(async (instructor) => {
          // Sửa: field trong Class schema là 'instructor' chứ không phải 'instructorId'
          const activeClasses = await Class.countDocuments({
            instructor: instructor._id,
            status: { $in: ['ongoing', 'scheduled'] } // Sửa: 'active'/'upcoming' thành 'ongoing'/'scheduled'
          })

          // Tính tổng số học viên từ tất cả các lớp của instructor
          const classes = await Class.find({ instructor: instructor._id }).lean()
          const totalStudents = classes.reduce((sum, cls) => {
            return sum + (cls.capacity?.currentStudents || 0)
          }, 0)

          return {
            ...instructor,
            stats: {
              activeClasses,
              totalStudents
            }
          }
        })
      )

      return instructorsWithStats
    } catch (error) {
      console.error('❌ Error in getAllInstructors:', error)
      throw error
    }
  }

  /**
   * Tạo tài khoản instructor mới
   */
  async createInstructor(instructorData: {
    email: string
    password: string
    firstname: string
    lastname: string
    phone?: string
    bio?: string
    position?: string
    specialization?: string
    experience?: string
    education?: string
  }) {
    try {
      // Kiểm tra email đã tồn tại
      const existingUser = await User.findOne({ 'profile.email': instructorData.email })
      if (existingUser) {
        throw new Error('Email already exists')
      }

      // Hash password
      const crypto = require('crypto')
      const hashedPassword = hashPassword(instructorData.password)
      // Tạo instructor mới
      const newInstructor = new User({
        password: hashedPassword,
        isVerified: true,
        role: 'instructor',
        profile: {
          username: instructorData.email.split('@')[0],
          email: instructorData.email,
          firstname: instructorData.firstname,
          lastname: instructorData.lastname,
          phone: instructorData.phone || '',
          bio: instructorData.bio || '',
          gender: '',
          avatar: 'https://via.placeholder.com/150'
        },
        instructorInfo: {
          position: instructorData.position || 'Giảng viên',
          specialization: instructorData.specialization || '',
          experience: instructorData.experience || '0 năm',
          education: instructorData.education || '',
          joinDate: new Date(),
          certificate: []
        }
      })

      await newInstructor.save()

      return newInstructor
    } catch (error) {
      console.error('❌ Error in createInstructor:', error)
      throw error
    }
  }

  /**
   * Xóa instructor (soft delete - chuyển role về user)
   */
  async deleteInstructor(instructorId: string) {
    try {
      // Kiểm tra instructor có đang dạy lớp active không
      const activeClasses = await Class.countDocuments({
        instructorId: instructorId,
        status: { $in: ['active', 'upcoming'] }
      })

      if (activeClasses > 0) {
        throw new Error('Cannot delete instructor with active classes')
      }

      // Chuyển role về user thay vì xóa
      const result = await User.findByIdAndUpdate(
        instructorId,
        {
          role: 'guest',
          $unset: { instructorInfo: 1 } // Xóa instructorInfo
        },
        { new: true }
      )

      return result
    } catch (error) {
      console.error('❌ Error in deleteInstructor:', error)
      throw error
    }
  }

  /**
   * Gán lớp học cho instructor
   */
  async assignClassToInstructor(instructorId: string, classId: string) {
    try {
      // Kiểm tra instructor tồn tại
      const instructor = await User.findOne({ _id: instructorId, role: 'instructor' })
      if (!instructor) {
        throw new Error('Instructor not found')
      }

      // Kiểm tra class tồn tại
      const classDoc = await Class.findById(classId)
      if (!classDoc) {
        throw new Error('Class not found')
      }

      // Cập nhật instructorId cho class
      const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { instructorId: instructorId },
        { new: true }
      ).populate('instructorId', 'profile.firstname profile.lastname profile.email')

      return updatedClass
    } catch (error) {
      console.error('❌ Error in assignClassToInstructor:', error)
      throw error
    }
  }

  /**
   * Lấy danh sách lớp có thể assign (chưa có instructor)
   */
  async getAvailableClasses() {
    try {
      const classes = await Class.find({
        $or: [{ instructorId: { $exists: false } }, { instructorId: null }],
        status: { $in: ['upcoming', 'active'] }
      })
        .populate('courseId', 'title')
        .sort({ startDate: 1 })
        .lean()

      return classes
    } catch (error) {
      console.error('❌ Error in getAvailableClasses:', error)
      throw error
    }
  }

  async getAllClasses(filters?: { status?: string; courseId?: string; instructorId?: string }) {
    try {
      const query: any = {}

      if (filters?.status) {
        query.status = filters.status
      }
      if (filters?.courseId) {
        query.courseId = filters.courseId
      }
      if (filters?.instructorId) {
        query.instructor = filters.instructorId
      }

      const classes = await Class.find(query)
        .populate('courseId', 'title level price')
        .populate('instructor', 'profile.firstname profile.lastname profile.email')
        .sort({ 'schedule.startDate': -1 })
        .lean()

      // Format dữ liệu trả về
      const formattedClasses = classes.map((cls: any) => ({
        _id: cls._id,
        classCode: cls.classCode,
        classId: cls.classId,
        course: {
          _id: cls.courseId._id,
          title: cls.courseId.title,
          level: cls.courseId.level,
          price: cls.courseId.price
        },
        instructor: {
          _id: cls.instructor._id,
          name: `${cls.instructor.profile.lastname} ${cls.instructor.profile.firstname}`,
          email: cls.instructor.profile.email
        },
        schedule: {
          days: cls.schedule.days,
          meetLink: cls.schedule.meetLink,
          startTime: cls.schedule.startTime,
          endTime: cls.schedule.endTime,
          startDate: cls.schedule.startDate,
          endDate: cls.schedule.endDate,
          durationWeeks: cls.schedule.durationWeeks
        },
        capacity: {
          maxStudents: cls.capacity.maxStudents,
          currentStudents: cls.capacity.currentStudents,
          availableSlots: cls.capacity.maxStudents - cls.capacity.currentStudents
        },
        status: cls.status,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt
      }))

      return formattedClasses
    } catch (error) {
      console.error('❌ Error in getAllClasses:', error)
      throw error
    }
  }

  /**
   * Chuyển đổi giảng viên cho lớp học
   */
  async changeClassInstructor(classId: string, newInstructorId: string) {
    try {
      // Kiểm tra class tồn tại
      const classDoc = await Class.findById(classId)
      if (!classDoc) {
        throw new Error('Class not found')
      }

      // Kiểm tra instructor mới tồn tại và có role instructor
      const newInstructor = await User.findOne({
        _id: newInstructorId,
        role: 'instructor'
      })
      if (!newInstructor) {
        throw new Error('Instructor not found or invalid role')
      }

      // Cập nhật instructor
      const updatedClass = await Class.findByIdAndUpdate(classId, { instructor: newInstructorId }, { new: true })
        .populate('courseId', 'title level')
        .populate('instructor', 'profile.firstname profile.lastname profile.email')

      if (!updatedClass) {
        // Trường hợp rất hiếm: Class bị xóa ngay sau khi được tìm thấy ở bước đầu.
        throw new Error('Failed to update class or class disappeared')
      }
      return {
        _id: updatedClass._id,
        classCode: updatedClass.classCode,
        classId: updatedClass.classId,
        course: (updatedClass as any).courseId,
        instructor: {
          _id: (updatedClass as any).instructor._id,
          name: `${(updatedClass as any).instructor.profile.lastname} ${(updatedClass as any).instructor.profile.firstname}`,
          email: (updatedClass as any).instructor.profile.email
        },
        status: updatedClass.status
      }
    } catch (error) {
      console.error('❌ Error in changeClassInstructor:', error)
      throw error
    }
  }

  /**
   * Xóa lớp học (chỉ xóa nếu currentStudents = 0)
   */
  async deleteClass(classId: string) {
    try {
      // Kiểm tra class tồn tại
      const classDoc = await Class.findById(classId)
      if (!classDoc) {
        throw new Error('Class not found')
      }

      // Kiểm tra currentStudents
      if (classDoc.capacity.currentStudents > 0) {
        throw new Error(
          'Cannot delete class with enrolled students. Current students: ' + classDoc.capacity.currentStudents
        )
      }

      // Xóa class
      await Class.findByIdAndDelete(classId)

      return {
        message: 'Class deleted successfully',
        deletedClass: {
          _id: classDoc._id,
          classCode: classDoc.classCode,
          classId: classDoc.classId
        }
      }
    } catch (error) {
      console.error('❌ Error in deleteClass:', error)
      throw error
    }
  }

  /**
   * Tạo lớp học mới
   */
  async createClass(classData: {
    courseId: string
    classId: string
    instructorId: string
    schedule: {
      days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[]
      meetLink: string
      startTime: string
      endTime: string
      startDate: Date
      endDate?: Date
      durationWeeks?: number
    }
    capacity: {
      maxStudents: number
    }
    status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  }) {
    try {
      // Kiểm tra course tồn tại
      const course = await Course.findById(classData.courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      // Kiểm tra instructor tồn tại và có role instructor
      const instructor = await User.findOne({
        _id: classData.instructorId,
        role: 'instructor'
      })
      if (!instructor) {
        throw new Error('Instructor not found or invalid role')
      }

      // Kiểm tra classId đã tồn tại chưa
      const existingClass = await Class.findOne({ classId: classData.classId })
      if (existingClass) {
        throw new Error('ClassId already exists')
      }

      // Tạo class mới
      const newClass = new Class({
        courseId: classData.courseId,
        classId: classData.classId,
        instructor: classData.instructorId,
        schedule: {
          days: classData.schedule.days,
          meetLink: classData.schedule.meetLink,
          startTime: classData.schedule.startTime,
          endTime: classData.schedule.endTime,
          startDate: classData.schedule.startDate,
          endDate: classData.schedule.endDate,
          durationWeeks: classData.schedule.durationWeeks
        },
        capacity: {
          maxStudents: classData.capacity.maxStudents,
          currentStudents: 0
        },
        status: classData.status || 'scheduled'
      })

      await newClass.save()

      // Populate để trả về đầy đủ thông tin
      const populatedClass = await Class.findById(newClass._id)
        .populate('courseId', 'title level price')
        .populate('instructor', 'profile.firstname profile.lastname profile.email')

      if (!populatedClass) {
        // Xử lý trường hợp không tìm thấy (gần như không xảy ra)
        throw new Error('Failed to retrieve class after creation')
      }
      return {
        _id: populatedClass._id,
        classCode: populatedClass.classCode,
        classId: populatedClass.classId,
        course: (populatedClass as any).courseId,
        instructor: {
          _id: (populatedClass as any).instructor._id,
          name: `${(populatedClass as any).instructor.profile.lastname} ${(populatedClass as any).instructor.profile.firstname}`,
          email: (populatedClass as any).instructor.profile.email
        },
        schedule: populatedClass.schedule,
        capacity: populatedClass.capacity,
        status: populatedClass.status,
        createdAt: populatedClass.createdAt,
        updatedAt: populatedClass.updatedAt
      }
    } catch (error) {
      console.error('❌ Error in createClass:', error)
      throw error
    }
  }

  /**
   * Lấy danh sách tất cả khóa học pre-recorded
   */
  async getAllPreRecordedCourses() {
    try {
      const courses = await Course.find({ type: 'pre-recorded' })
        .populate('instructor', 'profile.firstname profile.lastname profile.email profile.avatar')
        .sort({ createdAt: -1 })
        .lean()

      return courses
    } catch (error) {
      console.error('❌ Error in getAllPreRecordedCourses:', error)
      throw error
    }
  }

  /**
   * Lấy chi tiết một khóa học pre-recorded
   */
  async getPreRecordedCourseById(courseId: string) {
    try {
      const course = await Course.findOne({ _id: courseId, type: 'pre-recorded' })
        .populate('instructor', 'profile.firstname profile.lastname profile.email profile.avatar')
        .lean()

      if (!course) {
        throw new Error('Course not found')
      }

      return course
    } catch (error) {
      console.error('❌ Error in getPreRecordedCourseById:', error)
      throw error
    }
  }

  /**
   * Tạo khóa học pre-recorded mới
   */
  async createPreRecordedCourse(courseData: {
    title: string
    description: string
    price: number
    discountPrice?: number
    level: string
    targetScoreRange: { min: number; max: number }
    features: string[]
    courseStructure: {
      totalSessions: number
      hoursPerSession: number
      totalHours: number
      description: string
    }
    instructor: string
    thumbnail: string
    preRecordedContent: {
      totalTopics: number
      totalLessons: number
      accessDuration: number
      accessDurationUnit: string
      downloadable: boolean
      certificate: boolean
      description: string
      videoLessons: Array<{ title: string; url: string; order: number }>
    }
  }) {
    try {
      // Tính discount percent nếu có discountPrice
      let discountPercent = 0
      if (courseData.discountPrice && courseData.price > 0) {
        discountPercent = Math.round(((courseData.price - courseData.discountPrice) / courseData.price) * 100)
      }

      const newCourse = new Course({
        title: courseData.title,
        description: courseData.description,
        type: 'pre-recorded',
        price: courseData.price,
        discountPrice: courseData.discountPrice || courseData.price,
        discountPercent: discountPercent,
        level: courseData.level,
        targetScoreRange: courseData.targetScoreRange,
        rating: {
          average: 0,
          reviewsCount: 0
        },
        studentsCount: 0,
        features: courseData.features,
        courseStructure: courseData.courseStructure,
        instructor: courseData.instructor,
        thumbnail: courseData.thumbnail,
        status: 'active',
        preRecordedContent: courseData.preRecordedContent
      })

      await newCourse.save()
      return newCourse
    } catch (error) {
      console.error('❌ Error in createPreRecordedCourse:', error)
      throw error
    }
  }

  /**
   * Cập nhật khóa học pre-recorded
   */
  async updatePreRecordedCourse(courseId: string, updateData: any) {
    try {
      // Tính lại discount percent nếu có thay đổi price
      if (updateData.price || updateData.discountPrice) {
        const course = await Course.findById(courseId)
        const price = updateData.price || course?.price || 0
        const discountPrice = updateData.discountPrice || course?.discountPrice || price

        if (price > 0) {
          updateData.discountPercent = Math.round(((price - discountPrice) / price) * 100)
        }
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('instructor', 'profile.firstname profile.lastname profile.email profile.avatar')

      if (!updatedCourse) {
        throw new Error('Course not found')
      }

      return updatedCourse
    } catch (error) {
      console.error('❌ Error in updatePreRecordedCourse:', error)
      throw error
    }
  }

  /**
   * Xóa khóa học pre-recorded (soft delete - chuyển status về inactive)
   */
  async deletePreRecordedCourse(courseId: string) {
    try {
      // Kiểm tra có học viên đang học không
      const enrollments = await Enrollment.countDocuments({
        courseId: courseId,
        status: 'active'
      })

      if (enrollments > 0) {
        throw new Error('Cannot delete course with active enrollments')
      }

      const result = await Course.findByIdAndUpdate(courseId, { status: 'inactive' }, { new: true })

      return result
    } catch (error) {
      console.error('❌ Error in deletePreRecordedCourse:', error)
      throw error
    }
  }

  /**
   * Generate Cloudinary upload signature
   */
  async generateUploadSignature() {
    const cloudname = process.env.CLOUDINARY_CLOUD_NAME
    const apikey = process.env.CLOUDINARY_API_KEY
    const apisecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudname || !apikey || !apisecret) {
      throw new Error('Cloudinary configuration is missing')
    }

    const timestamp = Math.round(new Date().getTime() / 1000)
    const paramsToSign = `timestamp=${timestamp}`

    const crypto = require('crypto')
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apisecret)
      .digest('hex')

    const result = {
      signature,
      timestamp,
      cloudname,
      apikey
    }

    return result
  }

  async getAllGuestUsers(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit

      const [users, total] = await Promise.all([
        User.find({ role: 'guest' })
          .select('-password -otp -otpExpiresAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments({ role: 'guest' })
      ])

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('❌ Error in getAllGuestUsers:', error)
      throw error
    }
  }

  /**
   * Xem người dùng đã đăng ký khoá gì thông qua payments completed
   */
  async getGuestUserEnrollments(userId: string) {
    try {
      // Kiểm tra user có tồn tại không
      const user = await User.findById(userId).select('-password').lean()

      if (!user) {
        throw new ErrorWithStatus({
          message: 'USER NOT FOUND',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      // Lấy tất cả payments completed của user
      const completedPayments = await Payment.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            status: 'completed'
          }
        },
        {
          $sort: { completedAt: -1 }
        },
        {
          // Lookup course information
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'courseInfo'
          }
        },
        {
          $unwind: {
            path: '$courseInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          // Lookup class information (nếu có)
          $lookup: {
            from: 'classes',
            localField: 'classId',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        {
          $unwind: {
            path: '$classInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            amount: 1,
            currency: 1,
            paymentMethod: 1,
            status: 1,
            orderInfo: 1,
            completedAt: 1,
            createdAt: 1,
            course: {
              _id: '$courseInfo._id',
              title: '$courseInfo.title',
              description: '$courseInfo.description',
              thumbnail: '$courseInfo.thumbnail',
              price: '$courseInfo.price',
              level: '$courseInfo.level',
              category: '$courseInfo.category'
            },
            class: {
              $cond: {
                if: { $ne: ['$classInfo', null] },
                then: {
                  _id: '$classInfo._id',
                  classCode: '$classInfo.classCode',
                  className: '$classInfo.className',
                  startDate: '$classInfo.startDate',
                  endDate: '$classInfo.endDate',
                  schedule: '$classInfo.schedule',
                  instructor: '$classInfo.instructor',
                  maxStudents: '$classInfo.maxStudents',
                  currentStudents: '$classInfo.currentStudents'
                },
                else: null
              }
            }
          }
        }
      ])

      // Tính toán thống kê
      const totalSpent = completedPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const totalCourses = completedPayments.length
      const coursesWithClass = completedPayments.filter((p) => p.class !== null).length
      const coursesWithoutClass = completedPayments.filter((p) => p.class === null).length

      return {
        user: {
          _id: user._id,
          profile: user.profile,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        },
        statistics: {
          totalEnrollments: totalCourses,
          totalSpent,
          coursesWithClass,
          coursesWithoutClass
        },
        enrollments: completedPayments
      }
    } catch (error) {
      console.error('❌ Error in getGuestUserEnrollments:', error)
      throw error
    }
  }

  /**
   * Xoá người dùng
   */
  async deleteGuestUser(userId: string) {
    try {
      // Kiểm tra user có tồn tại không
      const user = await User.findById(userId)

      if (!user) {
        throw new ErrorWithStatus({
          message: 'USER_NOT_FOUND',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      // Kiểm tra xem user có payments completed không
      const hasCompletedPayments = await Payment.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed'
      })

      if (hasCompletedPayments > 0) {
        throw new ErrorWithStatus({
          message: 'CANNOT_DELETE_USER_WITH_PAYMENTS',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      // Xoá user
      await User.findByIdAndDelete(userId)

      // Optional: Xoá các payments pending/failed của user này
      await Payment.deleteMany({
        userId: new mongoose.Types.ObjectId(userId),
        status: { $in: ['pending', 'failed'] }
      })

      return {
        message: 'Deleted'
      }
    } catch (error) {
      console.error('❌ Error in deleteGuestUser:', error)
      throw error
    }
  }
}

export const adminService = new AdminService()
