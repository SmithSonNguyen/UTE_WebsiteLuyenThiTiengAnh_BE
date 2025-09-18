import { Request, Response } from 'express'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import lessonsService from '~/services/lessons.services'

export const getSixHundredNewVocabularyController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  const result = await lessonsService.getSixHundredNewVocabulary()
  return res.status(200).json(result)
}
