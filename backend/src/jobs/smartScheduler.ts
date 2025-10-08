import cron from 'node-cron';
import { smartContentGenerator } from '../services/smartContentGenerator';
import { generateWeeklyInsights } from '../services/mentorService';
import { prisma } from '../db';

class SmartScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.setupJobs();
  }

  private setupJobs() {
    console.log('🕒 [Smart Scheduler] Setting up automated AI jobs...');

    // Daily content generation - runs at 8:00 AM every day
    const dailyContentJob = cron.schedule('0 8 * * *', async () => {
      console.log('📅 [Smart Scheduler] Starting daily content generation...');
      try {
        await smartContentGenerator.generateDailyContent();
        console.log('✅ [Smart Scheduler] Daily content generation completed');
      } catch (error) {
        console.error('❌ [Smart Scheduler] Daily content generation failed:', error);
      }
    }, {
      scheduled: false, // Don't start automatically
      timezone: 'Asia/Jerusalem' // Israeli timezone
    });

    // Weekly insights generation - runs every Sunday at 9:00 PM
    const weeklyInsightsJob = cron.schedule('0 21 * * 0', async () => {
      console.log('📊 [Smart Scheduler] Starting weekly insights generation...');
      try {
        await generateWeeklyInsights();
        console.log('✅ [Smart Scheduler] Weekly insights generation completed');
      } catch (error) {
        console.error('❌ [Smart Scheduler] Weekly insights generation failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jerusalem'
    });

    // Clean old insights - runs every day at 2:00 AM
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      console.log('🧹 [Smart Scheduler] Starting cleanup task...');
      try {
        await this.cleanupOldData();
        console.log('✅ [Smart Scheduler] Cleanup completed');
      } catch (error) {
        console.error('❌ [Smart Scheduler] Cleanup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jerusalem'
    });

    // Smart content burst - runs 3 times a week (Mon, Wed, Fri at 10:00 AM)
    const contentBurstJob = cron.schedule('0 10 * * 1,3,5', async () => {
      console.log('⚡ [Smart Scheduler] Starting smart content burst...');
      try {
        // Generate 3-5 articles based on recent activity
        await smartContentGenerator.generatePersonalizedContent(4);
        console.log('✅ [Smart Scheduler] Content burst completed');
      } catch (error) {
        console.error('❌ [Smart Scheduler] Content burst failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Jerusalem'
    });

    this.jobs.set('dailyContent', dailyContentJob);
    this.jobs.set('weeklyInsights', weeklyInsightsJob);
    this.jobs.set('cleanup', cleanupJob);
    this.jobs.set('contentBurst', contentBurstJob);

    console.log(`✅ [Smart Scheduler] Setup complete with ${this.jobs.size} jobs`);
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    console.log('🚀 [Smart Scheduler] Starting all jobs...');
    
    for (const [name, job] of this.jobs) {
      job.start();
      console.log(`✅ [Smart Scheduler] Started job: ${name}`);
    }

    // Log next execution times
    this.logNextExecutions();
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log('🛑 [Smart Scheduler] Stopping all jobs...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`🛑 [Smart Scheduler] Stopped job: ${name}`);
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const status: Record<string, { running: boolean; nextExecution?: string }> = {};
    
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: (job as any).running || false,
        // Add next execution time if we can determine it
      };
    }

    return status;
  }

  /**
   * Run a specific job manually
   */
  async runJob(jobName: string): Promise<boolean> {
    console.log(`🔧 [Smart Scheduler] Manually running job: ${jobName}`);

    try {
      switch (jobName) {
        case 'dailyContent':
          await smartContentGenerator.generateDailyContent();
          break;
        case 'weeklyInsights':
          await generateWeeklyInsights();
          break;
        case 'cleanup':
          await this.cleanupOldData();
          break;
        case 'contentBurst':
          await smartContentGenerator.generatePersonalizedContent(4);
          break;
        default:
          console.error(`❌ [Smart Scheduler] Unknown job: ${jobName}`);
          return false;
      }

      console.log(`✅ [Smart Scheduler] Manual job completed: ${jobName}`);
      return true;

    } catch (error) {
      console.error(`❌ [Smart Scheduler] Manual job failed (${jobName}):`, error);
      return false;
    }
  }

  /**
   * Clean up old data to prevent database bloat
   */
  private async cleanupOldData() {
    try {
      // Remove insights older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const deletedInsights = await prisma.insight.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          type: {
            in: ['generated_content', 'drive_document'], // Keep important insights
          },
        },
      });

      // Remove old activity logs older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const deletedActivity = await prisma.userActivity.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      console.log(`🧹 [Smart Scheduler] Cleanup: removed ${deletedInsights.count} insights and ${deletedActivity.count} activity logs`);

    } catch (error) {
      console.error('❌ [Smart Scheduler] Cleanup error:', error);
    }
  }

  /**
   * Log next execution times for debugging
   */
  private logNextExecutions() {
    console.log('⏰ [Smart Scheduler] Scheduled execution times:');
    console.log('  - Daily Content: Every day at 8:00 AM');
    console.log('  - Weekly Insights: Every Sunday at 9:00 PM');
    console.log('  - Cleanup: Every day at 2:00 AM');
    console.log('  - Content Burst: Mon/Wed/Fri at 10:00 AM');
  }
}

// Export singleton instance
export const smartScheduler = new SmartScheduler();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  smartScheduler.start();
  console.log('🚀 [Smart Scheduler] Auto-started for production environment');
} else {
  console.log('🔧 [Smart Scheduler] Development mode - call smartScheduler.start() manually');
}