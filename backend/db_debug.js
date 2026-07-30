const { PrismaClient } = require('@prisma/client');

async function main() {
  const dbUrl = 'postgresql://postgres:aEUHbqkiXWpcdLJLpzCKQNopgDbIUwah@sakura.proxy.rlwy.net:18616/railway';

  console.log('Connecting to database...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    const email = 'lakshaykaushik4605@gmail.com';
    console.log(`Searching for user with email: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User not found: ${email}`);
      return;
    }

    console.log('User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // 1. Check all journal entries
    const journalEntries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Total journal entries in database: ${journalEntries.length}`);
    if (journalEntries.length > 0) {
      console.log('Latest journal entries (up to 3):');
      journalEntries.slice(0, 3).forEach((e, idx) => {
        console.log(`  [${idx}] Title: "${e.title}", CreatedAt: ${e.createdAt.toISOString()}`);
      });
    }

    // 2. Check all mood entries
    const moodEntries = await prisma.moodEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    console.log(`Total mood entries in database: ${moodEntries.length}`);
    if (moodEntries.length > 0) {
      console.log('Latest mood entries (up to 3):');
      moodEntries.slice(0, 3).forEach((e, idx) => {
        console.log(`  [${idx}] Score: ${e.score}, Mood: ${e.mood}, Date: ${e.date.toISOString()}, CreatedAt: ${e.createdAt.toISOString()}`);
      });
    }

    // 3. Inspect date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    console.log('Current Time (UTC):', now.toISOString());
    console.log('30 Days Ago Threshold (UTC):', thirtyDaysAgo.toISOString());

    const journalInLast30Days = journalEntries.filter(
      (e) => new Date(e.createdAt) >= thirtyDaysAgo
    );
    console.log(`Journal entries in last 30 days: ${journalInLast30Days.length}`);

    const moodInLast30Days = moodEntries.filter(
      (e) => new Date(e.date) >= thirtyDaysAgo
    );
    console.log(`Mood entries in last 30 days: ${moodInLast30Days.length}`);

  } catch (err) {
    console.error('Error during database check:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
