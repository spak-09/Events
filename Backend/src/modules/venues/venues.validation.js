const { z } = require('zod');

const roomSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  floor: z.string().trim().default('1'),
  amenities: z.array(z.string()).default([]),
});

const createVenueSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Venue name must be at least 2 characters'),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    geo: z
      .object({
        type: z.literal('Point').default('Point'),
        coordinates: z.tuple([z.number(), z.number()]).default([0, 0]),
      })
      .optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactPhone: z.string().optional(),
    rooms: z.array(roomSchema).optional(),
  }),
});

const updateVenueSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).optional(),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    geo: z
      .object({
        type: z.literal('Point').default('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
      })
      .optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactPhone: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

const addRoomSchema = z.object({
  body: roomSchema,
});

const updateRoomSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    capacity: z.number().int().min(1).optional(),
    floor: z.string().trim().optional(),
    amenities: z.array(z.string()).optional(),
  }),
});

const listVenuesQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      search: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
      sortBy: z.string().default('name'),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
    })
    .optional(),
});

module.exports = {
  createVenueSchema,
  updateVenueSchema,
  addRoomSchema,
  updateRoomSchema,
  listVenuesQuerySchema,
};
