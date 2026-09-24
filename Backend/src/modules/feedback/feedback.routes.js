const express = require('express');
const feedbackController = require('./feedback.controller');
const { submitFeedbackSchema, listFeedbackQuerySchema } = require('./feedback.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES } = require('../../config/roles');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

/**
 * @openapi
 * /events/{eventId}/feedback:
 *   post:
 *     summary: Submit attendee feedback for an event or session
 *     tags: [Feedback & Ratings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', validate(submitFeedbackSchema), feedbackController.submitFeedback);

/**
 * @openapi
 * /events/{eventId}/feedback:
 *   get:
 *     summary: List feedback records for an event (Organizer or Staff only)
 *     tags: [Feedback & Ratings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.STAFF] }),
  validate(listFeedbackQuerySchema),
  feedbackController.listFeedback
);

/**
 * @openapi
 * /events/{eventId}/feedback/summary:
 *   get:
 *     summary: Aggregate feedback analytics and rating distribution (Organizer or Staff only)
 *     tags: [Feedback & Ratings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/summary',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.STAFF] }),
  feedbackController.getFeedbackSummary
);

module.exports = router;
