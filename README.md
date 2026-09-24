# EventForge — Corporate Event & Conference Management Platform

**EventForge** is an enterprise-grade backend for modern conferences, corporate summits, and hybrid expos. Built with Node.js, Express, MongoDB, and Mongoose, it features a dual-layer Role-Based Access Control (RBAC) architecture, multi-tenant organization boundaries, Zod schema validation, JWT token rotation with HTTP-only cookies, structured audit trails, and interactive Swagger OpenAPI 3.0 documentation.

---


## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** >= 20.0.0
- **MongoDB** running locally on `localhost:27017` or configured via `MONGODB_URI`

### 2. Environment Configuration
The server includes a configured `.env` file (`server/.env`). To customize settings:
```bash
cp server/.env.example server/.env
```

### 3. Seed Database
Run the seed script from the repository root or server folder:
```bash
npm run seed
```

### 4. Run Test Suite
Run the automated test suite powered by Jest, Supertest, and MongoMemoryServer:
```bash
npm test
```
*Coverage includes authentication flow, token rotation, cross-event RBAC denial boundaries, event lifecycle workflows, and Zod validation errors.*

### 5. Launch Development Server
```bash
npm run dev
```
The server will start on port `5000`:
- **API Base**: `http://localhost:5000/api/v1`
- **Health Check**: `http://localhost:5000/api/v1/health`
- **Interactive Swagger Docs**: `http://localhost:5000/api/docs`

---

## 🏛️ System Architecture & RBAC

EventForge enforces a **Dual-Layer Authorization Engine**:
1. **Global Layer (`User.globalRole`)**:
   - `platform_admin`: Superuser managing tenants, subscription tiers, and global security policies.
   - `user`: Standard platform account.
2. **Event-Scoped Layer (`EventMember.role`)**:
   - `organizer`: Full authority over specific event instance (`/events/:eventId`).
   - `staff`: Operational duties, scheduling, and broadcast announcements.
   - `speaker`: Presenter profile management and schedule visibility.
   - `sponsor`: Corporate booth collateral management.
   - `attendee`: Participant derived via registration.

> **Cross-Event Isolation**: Organizers of Event A cannot inspect, edit, publish, or alter roster data for Event B. All cross-event mutation attempts are rejected with `403 Forbidden`.

For in-depth specifications, refer to:
- [`docs/ARCHITECTURE.md`](file:///c:/Event-forge/docs/ARCHITECTURE.md) — Architectural overview, layered patterns, Mermaid ERD, and product API contract.
- [`docs/RBAC.md`](file:///c:/Event-forge/docs/RBAC.md) — Two-layer RBAC deep dive and boundary enforcement mechanics.
- [`docs/API.md`](file:///c:/Event-forge/docs/API.md) — Detailed endpoint reference with request/response payloads.

---

## 📁 Repository Structure

```
eventforge/
├── docs/
│   ├── ARCHITECTURE.md         # Layered architecture, Mermaid ERD & full API contract
│   ├── API.md                  # REST API reference guide
│   └── RBAC.md                 # Dual-layer RBAC specifications
├── client/                     # Frontend client workspace (Prompt 2+)
├── server/
│   ├── package.json            # Server configuration & dependencies
│   ├── uploads/                # Local uploaded asset storage directory
│   ├── tests/
│   │   ├── setup.js            # MongoMemoryServer test harness
│   │   ├── auth.test.js        # Authentication & token rotation tests
│   │   ├── rbac.test.js        # Cross-event boundary enforcement tests
│   │   ├── event.test.js       # Event CRUD, lifecycle & duplication tests
│   │   └── validation.test.js  # Zod schema validation error mapping tests
│   └── src/
│       ├── app.js              # Express app setup, security middlewares, route mounts
│       ├── server.js           # Server listener & graceful shutdown handlers
│       ├── config/
│       │   ├── env.js          # Validated environment configuration (Zod)
│       │   ├── db.js           # Mongoose connection management
│       │   ├── roles.js        # Role constants & status definitions
│       │   └── swagger.js      # OpenAPI 3.0 JSDoc configuration
│       ├── middlewares/
│       │   ├── authenticate.js # JWT access token verification
│       │   ├── authorize.js    # Two-layer RBAC middleware
│       │   ├── validate.js     # Zod request validation middleware
│       │   ├── error.js        # Centralized error handler & status mapper
│       │   ├── rateLimit.js    # Standard & auth rate limiters
│       │   └── upload.js       # Multer multipart file upload handler
│       ├── models/
│       │   ├── Organization.js # Multi-tenant organization accounts
│       │   ├── User.js         # User profiles & bcrypt hashes
│       │   ├── RefreshToken.js # Rotating refresh tokens & family revocation
│       │   ├── Event.js        # Events, lifecycle statuses, policies
│       │   ├── EventMember.js  # Event-scoped memberships & roles
│       │   ├── Venue.js        # Venues & embedded room layouts
│       │   ├── Speaker.js      # Speaker catalog & availability
│       │   ├── Announcement.js # Event broadcasts by audience segment
│       │   ├── AuditLog.js     # Tamper-evident admin & security action logs
│       │   └── GlobalPolicy.js # Platform configuration parameters
│       ├── modules/
│       │   ├── auth/           # register, login, refresh, logout, me, password reset
│       │   ├── users/          # User directory & profile updates
│       │   ├── organizations/  # Multi-tenant orgs, tiers, subscription management
│       │   ├── events/         # Event CRUD, lifecycle (publish/cancel), duplicate
│       │   ├── venues/         # Venues & room layouts management
│       │   ├── speakers/       # Speaker catalog & availability
│       │   ├── team/           # Event member invitations & role management
│       │   ├── announcements/  # Event broadcast messaging
│       │   ├── policies/       # Global system policies & admin settings
│       │   └── uploads/        # Pluggable storage (Local Disk & S3 Interface)
│       ├── seed/
│       │   ├── index.js        # Database seeder execution script
│       │   └── seedData.js     # Deterministic seed data fixtures
│       └── utils/
│           ├── ApiError.js     # Operational API error class
│           ├── asyncHandler.js # Async error propagation wrapper
│           ├── response.js     # Standard response envelope helpers
│           ├── logger.js       # Structured logger
│           ├── pagination.js   # Pagination, search & sort utility
│           └── storage.js      # Storage provider abstraction (Disk & S3)
└── package.json                # Monorepo root package.json (delegating scripts)
```
