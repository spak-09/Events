const { z } = require('zod');
const { ALL_GLOBAL_ROLES } = require('../../config/roles');

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().optional().nullable(),
    avatar: z.string().trim().optional().nullable(),
  }),
});

const updateUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status boolean is required' }),
    reason: z.string().optional(),
  }),
});

const listUsersQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      search: z.string().optional(),
      globalRole: z.enum(ALL_GLOBAL_ROLES).optional(),
      isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
      sortBy: z.string().default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    .optional(),
});

module.exports = {
  updateUserSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
};
