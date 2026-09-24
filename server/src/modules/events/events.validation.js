const { z } = require('zod');
const { ALL_EVENT_STATUSES } = require('../../config/roles');

const policiesSchema = z.object({
  refundPolicy: z.string().optional(),
  codeOfConduct: z.string().optional(),
  ageRestriction: z.number().int().min(0).optional(),
  privacyPolicy: z.string().optional(),
});

const createEventSchema = z.object({
  body: z
    .object({
      org: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID format'),
      title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
      slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug must only contain letters, numbers, and dashes').optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      startDate: z.coerce.date({ required_error: 'Start date is required' }),
      endDate: z.coerce.date({ required_error: 'End date is required' }),
      timezone: z.string().default('UTC'),
      venue: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid venue ID format').optional().nullable(),
      capacity: z.number().int().min(1, 'Capacity must be at least 1').default(100),
      banner: z.string().optional().nullable(),
      policies: policiesSchema.optional(),
    })
    .refine((data) => data.endDate >= data.startDate, {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    }),
});

const updateEventSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(3).max(200).optional(),
      slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      timezone: z.string().optional(),
      venue: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
      capacity: z.number().int().min(1).optional(),
      banner: z.string().optional().nullable(),
      policies: policiesSchema.optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return data.endDate >= data.startDate;
        }
        return true;
      },
      {
        message: 'End date must be after or equal to start date',
        path: ['endDate'],
      }
    ),
});

const cancelEventSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
});

const duplicateEventSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(200),
    startDate: z.coerce.date({ required_error: 'Start date is required' }),
    endDate: z.coerce.date({ required_error: 'End date is required' }),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
  }),
});

const listEventsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      search: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(ALL_EVENT_STATUSES).optional(),
      org: z.string().optional(),
      myEvents: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
      sortBy: z.string().default('startDate'),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
    })
    .optional(),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  cancelEventSchema,
  duplicateEventSchema,
  listEventsQuerySchema,
};
