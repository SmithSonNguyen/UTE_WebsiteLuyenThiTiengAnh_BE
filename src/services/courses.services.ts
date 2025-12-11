import Course from '~/models/schemas/Course.schema'
import Topic from '~/models/schemas/Topic.schema'
import Lesson from '~/models/schemas/Lesson.schema'
import { ICourse } from '~/models/schemas/Course.schema'
import mongoose from 'mongoose'
import { response } from 'express'
import Enrollment from '~/models/schemas/Enrollment.schema'
import Payment from '~/models/schemas/Payment.schema'

class CoursesService {
  // Lấy tất cả khóa học với filter và pagination
  async getAllCourses(options: {
    page?: number
    limit?: number
    type?: 'pre-recorded' | 'live-meet'
    level?: 'beginner' | 'intermediate' | 'advanced'
    status?: 'active' | 'inactive' | 'draft'
  }) {
    try {
      const { page = 1, limit = 12, type, level, status = 'active' } = options
      const skip = (page - 1) * limit

      // Build filter query
      interface FilterQuery {
        status: string
        type?: string
        level?: string
      }

      const filter: FilterQuery = { status }
      if (type) filter.type = type
      if (level) filter.level = level

      // Execute query with pagination
      const [courses, total] = await Promise.all([
        Course.find(filter)
          .select(
            '_id title description type price discountPrice discountPercent level targetScoreRange rating studentsCount features courseStructure preRecordedContent thumbnail'
          )
          .sort({ createdAt: -1 }) // Mới nhất trước
          .skip(skip)
          .limit(limit)
          .lean(),
        Course.countDocuments(filter)
      ])

      return {
        courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    } catch (error) {
      console.error('Error fetching all courses:', error)
      throw new Error('Failed to fetch courses')
    }
  }

  async getFeaturedCourses(): Promise<ICourse[]> {
    try {
      // Sử dụng aggregate để tính tie-breaker: rating.average * studentsCount
      // Sort ưu tiên rating.average cao nhất, tie-breaker theo (rating.average * studentsCount) nhiều nhất
      // Nếu rating.average null/undefined, set = 0 để xếp cuối
      const featuredCourses = await Course.aggregate([
        {
          $addFields: {
            // Tính tie-breaker field
            tieBreaker: {
              $multiply: [
                { $ifNull: ['$rating.average', 0] }, // Xử lý null rating
                { $ifNull: ['$studentsCount', 0] }
              ]
            }
          }
        },
        {
          $sort: {
            'rating.average': -1, // Ưu tiên rating cao nhất
            tieBreaker: -1 // Tie-breaker: product rating * studentsCount
          }
        },
        { $limit: 6 }, // Giới hạn 6 courses
        {
          $project: {
            _id: 1,
            title: 1,
            type: 1,
            description: 1,
            price: 1,
            discountPrice: 1,
            discountPercent: 1,
            level: 1,
            targetScoreRange: 1,
            rating: 1,
            studentsCount: 1
          }
        }
      ])

      // Convert to ICourse[] (aggregate trả plain objects)
      return featuredCourses as ICourse[]
    } catch (error) {
      console.error('Error fetching featured courses:', error)
      throw new Error('Failed to fetch featured courses')
    }
  }

  async getCourseById(courseId: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid course ID')
    }

    // Lấy thông tin course cơ bản
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email') // Nếu có instructor
      .lean()

    if (!course) {
      throw new Error('Course not found')
    }

    // Nếu là pre-recorded course, lấy thêm curriculum (topics và lessons)
    if (course.type === 'pre-recorded') {
      // Lấy tất cả topics của course, sắp xếp theo orderIndex
      const topics = await Topic.find({
        course: courseId,
        status: 'active'
      })
        .sort({ orderIndex: 1 })
        .lean()

      // Lấy tất cả lessons và nhóm theo topic
      const lessons = await Lesson.find({
        course: courseId
        //status: 'active'
      })
        .sort({ orderIndex: 1 })
        .select('title description duration difficulty isPreview content.type topic orderIndex')
        .lean()

      // Nhóm lessons theo topic và đếm số lessons
      const curriculum = topics.map((topic) => {
        const topicLessons = lessons.filter((lesson) => lesson.topic.toString() === topic._id.toString())

        return {
          _id: topic._id,
          title: topic.title,
          description: topic.description,
          orderIndex: topic.orderIndex,
          learningObjectives: topic.learningObjectives,
          stats: {
            ...topic.stats,
            totalLessons: topicLessons.length
          },
          lessons: topicLessons.map((lesson) => ({
            _id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            difficulty: lesson.difficulty,
            isPreview: lesson.isPreview,
            contentType: lesson.content?.type,
            orderIndex: lesson.orderIndex,
            isLocked: !lesson.isPreview // Lessons không phải preview sẽ bị lock
          }))
        }
      })

      // Tính toán thống kê tổng thể
      const totalLessons = lessons.length
      const totalPreviewLessons = lessons.filter((l) => l.isPreview).length
      const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0)

      // ===== PHẦN MỚI THÊM: Lấy videoLessons từ preRecordedContent =====
      const videoLessons = course.preRecordedContent?.videoLessons
        ? [...course.preRecordedContent.videoLessons].sort((a, b) => (a.order || 0) - (b.order || 0))
        : []
      // ===== HẾT PHẦN MỚI =====

      return {
        ...course,
        curriculum,
        videoLessons, // <-- CHỈ THÊM DÒNG NÀY
        stats: {
          totalTopics: topics.length,
          totalLessons,
          totalPreviewLessons,
          totalDuration, // in minutes
          totalHours: Math.round((totalDuration / 60) * 10) / 10 // Round to 1 decimal
        }
      }
    }

    // Nếu là live-meet course, chỉ trả về thông tin course cơ bản
    return {
      ...course,
      curriculum: [],
      videoLessons: [], // <-- CHỈ THÊM DÒNG NÀY
      stats: {
        totalTopics: 0,
        totalLessons: 0,
        totalPreviewLessons: 0,
        totalDuration: 0,
        totalHours: 0
      }
    }
  }

  // Method để lấy chỉ curriculum của course (cho course detail page)
  async getCourseCurriculum(courseId: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid course ID')
    }

    // Sử dụng aggregation để lấy data hiệu quả hơn
    const curriculum = await Topic.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
          status: 'active'
        }
      },
      {
        $sort: { orderIndex: 1 }
      },
      {
        $lookup: {
          from: 'lessons', // Collection name trong MongoDB (lowercase + s)
          let: { topicId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$topic', '$$topicId'] }, { $eq: ['$status', 'active'] }]
                }
              }
            },
            {
              $sort: { orderIndex: 1 }
            },
            {
              $project: {
                title: 1,
                description: 1,
                duration: 1,
                difficulty: 1,
                isPreview: 1,
                contentType: '$content.type',
                orderIndex: 1,
                isLocked: { $not: '$isPreview' }
              }
            }
          ],
          as: 'lessons'
        }
      },
      {
        $addFields: {
          lessonCount: { $size: '$lessons' },
          'stats.totalLessons': { $size: '$lessons' },
          'stats.totalDuration': {
            $sum: '$lessons.duration'
          }
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          orderIndex: 1,
          learningObjectives: 1,
          lessonCount: 1,
          lessons: 1,
          stats: 1
        }
      }
    ])

    return curriculum
  }

  // Method để lấy preview lessons (miễn phí)
  async getCoursePreviewLessons(courseId: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid course ID')
    }

    const previewLessons = await Lesson.find({
      course: courseId,
      isPreview: true,
      status: 'active'
    })
      .populate('topic', 'title orderIndex')
      .select('title description duration difficulty content.type')
      .sort({ 'topic.orderIndex': 1, orderIndex: 1 })
      .lean()

    return previewLessons
  }

  // Method để check xem user có access vào course không
  async checkCourseAccess(courseId: string, userId?: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid course ID')
    }

    const course = await Course.findById(courseId).select('type preRecordedContent').lean()

    if (!course) {
      throw new Error('Course not found')
    }

    let hasAccess = false
    let enrollmentInfo = null

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      // Kiểm tra enrollment với payment đã paid
      const enrollment = await Enrollment.findOne({
        studentId: new mongoose.Types.ObjectId(userId),
        courseId: new mongoose.Types.ObjectId(courseId),
        status: { $in: ['enrolled', 'completed'] },
        paymentStatus: 'paid'
      }).lean()

      if (enrollment) {
        hasAccess = true
        enrollmentInfo = enrollment
      }
    }

    return {
      hasAccess,
      courseType: course.type,
      accessDuration: course.preRecordedContent?.accessDuration,
      accessDurationUnit: course.preRecordedContent?.accessDurationUnit,
      enrollment: enrollmentInfo
    }
  }

  async getMyEnrolledCourses(userId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID')
      }

      // Bước 1: Lấy tất cả payments của user
      // - status: completed (thanh toán thành công)
      // - classId không tồn tại (chỉ lấy pre-recorded courses)
      const userPayments = await Payment.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed',
        classId: { $exists: false } // Chỉ lấy những payment không có classId
      })
        .select('courseId amount completedAt enrollmentId')
        .sort({ completedAt: -1 }) // Mới nhất trước
        .lean()

      if (!userPayments || userPayments.length === 0) {
        return []
      }

      // Bước 2: Lấy danh sách courseId từ payments
      const courseIds = userPayments.map((payment) => payment.courseId)

      // Bước 3: Lấy thông tin chi tiết các courses từ bảng courses
      const courses = await Course.find({
        _id: { $in: courseIds }
      })
        .select(
          '_id title description type price discountPrice discountPercent level targetScoreRange rating studentsCount thumbnail preRecordedContent'
        )
        .lean()

      // Bước 4: Map courses với thông tin payment tương ứng
      const enrolledCoursesWithPayment = courses.map((course) => {
        const payment = userPayments.find((p) => p.courseId!.toString() === course._id.toString())

        return {
          ...course,
          enrollmentInfo: {
            paymentId: payment?._id,
            enrollmentId: payment?.enrollmentId,
            paidAmount: payment?.amount,
            enrolledAt: payment?.completedAt,
            accessDuration: course.preRecordedContent?.accessDuration,
            accessDurationUnit: course.preRecordedContent?.accessDurationUnit
          }
        }
      })

      // Sắp xếp theo thời gian đăng ký (mới nhất trước)
      enrolledCoursesWithPayment.sort((a, b) => {
        const dateA = a.enrollmentInfo.enrolledAt ? new Date(a.enrollmentInfo.enrolledAt).getTime() : 0
        const dateB = b.enrollmentInfo.enrolledAt ? new Date(b.enrollmentInfo.enrolledAt).getTime() : 0
        return dateB - dateA
      })

      return enrolledCoursesWithPayment
    } catch (error) {
      console.error('Error fetching enrolled courses:', error)
      throw new Error('Failed to fetch enrolled courses')
    }
  }

  async checkUserCourseAccess(userId: any, courseId: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
        return false
      }

      // Kiểm tra trong bảng payments
      // - userId khớp
      // - courseId khớp
      // - status: completed (đã thanh toán thành công)
      // - classId không tồn tại (chỉ pre-recorded courses)
      const payment = await Payment.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        courseId: new mongoose.Types.ObjectId(courseId),
        status: 'completed',
        classId: { $exists: false }
      }).lean()

      return !!payment // Trả về true nếu tìm thấy payment
    } catch (error) {
      console.error('Error checking course access:', error)
      return false
    }
  }

  // Method lấy thông tin khóa học với videoLessons cho user đã mua
  async getEnrolledCourseById(courseId: string, userId: any) {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID')
      }

      // Lấy thông tin course cơ bản
      const course = await Course.findById(courseId)
        .select('_id title description type level targetScoreRange rating studentsCount preRecordedContent thumbnail')
        .lean()

      if (!course) {
        return null
      }

      // Chỉ trả về videoLessons nếu là pre-recorded course
      if (course.type === 'pre-recorded' && course.preRecordedContent?.videoLessons) {
        // Sắp xếp videoLessons theo order
        const videoLessons = [...course.preRecordedContent.videoLessons].sort((a, b) => (a.order || 0) - (b.order || 0))

        return {
          ...course,
          videoLessons
        }
      }

      return {
        ...course,
        videoLessons: []
      }
    } catch (error) {
      console.error('Error fetching enrolled course:', error)
      throw new Error('Failed to fetch enrolled course')
    }
  }
}

export default new CoursesService()
