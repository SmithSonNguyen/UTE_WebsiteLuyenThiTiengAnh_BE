import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schema'
import Class from '~/models/schemas/Class.schema'
import Enrollment from '~/models/schemas/Enrollment.schema'
import Attendance from '~/models/schemas/Attendance.schema'

class InstructorService {
  // Lấy thông tin cơ bản của giảng viên
  async getInstructorProfile(instructorId: string) {
    const instructor = await User.findById(instructorId).select('-password -forgot_password_token -email_verify_token')

    if (!instructor) {
      throw new Error('Instructor not found')
    }

    return instructor
  }

  // Lấy thông tin chi tiết giảng viên với thống kê
  async getInstructorDetails(instructorId: string) {
    const instructorObjectId = new ObjectId(instructorId)

    // Lấy thông tin cơ bản
    const instructor = await User.findById(instructorObjectId).select(
      '-password -forgot_password_token -email_verify_token'
    )

    if (!instructor) {
      throw new Error('Instructor not found')
    }

    // Thống kê lớp học
    const totalClasses = await Class.countDocuments({ instructor: instructorObjectId })
    const activeClasses = await Class.countDocuments({
      instructor: instructorObjectId,
      status: 'ongoing'
    })

    // Tổng số sinh viên
    const enrollmentStats = await Enrollment.aggregate([
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'class'
        }
      },
      {
        $match: {
          'class.instructor': instructorObjectId,
          status: 'enrolled'
        }
      },
      {
        $count: 'totalStudents'
      }
    ])

    const totalStudents = enrollmentStats[0]?.totalStudents || 0

    // Đánh giá trung bình (giả sử có schema Review)
    // const averageRating = await Review.aggregate([
    //   {
    //     $lookup: {
    //       from: 'classes',
    //       localField: 'classId',
    //       foreignField: '_id',
    //       as: 'class'
    //     }
    //   },
    //   {
    //     $match: {
    //       'class.instructor': instructorObjectId
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       averageScore: { $avg: '$rating' }
    //     }
    //   }
    // ])

    const teachingStats = {
      totalClasses,
      activeClasses,
      totalStudents
    }

    return {
      ...instructor.toObject(),
      teachingStats
    }
  }

  // Lấy danh sách lớp học của giảng viên
  async getInstructorClasses(instructorId: string) {
    const instructorObjectId = new ObjectId(instructorId)

    const classes = await Class.find({ instructor: instructorObjectId })
      .populate('courseId', 'name title description level')
      .sort({ createdAt: -1 })

    // Thêm thống kê cho mỗi lớp
    const classesWithStats = await Promise.all(
      classes.map(async (classItem) => {
        const totalStudents = await Enrollment.countDocuments({
          classId: classItem._id,
          status: 'enrolled'
        })

        // Số sinh viên có mặt trong buổi học gần nhất
        const latestAttendance = await Attendance.findOne({ classId: classItem._id }).sort({ sessionDate: -1 })

        const presentStudents = latestAttendance?.statistics.presentCount || 0

        return {
          ...classItem.toObject(),
          totalStudents,
          presentStudents,
          attendanceRate: totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0
        }
      })
    )

    return classesWithStats
  }

  // Cập nhật thông tin giảng viên
  async updateInstructorProfile(instructorId: string, updateData: any) {
    const allowedFields = [
      'name',
      'phone',
      'address',
      'bio',
      'avatar',
      'department',
      'position',
      'specialization',
      'experience',
      'education'
    ]

    const filteredData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updateData[key]
        return obj
      }, {})

    const updatedInstructor = await User.findByIdAndUpdate(
      instructorId,
      { $set: filteredData },
      { new: true, runValidators: true }
    ).select('-password -forgot_password_token -email_verify_token')

    if (!updatedInstructor) {
      throw new Error('Instructor not found')
    }

    return updatedInstructor
  }
}

export const instructorService = new InstructorService()
