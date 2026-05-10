import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'
import { toJson, fromJson } from '../lib/jsonField'

const router = Router()
const prisma = new PrismaClient()
const parse = (r: { tags: string | null; tasks: string; [k: string]: unknown }) =>
  ({ ...r, tags: fromJson(r.tags) ?? [], tasks: fromJson(r.tasks) ?? [] })

router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const where = req.query.categoryId ? { categoryId: String(req.query.categoryId) } : {}
    const [rows, total] = await Promise.all([
      prisma.completedWorkSession.findMany({ where, take: pg.limit, skip: pg.offset, orderBy: { startedAt: 'desc' } }),
      prisma.completedWorkSession.count({ where }),
    ])
    res.json(paged(rows.map(parse), total, pg))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.completedWorkSession.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(parse(row))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.completedWorkSession.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        categoryId: b.categoryId, categoryName: b.categoryName, categoryColor: b.categoryColor,
        plannedDurationSeconds: b.plannedDurationSeconds ?? 0,
        actualDurationSeconds: b.actualDurationSeconds ?? 0,
        distractionSeconds: b.distractionSeconds ?? 0,
        productivityPct: b.productivityPct ?? 0,
        notes: b.notes ?? null,
        tags: b.tags ? toJson(b.tags) : null,
        tasks: toJson(b.tasks ?? []),
        startedAt: b.startedAt, endedAt: b.endedAt ?? new Date().toISOString(),
      },
    })
    res.status(201).json(parse(row))
  } catch (err) { res.status(400).json({ error: String(err) }) }
})

router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.completedWorkSession.update({
      where: { id: req.params.id },
      data: {
        ...(b.notes !== undefined && { notes: b.notes }),
        ...(b.tags  !== undefined && { tags: toJson(b.tags) }),
        ...(b.tasks !== undefined && { tasks: toJson(b.tasks) }),
        ...(b.productivityPct !== undefined && { productivityPct: b.productivityPct }),
      },
    })
    res.json(parse(row))
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.completedWorkSession.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

export default router