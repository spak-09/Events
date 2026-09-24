const { z } = require('zod');
const { ALL_COUPON_TYPES } = require('../../config/roles');

const salesWindowSchema = z.object({
  start: z.coerce.date().default(() => new Date()),
  end: z.coerce.date({ required_error: 'Sales window end date is required' }),
});

const createTicketTypeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Ticket type name must be at least 2 characters').max(100),
    price: z.number().min(0, 'Price cannot be negative'),
    capacity: z.number().int().min(1, 'Capacity must be at least 1'),
    salesWindow: salesWindowSchema,
    requiresApproval: z.boolean().default(false),
  }),
});

const updateTicketTypeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    price: z.number().min(0).optional(),
    capacity: z.number().int().min(1).optional(),
    salesWindow: salesWindowSchema.optional(),
    requiresApproval: z.boolean().optional(),
  }),
});

const createCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(3).max(30).toUpperCase(),
    type: z.enum(ALL_COUPON_TYPES),
    value: z.number().min(0, 'Discount value cannot be negative'),
    maxUses: z.number().int().min(1).default(100),
    expiry: z.coerce.date({ required_error: 'Expiry date is required' }),
    ticketTypes: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ticketType ID')).optional(),
  }),
});

const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().toUpperCase(),
    ticketTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ticketType ID'),
  }),
});

module.exports = {
  createTicketTypeSchema,
  updateTicketTypeSchema,
  createCouponSchema,
  validateCouponSchema,
};
