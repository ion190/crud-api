import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'
import { toJson, fromJson } from '../lib/jsonField'

const router = Router()
const prisma = new PrismaClient()

// Deserialize JSON columns back to JS values
function parse(h: Parameters<typeof toHabit>[0]) { return toHabit(h) }
function toHabit(h: {
  id: string; name: string; color: string; icon: string; frequency: string
  targetDays: string; tags: string; quota: string | null
  createdAt: string; archivedAt: string | null
}) {
  return {
    ...h,
    targetDays: fromJson<number[]>(h.targetDays) ?? [],
    tags: fromJson<string[]>(h.tags) ?? [],
    quota: fromJson(h.quota),
  }
}

// GET /habits?limit=20&offset=0&archived=false
router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const showArchived = req.query.archived === 'true'
    const where = showArchived ? {} : { archivedAt: null }
    const [rows, total] = await Promise.all([
      prisma.habit.findMany({ where, take: pg.limit, skip: pg.offset, orderBy: { createdAt: 'desc' } }),
      prisma.habit.count({ where }),
    ])
    res.json(paged(rows.map(parse), total, pg))
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', detail: String(err) })
  }
})

// GET /habits/:id
router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.habit.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Habit not found' }); return }
    res.json(parse(row))
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', detail: String(err) })
  }
})

// POST /habits
router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.habit.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: b.name, color: b.color, icon: b.icon,
        frequency: b.frequency,
        targetDays: toJson(b.targetDays ?? []),
        tags: toJson(b.tags ?? []),
        quota: b.quota ? toJson(b.quota) : null,
        createdAt: b.createdAt ?? new Date().toISOString(),
        archivedAt: b.archivedAt ?? null,
      },
    })
    res.status(201).json(parse(row))
  } catch (err) {
    res.status(400).json({ error: 'Bad request', detail: String(err) })
  }
})

// PUT /habits/:id
router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.habit.update({
      where: { id: req.params.id },
      data: {
        ...(b.name       !== undefined && { name: b.name }),
        ...(b.color      !== undefined && { color: b.color }),
        ...(b.icon       !== undefined && { icon: b.icon }),
        ...(b.frequency  !== undefined && { frequency: b.frequency }),
        ...(b.targetDays !== undefined && { targetDays: toJson(b.targetDays) }),
        ...(b.tags       !== undefined && { tags: toJson(b.tags) }),
        ...(b.quota      !== undefined && { quota: b.quota ? toJson(b.quota) : null }),
        ...(b.archivedAt !== undefined && { archivedAt: b.archivedAt }),
      },
    })
    res.json(parse(row))
  } catch (err) {
    res.status(404).json({ error: 'Habit not found or bad request', detail: String(err) })
  }
})

// DELETE /habits/:id
router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.habit.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: 'Habit not found', detail: String(err) })
  }
})

export default router