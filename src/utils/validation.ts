import express from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// can be reused by many routes
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // sequential processing, stops running validations chain if one fails.
    await validation.run(req)
    const errors = validationResult(req)
    // Không có lỗi thì next, tiếp tục request
    if (errors.isEmpty()) {
      return next()
    }
    const errorsOject = errors.mapped() //chuyển về mapped để gom lỗi lại, array thì không gom được

    const entityError = new EntityError({ errors: {} })
    for (const key in errorsOject) {
      //lặp những cái lỗi đã được mapped lại, ở đây key là confirm_password{}, email{}
      const { msg } = errorsOject[key]
      // Trả về lỗi không phải lỗi do validate
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        // msg là Obj có kiểu là ErrorWithStatus, và nếu nó thoả thì nó cx có status luôn, check coi có phải là 422 không
        return next(msg) //dồn hết error vào next, để cho nó chạy vào error handler ở index.ts
      }
      entityError.errors[key] = errorsOject[key] //lưu lại lỗi vào entityError.errors, key là confirm_password{}, email{}
    }

    next()
  }
}
