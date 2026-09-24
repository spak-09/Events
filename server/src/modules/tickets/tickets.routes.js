const express = require('express');
const ticketsController = require('./tickets.controller');
const {
  createTicketTypeSchema,
  updateTicketTypeSchema,
  createCouponSchema,
  validateCouponSchema,
} = require('./tickets.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES } = require('../../config/roles');

const ticketRouter = express.Router({ mergeParams: true });
const couponRouter = express.Router({ mergeParams: true });

/**
 * @openapi
 * /events/{eventId}/tickets:
 *   get:
 *     summary: List ticket tiers for an event
 *     tags: [Tickets & Registration]
 */
ticketRouter.get('/', ticketsController.listTicketTypes);

/**
 * @openapi
 * /events/{eventId}/tickets/{id}:
 *   get:
 *     summary: Get single ticket type details
 *     tags: [Tickets & Registration]
 */
ticketRouter.get('/:id', ticketsController.getTicketTypeById);

/**
 * @openapi
 * /events/{eventId}/tickets:
 *   post:
 *     summary: Create a ticket tier (Organizer only)
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
ticketRouter.post(
  '/',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(createTicketTypeSchema),
  ticketsController.createTicketType
);

/**
 * @openapi
 * /events/{eventId}/tickets/{id}:
 *   patch:
 *     summary: Update ticket tier (Organizer only)
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
ticketRouter.patch(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(updateTicketTypeSchema),
  ticketsController.updateTicketType
);

/**
 * @openapi
 * /events/{eventId}/tickets/{id}:
 *   delete:
 *     summary: Delete ticket tier (Organizer only)
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
ticketRouter.delete(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  ticketsController.deleteTicketType
);

/**
 * Coupon routes
 */
couponRouter.post(
  '/',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(createCouponSchema),
  ticketsController.createCoupon
);

couponRouter.get(
  '/',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  ticketsController.listCoupons
);

couponRouter.post(
  '/validate',
  validate(validateCouponSchema),
  ticketsController.validateCoupon
);

module.exports = {
  ticketRouter,
  couponRouter,
};
