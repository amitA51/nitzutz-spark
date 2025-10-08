import { prisma } from '../db';

export interface TrackActivityParams {
  action: string; // "article_read" | "article_saved" | "book_started" | "summary_created"
  targetType: string; // "article" | "book" | "summary"
  targetId: string;
  metadata?: Record<string, any>;
}

/**
 * Track any user activity. Errors are swallowed to avoid breaking flows.
 */
export async function trackActivity(params: TrackActivityParams) {
  try {
    await prisma.userActivity.create({
      data: {
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error('[ActivityTracker] Failed to track activity:', error);
  }
}

/**
 * Get recent activity for the last N days (default 7)
 */
export async function getRecentActivity(daysBack: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  return prisma.userActivity.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Quick activity analytics summary
 */
export async function getActivitySummary(daysBack: number = 7) {
  const activities = await getRecentActivity(daysBack);

  return {
    totalActions: activities.length,
    articlesRead: activities.filter(a => a.action === 'article_read').length,
    articlesSaved: activities.filter(a => a.action === 'article_saved').length,
    booksStarted: activities.filter(a => a.action === 'book_started').length,
    summariesCreated: activities.filter(a => a.action === 'summary_created').length,
  };
}
