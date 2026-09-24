const { z } = require('zod');
const { ALL_REGISTRATION_STATUSES } = require('../../config/roles');

const registerForEventSchema = z.object({
  body: z.object({
    ticketTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ticketType ID'),
    couponCode: z.string().trim().toUpperCase().optional(),
    interests: z.array(z.string().trim()).default([]),
    selectedSessions: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'))
      .default([]),
  }),
});

const updateRegistrationStatusSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected'], {
      required_error: 'Status must be approved or rejected',
    }),
  }),
});

const pickSessionsSchema = z.object({
  body: z.object({
    sessionIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID')),
  }),
});

const listRegistrationsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      status: z.enum(ALL_REGISTRATION_STATUSES).optional(),
      ticketType: z.string().optional(),
      search: z.string().optional(),
      sortBy: z.string().default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    .optional(),
});

module.exports = {
  registerForEventSchema,
  updateRegistrationStatusSchema,
  pickSessionsSchema,
  listRegistrationsQuerySchema,
};
