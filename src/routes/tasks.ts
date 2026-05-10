import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'
import { toJson, fromJson } from '../lib/jsonField'

const router = Router()
const prisma = new PrismaClient()

const parse = (t: { tags: string; recurrence: string | null; [k: string]: unknown }) => ({
  ...t, tags: fromJson<string[]>(t.tags) ?? [], recurrence: fromJson(t.recurrence),
})

// GET /tasks?completed=false&limit=20&offset=0
router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const where: Record<string, unknown> = {}
    if (req.query.completed === 'false') where.completedAt = null
    if (req.query.completed === 'true')  where.NOT = { completedAt: null }
    if (req.query.urgency)    where.urgency    = req.query.urgency
    if (req.query.importance) where.importance = req.query.importance
    const [rows, total] = await Promise.all([
      prisma.task.findMany({ where, take: pg.limit, skip: pg.offset, orderBy: { createdAt: 'desc' } }),
      prisma.task.count({ where }),
    ])
    res.json(paged(rows.map(parse), total, pg))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(parse(row))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.task.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: b.title, description: b.description ?? null,
        dueDate: b.dueDate ?? null, notificationTime: b.notificationTime ?? null,
        completedAt: b.completedAt ?? null,
        createdAt: b.createdAt ?? new Date().toISOString(),
        tags: toJson(b.tags ?? []),
        urgency: b.urgency ?? 'medium', importance: b.importance ?? 'medium',
        archivedAt: b.archivedAt ?? null,
        recurrence: b.recurrence ? toJson(b.recurrence) : null,
      },
    })
    res.status(201).json(parse(row))
  } catch (err) { res.status(400).json({ error: String(err) }) }
})

router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(b.title        !== undefined && { title: b.title }),
        ...(b.description  !== undefined && { description: b.description }),
        ...(b.dueDate      !== undefined && { dueDate: b.dueDate }),
        ...(b.completedAt  !== undefined && { completedAt: b.completedAt }),
        ...(b.tags         !== undefined && { tags: toJson(b.tags) }),
        ...(b.urgency      !== undefined && { urgency: b.urgency }),
        ...(b.importance   !== undefined && { importance: b.importance }),
        ...(b.archivedAt   !== undefined && { archivedAt: b.archivedAt }),
        ...(b.recurrence   !== undefined && { recurrence: b.recurrence ? toJson(b.recurrence) : null }),
      },
    })
    res.json(parse(row))
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

export default router