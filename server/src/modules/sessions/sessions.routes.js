const express = require('express');
const sessionsController = require('./sessions.controller');
const {
  createSessionSchema,
  updateSessionSchema,
  checkConflictsSchema,
  listSessionsQuerySchema,
} = require('./sessions.validation');
const validate = require('../../middlewares/validate');
const { authenticate, optionalAuthenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES } = require('../../config/roles');

const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * /events/{eventId}/sessions:
 *   get:
 *     summary: List agenda sessions for an event
 *     tags: [Sessions & Agenda]
 */
router.get('/', optionalAuthenticate, validate(listSessionsQuerySchema), sessionsController.listSessions);

/**
 * @openapi
 * /events/{eventId}/sessions/{id}:
 *   get:
 *     summary: Get single session details
 *     tags: [Sessions & Agenda]
 */
router.get('/:id', optionalAuthenticate, sessionsController.getSessionById);

/**
 * @openapi
 * /events/{eventId}/sessions/check-conflicts:
 *   post:
 *     summary: Pre-validate session schedule for conflicts without persisting (Organizer only)
 *     tags: [Sessions & Agenda]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/check-conflicts',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(checkConflictsSchema),
  sessionsController.checkConflicts
);

/**
 * @openapi
 * /events/{eventId}/sessions:
 *   post:
 *     summary: Create agenda session with conflict rejection (Organizer only)
 *     tags: [Sessions & Agenda]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(createSessionSchema),
  sessionsController.createSession
);

/**
 * @openapi
 * /events/{eventId}/sessions/{id}:
 *   patch:
 *     summary: Update agenda session with conflict rejection (Organizer only)
 *     tags: [Sessions & Agenda]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(updateSessionSchema),
  sessionsController.updateSession
);

/**
 * @openapi
 * /events/{eventId}/sessions/{id}:
 *   delete:
 *     summary: Delete agenda session (Organizer only)
 *     tags: [Sessions & Agenda]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  sessionsController.deleteSession
);

module.exports = router;
