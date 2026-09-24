const express = require('express');
const checkinController = require('./checkin.controller');
const { eventCheckinSchema, sessionCheckinSchema } = require('./checkin.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES } = require('../../config/roles');

const checkinRouter = express.Router();
const liveAttendanceRouter = express.Router({ mergeParams: true });

checkinRouter.use(authenticate);
liveAttendanceRouter.use(authenticate);

/**
 * @openapi
 * /checkin/event:
 *   post:
 *     summary: Scan attendee QR code and check into event (Staff only, idempotent)
 *     tags: [Check-in & Attendance]
 *     security:
 *       - bearerAuth: []
 */
checkinRouter.post(
  '/event',
  validate(eventCheckinSchema),
  authorize({ eventRoles: [EVENT_ROLES.STAFF, EVENT_ROLES.ORGANIZER] }),
  checkinController.checkinEvent
);

/**
 * @openapi
 * /checkin/session:
 *   post:
 *     summary: Scan attendee QR code and check into session (Staff only, idempotent)
 *     tags: [Check-in & Attendance]
 *     security:
 *       - bearerAuth: []
 */
checkinRouter.post(
  '/session',
  validate(sessionCheckinSchema),
  authorize({ eventRoles: [EVENT_ROLES.STAFF, EVENT_ROLES.ORGANIZER] }),
  checkinController.checkinSession
);

/**
 * @openapi
 * /events/{eventId}/attendance/live:
 *   get:
 *     summary: Live event and session attendance counters (Staff or Organizer only)
 *     tags: [Check-in & Attendance]
 *     security:
 *       - bearerAuth: []
 */
liveAttendanceRouter.get(
  '/live',
  authorize({ eventRoles: [EVENT_ROLES.STAFF, EVENT_ROLES.ORGANIZER] }),
  checkinController.getLiveAttendance
);

module.exports = {
  checkinRouter,
  liveAttendanceRouter,
};
