const mongoose = require('mongoose');
const { GLOBAL_ROLES, EVENT_MEMBER_STATUS } = require('../config/roles');
const EventMember = require('../models/EventMember');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Two-layer authorization middleware:
 * Layer 1: Global roles (platform_admin, user)
 * Layer 2: Event-scoped roles (organizer, staff, speaker, sponsor)
 *
 * @param {Object} options
 * @param {string[]} [options.global] - Allowed global roles (e.g. ['platform_admin'])
 * @param {string[]} [options.eventRoles] - Allowed event-scoped roles (e.g. ['organizer', 'staff'])
 * @param {boolean} [options.allowPlatformAdminBypass=true] - Whether platform_admin bypasses event checks
 */
const authorize = ({
  global: allowedGlobalRoles = [],
  eventRoles: allowedEventRoles = [],
  allowPlatformAdminBypass = true,
} = {}) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const isPlatformAdmin = user.globalRole === GLOBAL_ROLES.PLATFORM_ADMIN;

    // Platform admin global bypass if permitted
    if (isPlatformAdmin && allowPlatformAdminBypass) {
      // If an eventId is present, we still attach it for convenience
      const eventId = req.params.eventId || req.params.id || req.body?.eventId || req.query?.eventId;
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        req.eventId = eventId;
      }
      return next();
    }

    // 1. Check Global Role Requirement (if specified)
    if (allowedGlobalRoles.length > 0) {
      if (!allowedGlobalRoles.includes(user.globalRole)) {
        // If eventRoles is also specified, regular user might be allowed through event membership,
        // otherwise reject immediately.
        if (allowedEventRoles.length === 0) {
          throw ApiError.forbidden(
            `Forbidden: Requires one of [${allowedGlobalRoles.join(', ')}] global role`
          );
        }
      } else if (allowedEventRoles.length === 0) {
        // Global role matched and no event role required
        return next();
      }
    }

    // 2. Check Event-Scoped Role Requirement (if specified)
    if (allowedEventRoles.length > 0) {
      // Resolve eventId from route parameters, body, or query
      const eventId = req.params.eventId || req.params.id || req.body?.eventId || req.query?.eventId;

      if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
        throw ApiError.badRequest('Valid eventId is required for this operation');
      }

      const membership = await EventMember.findOne({
        user: user._id,
        event: eventId,
        status: EVENT_MEMBER_STATUS.ACTIVE,
      });

      if (!membership || !allowedEventRoles.includes(membership.role)) {
        throw ApiError.forbidden(
          `Forbidden: You do not have permissions for this event. Required role: [${allowedEventRoles.join(', ')}]`
        );
      }

      req.eventMember = membership;
      req.eventId = eventId;
      return next();
    }

    next();
  });
};

module.exports = authorize;
