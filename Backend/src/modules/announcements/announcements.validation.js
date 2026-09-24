const { z } = require('zod');
const { ALL_ANNOUNCEMENT_AUDIENCES } = require('../../config/roles');

const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
    body: z.string().trim().min(5, 'Announcement body must be at least 5 characters'),
    audience: z.enum(ALL_ANNOUNCEMENT_AUDIENCES).default('all'),
    isPinned: z.boolean().default(false),
  }),
});

const updateAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(200).optional(),
    body: z.string().trim().min(5).optional(),
    audience: z.enum(ALL_ANNOUNCEMENT_AUDIENCES).optional(),
    isPinned: z.boolean().optional(),
  }),
});

module.exports = {
  createAnnouncementSchema,
  updateAnnouncementSchema,
};
