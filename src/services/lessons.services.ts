// src/services/lessons.services.ts
import Vocabulary from '~/models/schemas/Vocabulary.schema'

class LessonsService {
  async getSixHundredNewVocabulary(lesson?: number) {
    const filter: Record<string, any> = {}
    if (lesson) {
      filter.lesson = lesson
    }

    // Query MongoDB
    const vocabularies = await Vocabulary.find(filter).sort({ _id: 1 })

    return {
      message: 'Get vocabularies successfully',
      data: vocabularies
    }
  }
}

const lessonsService = new LessonsService()
export default lessonsService
