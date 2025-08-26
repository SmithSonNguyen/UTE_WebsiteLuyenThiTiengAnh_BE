import { Request } from 'express'
import { IUser } from './models/schemas/User.schema'

// Mở rộng interface Request để có thuộc tính user
declare module 'express' {
  interface Request {
    user?: IUser
  }
}
