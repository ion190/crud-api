import { Request } from 'express'

export interface Page { limit: number; offset: number }

export function paginate(req: Request): Page {
  const limit  = Math.min(Math.max(parseInt(req.query.limit  as string) || 20, 1), 100)
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0)
  return { limit, offset }
}

export function paged<T>(data: T[], total: number, { limit, offset }: Page) {
  return { data, total, limit, offset, hasMore: offset + limit < total }
}