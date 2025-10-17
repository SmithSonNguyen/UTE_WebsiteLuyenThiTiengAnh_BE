import { Class, IClass } from '~/models/schemas/Class.schema'
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
}

const classService = new ClassService()
export default classService
