import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
const j = JSON.stringify
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

async function main() {
  // ── Wipe ──────────────────────────────────────────────
  await prisma.$transaction([
    prisma.habitLog.deleteMany(),
    prisma.habit.deleteMany(),
    prisma.task.deleteMany(),
    prisma.completedWorkout.deleteMany(),
    prisma.workoutPlan.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.completedWorkSession.deleteMany(),
    prisma.workSessionCategory.deleteMany(),
    prisma.journalEntry.deleteMany(),
    prisma.calendarActivity.deleteMany(),
  ])

  // ── Work session categories ───────────────────────────
  const catWork   = { id: genId(), name: 'Work',       color: '#ef4444', icon: '💻', createdAt: new Date().toISOString() }
  const catMed    = { id: genId(), name: 'Meditation', color: '#22c55e', icon: '🧘', createdAt: new Date().toISOString() }
  const catRead   = { id: genId(), name: 'Reading',    color: '#3b82f6', icon: '📖', createdAt: new Date().toISOString() }
  await prisma.workSessionCategory.createMany({ data: [catWork, catMed, catRead] })

  // ── Habits ────────────────────────────────────────────
  const habits = [
    { id: genId(), name: 'Meditate',      color: '#22c55e', icon: '🧘', frequency: 'daily',  targetDays: j([0,1,2,3,4,5,6]), tags: j(['health','mindfulness']), quota: null,                              createdAt: daysAgo(100) },
    { id: genId(), name: 'Read 30min',    color: '#3b82f6', icon: '📖', frequency: 'daily',  targetDays: j([0,1,2,3,4,5,6]), tags: j(['personal','growth']),    quota: j({type:'time',target:30,unit:'min'}), createdAt: daysAgo(90)  },
    { id: genId(), name: 'Code 2hrs',     color: '#aa3bff', icon: '💻', frequency: 'daily',  targetDays: j([1,2,3,4,5]),     tags: j(['work','coding']),        quota: j({type:'time',target:2,unit:'hrs'}),  createdAt: daysAgo(80)  },
    { id: genId(), name: 'Gym workout',   color: '#ef4444', icon: '🏋️', frequency: 'weekly', targetDays: j([1,3,5]),         tags: j(['health','fitness']),     quota: null,                              createdAt: daysAgo(70)  },
    { id: genId(), name: 'Journal',       color: '#f59e0b', icon: '📝', frequency: 'daily',  targetDays: j([0,1,2,3,4,5,6]), tags: j(['personal','reflect']),   quota: null,                              createdAt: daysAgo(60)  },
    { id: genId(), name: 'Water 3L',      color: '#14b8a6', icon: '💧', frequency: 'daily',  targetDays: j([0,1,2,3,4,5,6]), tags: j(['health']),               quota: j({type:'quantity',target:3,unit:'L'}), createdAt: daysAgo(50)  },
    { id: genId(), name: 'Plan tomorrow', color: '#ec4899', icon: '📋', frequency: 'daily',  targetDays: j([0]),             tags: j(['work','productivity']),  quota: null,                              createdAt: daysAgo(40)  },
  ]
  await prisma.habit.createMany({ data: habits })

  // ── Habit logs (random ~30% per day over 30 days) ─────
  const logs: Array<{
    id: string
    habitId: string
    completedAt: string
    value: number | null
  }> = []
  for (const h of habits) {
    for (let d = 0; d < 30; d++) {
      if (Math.random() > 0.7) {
        const q = h.quota ? JSON.parse(h.quota) : null
        logs.push({
          id: genId(),
          habitId: h.id,
          completedAt: daysAgo(d),
          value: q ? Math.floor(Math.random() * q.target * 1.2) : null,
        })
      }
    }
  }
  await prisma.habitLog.createMany({ data: logs })

  // ── Tasks ─────────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      { id: genId(), title: 'Finish project proposal', description: 'Client deliverable',    dueDate: daysFromNow(3),  tags: j(['work','urgent']),    urgency: 'high',   importance: 'high',   createdAt: new Date().toISOString() },
      { id: genId(), title: 'Schedule dentist',        description: '',                      dueDate: daysFromNow(7),  tags: j(['health']),           urgency: 'medium', importance: 'medium', createdAt: daysAgo(2)                },
      { id: genId(), title: 'Buy groceries',           description: 'Milk, eggs, veggies',   dueDate: null,            tags: j(['personal']),         urgency: 'high',   importance: 'low',    createdAt: new Date().toISOString(), completedAt: daysAgo(1) },
      { id: genId(), title: 'Read React docs',         description: 'Hooks section',         dueDate: daysFromNow(5),  tags: j(['work','learning']),  urgency: 'low',    importance: 'high',   createdAt: new Date().toISOString() },
      { id: genId(), title: 'Call mom',                description: '',                      dueDate: null,            tags: j(['personal']),         urgency: 'medium', importance: 'medium', createdAt: new Date().toISOString() },
      { id: genId(), title: 'Update resume',           description: 'Add recent projects',   dueDate: daysFromNow(14), tags: j(['personal']),         urgency: 'low',    importance: 'high',   createdAt: new Date().toISOString() },
    ],
  })

  // ── Exercises + workout plan ──────────────────────────
  const exPushup = { id: genId(), name: 'Push-ups', category: 'Bodyweight', createdAt: new Date().toISOString() }
  const exPullup = { id: genId(), name: 'Pull-ups', category: 'Bodyweight', createdAt: new Date().toISOString() }
  const exSquat  = { id: genId(), name: 'Squats',   category: 'Legs',       createdAt: new Date().toISOString() }
  await prisma.exercise.createMany({ data: [exPushup, exPullup, exSquat] })

  const plan = await prisma.workoutPlan.create({
    data: {
      id: genId(), name: 'Full Body', description: 'Basic strength routine',
      exercises: j([
        { exerciseId: exPushup.id, sets: 3, reps: 10, weight: 0 },
        { exerciseId: exSquat.id,  sets: 3, reps: 12, weight: 0 },
      ]),
      createdAt: new Date().toISOString(),
    },
  })

  await prisma.completedWorkout.create({
    data: {
      id: genId(), workoutPlanId: plan.id, workoutPlanName: plan.name,
      startedAt: daysAgo(0), completedAt: new Date().toISOString(),
      totalDurationSeconds: 45 * 60,
      exercises: j([
        { exerciseId: exPushup.id, name: 'Push-ups', sets: [{ reps:12,weight:0,done:true },{ reps:10,weight:0,done:true },{ reps:8,weight:0,done:true }] },
        { exerciseId: exSquat.id,  name: 'Squats',   sets: [{ reps:12,weight:0,done:true },{ reps:10,weight:0,done:true },{ reps:8,weight:0,done:true }] },
      ]),
    },
  })

  // ── Completed work sessions ───────────────────────────
  await prisma.completedWorkSession.create({
    data: {
      id: genId(), categoryId: catWork.id, categoryName: catWork.name, categoryColor: catWork.color,
      plannedDurationSeconds: 3600, actualDurationSeconds: 3540, distractionSeconds: 120, productivityPct: 96.7,
      notes: 'Deep work on API layer', tags: j(['coding']), tasks: j([]),
      startedAt: daysAgo(1), endedAt: daysAgo(1),
    },
  })

  // ── Journal entries ───────────────────────────────────
  await prisma.journalEntry.createMany({
    data: [
      { id: genId(), period: 'daily', dateKey: new Date().toISOString().slice(0,10), title: 'Today', content: 'A productive day working on the API.', mood: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: genId(), period: 'weekly', dateKey: '2026-W19', title: 'Week 19', content: 'Good progress on the project.', mood: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  })

  // ── Calendar activities ───────────────────────────────
  await prisma.calendarActivity.createMany({
    data: [
      { id: genId(), title: 'Team standup', date: new Date().toISOString().slice(0,10), startTime: '09:00', endTime: '09:30', color: '#3b82f6', category: 'Work', createdAt: new Date().toISOString() },
      { id: genId(), title: 'Gym session',  date: new Date().toISOString().slice(0,10), startTime: '18:00', endTime: '19:30', color: '#ef4444', category: 'Fitness', createdAt: new Date().toISOString() },
    ],
  })

  console.log('✅ Seed complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())