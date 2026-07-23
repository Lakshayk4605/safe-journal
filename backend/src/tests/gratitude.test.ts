import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../config/prisma';

const app = createApp();

async function isDbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

afterAll(async () => {
  await prisma.gratitudeEntry.deleteMany({
    where: { user: { email: { contains: 'jest-test' } } }
  }).catch(() => undefined);
  await prisma.user.deleteMany({ where: { email: { contains: 'jest-test' } } }).catch(() => undefined);
  await prisma.$disconnect();
});

describe('Gratitude Endpoints', () => {
  const testEmail = `jest-test-gratitude-${Date.now()}@example.com`;
  const password = 'StrongPass123';
  let authCookie: any;

  beforeAll(async () => {
    if (!(await isDbAvailable())) return;

    // Create a test user and obtain auth cookie
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Gratitude Tester',
      email: testEmail,
      password,
    });
    authCookie = signupRes.headers['set-cookie'];
  });

  it('rejects logging gratitude when unauthenticated', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app).post('/api/v1/gratitude').send({
      item1: 'Family',
      item2: 'Sunlight',
      item3: 'Fresh air',
    });

    expect(res.status).toBe(401);
  });

  it('creates today\'s gratitude entry when authenticated', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app)
      .post('/api/v1/gratitude')
      .set('Cookie', authCookie)
      .send({
        item1: 'Family',
        item2: 'Sunlight',
        item3: 'Coffee',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entry.item1).toBe('Family');
    expect(res.body.data.entry.item2).toBe('Sunlight');
    expect(res.body.data.entry.item3).toBe('Coffee');
  });

  it('updates today\'s gratitude entry on subsequent logs (idempotency)', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app)
      .post('/api/v1/gratitude')
      .set('Cookie', authCookie)
      .send({
        item1: 'A warm tea',
        item2: 'Productive morning',
        item3: 'Clean desk',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.entry.item1).toBe('A warm tea');
    expect(res.body.data.entry.item2).toBe('Productive morning');
    expect(res.body.data.entry.item3).toBe('Clean desk');
  });

  it('fetches today\'s gratitude entry', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app)
      .get('/api/v1/gratitude/today')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.entry.item1).toBe('A warm tea');
  });

  it('fetches history of gratitude entries', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app)
      .get('/api/v1/gratitude/history')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.history)).toBe(true);
    expect(res.body.data.history.length).toBeGreaterThan(0);
  });

  it('draws a random gratitude item from the jar', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app)
      .get('/api/v1/gratitude/random')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.item).toBe('string');
    expect(['A warm tea', 'Productive morning', 'Clean desk']).toContain(res.body.data.item);
    expect(res.body.data.date).toBeDefined();
  });
});
