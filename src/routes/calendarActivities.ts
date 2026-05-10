import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'

const router = Router()
const prisma = new PrismaClient()

// GET /calendar-activities?date=2026-05-10
router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const where = req.query.date ? { date: String(req.query.date) } : {}
    const [rows, total] = await Promise.all([
      prisma.calendarActivity.findMany({ where, take: pg.limit, skip: pg.offset, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] }),
      prisma.calendarActivity.count({ where }),
    ])
    res.json(paged(rows, total, pg))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.calendarActivity.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(row)
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.calendarActivity.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: b.title, date: b.date, startTime: b.startTime, endTime: b.endTime,
        color: b.color, category: b.category ?? null, notes: b.notes ?? null,
        createdAt: b.createdAt ?? new Date().toISOString(),
      },
    })
    res.status(201).json(row)
  } catch (err) { res.status(400).json({ error: String(err) }) }
})

router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.calendarActivity.update({
      where: { id: req.params.id },
      data: {
        ...(b.title     !== undefined && { title: b.title }),
        ...(b.date      !== undefined && { date: b.date }),
        ...(b.startTime !== undefined && { startTime: b.startTime }),
        ...(b.endTime   !== undefined && { endTime: b.endTime }),
        ...(b.color     !== undefined && { color: b.color }),
        ...(b.category  !== undefined && { category: b.category }),
        ...(b.notes     !== undefined && { notes: b.notes }),
      },
    })
    res.json(row)
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.calendarActivity.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

export default router