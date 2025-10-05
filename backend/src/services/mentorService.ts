import { prisma } from '../db';
import { getRecentActivity } from './activityTracker';
import { createAIClientFromAny, getDefaultModel, chatCompletion } from './aiClient';

interface InsightGenerationResult {
  weeklySummary: string;
  connections: Array<{ title: string; content: string; sources: string[] }>;
  recommendations: Array<{ title: string; content: string }>;
  question: { title: string; content: string };
}

async function buildUserContext(daysBack: number = 7) {
  const activities = await getRecentActivity(daysBack);

  const articleIds = activities
    .filter(a => a.action === 'article_read' || a.action === 'article_saved')
    .map(a => a.targetId);

  const uniqueArticleIds = Array.from(new Set(articleIds));

  const articles = uniqueArticleIds.length
    ? await prisma.article.findMany({
        where: { id: { in: uniqueArticleIds } },
        select: { id: true, title: true, category: true, excerpt: true, content: true },
      })
    : [];

  const bookIds = activities
    .filter(a => a.action === 'book_started')
    .map(a => a.targetId);

  const uniqueBookIds = Array.from(new Set(bookIds));

  const books = uniqueBookIds.length
    ? await prisma.book.findMany({
        where: { id: { in: uniqueBookIds } },
        include: { summaries: { select: { content: true, chapterTitle: true } } },
      })
    : [];

  return {
    activityCount: activities.length,
    articles,
    books,
    categories: Array.from(new Set(articles.map(a => a.category).filter(Boolean))),
  };
}

function buildMentorPrompt(context: any): string {
  const articlesText = (context.articles || [])
    .map((a: any, i: number) => `${i + 1}. "${a.title}" (${a.category})\n   תקציר: ${a.excerpt || 'אין'}`)
    .join('\n');

  const booksText = (context.books || [])
    .map((b: any) => `- "${b.bookTitle}" (${b.summaries.length} סיכומים)`)
    .join('\n');

  return `אתה מנטור אישי חכם ומעורר מחשבה. המשתמש שלך למד השבוע את הדברים הבאים:

📚 **מאמרים שנקראו:**
${articlesText || 'לא נקראו מאמרים השבוע'}

📖 **ספרים פעילים:**
${booksText || 'אין ספרים פעילים'}

📊 **סטטיסטיקה:**
- סה"כ פעילויות: ${context.activityCount}
- קטגוריות: ${context.categories.join(', ') || 'אין'}

---

החזר תשובה ב-JSON תקין בלבד בפורמט:
{
  "weeklySummary": "תקציר קצר (2-3 משפטים)",
  "connections": [ { "title": "...", "content": "...", "sources": ["article_id_1", "article_id_2"] } ],
  "recommendations": [ { "title": "...", "content": "..." } ],
  "question": { "title": "...", "content": "..." }
}

כללים:
- תן תובנות ממוקדות ומעשיות, לא כלליות
- אם אין מספיק מידע, אמור זאת בכנות
- כתוב בעברית טבעית ואישית`;
}

function extractFirstJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in AI response');
  return JSON.parse(match[0]);
}

async function saveInsights(insights: InsightGenerationResult) {
  const data: { type: string; title: string; content: string; sources: string; metadata?: string | null }[] = [];

  data.push({ type: 'weekly_summary', title: 'תקציר השבוע', content: insights.weeklySummary, sources: '[]' });

  for (const c of insights.connections || []) {
    data.push({ type: 'connection', title: c.title, content: c.content, sources: JSON.stringify(c.sources || []) });
  }

  for (const r of insights.recommendations || []) {
    data.push({ type: 'recommendation', title: r.title, content: r.content, sources: '[]' });
  }

  if (insights.question?.title) {
    data.push({ type: 'question', title: insights.question.title, content: insights.question.content, sources: '[]' });
  }

  if (data.length) {
    await prisma.insight.createMany({ data });
  }
}

export async function generateWeeklyInsights() {
  console.log('🧠 [Mentor] Generating weekly insights...');
  try {
    const context = await buildUserContext(7);
    if (!context.activityCount) {
      console.log('⏭️  [Mentor] No activity this week, skipping.');
      return;
    }

    const prompt = buildMentorPrompt(context);

    const client = await createAIClientFromAny();
    if (!client) {
      console.warn('[Mentor] AI client not configured; skipping.');
      return;
    }

    const model = getDefaultModel();
    const completion = await chatCompletion(client, model, [
      { role: 'system', content: 'אתה מנטור אישי מומחה. החזר תמיד JSON תקין בלבד.' },
      { role: 'user', content: prompt },
    ]);

    const content = completion.choices?.[0]?.message?.content || '';
    const parsed = extractFirstJson(content) as InsightGenerationResult;

    await saveInsights(parsed);
    console.log('✅ [Mentor] Weekly insights generated.');
  } catch (err) {
    console.error('❌ [Mentor] Failed to generate insights:', err);
  }
}
