const express = require('express');
const eventsController = require('./events.controller');
const {
  createEventSchema,
  updateEventSchema,
  cancelEventSchema,
  duplicateEventSchema,
  listEventsQuerySchema,
} = require('./events.validation');
const validate = require('../../middlewares/validate');
const { authenticate, optionalAuthenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES } = require('../../config/roles');

const router = express.Router();

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, validate(createEventSchema), eventsController.createEvent);

/**
 * @openapi
 * /events:
 *   get:
 *     summary: List events (Public published events or myEvents)
 *     tags: [Events]
 */
router.get('/', optionalAuthenticate, validate(listEventsQuerySchema), eventsController.listEvents);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 */
router.get('/:id', optionalAuthenticate, eventsController.getEventById);

/**
 * @openapi
 * /events/{id}:
 *   patch:
 *     summary: Update event details (Organizer or Platform Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(updateEventSchema),
  eventsController.updateEvent
);

/**
 * @openapi
 * /events/{id}:
 *   delete:
 *     summary: Delete event (Organizer or Platform Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  eventsController.deleteEvent
);

/**
 * @openapi
 * /events/{id}/publish:
 *   post:
 *     summary: Publish event (Organizer or Platform Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/publish',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  eventsController.publishEvent
);

/**
 * @openapi
 * /events/{id}/cancel:
 *   post:
 *     summary: Cancel event (Organizer or Platform Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/cancel',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(cancelEventSchema),
  eventsController.cancelEvent
);

/**
 * @openapi
 * /events/{id}/duplicate:
 *   post:
 *     summary: Duplicate event (Organizer or Platform Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/duplicate',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(duplicateEventSchema),
  eventsController.duplicateEvent
);

module.exports = router;
