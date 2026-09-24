const express = require('express');
const registrationsController = require('./registrations.controller');
const {
  registerForEventSchema,
  updateRegistrationStatusSchema,
  pickSessionsSchema,
  listRegistrationsQuerySchema,
} = require('./registrations.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES } = require('../../config/roles');

const eventRegistrationRouter = express.Router({ mergeParams: true });
const myRegistrationsRouter = express.Router();

eventRegistrationRouter.use(authenticate);

/**
 * @openapi
 * /events/{eventId}/register:
 *   post:
 *     summary: Register for an event with atomic capacity check and waitlist support
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
eventRegistrationRouter.post(
  '/',
  validate(registerForEventSchema),
  registrationsController.registerForEvent
);

/**
 * @openapi
 * /events/{eventId}/registrations:
 *   get:
 *     summary: List registrations for an event (Organizer or Staff only)
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
eventRegistrationRouter.get(
  '/',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.STAFF] }),
  validate(listRegistrationsQuerySchema),
  registrationsController.listRegistrations
);

/**
 * @openapi
 * /events/{eventId}/registrations/{id}:
 *   get:
 *     summary: Get single registration details
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
eventRegistrationRouter.get('/:id', registrationsController.getRegistrationById);

/**
 * @openapi
 * /events/{eventId}/registrations/{id}/cancel:
 *   post:
 *     summary: Cancel registration and trigger auto-promotion from waitlist
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
eventRegistrationRouter.post('/:id/cancel', registrationsController.cancelRegistration);

/**
 * @openapi
 * /events/{eventId}/registrations/{id}/status:
 *   patch:
 *     summary: Review approval-required registration (Organizer only)
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
eventRegistrationRouter.patch(
  '/:id/status',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(updateRegistrationStatusSchema),
  registrationsController.updateRegistrationStatus
);

/**
 * @openapi
 * /events/{eventId}/registrations/me/sessions:
 *   post:
 *     summary: Attendee select sessions with schedule overlap warning
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
eventRegistrationRouter.post(
  '/me/sessions',
  validate(pickSessionsSchema),
  registrationsController.pickSessions
);

/**
 * @openapi
 * /registrations/me:
 *   get:
 *     summary: Get current authenticated attendee's registered passes
 *     tags: [Tickets & Registration]
 *     security:
 *       - bearerAuth: []
 */
myRegistrationsRouter.get('/me', authenticate, registrationsController.getMyRegistrations);

module.exports = {
  eventRegistrationRouter,
  myRegistrationsRouter,
};
