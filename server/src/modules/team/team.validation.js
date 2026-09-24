const { z } = require('zod');
const { ALL_EVENT_ROLES, EVENT_MEMBER_STATUS } = require('../../config/roles');

const assignMemberSchema = z.object({
  body: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format').optional(),
    email: z.string().email('Invalid email').optional(),
    role: z.enum(ALL_EVENT_ROLES, { required_error: 'Role is required' }),
  }).refine((data) => data.userId || data.email, {
    message: 'Either userId or email must be provided to assign team member',
    path: ['userId'],
  }),
});

const updateMemberSchema = z.object({
  body: z.object({
    role: z.enum(ALL_EVENT_ROLES).optional(),
    status: z.enum(Object.values(EVENT_MEMBER_STATUS)).optional(),
  }),
});

module.exports = {
  assignMemberSchema,
  updateMemberSchema,
};
