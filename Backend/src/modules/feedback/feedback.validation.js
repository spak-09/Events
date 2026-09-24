const { z } = require('zod');

const submitFeedbackSchema = z.object({
  body: z.object({
    sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID').optional().nullable(),
    rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    comment: z.string().trim().max(1000, 'Comment cannot exceed 1000 characters').default(''),
  }),
});

const listFeedbackQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      session: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  submitFeedbackSchema,
  listFeedbackQuerySchema,
};
