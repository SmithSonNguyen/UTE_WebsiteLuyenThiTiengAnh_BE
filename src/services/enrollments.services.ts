import mongoose from 'mongoose'
import Enrollment from '~/models/schemas/Enrollment.schema'
import Class from '~/models/schemas/Class.schema'
import MakeupRequest from '~/models/schemas/MakeupRequest.schema'

// Helper: Get today's date normalized (midnight local/UTC - adjust for timezone if needed)
const getTodayDate = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

// Helper: Check if a date matches today (ignoring time)
const isToday = (sessionDate: Date): boolean => {
  const today = getTodayDate()
  const sessionDay = new Date(sessionDate)
  sessionDay.setHours(0, 0, 0, 0)
  return sessionDay.getTime() === today.getTime()
}

// Helper: Parse time string to minutes since midnight for sorting
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

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
  },

  getTodaySchedule: async (studentId: string) => {
    try {
      const today = getTodayDate()

      // Step 1: Get regular sessions for today
      const enrollments = await Enrollment.find({
        studentId: new mongoose.Types.ObjectId(studentId),
        status: 'enrolled'
      }).populate({
        path: 'classId',
        match: { status: { $in: ['scheduled', 'ongoing'] } }, // Only active classes
        populate: [
          { path: 'classId.courseId', select: '_id title level' },
          { path: 'classId.instructor', select: 'profile' }
        ]
      })
      const regularSessions: Array<{
        type: 'regular'
        classId: mongoose.Types.ObjectId
        classCode: string
        courseTitle: string
        sessionNumber: number
        date: Date
        time: string
        instructor: { profile: { firstname: string; lastname: string } }
        meetLink: string
        status: 'regular'
      }> = []

      for (const enroll of enrollments) {
        const cls = enroll.classId as any // Typed as populated Class
        if (!cls) continue

        // Use existing method to get detailed schedule (generates sessions)
        const classInfo = await Class.getDetailedScheduleForStudent(cls._id, new mongoose.Types.ObjectId(studentId))

        // Filter sessions for today
        const todaySessions = classInfo.sessions.filter((session: any) => isToday(new Date(session.date)))

        todaySessions.forEach((session: any) => {
          regularSessions.push({
            type: 'regular',
            classId: cls._id,
            classCode: cls.classCode,
            courseTitle: classInfo.courseId.title,
            sessionNumber: session.sessionNumber,
            date: session.date,
            time: classInfo.time, // Or session-specific if available
            instructor: classInfo.instructor,
            meetLink: classInfo.meetLink,
            status: 'regular'
          })
        })
      }

      // Step 2: Get makeup sessions for today (integrate lazy update from getMakeupRequestsByStudent logic)
      const makeupRequests = await MakeupRequest.find({
        userId: new mongoose.Types.ObjectId(studentId),
        status: 'scheduled'
      })
        .populate({
          path: 'makeupSlot.classId',
          populate: [
            { path: 'courseId', select: '_id title level' },
            { path: 'instructor', select: 'profile' }
          ]
        })
        .lean()

      // Lazy update: Check and update completed statuses (reuse logic from getMakeupRequestsByStudent)
      const now = new Date()
      const updates: Array<{ updateOne: { filter: any; update: any } }> = []
      makeupRequests.forEach((req: any) => {
        const { date: slotDate, time: slotTime } = req.makeupSlot
        const [, endTimeStr] = slotTime.split(' - ') // End time

        // Reuse your getFullEndDateTime helper (assume imported or inline)
        const dateStr = new Date(slotDate).toISOString().split('T')[0]
        const fullEndStr = `${dateStr}T${endTimeStr}:00`
        const fullEnd = new Date(fullEndStr)

        if (now >= fullEnd) {
          updates.push({
            updateOne: {
              filter: { _id: req._id },
              update: { $set: { status: 'completed' } }
            }
          })
        }
      })

      if (updates.length > 0) {
        await MakeupRequest.bulkWrite(updates)
      }

      // Filter makeup for today (after potential update)
      const todayMakeupRequests = makeupRequests.filter(
        (req: any) => isToday(req.makeupSlot.date) && ['scheduled', 'completed'].includes(req.status) // Include completed if needed
      )

      const makeupSessions: Array<{
        type: 'makeup'
        requestId: mongoose.Types.ObjectId
        originalSessionId: mongoose.Types.ObjectId
        classId: mongoose.Types.ObjectId
        classCode: string
        courseTitle: string
        sessionNumber: number
        date: Date
        time: string
        instructor: { profile: { firstname: string; lastname: string } }
        meetLink: string
        status: string
      }> = todayMakeupRequests.map((req: any) => ({
        type: 'makeup',
        requestId: req._id,
        originalSessionId: req.originalSession._id,
        classId: req.makeupSlot.classId._id,
        classCode: req.makeupSlot.classId.classCode,
        courseTitle: req.makeupSlot.classId.courseId.title,
        sessionNumber: req.makeupSlot.sessionNumber,
        date: req.makeupSlot.date,
        time: req.makeupSlot.time,
        instructor: req.makeupSlot.classId.instructor,
        meetLink: req.makeupSlot.classId.schedule.meetLink,
        status: req.status
      }))

      // Step 3: Combine regular + makeup sessions
      const allSessions = [...regularSessions, ...makeupSessions]

      // Step 4: Sort by start time (parse "HH:MM" from time)
      allSessions.sort((a, b) => {
        const startTimeA = a.time.split(' - ')[0] // e.g., "18:00"
        const startTimeB = b.time.split(' - ')[0]
        return timeToMinutes(startTimeA) - timeToMinutes(startTimeB)
      })

      return {
        today: today.toISOString().split('T')[0], // YYYY-MM-DD string
        sessions: allSessions,
        total: allSessions.length,
        regularCount: regularSessions.length,
        makeupCount: makeupSessions.length
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to get today schedule: ${errorMessage}`)
    }
  }
}
