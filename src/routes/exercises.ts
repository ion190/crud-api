import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'

const router = Router()
const prisma = new PrismaClient()

router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const where = req.query.category ? { category: String(req.query.category) } : {}
    const [rows, total] = await Promise.all([
      prisma.exercise.findMany({ where, take: pg.limit, skip: pg.offset }),
      prisma.exercise.count({ where }),
    ])
    res.json(paged(rows, total, pg))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.exercise.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(row)
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.exercise.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: b.name, category: b.category,
        description: b.description ?? null, imageUrl: b.imageUrl ?? null,
        createdAt: b.createdAt ?? new Date().toISOString(),
      },
    })
    res.status(201).json(row)
  } catch (err) { res.status(400).json({ error: String(err) }) }
})

router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.exercise.update({
      where: { id: req.params.id },
      data: {
        ...(b.name !== undefined        && { name: b.name }),
        ...(b.category !== undefined    && { category: b.category }),
        ...(b.description !== undefined && { description: b.description }),
        ...(b.imageUrl !== undefined    && { imageUrl: b.imageUrl }),
      },
    })
    res.json(row)
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.exercise.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

export default router