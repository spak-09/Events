const request = require('supertest');
const app = require('../src/app');
const Organization = require('../src/models/Organization');
const Event = require('../src/models/Event');
const TicketType = require('../src/models/TicketType');
const Registration = require('../src/models/Registration');
const Session = require('../src/models/Session');
const AiLog = require('../src/models/AiLog');
const User = require('../src/models/User');

require('./setup');

describe('AI Drafts, Template Fallback Engine & Hybrid Recommendations Tests', () => {
  let userToken;
  let user;
  let event;
  let session1;
  let session2;
  let session3;

  beforeEach(async () => {
    // 1. User
    user = await User.create({
      name: 'Dr. Jane Architect',
      email: 'jane@architect.ai',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'jane@architect.ai',
      password: 'Password123!',
    });
    userToken = loginRes.body.data.accessToken;

    // 2. Organization & Event
    const org = await Organization.create({
      name: 'AI Innovators Group',
      slug: 'ai-innovators-group',
      plan: 'enterprise',
      status: 'active',
    });

    event = await Event.create({
      org: org._id,
      title: 'Global AI Summit 2026',
      slug: 'global-ai-summit-2026',
      description: 'Original summit description that must never be auto-overwritten.',
      startDate: new Date('2026-11-15T09:00:00.000Z'),
      endDate: new Date('2026-11-16T18:00:00.000Z'),
      status: 'published',
      capacity: 500,
      createdBy: user._id,
    });

    // 3. Sessions with tracks and tags
    session1 = await Session.create({
      event: event._id,
      title: 'LLMs in Production: Scaling Inference',
      description: 'Deep dive into KV cache and vLLM',
      room: 'Main Hall',
      start: new Date('2026-11-15T10:00:00.000Z'),
      end: new Date('2026-11-15T11:00:00.000Z'),
      track: 'Engineering',
      tags: ['LLM', 'Inference', 'Scale'],
      capacity: 200,
    });

    session2 = await Session.create({
      event: event._id,
      title: 'Agentic Workflows and Tool Calling',
      description: 'Autonomous agents and evaluation',
      room: 'Room 201',
      start: new Date('2026-11-15T11:30:00.000Z'),
      end: new Date('2026-11-15T12:30:00.000Z'),
      track: 'Engineering',
      tags: ['Agents', 'Automation', 'LLM'],
      capacity: 100,
    });

    session3 = await Session.create({
      event: event._id,
      title: 'AI Product Strategy & Economics',
      description: 'Monetizing generative software',
      room: 'Room 105',
      start: new Date('2026-11-15T14:00:00.000Z'),
      end: new Date('2026-11-15T15:00:00.000Z'),
      track: 'Business',
      tags: ['Strategy', 'Leadership'],
      capacity: 80,
    });
  });

  describe('Deterministic Template AI Drafts (Never Auto-Saved)', () => {
    it('1. should generate draft event marketing description and log to AiLog without mutating Event', async () => {
      const res = await request(app)
        .post('/api/v1/ai/event-description')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          eventId: event._id.toString(),
          title: 'NextGen Neural Summit',
          theme: 'Foundation Models & Enterprise Scale',
          targetAudience: 'ML Engineers, CTOs, and AI Researchers',
          highlights: ['Keynotes from frontier labs', 'Live benchmark shootout'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draft).toContain('NextGen Neural Summit');
      expect(res.body.data.draft).toContain('Foundation Models & Enterprise Scale');
      expect(res.body.data.provider).toBeDefined();

      // Verify the event document was NOT changed
      const dbEvent = await Event.findById(event._id);
      expect(dbEvent.description).toBe('Original summit description that must never be auto-overwritten.');

      // Verify AiLog recorded the request
      const log = await AiLog.findOne({ user: user._id, type: 'event-description' });
      expect(log).not.toBeNull();
      expect(log.prompt).toContain('NextGen Neural Summit');
    });

    it('2. should generate draft speaker biography and log to AiLog', async () => {
      const res = await request(app)
        .post('/api/v1/ai/speaker-bio')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Elena Rostova',
          title: 'VP of AI Research',
          company: 'HyperCompute Labs',
          expertise: ['Transformers', 'Quantization', 'Model Distillation'],
          tone: 'technical',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draft).toContain('Elena Rostova');
      expect(res.body.data.draft).toContain('HyperCompute Labs');

      const log = await AiLog.findOne({ user: user._id, type: 'speaker-bio' });
      expect(log).not.toBeNull();
    });

    it('3. should generate draft broadcast announcement with urgency prefix', async () => {
      const res = await request(app)
        .post('/api/v1/ai/announcement')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          eventId: event._id.toString(),
          eventTitle: 'Global AI Summit',
          keyMessage: 'Track 2 has moved to Grand Auditorium due to high interest.',
          audience: 'attendees',
          urgency: 'urgent',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draft).toContain('🚨 [URGENT UPDATE]');
      expect(res.body.data.draft).toContain('Hello Attendees');
      expect(res.body.data.draft).toContain('Track 2 has moved to Grand Auditorium');
    });

    it('4. should generate executive session summary draft', async () => {
      const res = await request(app)
        .post('/api/v1/ai/session-summary')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionTitle: 'High-Throughput Token Pipelines',
          speakerName: 'Dr. Jane Architect',
          keyPoints: [
            'Batching algorithms save 40% VRAM',
            'Speculative decoding improves latency by 2x',
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draft).toContain('High-Throughput Token Pipelines');
      expect(res.body.data.draft).toContain('Key Takeaways');
    });
  });

  describe('Hybrid Recommendation Engine', () => {
    it('5. should provide personalized session recommendations with score breakdown and rationale', async () => {
      // Create ticket and registration for user with specific interests
      const ticket = await TicketType.create({
        event: event._id,
        name: 'Attendee Pass',
        price: 99,
        capacity: 100,
        salesWindow: {
          start: new Date(Date.now() - 10000),
          end: new Date(Date.now() + 100000),
        },
      });

      await Registration.create({
        event: event._id,
        user: user._id,
        ticketType: ticket._id,
        status: 'approved',
        qrToken: 'qr_recommendation_test_token',
        interests: ['LLM', 'Scale', 'Agents'],
        selectedSessions: [session1._id],
      });

      const res = await request(app)
        .get(`/api/v1/events/${event._id}/recommendations?limit=3`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const topRec = res.body.data[0];
      expect(topRec).toHaveProperty('session');
      expect(topRec).toHaveProperty('score');
      expect(topRec).toHaveProperty('breakdown');
      expect(topRec).toHaveProperty('why');
      expect(typeof topRec.why).toBe('string');
      expect(topRec.breakdown).toHaveProperty('tagScore');
      expect(topRec.breakdown).toHaveProperty('coScore');
      expect(topRec.breakdown).toHaveProperty('trackScore');

      // Check that AiLog telemetry logged recommendations
      const log = await AiLog.findOne({ user: user._id, type: 'hybrid-recommendations' });
      expect(log).not.toBeNull();
    });
  });
});
