const { z } = require('zod');

const availabilitySchema = z.object({
  date: z.coerce.date(),
  startTime: z.string().default('09:00'),
  endTime: z.string().default('17:00'),
  notes: z.string().optional(),
});

const createSpeakerSchema = z.object({
  body: z.object({
    user: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional().nullable(),
    name: z.string().trim().min(2, 'Speaker name is required').max(100),
    email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
    bio: z.string().optional(),
    photo: z.string().optional().nullable(),
    company: z.string().optional(),
    title: z.string().optional(),
    links: z
      .object({
        website: z.string().optional(),
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
        github: z.string().optional(),
      })
      .optional(),
    expertise: z.array(z.string()).default([]),
    availability: z.array(availabilitySchema).default([]),
  }),
});

const updateSpeakerSchema = z.object({
  body: z.object({
    user: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().optional().or(z.literal('')),
    bio: z.string().optional(),
    photo: z.string().optional().nullable(),
    company: z.string().optional(),
    title: z.string().optional(),
    links: z
      .object({
        website: z.string().optional(),
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
        github: z.string().optional(),
      })
      .optional(),
    expertise: z.array(z.string()).optional(),
    availability: z.array(availabilitySchema).optional(),
    isActive: z.boolean().optional(),
  }),
});

const listSpeakersQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      search: z.string().optional(),
      expertise: z.string().optional(),
      isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
      sortBy: z.string().default('name'),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
    })
    .optional(),
});

module.exports = {
  createSpeakerSchema,
  updateSpeakerSchema,
  listSpeakersQuerySchema,
};
