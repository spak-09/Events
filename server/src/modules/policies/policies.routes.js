const express = require('express');
const policiesController = require('./policies.controller');
const { setPolicySchema } = require('./policies.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { GLOBAL_ROLES } = require('../../config/roles');

const router = express.Router();

router.use(authenticate);
router.use(authorize({ global: [GLOBAL_ROLES.PLATFORM_ADMIN] }));

/**
 * @openapi
 * /policies:
 *   get:
 *     summary: Get all global platform policies (Platform Admin only)
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', policiesController.getAllPolicies);

/**
 * @openapi
 * /policies:
 *   put:
 *     summary: Set or update global policy (Platform Admin only)
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 */
router.put('/', validate(setPolicySchema), policiesController.setPolicy);

module.exports = router;
