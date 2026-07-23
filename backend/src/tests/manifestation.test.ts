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
  await prisma.manifestationEntry.deleteMany({
    where: { user: { email: { contains: 'jest-test' } } }
  }).catch(() => undefined);
  await prisma.user.deleteMany({ where: { email: { contains: 'jest-test' } } }).catch(() => undefined);
  await prisma.$disconnect();
});

describe('Manifestation Endpoints', () => {
  const testEmail = `jest-test-manifest-${Date.now()}@example.com`;
  const password = 'StrongPass123';
  let authCookie: any;

  beforeAll(async () => {
    if (!(await isDbAvailable())) return;

    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Manifest Tester',
      email: testEmail,
      password,
    });
    authCookie = signupRes.headers['set-cookie'];
  });

  it('rejects logging manifestation when unauthenticated', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app).post('/api/v1/manifestation').send({
      intention: 'I intend to code well.',
      affirmation: 'I am a strong developer.',
      visualized: true,
    });

    expect(res.status).toBe(401);
  });

  it('creates today\'s manifestation entry when authenticated', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app)
      .post('/api/v1/manifestation')
      .set('Cookie', authCookie)
      .send({
        intention: 'I intend to be fully present today.',
        affirmation: 'I choose peace over anxiety.',
        visualized: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entry.intention).toBe('I intend to be fully present today.');
    expect(res.body.data.entry.affirmation).toBe('I choose peace over anxiety.');
    expect(res.body.data.entry.visualized).toBe(true);
  });

  it('updates today\'s manifestation entry on subsequent logs', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app)
      .post('/api/v1/manifestation')
      .set('Cookie', authCookie)
      .send({
        intention: 'I intend to be highly productive.',
        affirmation: 'I command clarity.',
        visualized: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.entry.intention).toBe('I intend to be highly productive.');
    expect(res.body.data.entry.affirmation).toBe('I command clarity.');
    expect(res.body.data.entry.visualized).toBe(false);
  });

  it('fetches today\'s manifestation entry', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app)
      .get('/api/v1/manifestation/today')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.entry.intention).toBe('I intend to be highly productive.');
  });

  it('fetches history of manifestations', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app)
      .get('/api/v1/manifestation/history')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.history)).toBe(true);
    expect(res.body.data.history.length).toBeGreaterThan(0);
  });
});
