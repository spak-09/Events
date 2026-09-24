const request = require('supertest');
const app = require('../src/app');
const Organization = require('../src/models/Organization');
const Event = require('../src/models/Event');
const EventMember = require('../src/models/EventMember');
const User = require('../src/models/User');
const { GLOBAL_ROLES, EVENT_ROLES } = require('../src/config/roles');

require('./setup');

describe('Dual-Layer RBAC & Cross-Event Isolation Tests', () => {
  let org;
  let adminToken;
  let organizerAToken;
  let organizerBToken;
  let regularUserToken;
  let eventA;
  let eventB;

  beforeEach(async () => {
    // 1. Create Organization
    org = await Organization.create({
      name: 'Acme Test Corp',
      slug: 'acme-test-corp',
      plan: 'enterprise',
      status: 'active',
      settings: { maxEvents: 20 },
    });

    // 2. Create Platform Admin
    const adminUser = await User.create({
      name: 'Platform Admin',
      email: 'admin@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: GLOBAL_ROLES.PLATFORM_ADMIN,
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@eventforge.com',
      password: 'Password123!',
    });
    adminToken = adminLogin.body.data.accessToken;

    // 3. Create Organizer A
    const userA = await User.create({
      name: 'Organizer A',
      email: 'organizerA@test.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: GLOBAL_ROLES.USER,
    });
    const loginA = await request(app).post('/api/v1/auth/login').send({
      email: 'organizerA@test.com',
      password: 'Password123!',
    });
    organizerAToken = loginA.body.data.accessToken;

    // 4. Create Organizer B
    const userB = await User.create({
      name: 'Organizer B',
      email: 'organizerB@test.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: GLOBAL_ROLES.USER,
    });
    const loginB = await request(app).post('/api/v1/auth/login').send({
      email: 'organizerB@test.com',
      password: 'Password123!',
    });
    organizerBToken = loginB.body.data.accessToken;

    // 5. Create Regular User
    await User.create({
      name: 'Regular Attendee',
      email: 'attendee@test.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: GLOBAL_ROLES.USER,
    });
    const loginRegular = await request(app).post('/api/v1/auth/login').send({
      email: 'attendee@test.com',
      password: 'Password123!',
    });
    regularUserToken = loginRegular.body.data.accessToken;

    // 6. Create Event A (organized by User A)
    eventA = await Event.create({
      org: org._id,
      title: 'Event Alpha',
      slug: 'event-alpha-1234',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-03'),
      status: 'draft',
      capacity: 500,
      createdBy: userA._id,
    });
    await EventMember.create({
      user: userA._id,
      event: eventA._id,
      role: EVENT_ROLES.ORGANIZER,
      status: 'active',
    });

    // 7. Create Event B (organized by User B)
    eventB = await Event.create({
      org: org._id,
      title: 'Event Beta',
      slug: 'event-beta-5678',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-03'),
      status: 'draft',
      capacity: 300,
      createdBy: userB._id,
    });
    await EventMember.create({
      user: userB._id,
      event: eventB._id,
      role: EVENT_ROLES.ORGANIZER,
      status: 'active',
    });
  });

  it('Organizer A can update their own Event A', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${eventA._id}`)
      .set('Authorization', `Bearer ${organizerAToken}`)
      .send({ title: 'Event Alpha (Updated by Organizer A)' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Event Alpha (Updated by Organizer A)');
  });

  it('Cross-Event Denial: Organizer A CANNOT update Event B (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${eventB._id}`)
      .set('Authorization', `Bearer ${organizerAToken}`)
      .send({ title: 'Hacked Title by Unauthorized User' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Cross-Event Denial: Organizer A CANNOT cancel or publish Event B', async () => {
    const resPublish = await request(app)
      .post(`/api/v1/events/${eventB._id}/publish`)
      .set('Authorization', `Bearer ${organizerAToken}`);

    expect(resPublish.status).toBe(403);
    expect(resPublish.body.success).toBe(false);
    expect(resPublish.body.error.code).toBe('FORBIDDEN');

    const resCancel = await request(app)
      .post(`/api/v1/events/${eventB._id}/cancel`)
      .set('Authorization', `Bearer ${organizerAToken}`)
      .send({ reason: 'Malicious cancellation' });

    expect(resCancel.status).toBe(403);
    expect(resCancel.body.success).toBe(false);
  });

  it('Cross-Event Denial: Organizer A CANNOT add team members to Event B', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventB._id}/members`)
      .set('Authorization', `Bearer ${organizerAToken}`)
      .send({
        email: 'organizerA@test.com',
        role: 'staff',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Cross-Event Denial: Organizer A CANNOT post announcements to Event B', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventB._id}/announcements`)
      .set('Authorization', `Bearer ${organizerAToken}`)
      .send({
        title: 'Unauthorized Announcement',
        body: 'This should be blocked by RBAC middleware.',
        audience: 'all',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Platform Admin can manage both Event A and Event B', async () => {
    const resA = await request(app)
      .patch(`/api/v1/events/${eventA._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Event Alpha Admin Supervision' });

    expect(resA.status).toBe(200);
    expect(resA.body.success).toBe(true);

    const resB = await request(app)
      .patch(`/api/v1/events/${eventB._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Event Beta Admin Supervision' });

    expect(resB.status).toBe(200);
    expect(resB.body.success).toBe(true);
  });

  it('Regular Attendee without event membership cannot edit events', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${eventA._id}`)
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ title: 'Attempted edit by attendee' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Non-platform admins cannot access Platform Admin only routes (e.g. POST /organizations)', async () => {
    const res = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${organizerAToken}`)
      .send({
        name: 'Unauthorized Org',
        plan: 'growth',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
