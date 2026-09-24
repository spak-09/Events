const request = require('supertest');
const app = require('../src/app');

require('./setup');

describe('Validation Errors & Zod Schema Enforcement Tests', () => {
  it('should return VALIDATION_ERROR with field details on invalid registration payload', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: '', // Too short
      email: 'not-an-email', // Malformed email
      password: 'short', // Lacks min length, upper, number, special char
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(3);

    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toContain('body.name');
    expect(fields).toContain('body.email');
    expect(fields).toContain('body.password');
  });

  it('should return VALIDATION_ERROR when event endDate precedes startDate', async () => {
    // First register user to get token
    const userRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Organizer Valid',
      email: 'organizer.valid@test.com',
      password: 'Password123!',
    });
    const token = userRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        org: '507f1f77bcf86cd799439011',
        title: 'Chronologically Impossible Event',
        startDate: '2026-12-10T09:00:00.000Z',
        endDate: '2026-12-05T09:00:00.000Z', // Before start date!
        capacity: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field.includes('endDate'))).toBe(true);
  });

  it('should reject invalid venue room capacity (capacity <= 0)', async () => {
    const userRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Venue Admin',
      email: 'venue.admin@test.com',
      password: 'Password123!',
    });
    const token = userRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/v1/venues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Invalid Room Venue',
        rooms: [
          {
            name: 'Tiny Closet',
            capacity: -5, // Negative capacity!
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field.includes('capacity'))).toBe(true);
  });
});
