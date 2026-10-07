const express = require('express');
const organizationsController = require('./organizations.controller');
const {
  createOrgSchema,
  updateOrgSchema,
  updateOrgStatusSchema,
  listOrgQuerySchema,
} = require('./organizations.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { GLOBAL_ROLES } = require('../../config/roles');

const router = express.Router();

// All organization routes require authentication
router.use(authenticate);

const requirePlatformAdmin = authorize({ global: [GLOBAL_ROLES.PLATFORM_ADMIN] });

/**
 * @openapi
 * /organizations:
 *   post:
 *     summary: Create organization (Platform Admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requirePlatformAdmin, validate(createOrgSchema), organizationsController.createOrganization);

/**
 * @openapi
 * /organizations:
 *   get:
 *     summary: List organizations (Authenticated users)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', validate(listOrgQuerySchema), organizationsController.listOrganizations);

/**
 * @openapi
 * /organizations/{id}:
 *   get:
 *     summary: Get organization by ID (Authenticated users)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', organizationsController.getOrganizationById);

/**
 * @openapi
 * /organizations/{id}:
 *   patch:
 *     summary: Update organization settings & plan (Platform Admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', requirePlatformAdmin, validate(updateOrgSchema), organizationsController.updateOrganization);

/**
 * @openapi
 * /organizations/{id}/status:
 *   patch:
 *     summary: Suspend or activate organization (Platform Admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', requirePlatformAdmin, validate(updateOrgStatusSchema), organizationsController.updateOrganizationStatus);

/**
 * @openapi
 * /organizations/{id}:
 *   delete:
 *     summary: Delete organization (Platform Admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requirePlatformAdmin, organizationsController.deleteOrganization);

module.exports = router;
