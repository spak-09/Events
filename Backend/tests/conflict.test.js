const request = require('supertest');
const app = require('../src/app');
const Organization = require('../src/models/Organization');
const Event = require('../src/models/Event');
const Venue = require('../src/models/Venue');
const Speaker = require('../src/models/Speaker');
const Session = require('../src/models/Session');
const User = require('../src/models/User');

require('./setup');

describe('Session Scheduling & 4-Point Conflict Detection Matrix Tests', () => {
  let organizerToken;
  let event;
  let venue;
  let speaker1;
  let speaker2;

  beforeEach(async () => {
    // 1. Create Organizer User
    const organizer = await User.create({
      name: 'Session Planner',
      email: 'planner@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'planner@eventforge.com',
      password: 'Password123!',
    });
    organizerToken = loginRes.body.data.accessToken;

    // 2. Organization
    const org = await Organization.create({
      name: 'Tech Events Global',
      slug: 'tech-events-global',
      plan: 'growth',
      status: 'active',
    });

    // 3. Venue with defined room capacities
    venue = await Venue.create({
      name: 'Moscone Center West',
      address: {
        street: '747 Howard St',
        city: 'San Francisco',
        country: 'USA',
      },
      capacity: 2000,
      rooms: [
        { name: 'Grand Ballroom', capacity: 500, floor: '1' },
        { name: 'Workshop Room B', capacity: 40, floor: '2' },
      ],
    });

    // 4. Event: 2026-10-15 from 09:00 to 18:00 UTC
    event = await Event.create({
      org: org._id,
      venue: venue._id,
      title: 'Architect Summit 2026',
      slug: 'architect-summit-2026',
      startDate: new Date('2026-10-15T09:00:00.000Z'),
      endDate: new Date('2026-10-15T18:00:00.000Z'),
      status: 'published',
      capacity: 500,
      createdBy: organizer._id,
    });

    // Make sure user is organizer in EventMember
    const EventMember = require('../src/models/EventMember');
    await EventMember.create({
      event: event._id,
      user: organizer._id,
      role: 'organizer',
      status: 'active',
    });

    // 5. Speakers
    speaker1 = await Speaker.create({
      name: 'Alice Turing',
      email: 'alice@crypto.org',
      bio: 'Distributed consensus researcher',
    });

    speaker2 = await Speaker.create({
      name: 'Bob Shannon',
      email: 'bob@info.org',
      bio: 'Information theory pioneer',
    });
  });

  it('1. should successfully create a valid agenda session without conflicts', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/sessions`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Keynote: Scalable Event Systems',
        description: 'Opening keynote architecture review',
        room: 'Grand Ballroom',
        start: '2026-10-15T10:00:00.000Z',
        end: '2026-10-15T11:00:00.000Z',
        speakers: [speaker1._id.toString()],
        capacity: 300,
        track: 'Architecture',
        tags: ['scale', 'events', 'kafka'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Keynote: Scalable Event Systems');
    expect(res.body.data.room).toBe('Grand Ballroom');
  });

  it('2. CONFLICT POINT 1: should reject overlapping sessions in the same room with 409 SCHEDULE_CONFLICT', async () => {
    // First session: 10:00 to 11:30 in Grand Ballroom
    await Session.create({
      event: event._id,
      title: 'Session 1',
      room: 'Grand Ballroom',
      start: new Date('2026-10-15T10:00:00.000Z'),
      end: new Date('2026-10-15T11:30:00.000Z'),
      speakers: [speaker1._id],
      capacity: 200,
    });

    // Overlapping session in same room: 11:00 to 12:00
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/sessions`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Session 2 Overlap',
        room: 'Grand Ballroom',
        start: '2026-10-15T11:00:00.000Z',
        end: '2026-10-15T12:00:00.000Z',
        speakers: [speaker2._id.toString()],
        capacity: 200,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SCHEDULE_CONFLICT');
    expect(res.body.error.message).toContain('already occupied');
    expect(res.body.error.details[0].type).toBe('ROOM_OVERLAP');
  });

  it('3. CONFLICT POINT 2: should reject speaker double-booking with 409 SCHEDULE_CONFLICT', async () => {
    // Session 1 in Grand Ballroom with speaker1: 14:00 to 15:00
    await Session.create({
      event: event._id,
      title: 'Advanced Microservices',
      room: 'Grand Ballroom',
      start: new Date('2026-10-15T14:00:00.000Z'),
      end: new Date('2026-10-15T15:00:00.000Z'),
      speakers: [speaker1._id],
      capacity: 200,
    });

    // Session 2 in Workshop Room B with the SAME speaker1: 14:30 to 15:30
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/sessions`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Concurrent Go Lab',
        room: 'Workshop Room B',
        start: '2026-10-15T14:30:00.000Z',
        end: '2026-10-15T15:30:00.000Z',
        speakers: [speaker1._id.toString()],
        capacity: 30,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SCHEDULE_CONFLICT');
    expect(res.body.error.details[0].type).toBe('SPEAKER_DOUBLE_BOOKING');
  });

  it('4. CONFLICT POINT 3: should reject sessions scheduled outside event date boundaries with 409', async () => {
    // Event is 2026-10-15 from 09:00 to 18:00 UTC
    // Session scheduled before event start: 08:00 to 09:30
    const resEarly = await request(app)
      .post(`/api/v1/events/${event._id}/sessions`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Pre-event Early Session',
        room: 'Grand Ballroom',
        start: '2026-10-15T08:00:00.000Z',
        end: '2026-10-15T09:30:00.000Z',
        speakers: [speaker1._id.toString()],
        capacity: 100,
      });

    expect(resEarly.status).toBe(409);
    expect(resEarly.body.error.code).toBe('SCHEDULE_CONFLICT');
    expect(resEarly.body.error.details[0].type).toBe('OUTSIDE_EVENT_DATES');

    // Session scheduled after event end: 18:00 to 19:00
    const resLate = await request(app)
      .post(`/api/v1/events/${event._id}/sessions`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'After Hours Party Talk',
        room: 'Grand Ballroom',
        start: '2026-10-15T18:00:00.000Z',
        end: '2026-10-15T19:00:00.000Z',
        speakers: [speaker2._id.toString()],
        capacity: 100,
      });

    expect(resLate.status).toBe(409);
    expect(resLate.body.error.code).toBe('SCHEDULE_CONFLICT');
    expect(resLate.body.error.details[0].type).toBe('OUTSIDE_EVENT_DATES');
  });

  it('5. CONFLICT POINT 4: should reject session capacity exceeding venue room capacity with 409', async () => {
    // Workshop Room B capacity is 40
    // Try creating session with capacity 100 in Workshop Room B
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/sessions`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Overcrowded Workshop',
        room: 'Workshop Room B',
        start: '2026-10-15T13:00:00.000Z',
        end: '2026-10-15T14:00:00.000Z',
        speakers: [speaker2._id.toString()],
        capacity: 100,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SCHEDULE_CONFLICT');
    expect(res.body.error.details[0].type).toBe('ROOM_CAPACITY_EXCEEDED');
    expect(res.body.error.details[0].roomCapacity).toBe(40);
    expect(res.body.error.details[0].sessionCapacity).toBe(100);
  });

  it('6. PRE-CHECK ENDPOINT: POST /sessions/check-conflicts should return conflict report without 409 or persisting', async () => {
    // Existing session
    await Session.create({
      event: event._id,
      title: 'Existing Talk',
      room: 'Grand Ballroom',
      start: new Date('2026-10-15T10:00:00.000Z'),
      end: new Date('2026-10-15T11:00:00.000Z'),
      speakers: [speaker1._id],
      capacity: 200,
    });

    // Check with conflict
    const conflictRes = await request(app)
      .post(`/api/v1/events/${event._id}/sessions/check-conflicts`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        room: 'Grand Ballroom',
        start: '2026-10-15T10:30:00.000Z',
        end: '2026-10-15T11:30:00.000Z',
        speakers: [speaker1._id.toString()],
      });

    expect(conflictRes.status).toBe(200);
    expect(conflictRes.body.success).toBe(true);
    expect(conflictRes.body.data.hasConflict).toBe(true);
    expect(conflictRes.body.data.conflicts.length).toBeGreaterThan(0);

    // Check with clean slot
    const cleanRes = await request(app)
      .post(`/api/v1/events/${event._id}/sessions/check-conflicts`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        room: 'Workshop Room B',
        start: '2026-10-15T10:00:00.000Z',
        end: '2026-10-15T11:00:00.000Z',
        speakers: [speaker2._id.toString()],
        capacity: 30,
      });

    expect(cleanRes.status).toBe(200);
    expect(cleanRes.body.data.hasConflict).toBe(false);
    expect(cleanRes.body.data.conflicts).toHaveLength(0);
  });

  it('7. UPDATE EXCLUSION: updating an existing session should not trigger self-conflict', async () => {
    const session = await Session.create({
      event: event._id,
      title: 'DevOps Deep Dive',
      room: 'Grand Ballroom',
      start: new Date('2026-10-15T15:00:00.000Z'),
      end: new Date('2026-10-15T16:00:00.000Z'),
      speakers: [speaker1._id],
      capacity: 200,
    });

    const updateRes = await request(app)
      .patch(`/api/v1/events/${event._id}/sessions/${session._id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'DevOps Deep Dive (Extended Q&A)',
        capacity: 250,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.title).toBe('DevOps Deep Dive (Extended Q&A)');
    expect(updateRes.body.data.capacity).toBe(250);
  });
});
