import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { spec } from './swagger'

import tokenRouter               from './routes/token'
import habitsRouter              from './routes/habits'
import habitLogsRouter           from './routes/habitLogs'
import tasksRouter               from './routes/tasks'
import exercisesRouter           from './routes/exercises'
import workoutPlansRouter        from './routes/workoutPlans'
import completedWorkoutsRouter   from './routes/completedWorkouts'
import workSessionCatsRouter     from './routes/workSessionCategories'
import completedWorkSessionsRouter from './routes/completedWorkSessions'
import journalEntriesRouter      from './routes/journalEntries'
import calendarActivitiesRouter  from './routes/calendarActivities'

const app  = express()
const PORT = process.env.PORT ?? 3001

// ── Middleware ────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))

// ── Swagger UI ───────────────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))
app.get('/docs.json', (_req, res) => res.json(spec))

// ── Routes ────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))
app.use('/token',                    tokenRouter)
app.use('/habits',                   habitsRouter)
app.use('/habit-logs',               habitLogsRouter)
app.use('/tasks',                    tasksRouter)
app.use('/exercises',                exercisesRouter)
app.use('/workout-plans',            workoutPlansRouter)
app.use('/completed-workouts',       completedWorkoutsRouter)
app.use('/work-session-categories',  workSessionCatsRouter)
app.use('/completed-work-sessions',  completedWorkSessionsRouter)
app.use('/journal-entries',          journalEntriesRouter)
app.use('/calendar-activities',      calendarActivitiesRouter)

// ── 404 fallthrough ───────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

app.listen(PORT, () => {
  console.log(`🚀  API      → http://localhost:${PORT}`)
  console.log(`📖  Swagger  → http://localhost:${PORT}/docs`)
})