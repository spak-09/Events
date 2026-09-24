const express = require('express');
const teamController = require('./team.controller');
const { assignMemberSchema, updateMemberSchema } = require('./team.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES } = require('../../config/roles');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

/**
 * @openapi
 * /events/{eventId}/members:
 *   get:
 *     summary: List all team members assigned to an event
 *     tags: [Event Team]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.STAFF] }),
  teamController.getEventTeam
);

/**
 * @openapi
 * /events/{eventId}/members:
 *   post:
 *     summary: Assign a new team member to an event (Organizer only)
 *     tags: [Event Team]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(assignMemberSchema),
  teamController.assignTeamMember
);

/**
 * @openapi
 * /events/{eventId}/members/{memberId}:
 *   patch:
 *     summary: Update team member role or status (Organizer only)
 *     tags: [Event Team]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:memberId',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(updateMemberSchema),
  teamController.updateTeamMember
);

/**
 * @openapi
 * /events/{eventId}/members/{memberId}:
 *   delete:
 *     summary: Remove a team member from the event (Organizer only)
 *     tags: [Event Team]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:memberId',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  teamController.removeTeamMember
);

module.exports = router;
