const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middlewares/rateLimit');
const { errorHandler, notFoundHandler } = require('./middlewares/error');
const { sendSuccess } = require('./utils/response');

// Module routes
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const organizationsRoutes = require('./modules/organizations/organizations.routes');
const policiesRoutes = require('./modules/policies/policies.routes');
const eventsRoutes = require('./modules/events/events.routes');
const teamRoutes = require('./modules/team/team.routes');
const announcementsRoutes = require('./modules/announcements/announcements.routes');
const venuesRoutes = require('./modules/venues/venues.routes');
const speakersRoutes = require('./modules/speakers/speakers.routes');
const uploadsRoutes = require('./modules/uploads/uploads.routes');
const { ticketRouter, couponRouter } = require('./modules/tickets/tickets.routes');
const { eventRegistrationRouter, myRegistrationsRouter } = require('./modules/registrations/registrations.routes');
const sessionsRoutes = require('./modules/sessions/sessions.routes');
const { checkinRouter, liveAttendanceRouter } = require('./modules/checkin/checkin.routes');
const { packageRouter, sponsorshipRouter } = require('./modules/sponsors/sponsors.routes');
const feedbackRoutes = require('./modules/feedback/feedback.routes');
const { aiRouter, recommendationsRouter } = require('./modules/ai/ai.routes');
const { eventAnalyticsRouter, adminAnalyticsRouter } = require('./modules/analytics/analytics.routes');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Enable CORS with credentials
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Parse Cookie header and populate req.cookies
app.use(cookieParser(env.COOKIE_SECRET));

// Parse JSON and urlencoded request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize request data against MongoDB Operator Injection
app.use(mongoSanitize());

// HTTP request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Serve uploaded assets statically
const uploadDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Swagger UI Interactive API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'EventForge API Documentation',
}));

// Apply general rate limiter across /api routes
app.use('/api', apiLimiter);

// System Health Check Endpoint
app.get('/health', (req, res) => {
  sendSuccess(res, {
    statusCode: 200,
    data: {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'EventForge Backend API',
    },
  });
});

app.get('/api/v1/health', (req, res) => {
  sendSuccess(res, {
    statusCode: 200,
    data: {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'EventForge Backend API',
    },
  });
});

// Mount V1 API Feature Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/organizations', organizationsRoutes);
app.use('/api/v1/policies', policiesRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/events/:eventId/members', teamRoutes);
app.use('/api/v1/events/:eventId/announcements', announcementsRoutes);
app.use('/api/v1/venues', venuesRoutes);
app.use('/api/v1/speakers', speakersRoutes);
app.use('/api/v1/uploads', uploadsRoutes);

// Prompt 2 Routes
app.use('/api/v1/events/:eventId/tickets', ticketRouter);
app.use('/api/v1/events/:eventId/coupons', couponRouter);
app.use('/api/v1/events/:eventId/register', eventRegistrationRouter);
app.use('/api/v1/events/:eventId/registrations', eventRegistrationRouter);
app.use('/api/v1/registrations', myRegistrationsRouter);
app.use('/api/v1/events/:eventId/sessions', sessionsRoutes);
app.use('/api/v1/checkin', checkinRouter);
app.use('/api/v1/events/:eventId/attendance', liveAttendanceRouter);
app.use('/api/v1/events/:eventId/sponsor-packages', packageRouter);
app.use('/api/v1/events/:eventId/sponsorships', sponsorshipRouter);
app.use('/api/v1/events/:eventId/feedback', feedbackRoutes);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/events/:id', recommendationsRouter);
app.use('/api/v1/events/:eventId/analytics', eventAnalyticsRouter);
app.use('/api/v1/analytics', adminAnalyticsRouter);

// Catch-all 404 handler
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

module.exports = app;
