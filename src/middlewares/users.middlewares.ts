import { check, checkSchema, ParamSchema } from 'express-validator'
import { USERS_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { config } from 'dotenv'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { verifyToken } from '~/utils/jwt'
import { JsonWebTokenError } from 'jsonwebtoken'
import usersService from '~/services/users.services'
config()

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await User.findOne({ 'profile.email': value })
            if (!user) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }

            // So sánh password hash
            //const hashedPassword = hashPassword(req.body.password)
            if (user.password !== req.body.password) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }

            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isLength: {
          options: { min: 6, max: 50 },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_6_TO_100
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            returnScore: false
          }
        },
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
      }
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1] //giải thích trong notion
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              req.decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const registerValidation = validate(
  checkSchema(
    {
      lastname: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.LAST_NAME_IS_REQUIRED
        },
        isLength: { options: { min: 3, max: 50 }, errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_1_TO_100 },
        trim: true
      },
      firstname: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.FIRST_NAME_IS_REQUIRED
        },
        isLength: { options: { min: 3, max: 50 }, errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_1_TO_100 },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            // Check if email already exists in database
            const isExistEmail = await usersService.checkEmailExist(value)
            if (isExistEmail) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              })
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: { errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRING },
        isLength: { options: { min: 6, max: 100 }, errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_6_TO_100 },
        isStrongPassword: {
          options: { minSymbols: 1, minUppercase: 1, minNumbers: 1 },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      },
      confirm_password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: { errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRING },
        isLength: {
          options: { min: 6, max: 100 },
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_6_TO_100
        },
        isStrongPassword: {
          options: { minSymbols: 1, minUppercase: 1, minNumbers: 1 },
          errorMessage: USERS_MESSAGES.CONFRIM_PASSWORD_MUST_BE_STRONG
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_DOES_NOT_MATCH)
            }
            return true
          }
        }
      },
      birthday: {
        isISO8601: {
          options: { strict: true, strictSeparator: true },
          errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      }
    },
    ['body']
  )
)
