const express = require('express');
const sponsorsController = require('./sponsors.controller');
const {
  createPackageSchema,
  updatePackageSchema,
  createSponsorshipSchema,
  createDeliverableSchema,
  submitDeliverableSchema,
  reviewDeliverableSchema,
} = require('./sponsors.validation');
const validate = require('../../middlewares/validate');
const { authenticate, optionalAuthenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { EVENT_ROLES } = require('../../config/roles');

const packageRouter = express.Router({ mergeParams: true });
const sponsorshipRouter = express.Router({ mergeParams: true });

/**
 * Sponsor Packages Endpoints
 */
packageRouter.get('/', optionalAuthenticate, sponsorsController.listPackages);

packageRouter.post(
  '/',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(createPackageSchema),
  sponsorsController.createPackage
);

packageRouter.patch(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(updatePackageSchema),
  sponsorsController.updatePackage
);

packageRouter.delete(
  '/:id',
  authenticate,
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  sponsorsController.deletePackage
);

/**
 * Sponsorships & Deliverables Endpoints
 */
sponsorshipRouter.use(authenticate);

sponsorshipRouter.post(
  '/',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(createSponsorshipSchema),
  sponsorsController.createSponsorship
);

sponsorshipRouter.get(
  '/',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.SPONSOR] }),
  sponsorsController.listSponsorships
);

sponsorshipRouter.get(
  '/:id',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.SPONSOR] }),
  sponsorsController.getSponsorshipById
);

sponsorshipRouter.post(
  '/:sponsorshipId/deliverables',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(createDeliverableSchema),
  sponsorsController.createDeliverable
);

sponsorshipRouter.get(
  '/:sponsorshipId/deliverables',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER, EVENT_ROLES.SPONSOR] }),
  sponsorsController.listDeliverables
);

sponsorshipRouter.patch(
  '/:sponsorshipId/deliverables/:id/submit',
  authorize({ eventRoles: [EVENT_ROLES.SPONSOR] }),
  validate(submitDeliverableSchema),
  sponsorsController.submitDeliverable
);

sponsorshipRouter.patch(
  '/:sponsorshipId/deliverables/:id/review',
  authorize({ eventRoles: [EVENT_ROLES.ORGANIZER] }),
  validate(reviewDeliverableSchema),
  sponsorsController.reviewDeliverable
);

module.exports = {
  packageRouter,
  sponsorshipRouter,
};
