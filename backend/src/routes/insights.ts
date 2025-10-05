import { Router } from 'express';
import { prisma } from '../db';
import { runMentorManually } from '../jobs/mentorJob';

const router = Router();

// Get insights (latest first) + count of unviewed
router.get('/', async (req, res) => {
  try {
    const insights = await prisma.insight.findMany({
      where: { dismissed: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unviewedCount = await prisma.insight.count({ where: { viewed: false, dismissed: false } });
    res.json({ insights, unviewedCount });
  } catch (error) {
    console.error('[Insights] Failed to fetch insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Mark as viewed
router.put('/:id/view', async (req, res) => {
  try {
    await prisma.insight.update({ where: { id: req.params.id }, data: { viewed: true } });
    res.json({ success: true });
  } catch (error) {
    console.error('[Insights] Failed to mark as viewed:', error);
    res.status(500).json({ error: 'Failed to mark as viewed' });
  }
});

// Dismiss
router.delete('/:id', async (req, res) => {
  try {
    await prisma.insight.update({ where: { id: req.params.id }, data: { dismissed: true } });
    res.json({ success: true });
  } catch (error) {
    console.error('[Insights] Failed to dismiss:', error);
    res.status(500).json({ error: 'Failed to dismiss' });
  }
});

// Manual generation trigger
router.post('/generate', async (req, res) => {
  try {
    await runMentorManually();
    res.json({ success: true, message: 'Insights generation triggered' });
  } catch (error: any) {
    console.error('[Insights] Manual generation failed:', error);
    res.status(500).json({ error: error.message || 'Failed to generate insights' });
  }
});

export default router;
