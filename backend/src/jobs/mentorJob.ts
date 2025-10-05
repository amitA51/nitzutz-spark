import cron from 'node-cron';
import { generateWeeklyInsights } from '../services/mentorService';

/**
 * Schedule the mentor to run weekly on Sunday at 08:00.
 */
export function startMentorCron() {
  // '0 8 * * 0' => Sunday at 08:00
  cron.schedule('0 8 * * 0', async () => {
    console.log('⏰ [Cron] Weekly mentor job triggered');
    await generateWeeklyInsights();
  });

  console.log('✅ [Cron] Mentor job scheduled (Sundays at 08:00)');
}

/**
 * Manual trigger for development/testing.
 */
export async function runMentorManually() {
  console.log('🔧 [Manual] Running mentor job manually...');
  await generateWeeklyInsights();
}
