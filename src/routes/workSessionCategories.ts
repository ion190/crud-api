import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, can } from '../middleware/auth'
import { paginate, paged } from '../lib/paginate'

const router = Router()
const prisma = new PrismaClient()

router.get('/', requireAuth, can('READ'), async (req, res) => {
  try {
    const pg = paginate(req)
    const [rows, total] = await Promise.all([
      prisma.workSessionCategory.findMany({ take: pg.limit, skip: pg.offset }),
      prisma.workSessionCategory.count(),
    ])
    res.json(paged(rows, total, pg))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.get('/:id', requireAuth, can('READ'), async (req, res) => {
  try {
    const row = await prisma.workSessionCategory.findUnique({ where: { id: req.params.id } })
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(row)
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

router.post('/', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.workSessionCategory.create({
      data: {
        id: b.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: b.name, color: b.color, icon: b.icon,
        createdAt: b.createdAt ?? new Date().toISOString(),
      },
    })
    res.status(201).json(row)
  } catch (err) { res.status(400).json({ error: String(err) }) }
})

router.put('/:id', requireAuth, can('WRITE'), async (req, res) => {
  try {
    const b = req.body
    const row = await prisma.workSessionCategory.update({
      where: { id: req.params.id },
      data: {
        ...(b.name  !== undefined && { name: b.name }),
        ...(b.color !== undefined && { color: b.color }),
        ...(b.icon  !== undefined && { icon: b.icon }),
      },
    })
    res.json(row)
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

router.delete('/:id', requireAuth, can('DELETE'), async (req, res) => {
  try {
    await prisma.workSessionCategory.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { res.status(404).json({ error: String(err) }) }
})

export default router