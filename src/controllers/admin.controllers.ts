import { Router } from 'express'
import { Request, Response, NextFunction } from 'express'

export const dashboardController = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'Welcome admin!' })
}
