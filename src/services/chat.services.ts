import mongoose from 'mongoose'
import Message from '~/models/schemas/Message.schema'
import Enrollment from '~/models/schemas/Enrollment.schema'
import Class from '~/models/schemas/Class.schema'
import User from '~/models/schemas/User.schema'

export const chatService = {
  /**
   * Tạo roomId chuẩn từ 2 userId (sort để đảm bảo đồng nhất dù gọi theo thứ tự nào)
   */
  createRoomId(userIdA: string, userIdB: string): string {
    return [userIdA.toString(), userIdB.toString()].sort().join('_')
  },

  /**
   * Validate: student có được phép chat với instructor không?
   * Điều kiện: student phải có enrollment 'enrolled' trong class mà instructor đó dạy
   */
  async validateChatPermission(studentId: string, instructorId: string): Promise<boolean> {
    const studentOId = new mongoose.Types.ObjectId(studentId)
    const instructorOId = new mongoose.Types.ObjectId(instructorId)

    // Tìm các lớp của instructor
    const instructorClasses = await Class.find({ instructor: instructorOId }).select('_id').lean()
    if (instructorClasses.length === 0) return false

    const classIds = instructorClasses.map((c) => c._id)

    // Kiểm tra student có enrollment trong ít nhất 1 lớp không
    const enrollment = await Enrollment.findOne({
      studentId: studentOId,
      classId: { $in: classIds },
      status: 'enrolled'
    }).lean()

    return !!enrollment
  },

  /**
   * Lấy danh sách giảng viên của student (từ enrollments → classes → instructor)
   */
  async getInstructorsForStudent(studentId: string) {
    const studentOId = new mongoose.Types.ObjectId(studentId)

    // Lấy tất cả enrollments đang hoạt động
    const enrollments = await Enrollment.find({
      studentId: studentOId,
      status: 'enrolled'
    })
      .select('classId')
      .lean()

    if (enrollments.length === 0) return []

    const classIds = enrollments.map((e) => e.classId)

    // Lấy thông tin class + instructor (populate)
    const classes = await Class.find({ _id: { $in: classIds } })
      .populate('instructor', 'profile.firstname profile.lastname profile.avatar profile.email')
      .populate('courseId', 'title')
      .select('classCode classId instructor courseId')
      .lean()

    // Group theo instructor (một instructor có thể dạy nhiều lớp của student)
    const instructorMap = new Map<string, any>()

    for (const cls of classes) {
      const instructor = cls.instructor as any
      if (!instructor) continue

      const instrId = instructor._id.toString()
      const roomId = chatService.createRoomId(studentId, instrId)

      // Lấy tin nhắn cuối + số unread
      const [lastMsg, unreadCount] = await Promise.all([
        Message.findOne({ roomId }).sort({ createdAt: -1 }).select('content createdAt senderId').lean(),
        Message.countDocuments({ roomId, receiverId: studentOId, isRead: false })
      ])

      if (!instructorMap.has(instrId)) {
        instructorMap.set(instrId, {
          instructorId: instrId,
          name: `${instructor.profile.lastname} ${instructor.profile.firstname}`,
          avatar: instructor.profile.avatar,
          email: instructor.profile.email,
          classes: [],
          roomId,
          lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt } : null,
          unreadCount
        })
      }

      // Thêm lớp vào danh sách lớp của instructor này
      instructorMap.get(instrId).classes.push({
        classCode: cls.classCode,
        courseTitle: (cls.courseId as any)?.title || ''
      })
    }

    return Array.from(instructorMap.values()).sort((a, b) => {
      // Sort: unread trước, sau đó theo tin nhắn cuối
      if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount
      const tA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
      const tB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
      return tB - tA
    })
  },

  /**
   * Lấy danh sách học sinh của instructor (từ classes → enrollments → students)
   */
  async getStudentsForInstructor(instructorId: string) {
    const instructorOId = new mongoose.Types.ObjectId(instructorId)

    // Lấy tất cả lớp của giảng viên
    const classes = await Class.find({ instructor: instructorOId })
      .populate('courseId', 'title')
      .select('classCode classId courseId')
      .lean()

    if (classes.length === 0) return []

    const classIds = classes.map((c) => c._id)

    // Map classId → class info
    const classMap = new Map(classes.map((c) => [c._id.toString(), c]))

    // Lấy tất cả enrollments của các lớp này
    const enrollments = await Enrollment.find({
      classId: { $in: classIds },
      status: 'enrolled'
    })
      .populate('studentId', 'profile.firstname profile.lastname profile.avatar profile.email')
      .select('studentId classId')
      .lean()

    // Group theo student
    const studentMap = new Map<string, any>()

    for (const enrollment of enrollments) {
      const student = enrollment.studentId as any
      if (!student) continue

      const stuId = student._id.toString()
      const classInfo = classMap.get(enrollment.classId.toString())
      const roomId = chatService.createRoomId(instructorId, stuId)

      if (!studentMap.has(stuId)) {
        // Lấy tin nhắn cuối + số unread
        const [lastMsg, unreadCount] = await Promise.all([
          Message.findOne({ roomId }).sort({ createdAt: -1 }).select('content createdAt senderId').lean(),
          Message.countDocuments({
            roomId,
            receiverId: instructorOId,
            isRead: false
          })
        ])

        studentMap.set(stuId, {
          studentId: stuId,
          name: `${student.profile.lastname} ${student.profile.firstname}`,
          avatar: student.profile.avatar,
          email: student.profile.email,
          classes: [],
          roomId,
          lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt } : null,
          unreadCount
        })
      }

      if (classInfo) {
        studentMap.get(stuId).classes.push({
          classCode: classInfo.classCode,
          courseTitle: (classInfo.courseId as any)?.title || ''
        })
      }
    }

    return Array.from(studentMap.values()).sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount
      const tA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
      const tB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
      return tB - tA
    })
  },

  /**
   * Lấy lịch sử tin nhắn trong một room (phân trang)
   */
  async getMessages(roomId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit
    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'profile.firstname profile.lastname profile.avatar')
      .lean()

    return messages.reverse() // Trả về theo thứ tự cũ → mới
  },

  /**
   * Lưu tin nhắn mới vào DB
   */
  async saveMessage(roomId: string, senderId: string, receiverId: string, content: string) {
    const message = new Message({
      roomId,
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content: content.trim()
    })
    await message.save()

    // Populate sender info để trả về cho client
    await message.populate('senderId', 'profile.firstname profile.lastname profile.avatar')
    return message
  },

  /**
   * Đánh dấu tất cả tin nhắn trong room là đã đọc (cho receiverId)
   */
  async markMessagesAsRead(roomId: string, receiverId: string) {
    await Message.updateMany(
      { roomId, receiverId: new mongoose.Types.ObjectId(receiverId), isRead: false },
      { $set: { isRead: true } }
    )
  }
}
