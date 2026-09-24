# EventForge — Dual-Layer RBAC Architecture

EventForge enforces a **Dual-Layer Role-Based Access Control (RBAC)** architecture that decouples global platform governance from event-scoped operational privileges.

---

## 1. Architectural Motivation

In multi-tenant event management platforms, a single user can have multiple contextual responsibilities:
- An enterprise user may be an **Organizer** of their company's "Annual Engineering Summit 2026".
- That exact same user might be merely a **Speaker** at a partner's "Cloud Security Expo 2026".
- At a third conference, the user may only be a registered **Attendee**.
- System operators (**Platform Admins**) require tenant-spanning governance, system policy configuration, and dispute resolution privileges.

A naive single-role schema (e.g., storing `role: "organizer"` on the `User` model) fails completely because it does not bind authorization to the specific **tenant or event resource boundary**.

EventForge solves this using two distinct layers:
1. **Global Layer (`User.globalRole`)**: Determines platform-wide access (`platform_admin` vs. `user`).
2. **Event-Scoped Layer (`EventMember.role`)**: Determines contextual permissions for a specific event instance (`organizer`, `staff`, `speaker`, `sponsor`, `attendee`).

---

## 2. The Roles Specification

### 2.1 Global Roles (`User.globalRole`)
- `platform_admin`: Superuser authority.
  - Can manage organizations (create, suspend, update subscription plans).
  - Can view, configure, and toggle global policies.
  - Has supervisory access across all events, teams, and venues.
  - Can inspect system-wide audit logs.
  - Can view global platform revenue and cross-tenant overview metrics (`GET /analytics/overview`).
- `user`: Standard platform account.
  - Can authenticate, maintain personal profile, and change credentials.
  - Can create new events (automatically becoming an Organizer of that created event).
  - Can receive invitations and accept roles across multiple events.
  - Can register for tickets, receive QR codes, and attend sessions.

### 2.2 Event-Scoped Roles (`EventMember.role`)
- `organizer`:
  - Complete control over the specific event instance (`req.params.eventId`).
  - Manage ticket types, pricing, capacity, sales windows, and discount coupons.
  - Approve or reject pending registrations requiring manual review.
  - Schedule agenda sessions with 4-point conflict detection.
  - Create sponsor packages, allocate sponsorships, and review/approve deliverable assets.
  - View event analytics and feedback distributions.
- `staff`:
  - Operational authority during planning and live event execution.
  - Scan attendee QR codes for idempotent event and session check-ins (`POST /checkin/event`, `POST /checkin/session`).
  - Access live attendance counters and room capacity monitors (`GET /events/:id/attendance/live`).
  - Broadcast operational announcements to attendees or speakers.
- `speaker`:
  - Event presenter privileges.
  - View agenda schedule, green room details, and announcements targeted to `speakers` or `all`.
- `sponsor`:
  - Corporate partner privileges with strict tenant isolation.
  - View own company's sponsorship record and deliverables.
  - Submit branding deliverables (vector logos, slide decks, video reels).
- `attendee`:
  - Registered participant (derived from `Registration` collection).
  - View public agenda and bookmark sessions.
  - Present unique cryptographically signed QR token at venue entrance.
  - Submit ratings and reviews for sessions attended.
  - Receive personalized hybrid AI session recommendations.

---

## 3. The `authorize` Middleware Pipeline

The authorization middleware function is defined as:
```javascript
authorize({ global = [], eventRoles = [], allowPlatformAdminBypass = true })
```

### Resolution & Verification Algorithm:

```
                      ┌────────────────────────────┐
                      │  Incoming Request to Route │
                      └─────────────┬──────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │    authenticate (JWT)      │
                      │ Populates req.user & claims│
                      └─────────────┬──────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │   Is req.user.globalRole   │─── YES ───► [ Granted: 200/Next ]
                      │      platform_admin?       │             (Platform Admin Bypass)
                      └─────────────┬──────────────┘
                                    │ NO
                                    ▼
                      ┌────────────────────────────┐
                      │ Are global roles defined?  │
                      │  (e.g., ['platform_admin'])│─── YES ───► [ Denied: 403 Forbidden ]
                      └─────────────┬──────────────┘             (User is not global admin)
                                    │ NO / Global allowed
                                    ▼
                      ┌────────────────────────────┐
                      │ Are eventRoles specified?  │─── NO ────► [ Granted: 200/Next ]
                      └─────────────┬──────────────┘
                                    │ YES
                                    ▼
                      ┌────────────────────────────┐
                      │ Extract eventId from:      │
                      │ req.params.eventId,        │
                      │ req.params.id (events mod),│
                      │ req.body.eventId,          │
                      │ req.query.eventId          │
                      └─────────────┬──────────────┘
                                    │
                                    ▼
                          Valid ObjectId Present?
                                    ├─────────── NO ───────────► [ Error: 400 Bad Request ]
                                    │
                                   YES
                                    ▼
                      ┌────────────────────────────┐
                      │ Query EventMember:         │
                      │ { user: req.user._id,      │
                      │   event: eventId,          │
                      │   status: 'active' }       │
                      └─────────────┬──────────────┘
                                    │
                                    ▼
                        Membership Found &
                     membership.role in eventRoles?
                                    ├─────────── NO ───────────► [ Denied: 403 Forbidden ]
                                    │
                                   YES
                                    ▼
                      ┌────────────────────────────┐
                      │ Attach req.eventMember     │
                      │ Call next()                │
                      └────────────────────────────┘
```

---

## 4. Guaranteeing Cross-Event Isolation

### The Cross-Event Threat Vector
Consider two events:
- **Event A** (ID: `660c1...`): Organized by Alice.
- **Event B** (ID: `660c2...`): Organized by Bob.

If Alice attempts an HTTP `PATCH /api/v1/events/660c2...` with her valid authentication token:
1. `authenticate` verifies Alice's JWT and verifies she is an active user.
2. `authorize({ eventRoles: ['organizer'] })` executes:
   - Resolves target `eventId` = `660c2...`.
   - Checks if Alice has `globalRole === 'platform_admin'` (returns false).
   - Queries `EventMember.findOne({ user: Alice._id, event: '660c2...', status: 'active' })`.
   - Result is `null` (Alice has no membership for Event B).
   - Rejects immediately with **`403 Forbidden`**:
     ```json
     {
       "success": false,
       "error": {
         "code": "FORBIDDEN",
         "message": "Access denied: insufficient permissions for this event"
       }
     }
     ```
Alice cannot view draft content, update settings, duplicate, or alter roster data for Event B.

---

## 5. Domain Boundary & Tenant Isolation Rules

### 5.1 Sponsor Corporate Boundary Isolation
- **Sponsor Isolation**: A sponsor user representing Company A can only view their own sponsorship (`GET /events/:id/sponsorships/:sponsorshipId`) and deliverables.
- Attempting to access or submit assets for Company B's sponsorship or deliverable triggers an immediate **`403 Forbidden`** ("You can only submit deliverables for your own company sponsorship").
- The Event Organizer retains oversight over all sponsorships and deliverables within their event.

### 5.2 Check-In Staff Isolation
- Event and session check-in routes (`POST /checkin/event`, `POST /checkin/session`) enforce `authorize({ eventRoles: ['staff', 'organizer'] })`.
- A regular attendee cannot call check-in endpoints to check themselves or peers in.
- Staff members can only check in attendees for the event in which their `EventMember` record is active.

### 5.3 Feedback Integrity
- Feedback submission (`POST /events/:eventId/feedback`) enforces that the submitting user is an authenticated attendee.
- Sessions feedback is strictly tied to verified registrations and session attendance records.

---

## 6. Security Invariants
1. **Never Trust Client-Supplied Event Membership**: Membership must always be verified against the persistent database (`EventMember` collection) rather than relying on stale JWT claims.
2. **Compound Index Uniqueness**: The `EventMember` model enforces a compound unique index on `{ user: 1, event: 1 }` to prevent duplicate membership states.
3. **Audit Trail Accountability**: All administrative operations, member role modifications, ticket purchases, check-ins, and deliverable reviews emit an `AuditLog` entry documenting actor, action, resource target, IP address, and timestamp.
