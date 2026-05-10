import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET, ROLE_PERMISSIONS, Role, Permission } from '../middleware/auth'

const router = Router()

/**
 * POST /token
 * Body: { role: "ADMIN"|"WRITER"|"VISITOR" }
 *    OR { permissions: ["READ","WRITE","DELETE"] }
 *
 * Returns a JWT that expires in 1 minute (for demo purposes).
 * Increase expiresIn in production.
 */
router.post('/', (req, res) => {
  const { role, permissions } = req.body as { role?: Role; permissions?: Permission[] }

  let resolvedRole: Role
  let resolvedPermissions: Permission[]

  if (role && Object.keys(ROLE_PERMISSIONS).includes(role)) {
    resolvedRole = role
    resolvedPermissions = ROLE_PERMISSIONS[role]
  } else if (Array.isArray(permissions) && permissions.length > 0) {
    const valid: Permission[] = ['READ', 'WRITE', 'DELETE']
    resolvedPermissions = permissions.filter((p) => valid.includes(p))
    // infer closest role for labelling
    resolvedRole = resolvedPermissions.includes('DELETE')
      ? 'ADMIN'
      : resolvedPermissions.includes('WRITE')
      ? 'WRITER'
      : 'VISITOR'
  } else {
    res.status(400).json({
      error: 'Provide { role: "ADMIN"|"WRITER"|"VISITOR" } or { permissions: [...] }',
    })
    return
  }

  const token = jwt.sign(
    { sub: 'user', role: resolvedRole, permissions: resolvedPermissions },
    JWT_SECRET,
    { expiresIn: '1m' },   // 1 minute
  )

  res.json({ token, role: resolvedRole, permissions: resolvedPermissions, expiresIn: '1m' })
})

export default router