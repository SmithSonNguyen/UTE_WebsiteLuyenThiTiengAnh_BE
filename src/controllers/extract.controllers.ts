import { Request, Response, NextFunction } from 'express'
import { extractArticleService } from '~/services/extract.services'

export const extractArticleController = async (req: Request, res: Response) => {
  const url = req.query.url as string

  if (!url) {
    return res.status(400).json({ message: 'Missing URL' })
  }

  const result = await extractArticleService(url)
  res.json({
    message: 'Extract article successfully',
    data: result
  })
}
