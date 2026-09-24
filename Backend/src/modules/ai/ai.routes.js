const express = require('express');
const aiController = require('./ai.controller');
const {
  eventDescriptionSchema,
  speakerBioSchema,
  announcementSchema,
  sessionSummarySchema,
  recommendationsQuerySchema,
} = require('./ai.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const { createRateLimiter } = require('../../middlewares/rateLimit');

const aiRouter = express.Router();
const recommendationsRouter = express.Router({ mergeParams: true });

// AI endpoints rate limiter: 30 requests per minute
const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'AI generation request rate limit exceeded. Please wait a minute before requesting more drafts.',
});

aiRouter.use(authenticate);
aiRouter.use(aiLimiter);

/**
 * @openapi
 * /ai/event-description:
 *   post:
 *     summary: Generate draft event marketing description (Draft only, does not auto-save)
 *     tags: [AI Generation & Matchmaking]
 *     security:
 *       - bearerAuth: []
 */
aiRouter.post('/event-description', validate(eventDescriptionSchema), aiController.generateEventDescription);

/**
 * @openapi
 * /ai/speaker-bio:
 *   post:
 *     summary: Generate draft speaker biography (Draft only)
 *     tags: [AI Generation & Matchmaking]
 *     security:
 *       - bearerAuth: []
 */
aiRouter.post('/speaker-bio', validate(speakerBioSchema), aiController.generateSpeakerBio);

/**
 * @openapi
 * /ai/announcement:
 *   post:
 *     summary: Generate draft broadcast announcement (Draft only)
 *     tags: [AI Generation & Matchmaking]
 *     security:
 *       - bearerAuth: []
 */
aiRouter.post('/announcement', validate(announcementSchema), aiController.generateAnnouncement);

/**
 * @openapi
 * /ai/session-summary:
 *   post:
 *     summary: Generate draft session executive summary (Draft only)
 *     tags: [AI Generation & Matchmaking]
 *     security:
 *       - bearerAuth: []
 */
aiRouter.post('/session-summary', validate(sessionSummarySchema), aiController.generateSessionSummary);

/**
 * Hybrid Recommendations endpoint
 * GET /events/:id/recommendations
 */
recommendationsRouter.get(
  '/recommendations',
  authenticate,
  validate(recommendationsQuerySchema),
  aiController.getRecommendations
);

module.exports = {
  aiRouter,
  recommendationsRouter,
};
