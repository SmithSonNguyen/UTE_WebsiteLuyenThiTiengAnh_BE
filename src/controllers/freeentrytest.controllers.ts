import { Request, Response, NextFunction } from 'express'
import freeentrytestService from '~/services/freeentrytest.services'

export const fulltestController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await freeentrytestService.getFullTest()
  return res.status(200).json(result)
}
