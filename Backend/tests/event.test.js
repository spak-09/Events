const request = require('supertest');
const app = require('../src/app');
const Organization = require('../src/models/Organization');
const EventMember = require('../src/models/EventMember');
const User = require('../src/models/User');

require('./setup');

describe('Event Module CRUD & Lifecycle Tests', () => {
  let user;
  let userToken;
  let org;

  beforeEach(async () => {
    user = await User.create({
      name: 'Event Creator',
      email: 'creator@test.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'creator@test.com',
      password: 'Password123!',
    });
    userToken = loginRes.body.data.accessToken;

    org = await Organization.create({
      name: 'Test Innovation Org',
      slug: 'test-innovation-org',
      plan: 'growth',
      status: 'active',
      settings: { maxEvents: 10 },
    });
  });

  it('should create an event in draft status and automatically designate creator as organizer', async () => {
    const eventPayload = {
      org: org._id.toString(),
      title: 'Global Innovation Forum 2026',
      description: 'Annual gathering of innovators',
      category: 'Innovation',
      tags: ['innovation', 'design', 'future'],
      startDate: '2026-10-15T09:00:00.000Z',
      endDate: '2026-10-17T17:00:00.000Z',
      capacity: 500,
      policies: {
        refundPolicy: 'Full refund 7 days prior',
      },
    };

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send(eventPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(eventPayload.title);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.slug).toBeDefined();

    // Verify creator is organizer in EventMember collection
    const membership = await EventMember.findOne({
      user: user._id,
      event: res.body.data.id,
    });
    expect(membership).toBeDefined();
    expect(membership.role).toBe('organizer');
    expect(membership.status).toBe('active');
  });

  it('should publish an event successfully', async () => {
    const createRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        org: org._id.toString(),
        title: 'Publishable Event',
        startDate: '2026-11-01T09:00:00.000Z',
        endDate: '2026-11-02T17:00:00.000Z',
        capacity: 200,
      });

    const eventId = createRes.body.data.id;

    const publishRes = await request(app)
      .post(`/api/v1/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.success).toBe(true);
    expect(publishRes.body.data.status).toBe('published');
  });

  it('should cancel an event with reason', async () => {
    const createRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        org: org._id.toString(),
        title: 'Cancellable Event',
        startDate: '2026-11-01T09:00:00.000Z',
        endDate: '2026-11-02T17:00:00.000Z',
        capacity: 200,
      });

    const eventId = createRes.body.data.id;

    const cancelRes = await request(app)
      .post(`/api/v1/events/${eventId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Weather hazard' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe('cancelled');
  });

  it('should duplicate an event into a new draft event', async () => {
    const createRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        org: org._id.toString(),
        title: 'Original Event 2026',
        description: 'Original event description',
        startDate: '2026-11-01T09:00:00.000Z',
        endDate: '2026-11-02T17:00:00.000Z',
        capacity: 250,
      });

    const eventId = createRes.body.data.id;

    const dupRes = await request(app)
      .post(`/api/v1/events/${eventId}/duplicate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Cloned Event 2027',
        startDate: '2027-11-01T09:00:00.000Z',
        endDate: '2027-11-02T17:00:00.000Z',
      });

    expect(dupRes.status).toBe(201);
    expect(dupRes.body.success).toBe(true);
    expect(dupRes.body.data.title).toBe('Cloned Event 2027');
    expect(dupRes.body.data.status).toBe('draft');
    expect(dupRes.body.data.id).not.toBe(eventId);

    // Creator should be organizer of the duplicated event
    const dupMembership = await EventMember.findOne({
      user: user._id,
      event: dupRes.body.data.id,
    });
    expect(dupMembership).toBeDefined();
    expect(dupMembership.role).toBe('organizer');
  });
});
