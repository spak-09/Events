const { z } = require('zod');

const eventCheckinSchema = z.object({
  body: z
    .object({
      eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
      qrToken: z.string().trim().optional(),
      registrationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid registration ID format').optional(),
    })
    .refine((data) => data.qrToken || data.registrationId, {
      message: 'Either qrToken or registrationId must be provided for check-in',
      path: ['qrToken'],
    }),
});

const sessionCheckinSchema = z.object({
  body: z
    .object({
      eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
      sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID format'),
      qrToken: z.string().trim().optional(),
      registrationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid registration ID format').optional(),
    })
    .refine((data) => data.qrToken || data.registrationId, {
      message: 'Either qrToken or registrationId must be provided for session check-in',
      path: ['qrToken'],
    }),
});

module.exports = {
  eventCheckinSchema,
  sessionCheckinSchema,
};
