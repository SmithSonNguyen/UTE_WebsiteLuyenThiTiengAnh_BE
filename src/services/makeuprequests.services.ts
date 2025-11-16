import Class from '~/models/schemas/Class.schema'
import mongoose from 'mongoose'

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
}

const makeupRequestsService = new MakeupRequestsService()
export default makeupRequestsService
