const express = require('express');
const usersController = require('./users.controller');
const {
  updateUserSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
} = require('./users.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { GLOBAL_ROLES } = require('../../config/roles');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List platform users (Admin/Organizers)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', validate(listUsersQuerySchema), usersController.listUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get single user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', usersController.getUserById);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', validate(updateUserSchema), usersController.updateUser);

/**
 * @openapi
 * /users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate user (Platform Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/status',
  authorize({ global: [GLOBAL_ROLES.PLATFORM_ADMIN] }),
  validate(updateUserStatusSchema),
  usersController.updateUserStatus
);

module.exports = router;
