# EventForge — REST API Reference Guide

All API routes are prefixed with `/api/v1`. Interactive Swagger documentation is served live at `GET /api/docs`.

---

## 1. Authentication Endpoints (`/auth`)

### 1.1 Register Account
- **POST** `/auth/register`
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "660c1bf6e4b0123456789001",
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "globalRole": "user",
        "isActive": true
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```
- **Cookies**: Sets `refreshToken` in HTTP-Only, Secure, SameSite cookie.

### 1.2 Login
- **POST** `/auth/login`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "660c1bf6e4b0123456789001",
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "globalRole": "user"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```
- **Cookies**: Sets rotating `refreshToken` cookie.

### 1.3 Refresh Access Token
- **POST** `/auth/refresh`
- **Access**: Public (Requires `refreshToken` cookie or body)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```
- **Cookies**: Issues a new rotated `refreshToken` cookie and revokes previous token.

### 1.4 Logout
- **POST** `/auth/logout`
- **Access**: Public / Authenticated
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out successfully"
    }
  }
  ```
- **Cookies**: Clears `refreshToken` cookie and marks token family as revoked in database.

### 1.5 Get Current User Profile
- **GET** `/auth/me`
- **Access**: Authenticated (`Bearer <token>`)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "660c1bf6e4b0123456789001",
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "globalRole": "user"
      },
      "memberships": [
        {
          "event": "660c1bf6e4b0123456789002",
          "role": "organizer",
          "status": "active"
        }
      ]
    }
  }
  ```

---

## 2. Organizations (`/organizations`)

### 2.1 Create Organization
- **POST** `/organizations`
- **Access**: Platform Admin only
- **Body**:
  ```json
  {
    "name": "Acme Innovations",
    "plan": "enterprise",
    "settings": {
      "maxEvents": 50,
      "customBranding": true
    }
  }
  ```

### 2.2 List Organizations
- **GET** `/organizations`
- **Access**: Platform Admin only
- **Query**: `page`, `limit`, `search`, `plan`, `status`

---

## 3. Events (`/events`)

### 3.1 Create Event
- **POST** `/events`
- **Access**: Authenticated User (becomes Event Organizer)
- **Body**:
  ```json
  {
    "org": "660c1bf6e4b0123456789010",
    "title": "Cloud Native Summit 2026",
    "startDate": "2026-11-15T09:00:00.000Z",
    "endDate": "2026-11-17T18:00:00.000Z",
    "capacity": 1500,
    "venue": "660c1bf6e4b0123456789020"
  }
  ```

### 3.2 Publish Event
- **POST** `/events/:id/publish`
- **Access**: Event Organizer or Platform Admin

### 3.3 Cancel Event
- **POST** `/events/:id/cancel`
- **Access**: Event Organizer or Platform Admin
- **Body**:
  ```json
  {
    "reason": "Logistical rescheduling"
  }
  ```

### 3.4 Duplicate Event
- **POST** `/events/:id/duplicate`
- **Access**: Event Organizer or Platform Admin

---

## 4. Ticket Types & Coupons

### 4.1 Create Ticket Type
- **POST** `/events/:eventId/tickets`
- **Access**: Event Organizer
- **Body**:
  ```json
  {
    "name": "Early Bird VIP",
    "price": 299,
    "capacity": 100,
    "salesWindow": {
      "start": "2026-09-01T00:00:00.000Z",
      "end": "2026-10-31T23:59:59.000Z"
    },
    "requiresApproval": false
  }
  ```

### 4.2 List Ticket Types
- **GET** `/events/:eventId/tickets`
- **Access**: Public / Authenticated

### 4.3 Create Coupon
- **POST** `/events/:eventId/coupons`
- **Access**: Event Organizer
- **Body**:
  ```json
  {
    "code": "TECH20",
    "type": "percent",
    "value": 20,
    "maxUses": 100,
    "expiry": "2026-12-31T23:59:59.000Z",
    "ticketTypes": ["660c1bf6e4b0123456789030"]
  }
  ```

### 4.4 Validate Coupon
- **POST** `/events/:eventId/coupons/validate`
- **Access**: Authenticated User
- **Body**:
  ```json
  {
    "code": "TECH20",
    "ticketTypeId": "660c1bf6e4b0123456789030"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "valid": true,
      "discountAmount": 59.8,
      "finalPrice": 239.2,
      "coupon": {
        "code": "TECH20",
        "type": "percent",
        "value": 20
      }
    }
  }
  ```

---

## 5. Registrations & Waitlist Management

### 5.1 Register for Event Ticket
- **POST** `/events/:eventId/register`
- **Access**: Authenticated User
- **Body**:
  ```json
  {
    "ticketTypeId": "660c1bf6e4b0123456789030",
    "couponCode": "TECH20",
    "interests": ["LLM", "Inference", "Scale"],
    "selectedSessions": ["660c1bf6e4b0123456789040"]
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "registration": {
        "id": "660c1bf6e4b0123456789050",
        "status": "approved",
        "finalPrice": 239.2,
        "qrToken": "qr_sec_tok_991823719827391823",
        "interests": ["LLM", "Inference", "Scale"]
      },
      "isWaitlisted": false
    }
  }
  ```
  *(If ticket capacity is exhausted, status automatically becomes `waitlisted` with a sequential 1-based `waitlistPosition`)*.

### 5.2 Cancel Registration (Auto-Promotion)
- **POST** `/registrations/:id/cancel`
- **Access**: Attendee (Self) or Organizer
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "message": "Registration cancelled successfully",
      "promotedWaitlistId": "660c1bf6e4b0123456789051"
    }
  }
  ```

### 5.3 Approve / Reject Pending Registration
- **PATCH** `/events/:eventId/registrations/:id/approve`
- **PATCH** `/events/:eventId/registrations/:id/reject`
- **Access**: Event Organizer

---

## 6. Agenda & Session Scheduling (4-Point Conflict Detection)

### 6.1 Pre-Check Conflicts (Live Validation)
- **POST** `/events/:eventId/sessions/check-conflicts`
- **Access**: Event Organizer
- **Body**:
  ```json
  {
    "room": "Grand Ballroom",
    "start": "2026-11-15T10:00:00.000Z",
    "end": "2026-11-15T11:00:00.000Z",
    "speakers": ["660c1bf6e4b0123456789060"],
    "capacity": 500
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "hasConflict": false,
      "conflicts": []
    }
  }
  ```

### 6.2 Create Session
- **POST** `/events/:eventId/sessions`
- **Access**: Event Organizer
- **Body**:
  ```json
  {
    "title": "Scaling Distributed Inference",
    "description": "Technical deep dive on KV cache optimizations",
    "room": "Grand Ballroom",
    "start": "2026-11-15T10:00:00.000Z",
    "end": "2026-11-15T11:00:00.000Z",
    "speakers": ["660c1bf6e4b0123456789060"],
    "track": "Engineering",
    "tags": ["LLM", "Scale"],
    "capacity": 500
  }
  ```
- **Error Response on Conflict** (`409 Conflict`):
  ```json
  {
    "success": false,
    "error": {
      "code": "SCHEDULE_CONFLICT",
      "message": "Room 'Grand Ballroom' is already occupied by session 'Keynote'...",
      "details": [
        {
          "type": "ROOM_OVERLAP",
          "message": "Room 'Grand Ballroom' is already occupied..."
        }
      ]
    }
  }
  ```

### 6.3 Update Session
- **PATCH** `/events/:eventId/sessions/:id`
- **Access**: Event Organizer (Excludes current session from self-conflict checking).

---

## 7. QR Check-In & Attendance

### 7.1 Event QR Check-In (Idempotent)
- **POST** `/checkin/event`
- **Access**: Event Staff or Organizer
- **Body**:
  ```json
  {
    "eventId": "660c1bf6e4b0123456789002",
    "qrToken": "qr_sec_tok_991823719827391823"
  }
  ```
- **Response on First Scan** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "alreadyCheckedIn": false,
      "message": "Event check-in verified successfully",
      "registration": {
        "id": "660c1bf6e4b0123456789050",
        "status": "checked_in"
      },
      "checkedInAt": "2026-11-15T09:12:00.000Z"
    }
  }
  ```
- **Response on Re-Scan (Idempotent)** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "alreadyCheckedIn": true,
      "message": "Attendee has already been checked into this event",
      "checkedInAt": "2026-11-15T09:12:00.000Z"
    }
  }
  ```

### 7.2 Session QR Check-In
- **POST** `/checkin/session`
- **Access**: Event Staff or Organizer
- **Body**:
  ```json
  {
    "eventId": "660c1bf6e4b0123456789002",
    "sessionId": "660c1bf6e4b0123456789040",
    "qrToken": "qr_sec_tok_991823719827391823"
  }
  ```

### 7.3 Live Attendance Counters
- **GET** `/events/:eventId/attendance/live`
- **Access**: Event Staff or Organizer
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "eventCounters": {
        "totalEligibleRegistrations": 160,
        "actualCheckedIn": 90,
        "checkInRatePercentage": 56,
        "waitlistCount": 25
      },
      "sessions": [
        {
          "sessionId": "660c1bf6e4b0123456789040",
          "title": "Scaling Distributed Inference",
          "room": "Grand Ballroom",
          "capacity": 500,
          "attendees": 340,
          "utilizationRate": 68
        }
      ]
    }
  }
  ```

---

## 8. Sponsors & Deliverable Tracking

### 8.1 Allocate Sponsorship
- **POST** `/events/:eventId/sponsorships`
- **Access**: Event Organizer
- **Body**:
  ```json
  {
    "sponsorId": "660c1bf6e4b0123456789070",
    "packageId": "660c1bf6e4b0123456789080",
    "companyName": "CloudScale Systems",
    "companyLogo": "https://cdn.example.com/logo.png"
  }
  ```

### 8.2 Submit Deliverable Asset
- **PATCH** `/events/:eventId/sponsorships/:sponsorshipId/deliverables/:id/submit`
- **Access**: Sponsor User (Strict Tenant Isolation: own company only)
- **Body**:
  ```json
  {
    "asset": "https://cdn.example.com/assets/logo_transparent.svg"
  }
  ```

### 8.3 Review Deliverable
- **PATCH** `/events/:eventId/sponsorships/:sponsorshipId/deliverables/:id/review`
- **Access**: Event Organizer
- **Body**:
  ```json
  {
    "status": "approved",
    "reviewNotes": "Vector resolution and clear space verified."
  }
  ```

---

## 9. Attendee Feedback

### 9.1 Submit Feedback
- **POST** `/events/:eventId/feedback`
- **Access**: Verified Attendee
- **Body**:
  ```json
  {
    "sessionId": "660c1bf6e4b0123456789040",
    "rating": 5,
    "comment": "Super practical benchmarks and code examples."
  }
  ```

### 9.2 Feedback Rating Distribution & Summary
- **GET** `/events/:eventId/feedback/summary`
- **Access**: Event Organizer or Staff

---

## 10. AI Drafts & Hybrid Recommendations

### 10.1 Generate Marketing Description Draft
- **POST** `/ai/event-description`
- **Access**: Authenticated User
- **Body**:
  ```json
  {
    "title": "Neural World Summit 2026",
    "theme": "Autonomous Agents at Scale",
    "targetAudience": "ML Engineers and Tech Leaders",
    "highlights": ["Keynotes from frontier labs", "Hands-on labs"]
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "draft": "### About Neural World Summit 2026...",
      "provider": "deterministic-template-v1",
      "model": "rule-template-engine"
    }
  }
  ```
  *(Draft is returned directly and is never auto-saved to an Event doc)*.

### 10.2 Hybrid Recommendations
- **GET** `/events/:id/recommendations?limit=5`
- **Access**: Authenticated Attendee
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "session": {
          "id": "660c1bf6e4b0123456789040",
          "title": "Scaling Distributed Inference",
          "track": "Engineering",
          "tags": ["LLM", "Inference"]
        },
        "score": 75,
        "breakdown": {
          "tagScore": 50,
          "coScore": 15,
          "trackScore": 10
        },
        "why": "Matches your interest in LLM & Inference • Popular among 12 attendees with similar interests",
        "isAlreadySelected": false
      }
    ]
  }
  ```

---

## 11. Analytics & Metrics Dashboards

### 11.1 Event Metrics Dashboard
- **GET** `/events/:eventId/analytics`
- **Access**: Event Organizer or Staff
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "registrationsOverTime": [
        { "date": "2026-11-01", "total": 12, "approved": 10, "checkedIn": 8, "waitlisted": 2, "cancelled": 0 }
      ],
      "ticketMixAndRevenue": {
        "totalRevenue": 42500,
        "tickets": [
          { "ticketId": "...", "name": "VIP Pass", "price": 599, "sold": 35, "revenue": 20965 }
        ]
      },
      "attendanceRate": {
        "totalApproved": 160,
        "totalCheckedIn": 90,
        "ratePercentage": 56
      },
      "sessionPopularity": [
        { "sessionId": "...", "title": "Scaling Distributed Inference", "attendees": 340, "fillRatePercentage": 68 }
      ],
      "feedback": {
        "count": 55,
        "averageRating": 4.7,
        "ratingBreakdown": { "5": 38, "4": 14, "3": 3, "2": 0, "1": 0 }
      },
      "sponsorshipDeliverables": {
        "totalDeliverables": 6,
        "approvedDeliverables": 4,
        "submittedDeliverables": 2,
        "pendingDeliverables": 0,
        "completionRatePercentage": 67
      }
    }
  }
  ```

### 11.2 Platform Overview
- **GET** `/analytics/overview`
- **Access**: Platform Admin only
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "totalOrganizations": 2,
      "totalEvents": 3,
      "eventsByStatus": { "live": 1, "published": 1, "completed": 1 },
      "totalUsers": 209,
      "totalSessions": 20,
      "totalSponsorships": 3,
      "totalTicketsSold": 160,
      "grossPlatformRevenue": 42500
    }
  }
  ```
