import { Request, Response, NextFunction } from 'express'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'

/**
 * Middleware kiểm tra quyền Admin
 * Sử dụng sau accessTokenValidator để đảm bảo req.decoded_authorization tồn tại
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded_authorization = req.decoded_authorization

    // Kiểm tra token có tồn tại không
    if (!decoded_authorization) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }

    // Kiểm tra role có phải admin không
    if (decoded_authorization.role !== 'admin') {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.PERMISSION_DENIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware kiểm tra quyền Instructor
 */
export const requireInstructor = (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded_authorization = req.decoded_authorization

    if (!decoded_authorization) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }

    if (decoded_authorization.role !== 'instructor') {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.PERMISSION_DENIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware kiểm tra nhiều roles (flexible)
 * @param allowedRoles - Mảng các role được phép
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const decoded_authorization = req.decoded_authorization

      if (!decoded_authorization) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }

      if (!allowedRoles.includes(decoded_authorization.role as string)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.PERMISSION_DENIED,
          status: HTTP_STATUS.FORBIDDEN
        })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
