import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../config/prisma';

// NOTE: These integration tests require a real PostgreSQL database reachable via
// process.env.DATABASE_URL, with migrations applied (`npm run prisma:migrate:deploy`).
// Each test checks connectivity itself and no-ops (rather than failing) if the
// database isn't reachable — this keeps `npm test` green for the pure-unit tests in
// utils.test.ts in environments without a DB configured, without relying on
// `describe`/`it` registration order, since `beforeAll` hooks run *after* all
// `describe` blocks have already been registered.

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
  await prisma.user.deleteMany({ where: { email: { contains: 'jest-test' } } }).catch(() => undefined);
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/signup', () => {
  const testEmail = `jest-test-${Date.now()}@example.com`;

  it('creates a new account with valid input', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Jest Tester',
      email: testEmail,
      password: 'StrongPass123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects a duplicate signup', async () => {
    if (!(await isDbAvailable())) return;

    await request(app).post('/api/v1/auth/signup').send({
      name: 'Jest Tester',
      email: testEmail,
      password: 'StrongPass123',
    });
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Jest Tester',
      email: testEmail,
      password: 'StrongPass123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects a weak password', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Jest Tester 2',
      email: `jest-test-weak-${Date.now()}@example.com`,
      password: 'weak',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  const testEmail = `jest-test-login-${Date.now()}@example.com`;
  const password = 'StrongPass123';

  it('logs in with correct credentials', async () => {
    if (!(await isDbAvailable())) return;

    await request(app).post('/api/v1/auth/signup').send({ name: 'Login Tester', email: testEmail, password });

    const res = await request(app).post('/api/v1/auth/login').send({ email: testEmail, password });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('rejects incorrect credentials', async () => {
    if (!(await isDbAvailable())) return;

    const res = await request(app).post('/api/v1/auth/login').send({ email: testEmail, password: 'WrongPass123' });
    expect(res.status).toBe(401);
  });
});
