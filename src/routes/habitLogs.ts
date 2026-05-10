import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'

const router = Router()
const prisma = new PrismaClient()

// GET /habit-logs?habitId=xxx&limit=20&offset=0
router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const where = req.query.habitId ? { habitId: String(req.query.habitId) } : {}
    const [rows, total] = await Promise.all([
      prisma.habitLog.findMany({ where, take: pg.limit, skip: pg.offset, orderBy: { completedAt: 'desc' } }),
      prisma.habitLog.count({ where }),
    ])
    res.json(paged(rows, total, pg))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.habitLog.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(row)
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.habitLog.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        habitId: b.habitId, completedAt: b.completedAt ?? new Date().toISOString(),
        note: b.note ?? null, value: b.value ?? null,
      },
    })
    res.status(201).json(row)
  } catch (err) { res.status(400).json({ error: String(err) }) }
})

router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.habitLog.update({
      where: { id: req.params.id },
      data: {
        ...(b.completedAt !== undefined && { completedAt: b.completedAt }),
        ...(b.note !== undefined && { note: b.note }),
        ...(b.value !== undefined && { value: b.value }),
      },
    })
    res.json(row)
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.habitLog.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

export default router