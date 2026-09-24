const express = require('express');
const venuesController = require('./venues.controller');
const {
  createVenueSchema,
  updateVenueSchema,
  addRoomSchema,
  updateRoomSchema,
  listVenuesQuerySchema,
} = require('./venues.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');

const router = express.Router();

/**
 * @openapi
 * /venues:
 *   get:
 *     summary: List all venues
 *     tags: [Venues]
 */
router.get('/', validate(listVenuesQuerySchema), venuesController.listVenues);

/**
 * @openapi
 * /venues/{id}:
 *   get:
 *     summary: Get venue by ID
 *     tags: [Venues]
 */
router.get('/:id', venuesController.getVenueById);

/**
 * @openapi
 * /venues:
 *   post:
 *     summary: Create a new venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, validate(createVenueSchema), venuesController.createVenue);

/**
 * @openapi
 * /venues/{id}:
 *   patch:
 *     summary: Update venue details
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authenticate, validate(updateVenueSchema), venuesController.updateVenue);

/**
 * @openapi
 * /venues/{id}:
 *   delete:
 *     summary: Delete a venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, venuesController.deleteVenue);

/**
 * @openapi
 * /venues/{id}/rooms:
 *   post:
 *     summary: Add a room layout to venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/rooms', authenticate, validate(addRoomSchema), venuesController.addRoom);

/**
 * @openapi
 * /venues/{id}/rooms/{roomId}:
 *   patch:
 *     summary: Update room layout in venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/rooms/:roomId', authenticate, validate(updateRoomSchema), venuesController.updateRoom);

/**
 * @openapi
 * /venues/{id}/rooms/{roomId}:
 *   delete:
 *     summary: Remove room from venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/rooms/:roomId', authenticate, venuesController.deleteRoom);

module.exports = router;
