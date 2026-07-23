import { PrismaClient, Role, Mood, EntryType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash('AdminPass123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@safejournal.app' },
    update: {},
    create: {
      name: 'Safe Journal Admin',
      email: 'admin@safejournal.app',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      preferences: { create: {} },
    },
  });

  const demoPasswordHash = await bcrypt.hash('DemoPass123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'alex.chen@example.com' },
    update: {},
    create: {
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      passwordHash: demoPasswordHash,
      role: Role.USER,
      isEmailVerified: true,
      streakDays: 12,
      totalEntries: 0,
      preferences: { create: {} },
    },
  });

  const workTag = await prisma.tag.upsert({ where: { name: 'work' }, update: {}, create: { name: 'work' } });
  const wellnessTag = await prisma.tag.upsert({
    where: { name: 'wellness' },
    update: {},
    create: { name: 'wellness' },
  });
  const accomplished = await prisma.emotion.upsert({
    where: { name: 'accomplished' },
    update: {},
    create: { name: 'accomplished' },
  });
  const energized = await prisma.emotion.upsert({
    where: { name: 'energized' },
    update: {},
    create: { name: 'energized' },
  });

  const entry = await prisma.journalEntry.create({
    data: {
      userId: demoUser.id,
      title: 'Productive morning at the cafe',
      content:
        'Had an amazing coffee at my favorite cafe today. Managed to finish the design proposal that was due Friday. The team gave me positive feedback! Feeling accomplished and energized.',
      mood: Mood.EXCELLENT,
      entryType: EntryType.TEXT,
      tags: { create: [{ tagId: workTag.id }, { tagId: wellnessTag.id }] },
      emotions: { create: [{ emotionId: accomplished.id }, { emotionId: energized.id }] },
    },
  });

  await prisma.aiReflection.create({
    data: {
      journalEntryId: entry.id,
      content:
        'Your positive mood reflects your sense of achievement. This accomplishment in your work is a great stepping stone.',
      model: 'seed-data',
    },
  });

  await prisma.moodEntry.create({
    data: {
      userId: demoUser.id,
      journalEntryId: entry.id,
      mood: Mood.EXCELLENT,
      score: 5,
      date: new Date(),
    },
  });

  await prisma.user.update({ where: { id: demoUser.id }, data: { totalEntries: 1, lastEntryDate: new Date() } });

  await prisma.featureFlag.upsert({
    where: { key: 'voice_journaling' },
    update: {},
    create: { key: 'voice_journaling', enabled: true, description: 'Enables voice journal entries', rolloutPercentage: 100 },
  });

  console.log('Seed complete:');
  console.log(`  Admin login: admin@safejournal.app / AdminPass123`);
  console.log(`  Demo user login: alex.chen@example.com / DemoPass123`);
  console.log({ adminId: admin.id, demoUserId: demoUser.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
