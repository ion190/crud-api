import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'

const router = Router()
const prisma = new PrismaClient()

// GET /journal-entries?period=daily&dateKey=2026-05-10
router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const where: Record<string, unknown> = {}
    if (req.query.period)  where.period  = req.query.period
    if (req.query.dateKey) where.dateKey = req.query.dateKey
    const [rows, total] = await Promise.all([
      prisma.journalEntry.findMany({ where, take: pg.limit, skip: pg.offset, orderBy: { dateKey: 'desc' } }),
      prisma.journalEntry.count({ where }),
    ])
    res.json(paged(rows, total, pg))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.journalEntry.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(row)
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const now = new Date().toISOString()
    const row = await prisma.journalEntry.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        period: b.period, dateKey: b.dateKey, title: b.title ?? null,
        content: b.content, mood: b.mood ?? null,
        createdAt: b.createdAt ?? now, updatedAt: b.updatedAt ?? now,
      },
    })
    res.status(201).json(row)
  } catch (err) { res.status(400).json({ error: String(err) }) }
})

router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.journalEntry.update({
      where: { id: req.params.id },
      data: {
        ...(b.title   !== undefined && { title: b.title }),
        ...(b.content !== undefined && { content: b.content }),
        ...(b.mood    !== undefined && { mood: b.mood }),
        updatedAt: new Date().toISOString(),
      },
    })
    res.json(row)
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.journalEntry.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

export default router