const express = require('express');
const announcementsController = require('./announcements.controller');
const {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} = require('./announcements.validation');
const validate = require('../../middlewares/validate');
const { authenticate, optionalAuthenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES } = require('../../config/roles');

const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * /events/{eventId}/announcements:
 *   get:
 *     summary: List announcements for an event (Filtered by role audience)
 *     tags: [Announcements]
 */
router.get('/', optionalAuthenticate, announcementsController.getEventAnnouncements);

/**
 * @openapi
 * /events/{eventId}/announcements/{id}:
 *   get:
 *     summary: Get single announcement by ID
 *     tags: [Announcements]
 */
router.get('/:id', optionalAuthenticate, announcementsController.getAnnouncementById);

/**
 * @openapi
 * /events/{eventId}/announcements:
 *   post:
 *     summary: Post a new broadcast announcement (Organizer or Staff only)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.STAFF] }),
  validate(createAnnouncementSchema),
  announcementsController.createAnnouncement
);

/**
 * @openapi
 * /events/{eventId}/announcements/{id}:
 *   patch:
 *     summary: Update an announcement (Organizer or Staff only)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.STAFF] }),
  validate(updateAnnouncementSchema),
  announcementsController.updateAnnouncement
);

/**
 * @openapi
 * /events/{eventId}/announcements/{id}:
 *   delete:
 *     summary: Delete an announcement (Organizer or Staff only)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.STAFF] }),
  announcementsController.deleteAnnouncement
);

module.exports = router;
