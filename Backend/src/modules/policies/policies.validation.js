const { z } = require('zod');

const setPolicySchema = z.object({
  body: z.object({
    key: z.string().trim().min(2, 'Policy key is required'),
    value: z.any({ required_error: 'Policy value is required' }),
    description: z.string().optional(),
  }),
});

module.exports = {
  setPolicySchema,
};
