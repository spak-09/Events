const express = require('express');
const analyticsController = require('./analytics.controller');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES, GLOBAL_ROLES } = require('../../config/roles');

const eventAnalyticsRouter = express.Router({ mergeParams: true });
const adminAnalyticsRouter = express.Router();

eventAnalyticsRouter.use(authenticate);
adminAnalyticsRouter.use(authenticate);

/**
 * @openapi
 * /events/{eventId}/analytics:
 *   get:
 *     summary: Retrieve comprehensive event metrics (Organizer or Staff only)
 *     tags: [Analytics & Dashboards]
 *     security:
 *       - bearerAuth: []
 */
eventAnalyticsRouter.get(
  '/',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.STAFF] }),
  analyticsController.getEventAnalytics
);

/**
 * @openapi
 * /analytics/overview:
 *   get:
 *     summary: Retrieve global cross-tenant platform overview metrics (Platform Admin only)
 *     tags: [Analytics & Dashboards]
 *     security:
 *       - bearerAuth: []
 */
adminAnalyticsRouter.get(
  '/overview',
  authorize({ global: [GLOBAL_ROLES.PLATFORM_ADMIN] }),
  analyticsController.getPlatformOverview
);

module.exports = {
  eventAnalyticsRouter,
  adminAnalyticsRouter,
};
