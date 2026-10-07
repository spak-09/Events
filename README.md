# EventForge — Corporate Event & Conference Management Platform

EventForge is a production-grade enterprise conference management platform engineered with multi-tenant dual-layer RBAC, atomic capacity controls, 4-point conflict detection scheduling, and offline-tolerant QR check-ins.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    Client[React 18 + Vite + Tailwind CSS]
    subgraph Express API Gateway
        SecMW[Helmet, CORS & Mongo Sanitize]
        AuthMW[JWT Auth & Dual-Layer RBAC]
        Modules[Events, Sessions, Tickets, Registrations, Scanner, Sponsors, Analytics]
    end
    subgraph Persistence & Infrastructure
        DB[(MongoDB Database)]
        Uploads[Local / Cloud Asset Storage]
    end

    Client -->|REST API /api/v1 (Axios)| SecMW
    SecMW --> AuthMW
    AuthMW --> Modules
    Modules --> DB
    Modules --> Uploads
```

---

## 🚀 Deployment & Getting Started

### 1. Prerequisites
- **Node.js** >= 20.0.0
- **MongoDB** >= 6.0 (local instance or managed MongoDB Atlas cluster)

### 2. Environment Configuration

#### Backend Configuration
Copy the sample environment file in `Backend/` and configure your production values:
```bash
cp Backend/.env.example Backend/.env
```

Key variables to configure in `Backend/.env`:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/eventforge?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_high_entropy_64_char_access_secret
JWT_REFRESH_SECRET=your_high_entropy_64_char_refresh_secret
COOKIE_SECRET=your_high_entropy_cookie_secret
CORS_ORIGIN=https://yourdomain.com
UPLOAD_DIR=uploads
```

#### Frontend Configuration
Copy the sample environment file in `Frontend/` if deploying on a separate domain (e.g. Vercel, Netlify):
```bash
cp Frontend/.env.example Frontend/.env
```
```env
# Full backend API URL (leave blank if deploying behind same domain / reverse proxy):
VITE_API_URL=https://api.yourdomain.com
```

---

## 👤 Provisioning Your Initial Platform SuperAdmin

EventForge supports two secure bootstrapping methods for fresh deployments (with zero default/demo passwords):

### Method A: Web Self-Registration (Recommended for Fast Setup)
1. Boot the application with a clean database.
2. Navigate to `/register` in your browser.
3. The **very first account registered** on a fresh deployment is automatically granted the `platform_admin` global role. All subsequent registrations receive standard user permissions.

### Method B: CLI Admin Provisioning
You can provision or promote an administrator directly from the command line:
```bash
npm run create-admin <admin_email> <admin_password> "Platform Administrator"
```
Or with environment variables:
```bash
INITIAL_ADMIN_EMAIL=admin@company.com INITIAL_ADMIN_PASSWORD=SecurePassword123! npm run create-admin
```

---

## 🛠️ Database Management

To clear all database collections and reset the database to a clean baseline:
```bash
npm run db:clean
```
*This safely purges all user accounts, events, registrations, sessions, sponsorships, and deliverables, while initializing default platform operational settings.*

---

## 💻 Running the Application

### Development Mode
Runs both Frontend (Vite on port 3000) and Backend (Nodemon on port 5000) concurrently:
```bash
npm run dev
```

### Production Build & Deployment
1. Build the frontend client bundle:
   ```bash
   npm run build
   ```
2. Start the production backend server:
   ```bash
   npm start
   ```
*(When `NODE_ENV=production` and the frontend has been built, the backend server automatically serves the compiled static SPA from `Frontend/dist`.)*

---

## 🛡️ Dual-Layer RBAC Architecture

EventForge implements dual-layer role-based access control:

1. **Global Roles**:
   - `platform_admin`: System superuser with omnipotent oversight (manages organizations, global policies, suspends tenants, platform analytics).
   - `user`: Standard platform member eligible for event-specific role assignments.

2. **Event-Scoped Roles**:
   - `organizer`: Full governance over specific summit workspaces, scheduling grids, ticket pricing, deliverables, and team invitations.
   - `staff`: Badge check-in scanning, manual attendance logging, and session headcount monitoring.
   - `speaker`: Bio management, presentation material uploads, and session scheduling visibility.
   - `sponsor`: Collateral uploads, deliverables tracking, brand lead telemetry, and booth management.
   - `attendee`: Conference registration, digital QR badge access, agenda building, and session ratings.

---

## 📚 API Documentation

When the backend server is running, interactive OpenAPI/Swagger documentation is available at:
```
http://localhost:5000/api/docs
```
Health check endpoints:
- `GET /health`
- `GET /api/v1/health`
