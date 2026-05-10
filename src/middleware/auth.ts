import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type Role = 'ADMIN' | 'WRITER' | 'VISITOR'
export type Permission = 'READ' | 'WRITE' | 'DELETE'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN:   ['READ', 'WRITE', 'DELETE'],
  WRITER:  ['READ', 'WRITE'],
  VISITOR: ['READ'],
}

export interface JwtPayload {
  sub: string
  role: Role
  permissions: Permission[]
  iat?: number
  exp?: number
}

// Augment Express Request so req.user is typed everywhere
declare global {
  namespace Express {
    interface Request { user?: JwtPayload }
  }
}

export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization: Bearer <token>' })
    return
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload
    next()
  } catch {
    res.status(401).json({ error: 'Token is invalid or expired' })
  }
}

export function can(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.permissions.includes(permission)) {
      res.status(403).json({ error: `Permission '${permission}' required` })
      return
    }
    next()
  }
}