const request = require('supertest');
const app = require('../src/app');
const Organization = require('../src/models/Organization');
const Event = require('../src/models/Event');
const TicketType = require('../src/models/TicketType');
const Coupon = require('../src/models/Coupon');
const Registration = require('../src/models/Registration');
const User = require('../src/models/User');

require('./setup');

describe('Concurrency, Capacity Guards, Waitlist Promotion & Coupon Tests', () => {
  let org;
  let event;
  let ticketType;
  let adminToken;

  beforeEach(async () => {
    // Platform admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@eventforge.com',
      passwordHash: await User.hashPassword('Password123!'),
      globalRole: 'platform_admin',
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@eventforge.com',
      password: 'Password123!',
    });
    adminToken = adminLogin.body.data.accessToken;

    // Organization
    org = await Organization.create({
      name: 'High Concurrency Org',
      slug: 'high-concurrency-org',
      plan: 'enterprise',
      status: 'active',
      settings: { maxEvents: 50 },
    });

    // Published Event
    event = await Event.create({
      org: org._id,
      title: 'High Concurrency Summit 2026',
      slug: 'high-concurrency-summit-2026',
      startDate: new Date('2026-11-10T09:00:00Z'),
      endDate: new Date('2026-11-12T18:00:00Z'),
      status: 'published',
      capacity: 500,
      createdBy: admin._id,
    });

    // Limited Capacity Ticket: Exactly 10 seats
    ticketType = await TicketType.create({
      event: event._id,
      name: 'Ultra VIP Pass (Strict 10)',
      price: 200,
      capacity: 10,
      sold: 0,
      salesWindow: {
        start: new Date('2026-01-01'),
        end: new Date('2026-12-31'),
      },
      requiresApproval: false,
    });
  });

  it('CONCURRENCY TEST: 100 simultaneous registrations against capacity 10 -> exactly 10 approved, 90 waitlisted, sold === 10', async () => {
    // Pre-create 100 distinct users and generate their tokens
    const userTokens = [];
    for (let i = 1; i <= 100; i++) {
      const user = await User.create({
        name: `Attendee ${i}`,
        email: `attendee_${i}_${Date.now()}@test.com`,
        passwordHash: await User.hashPassword('Password123!'),
        globalRole: 'user',
      });
      const login = await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password: 'Password123!',
      });
      userTokens.push({ userId: user._id, token: login.body.data.accessToken });
    }

    // Fire 100 requests in true parallel using Promise.all
    const registrationPromises = userTokens.map(({ token }) =>
      request(app)
        .post(`/api/v1/events/${event._id}/register`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ticketTypeId: ticketType._id.toString(),
          interests: ['Concurrency', 'Distributed Systems'],
        })
    );

    const responses = await Promise.all(registrationPromises);

    // Verify all 100 requests succeeded with 201 Created
    responses.forEach((res) => {
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    // Verify TicketType.sold is EXACTLY 10 (no overselling!)
    const updatedTicket = await TicketType.findById(ticketType._id);
    expect(updatedTicket.sold).toBe(10);

    // Verify DB counts: exactly 10 approved, 90 waitlisted
    const approvedCount = await Registration.countDocuments({
      event: event._id,
      ticketType: ticketType._id,
      status: 'approved',
    });
    const waitlistedCount = await Registration.countDocuments({
      event: event._id,
      ticketType: ticketType._id,
      status: 'waitlisted',
    });

    expect(approvedCount).toBe(10);
    expect(waitlistedCount).toBe(90);

    // Check waitlist positions are sequential 1 through 90
    const waitlistedRegs = await Registration.find({
      event: event._id,
      ticketType: ticketType._id,
      status: 'waitlisted',
    }).sort({ waitlistPosition: 1 });

    expect(waitlistedRegs[0].waitlistPosition).toBe(1);
    expect(waitlistedRegs[89].waitlistPosition).toBe(90);
  }, 60000);

  it('WAITLIST PROMOTION: cancelling an approved registration auto-promotes waitlist position 1', async () => {
    // Register 11 users for a ticket with capacity 1
    const singleTicket = await TicketType.create({
      event: event._id,
      name: 'Single Slot Pass',
      price: 100,
      capacity: 1,
      sold: 0,
      salesWindow: {
        start: new Date('2026-01-01'),
        end: new Date('2026-12-31'),
      },
    });

    // User 1 gets the 1 slot (Approved)
    const user1 = await User.create({
      name: 'Lucky First',
      email: 'lucky@test.com',
      passwordHash: await User.hashPassword('Password123!'),
    });
    const token1 = (await request(app).post('/api/v1/auth/login').send({ email: 'lucky@test.com', password: 'Password123!' })).body.data.accessToken;

    const reg1Res = await request(app)
      .post(`/api/v1/events/${event._id}/register`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ ticketTypeId: singleTicket._id.toString() });

    expect(reg1Res.body.data.status).toBe('approved');
    const reg1Id = reg1Res.body.data.id;

    // User 2 gets waitlisted (Position 1)
    const user2 = await User.create({
      name: 'Second In Line',
      email: 'second@test.com',
      passwordHash: await User.hashPassword('Password123!'),
    });
    const token2 = (await request(app).post('/api/v1/auth/login').send({ email: 'second@test.com', password: 'Password123!' })).body.data.accessToken;

    const reg2Res = await request(app)
      .post(`/api/v1/events/${event._id}/register`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ ticketTypeId: singleTicket._id.toString() });

    expect(reg2Res.body.data.status).toBe('waitlisted');
    expect(reg2Res.body.data.waitlistPosition).toBe(1);
    const reg2Id = reg2Res.body.data.id;

    // User 3 gets waitlisted (Position 2)
    const user3 = await User.create({
      name: 'Third In Line',
      email: 'third@test.com',
      passwordHash: await User.hashPassword('Password123!'),
    });
    const token3 = (await request(app).post('/api/v1/auth/login').send({ email: 'third@test.com', password: 'Password123!' })).body.data.accessToken;

    const reg3Res = await request(app)
      .post(`/api/v1/events/${event._id}/register`)
      .set('Authorization', `Bearer ${token3}`)
      .send({ ticketTypeId: singleTicket._id.toString() });

    expect(reg3Res.body.data.status).toBe('waitlisted');
    expect(reg3Res.body.data.waitlistPosition).toBe(2);
    const reg3Id = reg3Res.body.data.id;

    // User 1 cancels their registration
    const cancelRes = await request(app)
      .post(`/api/v1/events/${event._id}/registrations/${reg1Id}/cancel`)
      .set('Authorization', `Bearer ${token1}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.registration.status).toBe('cancelled');

    // User 2 should be automatically promoted to approved with QR code!
    const promotedReg2 = await Registration.findById(reg2Id);
    expect(promotedReg2.status).toBe('approved');
    expect(promotedReg2.waitlistPosition).toBeNull();
    expect(promotedReg2.qrToken).toBeDefined();
    expect(promotedReg2.qrDataUrl).toBeDefined();

    // User 3 should now be waitlist position 1!
    const updatedReg3 = await Registration.findById(reg3Id);
    expect(updatedReg3.waitlistPosition).toBe(1);
    expect(updatedReg3.status).toBe('waitlisted');

    // Ticket sold count remains 1
    const checkTicket = await TicketType.findById(singleTicket._id);
    expect(checkTicket.sold).toBe(1);
  });

  it('COUPON RULES: percentage vs flat discounts, expiration, and usage limits', async () => {
    // 1. Percentage discount: 25% off $200 = $150
    const coupon25 = await Coupon.create({
      event: event._id,
      code: 'SAVE25',
      type: 'percent',
      value: 25,
      maxUses: 10,
      expiry: new Date('2026-12-31'),
    });

    const userPercent = await User.create({
      name: 'Percent Saver',
      email: 'percent@test.com',
      passwordHash: await User.hashPassword('Password123!'),
    });
    const tokenPercent = (await request(app).post('/api/v1/auth/login').send({ email: 'percent@test.com', password: 'Password123!' })).body.data.accessToken;

    const resPercent = await request(app)
      .post(`/api/v1/events/${event._id}/register`)
      .set('Authorization', `Bearer ${tokenPercent}`)
      .send({
        ticketTypeId: ticketType._id.toString(),
        couponCode: 'SAVE25',
      });

    expect(resPercent.status).toBe(201);
    expect(resPercent.body.data.finalPrice).toBe(150);

    const updatedCoupon25 = await Coupon.findById(coupon25._id);
    expect(updatedCoupon25.used).toBe(1);

    // 2. Flat discount: $50 off $200 = $150
    await Coupon.create({
      event: event._id,
      code: 'FLAT50',
      type: 'flat',
      value: 50,
      maxUses: 5,
      expiry: new Date('2026-12-31'),
    });

    const userFlat = await User.create({
      name: 'Flat Saver',
      email: 'flat@test.com',
      passwordHash: await User.hashPassword('Password123!'),
    });
    const tokenFlat = (await request(app).post('/api/v1/auth/login').send({ email: 'flat@test.com', password: 'Password123!' })).body.data.accessToken;

    const resFlat = await request(app)
      .post(`/api/v1/events/${event._id}/register`)
      .set('Authorization', `Bearer ${tokenFlat}`)
      .send({
        ticketTypeId: ticketType._id.toString(),
        couponCode: 'FLAT50',
      });

    expect(resFlat.status).toBe(201);
    expect(resFlat.body.data.finalPrice).toBe(150);

    // 3. Expired Coupon Rejection
    await Coupon.create({
      event: event._id,
      code: 'EXPIRED',
      type: 'flat',
      value: 20,
      maxUses: 10,
      expiry: new Date('2024-01-01'), // In the past
    });

    const userExpired = await User.create({
      name: 'Late Saver',
      email: 'late@test.com',
      passwordHash: await User.hashPassword('Password123!'),
    });
    const tokenExpired = (await request(app).post('/api/v1/auth/login').send({ email: 'late@test.com', password: 'Password123!' })).body.data.accessToken;

    const resExpired = await request(app)
      .post(`/api/v1/events/${event._id}/register`)
      .set('Authorization', `Bearer ${tokenExpired}`)
      .send({
        ticketTypeId: ticketType._id.toString(),
        couponCode: 'EXPIRED',
      });

    expect(resExpired.status).toBe(400);
    expect(resExpired.body.success).toBe(false);
  });
});
