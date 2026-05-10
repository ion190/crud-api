import { OpenAPIV3 } from 'openapi-types'

export const spec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: 'Rituals API', version: '1.0.0', description: 'CRUD API for the Rituals habits app' },
  servers: [{ url: 'http://localhost:3001', description: 'Local dev' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' }, limit: { type: 'integer' },
          offset: { type: 'integer' }, hasMore: { type: 'boolean' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ── Token ─────────────────────────────────────────
    '/token': {
      post: {
        tags: ['Auth'],
        summary: 'Obtain a JWT (expires in 1 minute)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { type: 'object', properties: { role: { type: 'string', enum: ['ADMIN','WRITER','VISITOR'] } }, required: ['role'] },
                  { type: 'object', properties: { permissions: { type: 'array', items: { type: 'string', enum: ['READ','WRITE','DELETE'] } } }, required: ['permissions'] },
                ],
              },
              examples: {
                admin: { summary: 'Admin role', value: { role: 'ADMIN' } },
                visitor: { summary: 'Visitor (read-only)', value: { role: 'VISITOR' } },
                custom: { summary: 'Custom permissions', value: { permissions: ['READ','WRITE'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'JWT issued', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, role: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } }, expiresIn: { type: 'string' } } } } } },
          400: { description: 'Invalid body' },
        },
      },
    },

    // ── Habits ────────────────────────────────────────
    '/habits': {
      get: {
        tags: ['Habits'], summary: 'List habits (paginated)',
        parameters: [
          { in: 'query', name: 'limit',    schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'offset',   schema: { type: 'integer', default: 0  } },
          { in: 'query', name: 'archived', schema: { type: 'boolean', default: false } },
        ],
        responses: { 200: { description: 'Paginated habits' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        tags: ['Habits'], summary: 'Create habit (requires WRITE)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name','color','icon','frequency','targetDays'], properties: { name:{type:'string'}, color:{type:'string'}, icon:{type:'string'}, frequency:{type:'string',enum:['daily','weekly','custom']}, targetDays:{type:'array',items:{type:'integer'}}, tags:{type:'array',items:{type:'string'}}, quota:{type:'object'} } } } } },
        responses: { 201: { description: 'Created' }, 400: { description: 'Bad request' }, 403: { description: 'Forbidden' } },
      },
    },
    '/habits/{id}': {
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      get:    { tags:['Habits'], summary:'Get habit by ID',      responses:{200:{description:'Habit'},404:{description:'Not found'}} },
      put:    { tags:['Habits'], summary:'Update habit (WRITE)',  requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}}, responses:{200:{description:'Updated'},403:{description:'Forbidden'},404:{description:'Not found'}} },
      delete: { tags:['Habits'], summary:'Delete habit (DELETE)', responses:{204:{description:'Deleted'},403:{description:'Forbidden'},404:{description:'Not found'}} },
    },

    // ── Habit Logs ────────────────────────────────────
    '/habit-logs': {
      get:  { tags:['HabitLogs'], summary:'List logs', parameters:[{in:'query',name:'habitId',schema:{type:'string'}},{in:'query',name:'limit',schema:{type:'integer',default:20}},{in:'query',name:'offset',schema:{type:'integer',default:0}}], responses:{200:{description:'Paginated logs'}} },
      post: { tags:['HabitLogs'], summary:'Log a completion (WRITE)', requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['habitId'],properties:{habitId:{type:'string'},completedAt:{type:'string'},note:{type:'string'},value:{type:'number'}}}}}}, responses:{201:{description:'Created'}} },
    },
    '/habit-logs/{id}': {
      parameters: [{ in:'path',name:'id',required:true,schema:{type:'string'} }],
      get:    { tags:['HabitLogs'], summary:'Get log',    responses:{200:{description:'Log'},404:{description:'Not found'}} },
      put:    { tags:['HabitLogs'], summary:'Update log',  requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}}, responses:{200:{description:'Updated'}} },
      delete: { tags:['HabitLogs'], summary:'Delete log',  responses:{204:{description:'Deleted'}} },
    },

    // ── Tasks ─────────────────────────────────────────
    '/tasks': {
      get:  { tags:['Tasks'], summary:'List tasks', parameters:[{in:'query',name:'completed',schema:{type:'boolean'}},{in:'query',name:'urgency',schema:{type:'string',enum:['low','medium','high']}},{in:'query',name:'importance',schema:{type:'string',enum:['low','medium','high']}},{in:'query',name:'limit',schema:{type:'integer',default:20}},{in:'query',name:'offset',schema:{type:'integer',default:0}}], responses:{200:{description:'Paginated tasks'}} },
      post: { tags:['Tasks'], summary:'Create task (WRITE)', requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['title'],properties:{title:{type:'string'},description:{type:'string'},dueDate:{type:'string'},urgency:{type:'string'},importance:{type:'string'},tags:{type:'array',items:{type:'string'}}}}}}}, responses:{201:{description:'Created'}} },
    },
    '/tasks/{id}': {
      parameters:[{in:'path',name:'id',required:true,schema:{type:'string'}}],
      get:    { tags:['Tasks'], summary:'Get task',    responses:{200:{description:'Task'},404:{description:'Not found'}} },
      put:    { tags:['Tasks'], summary:'Update task',  requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}}, responses:{200:{description:'Updated'}} },
      delete: { tags:['Tasks'], summary:'Delete task',  responses:{204:{description:'Deleted'}} },
    },

    // ── Exercises ─────────────────────────────────────
    '/exercises': {
      get:  { tags:['Exercises'], summary:'List exercises', parameters:[{in:'query',name:'category',schema:{type:'string'}},{in:'query',name:'limit',schema:{type:'integer',default:20}},{in:'query',name:'offset',schema:{type:'integer',default:0}}], responses:{200:{description:'Paginated'}} },
      post: { tags:['Exercises'], summary:'Create exercise (WRITE)', requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['name','category'],properties:{name:{type:'string'},category:{type:'string'},description:{type:'string'},imageUrl:{type:'string'}}}}}}, responses:{201:{description:'Created'}} },
    },
    '/exercises/{id}': { parameters:[{in:'path',name:'id',required:true,schema:{type:'string'}}], get:{tags:['Exercises'],summary:'Get exercise',responses:{200:{description:'Exercise'}}}, put:{tags:['Exercises'],summary:'Update',requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}},responses:{200:{description:'Updated'}}}, delete:{tags:['Exercises'],summary:'Delete',responses:{204:{description:'Deleted'}}} },

    // ── Workout Plans ─────────────────────────────────
    '/workout-plans': {
      get:  { tags:['Workouts'], summary:'List plans', parameters:[{in:'query',name:'limit',schema:{type:'integer',default:20}},{in:'query',name:'offset',schema:{type:'integer',default:0}}], responses:{200:{description:'Paginated'}} },
      post: { tags:['Workouts'], summary:'Create plan (WRITE)', requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}}, responses:{201:{description:'Created'}} },
    },
    '/workout-plans/{id}': { parameters:[{in:'path',name:'id',required:true,schema:{type:'string'}}], get:{tags:['Workouts'],summary:'Get plan',responses:{200:{description:'Plan'}}}, put:{tags:['Workouts'],summary:'Update',requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}},responses:{200:{description:'Updated'}}}, delete:{tags:['Workouts'],summary:'Delete',responses:{204:{description:'Deleted'}}} },

    // ── Completed Workouts ────────────────────────────
    '/completed-workouts': {
      get:  { tags:['Workouts'], summary:'List completed workouts', parameters:[{in:'query',name:'planId',schema:{type:'string'}},{in:'query',name:'limit',schema:{type:'integer',default:20}},{in:'query',name:'offset',schema:{type:'integer',default:0}}], responses:{200:{description:'Paginated'}} },
      post: { tags:['Workouts'], summary:'Log completed workout (WRITE)', requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}}, responses:{201:{description:'Created'}} },
    },
    '/completed-workouts/{id}': { parameters:[{in:'path',name:'id',required:true,schema:{type:'string'}}], get:{tags:['Workouts'],summary:'Get',responses:{200:{description:'Workout'}}}, put:{tags:['Workouts'],summary:'Update',requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}},responses:{200:{description:'Updated'}}}, delete:{tags:['Workouts'],summary:'Delete',responses:{204:{description:'Deleted'}}} },

    // ── Journal ───────────────────────────────────────
    '/journal-entries': {
      get:  { tags:['Journal'], summary:'List journal entries', parameters:[{in:'query',name:'period',schema:{type:'string',enum:['daily','weekly','monthly','quarterly','yearly','decadely']}},{in:'query',name:'dateKey',schema:{type:'string'}},{in:'query',name:'limit',schema:{type:'integer',default:20}},{in:'query',name:'offset',schema:{type:'integer',default:0}}], responses:{200:{description:'Paginated'}} },
      post: { tags:['Journal'], summary:'Create entry (WRITE)', requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['period','dateKey','content'],properties:{period:{type:'string'},dateKey:{type:'string'},title:{type:'string'},content:{type:'string'},mood:{type:'integer',minimum:1,maximum:5}}}}}}, responses:{201:{description:'Created'}} },
    },
    '/journal-entries/{id}': { parameters:[{in:'path',name:'id',required:true,schema:{type:'string'}}], get:{tags:['Journal'],summary:'Get entry',responses:{200:{description:'Entry'}}}, put:{tags:['Journal'],summary:'Update',requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}},responses:{200:{description:'Updated'}}}, delete:{tags:['Journal'],summary:'Delete',responses:{204:{description:'Deleted'}}} },

    // ── Calendar ──────────────────────────────────────
    '/calendar-activities': {
      get:  { tags:['Calendar'], summary:'List activities', parameters:[{in:'query',name:'date',schema:{type:'string',example:'2026-05-10'}},{in:'query',name:'limit',schema:{type:'integer',default:20}},{in:'query',name:'offset',schema:{type:'integer',default:0}}], responses:{200:{description:'Paginated'}} },
      post: { tags:['Calendar'], summary:'Create activity (WRITE)', requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['title','date','startTime','endTime','color'],properties:{title:{type:'string'},date:{type:'string'},startTime:{type:'string'},endTime:{type:'string'},color:{type:'string'},category:{type:'string'},notes:{type:'string'}}}}}}, responses:{201:{description:'Created'}} },
    },
    '/calendar-activities/{id}': { parameters:[{in:'path',name:'id',required:true,schema:{type:'string'}}], get:{tags:['Calendar'],summary:'Get activity',responses:{200:{description:'Activity'}}}, put:{tags:['Calendar'],summary:'Update',requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}},responses:{200:{description:'Updated'}}}, delete:{tags:['Calendar'],summary:'Delete',responses:{204:{description:'Deleted'}}} },

    // ── Work Session Categories ───────────────────────
    '/work-session-categories': {
      get:  { tags:['WorkSessions'], summary:'List categories', parameters:[{in:'query',name:'limit',schema:{type:'integer',default:20}},{in:'query',name:'offset',schema:{type:'integer',default:0}}], responses:{200:{description:'Paginated'}} },
      post: { tags:['WorkSessions'], summary:'Create category (WRITE)', requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}}, responses:{201:{description:'Created'}} },
    },
    '/work-session-categories/{id}': { parameters:[{in:'path',name:'id',required:true,schema:{type:'string'}}], get:{tags:['WorkSessions'],summary:'Get category',responses:{200:{description:'Category'}}}, put:{tags:['WorkSessions'],summary:'Update',requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}},responses:{200:{description:'Updated'}}}, delete:{tags:['WorkSessions'],summary:'Delete',responses:{204:{description:'Deleted'}}} },

    // ── Completed Work Sessions ───────────────────────
    '/completed-work-sessions': {
      get:  { tags:['WorkSessions'], summary:'List sessions', parameters:[{in:'query',name:'categoryId',schema:{type:'string'}},{in:'query',name:'limit',schema:{type:'integer',default:20}},{in:'query',name:'offset',schema:{type:'integer',default:0}}], responses:{200:{description:'Paginated'}} },
      post: { tags:['WorkSessions'], summary:'Log session (WRITE)', requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}}, responses:{201:{description:'Created'}} },
    },
    '/completed-work-sessions/{id}': { parameters:[{in:'path',name:'id',required:true,schema:{type:'string'}}], get:{tags:['WorkSessions'],summary:'Get session',responses:{200:{description:'Session'}}}, put:{tags:['WorkSessions'],summary:'Update',requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}},responses:{200:{description:'Updated'}}}, delete:{tags:['WorkSessions'],summary:'Delete',responses:{204:{description:'Deleted'}}} },
  },
}