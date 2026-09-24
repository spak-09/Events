const request = require('supertest');
const app = require('../src/app');
const Organization = require('../src/models/Organization');
const Event = require('../src/models/Event');
const EventMember = require('../src/models/EventMember');
const SponsorPackage = require('../src/models/SponsorPackage');
const Sponsorship = require('../src/models/Sponsorship');
const Deliverable = require('../src/models/Deliverable');
const User = require('../src/models/User');

require('./setup');

describe('Sponsor Management, Deliverable Review & Tenant Isolation Tests', () => {
  let organizerToken;
  let sponsor1Token;
  let sponsor2Token;
  let attendeeToken;

  let organizerUser;
  let sponsor1User;
  let sponsor2User;
  let attendeeUser;

  let event;
  let goldPackage;
  let sponsorship1;
  let deliverable1;

  beforeEach(async () => {
    // 1. Organizer
    organizerUser = await User.create({
      name: 'Event Organizer',
      email: 'organizer@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });
    const orgLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'organizer@eventforge.com',
      password: 'Password123!',
    });
    organizerToken = orgLogin.body.data.accessToken;

    // 2. Sponsor User 1 (Acme Corp)
    sponsor1User = await User.create({
      name: 'Acme Sponsor Rep',
      email: 'sponsor1@acme.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });
    const sp1Login = await request(app).post('/api/v1/auth/login').send({
      email: 'sponsor1@acme.com',
      password: 'Password123!',
    });
    sponsor1Token = sp1Login.body.data.accessToken;

    // 3. Sponsor User 2 (Beta Tech)
    sponsor2User = await User.create({
      name: 'Beta Tech Sponsor Rep',
      email: 'sponsor2@beta.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });
    const sp2Login = await request(app).post('/api/v1/auth/login').send({
      email: 'sponsor2@beta.com',
      password: 'Password123!',
    });
    sponsor2Token = sp2Login.body.data.accessToken;

    // 4. Regular Attendee
    attendeeUser = await User.create({
      name: 'Regular Attendee',
      email: 'attendee@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'user',
    });
    const attLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'attendee@eventforge.com',
      password: 'Password123!',
    });
    attendeeToken = attLogin.body.data.accessToken;

    // 5. Organization & Event
    const org = await Organization.create({
      name: 'Global Conferences Inc',
      slug: 'global-conferences-inc',
      plan: 'enterprise',
      status: 'active',
    });

    event = await Event.create({
      org: org._id,
      title: 'Cloud Native Expo 2026',
      slug: 'cloud-native-expo-2026',
      startDate: new Date('2026-11-20T09:00:00.000Z'),
      endDate: new Date('2026-11-22T18:00:00.000Z'),
      status: 'published',
      capacity: 1000,
      createdBy: organizerUser._id,
    });

    await EventMember.create({
      event: event._id,
      user: organizerUser._id,
      role: 'organizer',
      status: 'active',
    });

    // 6. Sponsor Package with 1 slot only
    goldPackage = await SponsorPackage.create({
      event: event._id,
      tier: 'gold',
      name: 'Gold Sponsor Tier',
      price: 10000,
      benefits: ['Keynote shoutout', 'Premium booth', 'Logo on lanyard'],
      slots: 1,
      claimed: 0,
    });
  });

  it('1. should allow organizer to create a sponsor package', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/sponsor-packages`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        tier: 'silver',
        name: 'Silver Partner',
        price: 5000,
        benefits: ['Booth space', 'Website logo'],
        slots: 3,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Silver Partner');
    expect(res.body.data.slots).toBe(3);
  });

  it('2. should assign sponsorship, increment package claimed, and give sponsor event role', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/sponsorships`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        sponsorId: sponsor1User._id.toString(),
        companyName: 'Acme Corporation',
        companyLogo: 'https://cdn.acme.com/logo.png',
        packageId: goldPackage._id.toString(),
        status: 'confirmed',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.companyName).toBe('Acme Corporation');

    // Verify package claimed was incremented
    const updatedPkg = await SponsorPackage.findById(goldPackage._id);
    expect(updatedPkg.claimed).toBe(1);

    // Verify EventMember created with role 'sponsor'
    const member = await EventMember.findOne({
      event: event._id,
      user: sponsor1User._id,
    });
    expect(member).not.toBeNull();
    expect(member.role).toBe('sponsor');
  });

  it('3. should reject sponsorship allocation when package slots are exhausted (400 Bad Request)', async () => {
    // Claim the 1 available slot
    await request(app)
      .post(`/api/v1/events/${event._id}/sponsorships`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        sponsorId: sponsor1User._id.toString(),
        companyName: 'Acme Corporation',
        packageId: goldPackage._id.toString(),
      });

    // Try claiming again with Beta Tech
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/sponsorships`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        sponsorId: sponsor2User._id.toString(),
        companyName: 'Beta Tech',
        packageId: goldPackage._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('claimed');
  });

  describe('Deliverable Management & Tenant Isolation', () => {
    beforeEach(async () => {
      // Create sponsorship for Acme
      sponsorship1 = await Sponsorship.create({
        event: event._id,
        sponsor: sponsor1User._id,
        companyName: 'Acme Corporation',
        package: goldPackage._id,
        status: 'confirmed',
      });

      await EventMember.create({
        event: event._id,
        user: sponsor1User._id,
        role: 'sponsor',
        status: 'active',
      });

      // Also create deliverable
      deliverable1 = await Deliverable.create({
        event: event._id,
        sponsorship: sponsorship1._id,
        title: 'High-Resolution Vector Logo',
        description: 'Provide SVG or EPS format with transparent background',
        dueDate: new Date('2026-11-01T00:00:00.000Z'),
        status: 'pending',
      });
    });

    it('4. Sponsor 1 can view their own deliverables', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${event._id}/sponsorships/${sponsorship1._id}/deliverables`)
        .set('Authorization', `Bearer ${sponsor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('High-Resolution Vector Logo');
    });

    it('5. TENANT ISOLATION: Sponsor 2 cannot access Sponsor 1 deliverables (403 Forbidden)', async () => {
      // Assign sponsor2 as sponsor in event
      await EventMember.create({
        event: event._id,
        user: sponsor2User._id,
        role: 'sponsor',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/events/${event._id}/sponsorships/${sponsorship1._id}/deliverables`)
        .set('Authorization', `Bearer ${sponsor2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('only view deliverables for your own sponsorship');
    });

    it('6. TENANT ISOLATION: Sponsor 2 cannot submit asset on Sponsor 1 deliverable (403 Forbidden)', async () => {
      await EventMember.create({
        event: event._id,
        user: sponsor2User._id,
        role: 'sponsor',
        status: 'active',
      });

      const res = await request(app)
        .patch(`/api/v1/events/${event._id}/sponsorships/${sponsorship1._id}/deliverables/${deliverable1._id}/submit`)
        .set('Authorization', `Bearer ${sponsor2Token}`)
        .send({
          asset: 'https://cdn.betatech.com/malicious_overwrite.png',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('only submit deliverables for your own');
    });

    it('7. Sponsor 1 submits deliverable successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${event._id}/sponsorships/${sponsorship1._id}/deliverables/${deliverable1._id}/submit`)
        .set('Authorization', `Bearer ${sponsor1Token}`)
        .send({
          asset: 'https://cdn.acme.com/assets/logo_vector.svg',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('submitted');
      expect(res.body.data.asset).toBe('https://cdn.acme.com/assets/logo_vector.svg');
      expect(res.body.data.submittedAt).toBeDefined();
    });

    it('8. Organizer reviews and approves deliverable', async () => {
      // First submit
      await request(app)
        .patch(`/api/v1/events/${event._id}/sponsorships/${sponsorship1._id}/deliverables/${deliverable1._id}/submit`)
        .set('Authorization', `Bearer ${sponsor1Token}`)
        .send({
          asset: 'https://cdn.acme.com/assets/logo_vector.svg',
        });

      // Organizer review
      const res = await request(app)
        .patch(`/api/v1/events/${event._id}/sponsorships/${sponsorship1._id}/deliverables/${deliverable1._id}/review`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          status: 'approved',
          reviewNotes: 'Verified vector format and transparent background.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.reviewNotes).toBe('Verified vector format and transparent background.');
      expect(res.body.data.reviewedAt).toBeDefined();
    });

    it('9. Non-organizer cannot review deliverables (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${event._id}/sponsorships/${sponsorship1._id}/deliverables/${deliverable1._id}/review`)
        .set('Authorization', `Bearer ${sponsor1Token}`)
        .send({
          status: 'approved',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
