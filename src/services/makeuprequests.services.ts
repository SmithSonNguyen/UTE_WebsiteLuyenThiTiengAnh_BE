import Class from '~/models/schemas/Class.schema'
import MakeupRequest from '~/models/schemas/MakeupRequest.schema'
import Attendance from '~/models/schemas/Attendance.schema'
import mongoose from 'mongoose'
import { populate } from 'dotenv'

// Helpers (có thể đặt trong utils/timeUtils.ts)
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

const getFullEndDateTime = (date: Date, endTimeStr: string): Date => {
  const dateStr = new Date(date).toISOString().split('T')[0] // e.g., "2025-11-18"
  const fullStr = `${dateStr}T${endTimeStr}:00` // Local time (no Z)
  return new Date(fullStr)
}

class MakeupRequestsService {
  // Lấy các lớp học có thể đăng ký học bù cho một lớp cụ thể
  async getAvailableMakeupClasses(studentId: string, originalClassId: string, sessionNumber: number) {
    try {
      const result = await Class.getAvailableMakeupSlotsForSession(
        new mongoose.Types.ObjectId(studentId),
        new mongoose.Types.ObjectId(originalClassId),
        sessionNumber
      )
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to get available makeup classes: ${errorMessage}`)
    }
  }

  async registerMakeupClass(
    studentId: string,
    originalClassId: string,
    sessionNumberOriginal: number,
    dateOriginal: Date,
    makeupClassId: string,
    sessionNumberMakeup: number,
    dateMakeup: Date,
    timeMakeup: string
  ) {
    try {
      // Lấy attendanceId của buổi học gốc
      const attendance = await Attendance.findOne({
        classId: new mongoose.Types.ObjectId(originalClassId),
        sessionNumber: sessionNumberOriginal
        //date: dateOriginal
      })
      if (!attendance) {
        throw new Error('Attendance record for the original session not found')
      }
      const attendanceId = attendance._id as mongoose.Types.ObjectId

      // Tạo mới makeup request
      const makeupRequest = new MakeupRequest({
        userId: new mongoose.Types.ObjectId(studentId),
        originalSession: {
          classId: new mongoose.Types.ObjectId(originalClassId),
          sessionNumber: sessionNumberOriginal,
          date: dateOriginal,
          attendanceId: attendanceId
        },
        makeupSlot: {
          classId: new mongoose.Types.ObjectId(makeupClassId),
          sessionNumber: sessionNumberMakeup,
          date: dateMakeup,
          time: timeMakeup
        }
      })
      // Await save để đảm bảo document được persist
      const savedMakeupRequest = await makeupRequest.save()

      // Populate trên saved document (populate returns Promise, cần await)
      await savedMakeupRequest.populate({
        path: 'originalSession.classId',
        populate: [
          { path: 'courseId', select: 'title' },
          { path: 'instructor', select: '_id profile.firstname profile.lastname' }
        ]
      })
      await savedMakeupRequest.populate({
        path: 'makeupSlot.classId',
        populate: [{ path: 'instructor', select: '_id profile.firstname profile.lastname' }]
      })

      return { makeupRequest: savedMakeupRequest }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to register makeup class: ${errorMessage}`)
    }
  }
  async getMakeupRequestsByStudent(studentId: string) {
    try {
      const now = new Date()

      // Step 1: Tìm scheduled requests cần check
      const scheduledRequests = await MakeupRequest.find({
        userId: new mongoose.Types.ObjectId(studentId),
        status: 'scheduled'
      })
        .select('makeupSlot _id')
        .lean() // Tăng tốc, không cần full data

      // Step 2: Check và prepare updates
      const updates: Array<{ updateOne: { filter: any; update: any } }> = []
      scheduledRequests.forEach((req) => {
        const { date: slotDate, time: slotTime } = req.makeupSlot
        const [, endTimeStr] = slotTime.split(' - ') // End time, e.g., "21:30"

        const fullEnd = getFullEndDateTime(slotDate, endTimeStr)

        // Nếu quá end time → Update completed
        if (now >= fullEnd) {
          updates.push({
            updateOne: {
              filter: { _id: req._id },
              update: { $set: { status: 'completed' } }
            }
          })
        }
      })

      // Step 3: Bulk update nếu có
      if (updates.length > 0) {
        await MakeupRequest.bulkWrite(updates)
        console.log(`Updated ${updates.length} completed statuses for user ${studentId}`)
      }

      // Step 4: Fetch full list với populate (sau update)
      const makeupRequests = await MakeupRequest.find({ userId: new mongoose.Types.ObjectId(studentId) })
        .populate({
          path: 'originalSession.classId',
          populate: [
            { path: 'courseId', select: 'title' },
            { path: 'instructor', select: '_id profile.firstname profile.lastname' }
          ]
        })
        .populate({
          path: 'makeupSlot.classId',
          populate: [{ path: 'instructor', select: '_id profile.firstname profile.lastname' }]
        })
        .sort({ createdAt: -1 }) // Optional: Sort mới nhất trước

      return makeupRequests
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to get makeup requests: ${errorMessage}`)
    }
  }

  async cancelMakeupRequest(studentId: string, makeupRequestId: string) {
    try {
      const result = await MakeupRequest.deleteOne({
        _id: new mongoose.Types.ObjectId(makeupRequestId),
        userId: new mongoose.Types.ObjectId(studentId)
      })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to cancel makeup request: ${errorMessage}`)
    }
  }
}

const makeupRequestsService = new MakeupRequestsService()
export default makeupRequestsService
