import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation'

export const sixHundredNewVocabularyValidator = validate(
  checkSchema(
    {
      lesson: {
        in: ['query'],
        optional: true, // nếu không truyền thì load tất cả bài
        isInt: {
          options: { min: 1 },
          errorMessage: 'lesson must be a positive integer'
        },
        toInt: true // convert về number luôn để controller dùng
      }
    },
    ['query']
  )
)
