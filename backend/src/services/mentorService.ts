import { prisma } from '../db';
import { getRecentActivity } from './activityTracker';
import { createAIClientFromAny, getDefaultModel, chatCompletion } from './aiClient';
import { preferenceAnalyzer } from './preferenceAnalyzer';
import { enhancedGoogleDriveService } from './enhancedGoogleDriveService';

interface InsightGenerationResult {
  weeklySummary: string;
  connections: Array<{ title: string; content: string; sources: string[] }>;
  recommendations: Array<{ title: string; content: string }>;
  question: { title: string; content: string };
}

async function buildEnhancedUserContext(daysBack: number = 7) {
  console.log('🔍 [Enhanced Mentor] Building comprehensive user context...');
  
  // ניתוח פעילות אחרונה
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

  // ניתוח פרופיל מתקדם
  const userProfile = await preferenceAnalyzer.analyzeUserProfile();
  
  // ניתוח Google Drive אם זמין
  let driveInsights = null;
  try {
    const settings = await prisma.userSettings.findUnique({ where: { id: 'default-user' } });
    if (settings?.googleDriveAuth) {
      const tokens = JSON.parse(settings.googleDriveAuth);
      enhancedGoogleDriveService.setAccessToken(tokens.accessToken, tokens.refreshToken);
      const documentInsights = await enhancedGoogleDriveService.analyzeDocumentsWithAI(10);
      if (documentInsights.length > 0) {
        driveInsights = await enhancedGoogleDriveService.generatePersonalizedContentMix(documentInsights);
      }
    }
  } catch (error) {
    console.warn('⚠️ [Enhanced Mentor] Could not analyze Google Drive:', error);
  }

  // שאלות AI אחרונות לניתוח דפוסי חשיבה
  const recentQuestions = await prisma.aiQuestion.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
      },
    },
    include: { article: { select: { title: true, category: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return {
    activityCount: activities.length,
    articles,
    books,
    categories: Array.from(new Set(articles.map(a => a.category).filter(Boolean))),
    userProfile,
    driveInsights,
    recentQuestions,
    weeklyStats: {
      articlesRead: articles.length,
      questionsAsked: recentQuestions.length,
      booksActive: books.length,
      topCategory: userProfile.topCategories[0]?.category || 'כללי',
    },
  };
}

function buildEnhancedMentorPrompt(context: any): string {
  const articlesText = (context.articles || [])
    .map((a: any, i: number) => `${i + 1}. "${a.title}" (${a.category})\n   תקציר: ${a.excerpt || 'אין'}`)
    .join('\n');

  const booksText = (context.books || [])
    .map((b: any) => `- "${b.bookTitle}" (${b.summaries.length} סיכומים)`)
    .join('\n');

  const questionsText = (context.recentQuestions || [])
    .slice(0, 5)
    .map((q: any, i: number) => `${i + 1}. "${q.question}" (על: ${q.article?.title || 'מאמר'})`)
    .join('\n');

  // בניית פרופיל מותאם אישית
  const userProfile = context.userProfile;
  const profileText = userProfile ? `
📋 **הפרופיל האישי שלך:**
- רמת קריאה: ${userProfile.readingLevel}
- סגנון תוכן מועדף: ${userProfile.contentStyle}
- תחומי עניין עיקריים: ${userProfile.topCategories.slice(0, 3).map((c: any) => c.category).join(', ')}
- דפוסי אינטראקציה: ${userProfile.interactionPatterns.readingTime} קריאה, ${Math.round(userProfile.interactionPatterns.saveFrequency * 100)}% שמירה
- סוגי שאלות: ${userProfile.interactionPatterns.questionTypes.join(', ')}` : '';

  const driveInsightsText = context.driveInsights ? `
📄 **ניתוח המסמכים האישיים שלך:**
- נושאים מוצעים: ${context.driveInsights.suggestedTopics.slice(0, 3).join(', ')}
- קהל יעד: ${context.driveInsights.targetAudience}
- רמת מומחיות: ${context.driveInsights.expertise_level}
- סגנון תוכן: ${context.driveInsights.contentStyle}` : '';

  return `אתה מנטור אישי מתקדם וחכם. אתה מכיר את המשתמש לעומק ומתאים את התובנות שלך בדיוק לפרופיל שלו.

📚 **מאמרים שנקראו השבוע:**
${articlesText || 'לא נקראו מאמרים השבוע'}

📖 **ספרים פעילים:**
${booksText || 'אין ספרים פעילים'}

❓ **שאלות אחרונות שנשאלו:**
${questionsText || 'לא נשאלו שאלות לאחרונה'}${profileText}${driveInsightsText}

📊 **סטטיסטיקה השבוע:**
- סה"כ פעילויות: ${context.activityCount}
- מאמרים נקראו: ${context.weeklyStats.articlesRead}
- שאלות נשאלו: ${context.weeklyStats.questionsAsked}
- ספרים פעילים: ${context.weeklyStats.booksActive}
- קטגוריה מובילה: ${context.weeklyStats.topCategory}

---

**המטרה שלך:** ליצור תובנות עמוקות ומותאמות אישית שיעזרו למשתמש להמשיך לגדול בדרכו הייחודית.

החזר תשובה ב-JSON תקין בלבד בפורמט:
{
  "weeklySummary": "תקציר מותאם אישית (2-3 משפטים) שמתבסס על הפרופיל והפעילות",
  "connections": [ { "title": "קשר מעניין", "content": "הסבר מפורט על הקשר", "sources": ["article_id_1"] }, { "title": "קשר נוסף", "content": "...", "sources": ["article_id_2"] } ],
  "recommendations": [ { "title": "המלצה מותאמת", "content": "המלצה ספציפית בהתאם לרמת הקריאה והתחומי עניין" }, { "title": "המלצה נוספת", "content": "..." } ],
  "question": { "title": "שאלה מעמיקה ומותאמת", "content": "שאלה שתעודד חשיבה לפי הסגנון והרמה של המשתמש" },
  "personalNote": "הערה אישית וחמה המבוססת על הפרופיל"
}

כללים חשובים:
- התאם את הטון והרמה לפרופיל המשתמש (רמת קריאה: ${userProfile?.readingLevel}, סגנון: ${userProfile?.contentStyle})
- התבסס על התחומי עניין האמיתיים שלו: ${userProfile?.topCategories?.slice(0, 3).map((c: any) => c.category).join(', ')}
- אם יש מידע מ-Google Drive, השתמש בו להמלצות מדויקות יותר
- צור קשרים משמעותיים בין החומרים שקרא
- תן המלצות ספציפיות ומעשיות, לא כלליות
- הוסף נופח אישי וחם
- אם אין מספיק מידע, אמור זאת בכנות אבל עדיין תן ערך`;
}

function extractFirstJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in AI response');
  return JSON.parse(match[0]);
}

async function saveEnhancedInsights(insights: InsightGenerationResult & { personalNote?: string }, context: any) {
  const data: { type: string; title: string; content: string; sources: string; metadata?: string | null }[] = [];

  // שמירת תקציר השבוע עם מטאדאטה מורחבת
  data.push({ 
    type: 'weekly_summary', 
    title: 'תקציר השבוע האישי', 
    content: insights.weeklySummary, 
    sources: '[]',
    metadata: JSON.stringify({
      userProfile: {
        readingLevel: context.userProfile?.readingLevel,
        contentStyle: context.userProfile?.contentStyle,
        topCategory: context.weeklyStats?.topCategory,
      },
      weeklyStats: context.weeklyStats,
      personalNote: insights.personalNote,
    }),
  });

  // שמירת קשרים עם מידע מורחב
  for (const c of insights.connections || []) {
    data.push({ 
      type: 'connection', 
      title: c.title, 
      content: c.content, 
      sources: JSON.stringify(c.sources || []),
      metadata: JSON.stringify({
        connectionType: 'cross_content',
        userLevel: context.userProfile?.readingLevel,
      }),
    });
  }

  // שמירת המלצות מותאמות אישית
  for (const r of insights.recommendations || []) {
    data.push({ 
      type: 'recommendation', 
      title: r.title, 
      content: r.content, 
      sources: '[]',
      metadata: JSON.stringify({
        targetAudience: context.driveInsights?.targetAudience || 'כללי',
        recommendationType: 'personalized',
        userInterests: context.userProfile?.topCategories?.slice(0, 3).map((c: any) => c.category) || [],
      }),
    });
  }

  // שמירת שאלה מעמיקה
  if (insights.question?.title) {
    data.push({ 
      type: 'question', 
      title: insights.question.title, 
      content: insights.question.content, 
      sources: '[]',
      metadata: JSON.stringify({
        questionType: 'deep_thinking',
        userLevel: context.userProfile?.readingLevel,
        relatedTopics: context.userProfile?.preferredTopics?.slice(0, 5) || [],
      }),
    });
  }

  // שמירת הערה אישית אם קיימת
  if (insights.personalNote) {
    data.push({
      type: 'personal_note',
      title: 'הערה אישית',
      content: insights.personalNote,
      sources: '[]',
      metadata: JSON.stringify({
        noteType: 'encouraging',
        basedOnProfile: true,
      }),
    });
  }

  if (data.length) {
    await prisma.insight.createMany({ data });
  }
}

export async function generateWeeklyInsights() {
  console.log('🧠 [Enhanced Mentor] Generating personalized weekly insights...');
  try {
    const context = await buildEnhancedUserContext(7);
    if (!context.activityCount) {
      console.log('⏭️  [Enhanced Mentor] No activity this week, generating motivational insight...');
      await generateMotivationalInsight();
      return;
    }

    const prompt = buildEnhancedMentorPrompt(context);

    const client = await createAIClientFromAny();
    if (!client) {
      console.warn('[Enhanced Mentor] AI client not configured; skipping.');
      return;
    }

    const model = getDefaultModel();
    const completion = await chatCompletion(client, model, [
      { 
        role: 'system', 
        content: 'אתה מנטור אישי מתקדם ומומחה. אתה מכיר את המשתמש באופן אישי ומעמיק. החזר תמיד JSON תקין עם כל השדות הנדרשים, כולל personalNote.' 
      },
      { role: 'user', content: prompt },
    ]);

    const content = completion.choices?.[0]?.message?.content || '';
    const parsed = extractFirstJson(content) as InsightGenerationResult & { personalNote?: string };

    await saveEnhancedInsights(parsed, context);
    console.log('✅ [Enhanced Mentor] Personalized weekly insights generated.');
  } catch (err) {
    console.error('❌ [Enhanced Mentor] Failed to generate insights:', err);
  }
}

/**
 * יצירת תובנה מוטיבציונית כאשר אין פעילות
 */
async function generateMotivationalInsight() {
  try {
    const client = await createAIClientFromAny();
    if (!client) return;

    const userProfile = await preferenceAnalyzer.analyzeUserProfile();
    const topCategories = userProfile.topCategories.slice(0, 3).map(c => c.category).join(', ');
    
    const motivationalPrompt = `צור הודעה מוטיבציונית קצרה ומעודדת למשתמש שלא היה פעיל השבוע.
    
תחומי העניין שלו: ${topCategories}
רמת הקריאה: ${userProfile.readingLevel}

החזר JSON:
{
  "title": "כותרת מעודדת",
  "content": "הודעה חמה ומוטיבציונית (2-3 משפטים)",
  "suggestion": "הצעה ספציפית לחזרה לפעילות"
}`;

    const completion = await chatCompletion(client, getDefaultModel(), [
      { role: 'system', content: 'אתה מנטור חם ומעודד. כתוב בעברית טבעית.' },
      { role: 'user', content: motivationalPrompt },
    ]);

    const responseText = completion.choices?.[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      await prisma.insight.create({
        data: {
          type: 'motivational',
          title: parsed.title || 'זמן לחזור ללמידה!',
          content: parsed.content || 'השבוע היה שקט יותר - זה הזמן המושלם לחזור ולגלות משהו חדש!',
          metadata: JSON.stringify({ suggestion: parsed.suggestion }),
          sources: '[]',
        },
      });
    }
  } catch (error) {
    console.error('❌ [Enhanced Mentor] Failed to generate motivational insight:', error);
  }
}
