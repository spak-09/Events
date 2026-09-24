const request = require('supertest');
const app = require('../src/app');
const Organization = require('../src/models/Organization');
const Event = require('../src/models/Event');
const TicketType = require('../src/models/TicketType');
const Registration = require('../src/models/Registration');
const Session = require('../src/models/Session');
const SessionAttendance = require('../src/models/SessionAttendance');
const EventMember = require('../src/models/EventMember');
const User = require('../src/models/User');

require('./setup');

describe('QR Check-in, Attendance Tracking & Idempotency Tests', () => {
  let staffToken;
  let attendeeToken;
  let event;
  let registration;
  let session;
  let staffUser;
  let attendeeUser;

  beforeEach(async () => {
    // 1. Staff User
    staffUser = await User.create({
      name: 'Event Staff Member',
      email: 'staff@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });

    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'staff@eventforge.com',
      password: 'Password123!',
    });
    staffToken = staffLogin.body.data.accessToken;

    // 2. Attendee User
    attendeeUser = await User.create({
      name: 'Conference Attendee',
      email: 'attendee@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });

    const attendeeLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'attendee@eventforge.com',
      password: 'Password123!',
    });
    attendeeToken = attendeeLogin.body.data.accessToken;

    // 3. Organization & Event
    const org = await Organization.create({
      name: 'Event Ops Org',
      slug: 'event-ops-org',
      plan: 'growth',
      status: 'active',
    });

    event = await Event.create({
      org: org._id,
      title: 'DevOps Summit 2026',
      slug: 'devops-summit-2026',
      startDate: new Date('2026-12-01T09:00:00.000Z'),
      endDate: new Date('2026-12-01T18:00:00.000Z'),
      status: 'published',
      capacity: 200,
      createdBy: staffUser._id,
    });

    // 4. Assign Staff Role in EventMember
    await EventMember.create({
      event: event._id,
      user: staffUser._id,
      role: 'staff',
      status: 'active',
    });

    // 5. Ticket Type & Registration
    const ticketType = await TicketType.create({
      event: event._id,
      name: 'Standard Pass',
      price: 150,
      capacity: 100,
      sold: 1,
      salesWindow: {
        start: new Date(Date.now() - 86400000),
        end: new Date(Date.now() + 86400000),
      },
    });

    // Approved registration with unique non-guessable qrToken
    registration = await Registration.create({
      event: event._id,
      user: attendeeUser._id,
      ticketType: ticketType._id,
      status: 'approved',
      qrToken: 'qr_test_secure_token_1234567890abcdef',
      finalPrice: 150,
    });

    // 6. Session
    session = await Session.create({
      event: event._id,
      title: 'Kubernetes at Scale',
      room: 'Hall A',
      start: new Date('2026-12-01T10:00:00.000Z'),
      end: new Date('2026-12-01T11:00:00.000Z'),
      capacity: 80,
    });
  });

  it('1. should successfully check in attendee to event on first scan (alreadyCheckedIn: false)', async () => {
    const res = await request(app)
      .post('/api/v1/checkin/event')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        eventId: event._id.toString(),
        qrToken: registration.qrToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyCheckedIn).toBe(false);
    expect(res.body.data.registration.status).toBe('checked_in');
    expect(res.body.data.checkedInAt).toBeDefined();

    // Verify DB update
    const updated = await Registration.findById(registration._id);
    expect(updated.status).toBe('checked_in');
    expect(updated.checkedInBy.toString()).toBe(staffUser._id.toString());
  });

  it('2. IDEMPOTENCY: second scan of same attendee QR code should succeed with alreadyCheckedIn: true', async () => {
    // First scan
    await request(app)
      .post('/api/v1/checkin/event')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        eventId: event._id.toString(),
        qrToken: registration.qrToken,
      });

    // Second scan (idempotent)
    const res = await request(app)
      .post('/api/v1/checkin/event')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        eventId: event._id.toString(),
        qrToken: registration.qrToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyCheckedIn).toBe(true);
    expect(res.body.data.message).toContain('already been checked into this event');
  });

  it('3. RBAC ISOLATION: regular attendee cannot access check-in endpoints (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/checkin/event')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: event._id.toString(),
        qrToken: registration.qrToken,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('4. should reject check-in with invalid or unapproved QR token (404 Not Found)', async () => {
    const res = await request(app)
      .post('/api/v1/checkin/event')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        eventId: event._id.toString(),
        qrToken: 'non_existent_qr_token_random',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('5. should check in attendee to specific session and create SessionAttendance record', async () => {
    const res = await request(app)
      .post('/api/v1/checkin/session')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        eventId: event._id.toString(),
        sessionId: session._id.toString(),
        qrToken: registration.qrToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyAttended).toBe(false);
    expect(res.body.data.session.id).toBe(session._id.toString());
    expect(res.body.data.attendee.name).toBe('Conference Attendee');

    const attendanceRecord = await SessionAttendance.findOne({
      session: session._id,
      user: attendeeUser._id,
    });
    expect(attendanceRecord).not.toBeNull();
    expect(attendanceRecord.scannedBy.toString()).toBe(staffUser._id.toString());
  });

  it('6. SESSION IDEMPOTENCY: second scan for same session returns alreadyAttended: true', async () => {
    // First scan
    await request(app)
      .post('/api/v1/checkin/session')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        eventId: event._id.toString(),
        sessionId: session._id.toString(),
        qrToken: registration.qrToken,
      });

    // Second scan
    const res = await request(app)
      .post('/api/v1/checkin/session')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        eventId: event._id.toString(),
        sessionId: session._id.toString(),
        qrToken: registration.qrToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyAttended).toBe(true);
    expect(res.body.data.message).toContain('already marked present');

    const records = await SessionAttendance.find({
      session: session._id,
      user: attendeeUser._id,
    });
    expect(records).toHaveLength(1);
  });

  it('7. LIVE COUNTERS: should return live attendance rate and session stats', async () => {
    // Complete event checkin
    await request(app)
      .post('/api/v1/checkin/event')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        eventId: event._id.toString(),
        qrToken: registration.qrToken,
      });

    // Complete session checkin
    await request(app)
      .post('/api/v1/checkin/session')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        eventId: event._id.toString(),
        sessionId: session._id.toString(),
        qrToken: registration.qrToken,
      });

    const res = await request(app)
      .get(`/api/v1/events/${event._id}/attendance/live`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eventCounters.totalEligibleRegistrations).toBe(1);
    expect(res.body.data.eventCounters.actualCheckedIn).toBe(1);
    expect(res.body.data.eventCounters.checkInRatePercentage).toBe(100);
    expect(res.body.data.sessions).toHaveLength(1);
    expect(res.body.data.sessions[0].attendees).toBe(1);
  });
});
