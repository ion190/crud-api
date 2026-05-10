import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'
import { toJson, fromJson } from '../lib/jsonField'

const router = Router()
const prisma = new PrismaClient()
const parse = (p: { exercises: string; [k: string]: unknown }) =>
  ({ ...p, exercises: fromJson(p.exercises) ?? [] })

router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const [rows, total] = await Promise.all([
      prisma.workoutPlan.findMany({ take: pg.limit, skip: pg.offset, orderBy: { createdAt: 'desc' } }),
      prisma.workoutPlan.count(),
    ])
    res.json(paged(rows.map(parse), total, pg))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.workoutPlan.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(parse(row))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.workoutPlan.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: b.name, description: b.description ?? null,
        exercises: toJson(b.exercises ?? []),
        createdAt: b.createdAt ?? new Date().toISOString(),
      },
    })
    res.status(201).json(parse(row))
  } catch (err) { res.status(400).json({ error: String(err) }) }
})

router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.workoutPlan.update({
      where: { id: req.params.id },
      data: {
        ...(b.name        !== undefined && { name: b.name }),
        ...(b.description !== undefined && { description: b.description }),
        ...(b.exercises   !== undefined && { exercises: toJson(b.exercises) }),
      },
    })
    res.json(parse(row))
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.workoutPlan.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

export default router