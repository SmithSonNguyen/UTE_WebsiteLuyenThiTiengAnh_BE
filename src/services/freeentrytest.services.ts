import FreeEntryTest from '~/models/schemas/FreeEntryTest.schema'

class FreeEntryTestService {
  async sortData() {
    // Lấy toàn bộ document, sắp xếp theo part và sắp xếp từng mảng questions theo number
    const tests = await FreeEntryTest.aggregate([
      {
        $addFields: {
          questions: {
            $sortArray: {
              input: '$questions',
              sortBy: { number: 1 }
            }
          }
        }
      },
      {
        $sort: {
          part: 1,
          'questions.0.number': 1 // Sắp xếp theo số câu hỏi đầu tiên
        }
      }
    ])
    return tests
  }
  async getFullTest() {
    try {
      const tests = await this.sortData()
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
