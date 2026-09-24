/**
 * Global and Event-scoped role definitions for EventForge.
 */

const GLOBAL_ROLES = Object.freeze({
  PLATFORM_ADMIN: 'platform_admin',
  USER: 'user',
});

const EVENT_ROLES = Object.freeze({
  ORGANIZER: 'organizer',
  STAFF: 'staff',
  SPEAKER: 'speaker',
  SPONSOR: 'sponsor',
});

const EVENT_MEMBER_STATUS = Object.freeze({
  ACTIVE: 'active',
  PENDING: 'pending',
  REVOKED: 'revoked',
});

const EVENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const ORG_PLANS = Object.freeze({
  STARTER: 'starter',
  GROWTH: 'growth',
  ENTERPRISE: 'enterprise',
});

const ORG_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
});

const ANNOUNCEMENT_AUDIENCE = Object.freeze({
  ALL: 'all',
  ATTENDEES: 'attendees',
  SPEAKERS: 'speakers',
  STAFF: 'staff',
  SPONSORS: 'sponsors',
});

const REGISTRATION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  WAITLISTED: 'waitlisted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  CHECKED_IN: 'checked_in',
});

const COUPON_TYPE = Object.freeze({
  PERCENT: 'percent',
  FLAT: 'flat',
});

const SESSION_STATUS = Object.freeze({
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
});

const SPONSOR_TIERS = Object.freeze({
  PLATINUM: 'platinum',
  GOLD: 'gold',
  SILVER: 'silver',
  BRONZE: 'bronze',
});

const SPONSORSHIP_STATUS = Object.freeze({
  INQUIRY: 'inquiry',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
});

const DELIVERABLE_STATUS = Object.freeze({
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

module.exports = {
  GLOBAL_ROLES,
  EVENT_ROLES,
  EVENT_MEMBER_STATUS,
  EVENT_STATUS,
  ORG_PLANS,
  ORG_STATUS,
  ANNOUNCEMENT_AUDIENCE,
  REGISTRATION_STATUS,
  COUPON_TYPE,
  SESSION_STATUS,
  SPONSOR_TIERS,
  SPONSORSHIP_STATUS,
  DELIVERABLE_STATUS,
  ALL_GLOBAL_ROLES: Object.values(GLOBAL_ROLES),
  ALL_EVENT_ROLES: Object.values(EVENT_ROLES),
  ALL_EVENT_STATUSES: Object.values(EVENT_STATUS),
  ALL_ORG_PLANS: Object.values(ORG_PLANS),
  ALL_ORG_STATUSES: Object.values(ORG_STATUS),
  ALL_ANNOUNCEMENT_AUDIENCES: Object.values(ANNOUNCEMENT_AUDIENCE),
  ALL_REGISTRATION_STATUSES: Object.values(REGISTRATION_STATUS),
  ALL_COUPON_TYPES: Object.values(COUPON_TYPE),
  ALL_SESSION_STATUSES: Object.values(SESSION_STATUS),
  ALL_SPONSOR_TIERS: Object.values(SPONSOR_TIERS),
  ALL_SPONSORSHIP_STATUSES: Object.values(SPONSORSHIP_STATUS),
  ALL_DELIVERABLE_STATUSES: Object.values(DELIVERABLE_STATUS),
};

