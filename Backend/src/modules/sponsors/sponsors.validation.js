const { z } = require('zod');
const { ALL_SPONSOR_TIERS, ALL_SPONSORSHIP_STATUSES, ALL_DELIVERABLE_STATUSES } = require('../../config/roles');

const createPackageSchema = z.object({
  body: z.object({
    tier: z.enum(ALL_SPONSOR_TIERS),
    name: z.string().trim().min(2, 'Package name is required').max(100),
    price: z.number().min(0, 'Price cannot be negative'),
    benefits: z.array(z.string().trim()).default([]),
    slots: z.number().int().min(1, 'Slots must be at least 1'),
  }),
});

const updatePackageSchema = z.object({
  body: z.object({
    tier: z.enum(ALL_SPONSOR_TIERS).optional(),
    name: z.string().trim().min(2).max(100).optional(),
    price: z.number().min(0).optional(),
    benefits: z.array(z.string().trim()).optional(),
    slots: z.number().int().min(1).optional(),
  }),
});

const createSponsorshipSchema = z.object({
  body: z.object({
    sponsorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sponsor user ID'),
    companyName: z.string().trim().min(2, 'Company name is required'),
    companyLogo: z.string().optional().nullable(),
    packageId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid package ID'),
    status: z.enum(ALL_SPONSORSHIP_STATUSES).optional(),
  }),
});

const createDeliverableSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2, 'Deliverable title is required'),
    description: z.string().optional(),
    dueDate: z.coerce.date({ required_error: 'Due date is required' }),
  }),
});

const submitDeliverableSchema = z.object({
  body: z.object({
    asset: z.string().trim().min(1, 'Asset URL or filename is required'),
  }),
});

const reviewDeliverableSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    reviewNotes: z.string().optional(),
  }),
});

module.exports = {
  createPackageSchema,
  updatePackageSchema,
  createSponsorshipSchema,
  createDeliverableSchema,
  submitDeliverableSchema,
  reviewDeliverableSchema,
};
