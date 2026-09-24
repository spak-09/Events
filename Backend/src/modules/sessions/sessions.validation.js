const { z } = require('zod');
const { ALL_SESSION_STATUSES } = require('../../config/roles');

const sessionBaseSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().default(''),
  room: z.string().trim().min(1, 'Room is required'),
  start: z.coerce.date({ required_error: 'Start time is required' }),
  end: z.coerce.date({ required_error: 'End time is required' }),
  speakers: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid speaker ID')).default([]),
  track: z.string().trim().default('General'),
  tags: z.array(z.string().trim()).default([]),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  status: z.enum(ALL_SESSION_STATUSES).optional(),
});

const createSessionSchema = z.object({
  body: sessionBaseSchema.refine((data) => data.end > data.start, {
    message: 'Session end time must be after start time',
    path: ['end'],
  }),
});

const updateSessionSchema = z.object({
  body: sessionBaseSchema
    .partial()
    .refine(
      (data) => {
        if (data.start && data.end) {
          return data.end > data.start;
        }
        return true;
      },
      {
        message: 'Session end time must be after start time',
        path: ['end'],
      }
    ),
});

const checkConflictsSchema = z.object({
  body: z.object({
    room: z.string().trim().min(1),
    start: z.coerce.date(),
    end: z.coerce.date(),
    speakers: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).default([]),
    capacity: z.number().int().min(1).optional(),
    excludeSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
  }),
});

const listSessionsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(50),
      room: z.string().optional(),
      track: z.string().optional(),
      speaker: z.string().optional(),
      status: z.enum(ALL_SESSION_STATUSES).optional(),
      search: z.string().optional(),
      sortBy: z.string().default('start'),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
    })
    .optional(),
});

module.exports = {
  createSessionSchema,
  updateSessionSchema,
  checkConflictsSchema,
  listSessionsQuerySchema,
};
