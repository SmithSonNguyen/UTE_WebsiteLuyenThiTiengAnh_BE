import FreeEntryTest from '~/models/schemas/FreeEntryTest.schema'

class FreeEntryTestService {
  async getFullTest() {
    try {
      // lấy toàn bộ document trong collection
      const tests = await FreeEntryTest.find()
      return tests
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error while fetching FreeEntryTest: ${error.message}`)
      } else {
        throw new Error('Error while fetching FreeEntryTest: Unknown error')
      }
    }
  }
}

const freeentrytestService = new FreeEntryTestService()
export default freeentrytestService
