const request = require('supertest');
const app = require('../src/app');
const Organization = require('../src/models/Organization');
const Event = require('../src/models/Event');
const EventMember = require('../src/models/EventMember');
const TicketType = require('../src/models/TicketType');
const Registration = require('../src/models/Registration');
const Session = require('../src/models/Session');
const SessionAttendance = require('../src/models/SessionAttendance');
const SponsorPackage = require('../src/models/SponsorPackage');
const Sponsorship = require('../src/models/Sponsorship');
const Deliverable = require('../src/models/Deliverable');
const Feedback = require('../src/models/Feedback');
const User = require('../src/models/User');

require('./setup');

describe('Event & Platform Analytics Aggregation Pipelines Tests', () => {
  let adminToken;
  let organizerToken;
  let attendeeToken;
  let event;

  beforeEach(async () => {
    // 1. Platform Admin
    await User.create({
      name: 'System Admin',
      email: 'admin@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'platform_admin',
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@eventforge.com',
      password: 'Password123!',
    });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Organizer
    const organizer = await User.create({
      name: 'Organizer Leader',
      email: 'organizer@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });
    const orgLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'organizer@eventforge.com',
      password: 'Password123!',
    });
    organizerToken = orgLogin.body.data.accessToken;

    // 3. Attendee
    const attendee = await User.create({
      name: 'Analytics Attendee',
      email: 'attendee@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });
    const attLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'attendee@eventforge.com',
      password: 'Password123!',
    });
    attendeeToken = attLogin.body.data.accessToken;

    // 4. Organization & Event
    const org = await Organization.create({
      name: 'Data Metrics Corp',
      slug: 'data-metrics-corp',
      plan: 'enterprise',
      status: 'active',
    });

    event = await Event.create({
      org: org._id,
      title: 'Metrics & Observability Con 2026',
      slug: 'metrics-observability-con-2026',
      startDate: new Date('2026-10-01T09:00:00.000Z'),
      endDate: new Date('2026-10-03T18:00:00.000Z'),
      status: 'published',
      capacity: 500,
      createdBy: organizer._id,
    });

    await EventMember.create({
      event: event._id,
      user: organizer._id,
      role: 'organizer',
      status: 'active',
    });

    // 5. Ticket Types & Registrations
    const ticket1 = await TicketType.create({
      event: event._id,
      name: 'General Admission',
      price: 100,
      capacity: 200,
      sold: 2,
      salesWindow: {
        start: new Date(Date.now() - 100000),
        end: new Date(Date.now() + 100000),
      },
    });

    await Registration.create({
      event: event._id,
      user: attendee._id,
      ticketType: ticket1._id,
      status: 'checked_in',
      finalPrice: 100,
      qrToken: 'qr_analytics_1',
      checkedInAt: new Date(),
    });

    await Registration.create({
      event: event._id,
      user: organizer._id,
      ticketType: ticket1._id,
      status: 'approved',
      finalPrice: 100,
      qrToken: 'qr_analytics_2',
    });

    // 6. Session & Attendance
    const session = await Session.create({
      event: event._id,
      title: 'Real-Time Streaming Aggregations',
      room: 'Hall B',
      start: new Date('2026-10-01T10:00:00.000Z'),
      end: new Date('2026-10-01T11:00:00.000Z'),
      capacity: 50,
    });

    await SessionAttendance.create({
      session: session._id,
      user: attendee._id,
      event: event._id,
      scannedAt: new Date(),
    });

    // 7. Feedback
    await Feedback.create({
      event: event._id,
      session: session._id,
      user: attendee._id,
      rating: 5,
      comment: 'Super informative session on aggregations!',
    });

    // 8. Sponsor & Deliverables
    const pkg = await SponsorPackage.create({
      event: event._id,
      tier: 'gold',
      name: 'Gold Package',
      price: 5000,
      slots: 2,
    });

    const sp = await Sponsorship.create({
      event: event._id,
      sponsor: organizer._id,
      package: pkg._id,
      companyName: 'MetricStream Inc',
      status: 'confirmed',
    });

    await Deliverable.create({
      event: event._id,
      sponsorship: sp._id,
      title: 'Company Logo',
      dueDate: new Date('2026-09-30T00:00:00.000Z'),
      status: 'approved',
      asset: 'https://cdn.example.com/logo.svg',
    });
  });

  describe('Event Analytics Endpoint: GET /events/:eventId/analytics', () => {
    it('1. should return aggregated event metrics for organizer', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${event._id}/analytics`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data).toHaveProperty('registrationsOverTime');
      expect(Array.isArray(data.registrationsOverTime)).toBe(true);
      expect(data.registrationsOverTime.length).toBeGreaterThan(0);

      expect(data).toHaveProperty('ticketMixAndRevenue');
      expect(data.ticketMixAndRevenue.totalRevenue).toBe(200);

      expect(data).toHaveProperty('attendanceRate');
      expect(data.attendanceRate.totalApproved).toBe(2);
      expect(data.attendanceRate.totalCheckedIn).toBe(1);
      expect(data.attendanceRate.ratePercentage).toBe(50);

      expect(data).toHaveProperty('sessionPopularity');
      expect(data.sessionPopularity.length).toBe(1);
      expect(data.sessionPopularity[0].attendees).toBe(1);

      expect(data).toHaveProperty('feedback');
      expect(data.feedback.count).toBe(1);
      expect(data.feedback.averageRating).toBe(5);

      expect(data).toHaveProperty('sponsorshipDeliverables');
      expect(data.sponsorshipDeliverables.totalDeliverables).toBe(1);
      expect(data.sponsorshipDeliverables.approvedDeliverables).toBe(1);
      expect(data.sponsorshipDeliverables.completionRatePercentage).toBe(100);
    });

    it('2. regular attendee cannot access event analytics (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${event._id}/analytics`)
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Platform Admin Overview Endpoint: GET /analytics/overview', () => {
    it('3. should return platform-wide overview metrics for platform_admin', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data).toHaveProperty('totalOrganizations');
      expect(data.totalOrganizations).toBeGreaterThanOrEqual(1);

      expect(data).toHaveProperty('totalEvents');
      expect(data.totalEvents).toBeGreaterThanOrEqual(1);

      expect(data).toHaveProperty('eventsByStatus');
      expect(data).toHaveProperty('totalUsers');
      expect(data).toHaveProperty('totalSessions');
      expect(data).toHaveProperty('totalSponsorships');
      expect(data).toHaveProperty('totalTicketsSold');
      expect(data.totalTicketsSold).toBeGreaterThanOrEqual(2);

      expect(data).toHaveProperty('grossPlatformRevenue');
      expect(data.grossPlatformRevenue).toBeGreaterThanOrEqual(200);
    });

    it('4. non-platform admin cannot access platform overview (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
