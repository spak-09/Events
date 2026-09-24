const { z } = require('zod');

const eventDescriptionSchema = z.object({
  body: z.object({
    eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format').optional(),
    title: z.string().trim().min(3, 'Event title is required'),
    theme: z.string().trim().optional(),
    targetAudience: z.string().trim().optional(),
    highlights: z.array(z.string().trim()).default([]),
  }),
});

const speakerBioSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Speaker name is required'),
    title: z.string().trim().optional(),
    company: z.string().trim().optional(),
    expertise: z.array(z.string().trim()).default([]),
    tone: z.enum(['formal', 'inspiring', 'technical', 'conversational']).default('technical'),
  }),
});

const announcementSchema = z.object({
  body: z.object({
    eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format').optional(),
    eventTitle: z.string().trim().min(2, 'Event title is required'),
    keyMessage: z.string().trim().min(5, 'Key message is required'),
    audience: z.enum(['all', 'attendees', 'speakers', 'staff', 'sponsors']).default('all'),
    urgency: z.enum(['low', 'normal', 'urgent']).default('normal'),
  }),
});

const sessionSummarySchema = z.object({
  body: z.object({
    sessionTitle: z.string().trim().min(2, 'Session title is required'),
    speakerName: z.string().trim().optional(),
    keyPoints: z.array(z.string().trim()).min(1, 'At least one key point is required'),
  }),
});

const recommendationsQuerySchema = z.object({
  query: z
    .object({
      limit: z.coerce.number().min(1).max(20).default(5),
    })
    .optional(),
});

module.exports = {
  eventDescriptionSchema,
  speakerBioSchema,
  announcementSchema,
  sessionSummarySchema,
  recommendationsQuerySchema,
};
