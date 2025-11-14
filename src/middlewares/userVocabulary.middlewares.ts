import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation'
import HTTP_STATUS from '~/constants/httpStatus'

/**
 * Validator cho việc lưu từ vựng
 */
export const saveVocabularyValidator = validate(
  checkSchema(
    {
      word: {
        notEmpty: {
          errorMessage: 'Word is required'
        },
        isString: {
          errorMessage: 'Word must be a string'
        },
        trim: true,
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: 'Word must be between 1 and 200 characters'
        }
      },
      explanation: {
        notEmpty: {
          errorMessage: 'Explanation is required'
        },
        isString: {
          errorMessage: 'Explanation must be a string'
        },
        trim: true,
        isLength: {
          options: { min: 1, max: 1000 },
          errorMessage: 'Explanation must be between 1 and 1000 characters'
        }
      },
      sourceLanguage: {
        optional: true,
        isString: {
          errorMessage: 'Source language must be a string'
        },
        trim: true
      },
      contextExample: {
        optional: true,
        isString: {
          errorMessage: 'Context example must be a string'
        },
        trim: true,
        isLength: {
          options: { max: 500 },
          errorMessage: 'Context example must not exceed 500 characters'
        }
      },
      tags: {
        optional: true,
        isArray: {
          errorMessage: 'Tags must be an array'
        }
      },
      'tags.*': {
        optional: true,
        isString: {
          errorMessage: 'Each tag must be a string'
        },
        trim: true
      }
    },
    ['body']
  )
)

/**
 * Validator cho query parameters khi lấy danh sách từ vựng
 */
export const getVocabulariesValidator = validate(
  checkSchema(
    {
      page: {
        optional: true,
        isInt: {
          options: { min: 1 },
          errorMessage: 'Page must be a positive integer'
        },
        toInt: true
      },
      limit: {
        optional: true,
        isInt: {
          options: { min: 1, max: 100 },
          errorMessage: 'Limit must be between 1 and 100'
        },
        toInt: true
      },
      search: {
        optional: true,
        isString: {
          errorMessage: 'Search must be a string'
        },
        trim: true
      },
      tags: {
        optional: true,
        isString: {
          errorMessage: 'Tags must be a comma-separated string'
        }
      },
      isFavorite: {
        optional: true,
        isIn: {
          options: [['true', 'false']],
          errorMessage: 'isFavorite must be true or false'
        }
      },
      sortBy: {
        optional: true,
        isIn: {
          options: [['createdAt', 'word']],
          errorMessage: 'sortBy must be createdAt or word'
        }
      },
      sortOrder: {
        optional: true,
        isIn: {
          options: [['asc', 'desc']],
          errorMessage: 'sortOrder must be asc or desc'
        }
      }
    },
    ['query']
  )
)

/**
 * Validator cho vocabularyId trong params
 */
export const vocabularyIdValidator = validate(
  checkSchema(
    {
      vocabularyId: {
        notEmpty: {
          errorMessage: 'Vocabulary ID is required'
        },
        isMongoId: {
          errorMessage: 'Invalid vocabulary ID format'
        }
      }
    },
    ['params']
  )
)
