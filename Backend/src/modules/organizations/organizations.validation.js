const { z } = require('zod');
const { ALL_ORG_PLANS, ALL_ORG_STATUSES } = require('../../config/roles');

const createOrgSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug must only contain letters, numbers, and dashes').optional(),
    plan: z.enum(ALL_ORG_PLANS).optional(),
    settings: z
      .object({
        maxEvents: z.number().int().min(1).optional(),
        customBranding: z.boolean().optional(),
        allowPublicRegistration: z.boolean().optional(),
        defaultTimezone: z.string().optional(),
        features: z.array(z.string()).optional(),
      })
      .optional(),
  }),
});

const updateOrgSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    plan: z.enum(ALL_ORG_PLANS).optional(),
    settings: z
      .object({
        maxEvents: z.number().int().min(1).optional(),
        customBranding: z.boolean().optional(),
        allowPublicRegistration: z.boolean().optional(),
        defaultTimezone: z.string().optional(),
        features: z.array(z.string()).optional(),
      })
      .optional(),
  }),
});

const updateOrgStatusSchema = z.object({
  body: z.object({
    status: z.enum(ALL_ORG_STATUSES, { required_error: 'Status is required' }),
    reason: z.string().optional(),
  }),
});

const listOrgQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      search: z.string().optional(),
      plan: z.enum(ALL_ORG_PLANS).optional(),
      status: z.enum(ALL_ORG_STATUSES).optional(),
      sortBy: z.string().default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    .optional(),
});

module.exports = {
  createOrgSchema,
  updateOrgSchema,
  updateOrgStatusSchema,
  listOrgQuerySchema,
};
