import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'
import { toJson, fromJson } from '../lib/jsonField'

const router = Router()
const prisma = new PrismaClient()
const parse = (r: { exercises: string; [k: string]: unknown }) =>
  ({ ...r, exercises: fromJson(r.exercises) ?? [] })

router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const where = req.query.planId ? { workoutPlanId: String(req.query.planId) } : {}
    const [rows, total] = await Promise.all([
      prisma.completedWorkout.findMany({ where, take: pg.limit, skip: pg.offset, orderBy: { startedAt: 'desc' } }),
      prisma.completedWorkout.count({ where }),
    ])
    res.json(paged(rows.map(parse), total, pg))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.completedWorkout.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(parse(row))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.completedWorkout.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        workoutPlanId: b.workoutPlanId, workoutPlanName: b.workoutPlanName,
        startedAt: b.startedAt, completedAt: b.completedAt ?? new Date().toISOString(),
        totalDurationSeconds: b.totalDurationSeconds ?? 0,
        exercises: toJson(b.exercises ?? []),
      },
    })
    res.status(201).json(parse(row))
  } catch (err) { res.status(400).json({ error: String(err) }) }
})

router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.completedWorkout.update({
      where: { id: req.params.id },
      data: {
        ...(b.totalDurationSeconds !== undefined && { totalDurationSeconds: b.totalDurationSeconds }),
        ...(b.exercises !== undefined && { exercises: toJson(b.exercises) }),
        ...(b.completedAt !== undefined && { completedAt: b.completedAt }),
      },
    })
    res.json(parse(row))
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.completedWorkout.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

export default router