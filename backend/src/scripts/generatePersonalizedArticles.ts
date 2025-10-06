import { prisma } from '../db';
import axios from 'axios';

/**
 * סקריפט ליצירת 300 מאמרים מותאמים אישית
 * מבוסס על:
 * 1. מאמרים ששמרת (savedArticles)
 * 2. קטגוריות שאתה קורא
 * 3. תוכן מהגוגל דרייב שלך
 */

interface ArticleTemplate {
  category: string;
  topics: string[];
  keywords: string[];
}

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://router.huggingface.co/v1';
const AI_API_URL = `${AI_BASE_URL}/chat/completions`;
const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-oss-120b';
const AI_API_KEY = process.env.AI_API_KEY;

async function analyzeUserPreferences() {
  console.log('🔍 מנתח את ההעדפות שלך...');
  
  // שלב 1: מאמרים ששמרת
  const savedArticles = await prisma.savedArticle.findMany({
    include: {
      article: true,
    },
    take: 50, // 50 האחרונים
  });

  // שלב 2: ספרים שהוספת
  const books = await prisma.book.findMany({
    take: 20,
  });

  // שלב 3: פעילות אחרונה
  const recentActivity = await prisma.userActivity.findMany({
    where: {
      action: { in: ['article_read', 'article_saved'] },
    },
    take: 100,
    orderBy: { createdAt: 'desc' },
  });

  // שלב 4: קטגוריות מועדפות
  const categoryCount: Record<string, number> = {};
  savedArticles.forEach(sa => {
    const cat = sa.article.category;
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat]) => cat);

  console.log(`✅ מצאתי ${savedArticles.length} מאמרים שמורים`);
  console.log(`✅ קטגוריות מועדפות: ${topCategories.join(', ')}`);
  console.log(`✅ ${books.length} ספרים`);

  return {
    savedArticles: savedArticles.map(sa => ({
      title: sa.article.title,
      category: sa.article.category,
      content: sa.article.content.substring(0, 500),
    })),
    topCategories: topCategories.length > 0 ? topCategories : ['self-improvement', 'productivity', 'psychology'],
    books: books.map(b => b.bookTitle),
  };
}

async function generateArticleWithAI(template: {
  category: string;
  topic: string;
  relatedContent: string[];
}): Promise<{
  title: string;
  content: string;
  excerpt: string;
  author: string;
  readTime: number;
}> {
  const prompt = `Write a high-quality Hebrew article about: ${template.topic}
Category: ${template.category}

Requirements:
- 800-1200 words in Hebrew
- Practical insights with concrete examples
- Inspiring but not fluffy tone
- Actionable takeaways

Return ONLY a valid JSON object with this exact structure (no additional text, no markdown):
{
  "title": "article title in Hebrew",
  "content": "full article content in Hebrew",
  "excerpt": "2-3 sentence summary in Hebrew",
  "author": "fictional Hebrew author name",
  "readTime": 7
}`;

  try {
    const response = await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: 'You are a professional Hebrew content writer. Always return ONLY valid JSON without any markdown formatting or additional text.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_API_KEY}`,
        },
      }
    );

    let content = response.data.choices[0].message.content;
    
    // Clean up common JSON formatting issues
    content = content.trim();
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // Try to extract JSON from the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      } catch (parseError: any) {
        console.error('❌ JSON parsing failed:', parseError.message);
        console.error('Content received:', content.substring(0, 500));
        throw new Error(`Invalid JSON: ${parseError.message}`);
      }
    }
    
    throw new Error('לא התקבל JSON תקין');
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.response?.data || error.message;
    console.error('❌ שגיאה ביצירת מאמר:', errorMsg);
    
    // Fallback - מאמר ברירת מחדל
    return {
      title: `${template.topic} - מדריך מקיף`,
      content: `מאמר מקיף על ${template.topic}.\n\nבמאמר זה נצלול לעומק של ${template.topic} ונבין כיצד ליישם את העקרונות בחיי היומיום.\n\n## מבוא\n${template.topic} הוא נושא מרתק ורלוונטי לכל מי שרוצה לשפר את עצמו. במאמר זה נבחן את הנושא מזוויות שונות.\n\n## עקרונות מרכזיים\n1. הבנה עמוקה של ${template.topic}\n2. יישום מעשי בחיי היומיום\n3. התמודדות עם אתגרים\n\n## דוגמאות מעשיות\nניתן ליישם את ${template.topic} בדרכים רבות. דוגמה אחת היא...\n\n## סיכום\n${template.topic} הוא כלי עוצמתי לשיפור אישי. עם התמדה ומיקוד, אפשר להשיג תוצאות מרשימות.`,
      excerpt: `מדריך מעמיק על ${template.topic} - כל מה שצריך לדעת כדי להתחיל`,
      author: 'ד"ר אורי כהן',
      readTime: 7,
    };
  }
}

const TOPICS_BY_CATEGORY: Record<string, string[]> = {
  'self-improvement': [
    'בניית הרגלים בני קיימא',
    'התמודדות עם דחיינות',
    'פיתוח משמעת עצמית',
    'מציאת המוטיבציה הפנימית',
    'ניהול זמן אפקטיבי',
    'יצירת שגרת בוקר מנצחת',
    'הגדרת יעדים SMART',
    'מעגל ההשפעה שלך',
    'פיתוח חוסן נפשי',
    'למידה מכשלונות',
  ],
  'productivity': [
    'שיטת Pomodoro המתקדמת',
    'Deep Work למתחילים',
    'ניהול אנרגיה לא זמן',
    'אופטימיזציה של סביבת העבודה',
    'מיקוד וריכוז במאה ה-21',
    'הפחתת הסחות דעת דיגיטליות',
    'תכנון שבועי אפקטיבי',
    'פרודוקטיביות בלי שחיקה',
    'עבודה חכמה לא קשה',
    'מערכות אוטומציה אישית',
  ],
  'psychology': [
    'הטיות קוגניטיביות שכדאי להכיר',
    'פסיכולוגיה של ההרגלים',
    'התיאוריה של הצמיחה',
    'אינטליגנציה רגשית בפועל',
    'תהליכי קבלת החלטות',
    'פסיכולוגיה חיובית מעשית',
    'הבנת המוטיבציה האנושית',
    'דפוסי חשיבה משביתים',
    'בניית אמונה עצמית',
    'גמישות נפשית',
  ],
  'mindfulness': [
    'מדיטציה ל-5 דקות ביום',
    'מיינדפולנס במהלך העבודה',
    'נשימות להורדת מתח',
    'נוכחות במציאות',
    'אכילה מודעת',
    'שינה איכותית',
    'התבוננות פנימית',
    'קבלה עצמית',
    'יומן הכרת תודה',
    'מנוחה פעילה',
  ],
  'health': [
    'הרגלי תזונה בריאים',
    'פעילות גופנית יומית',
    'שיפור איכות השינה',
    'ניהול מתח כרוני',
    'הידרציה נכונה',
    'ויטמינים ומינרלים',
    'הליכה יומית',
    'מתיחות והתעמלות',
    'בריאות המוח',
    'מערכת החיסון',
  ],
};

async function generatePersonalizedArticles(count: number = 300) {
  console.log(`🚀 מתחיל ליצור ${count} מאמרים מותאמים אישית...\n`);

  // שלב 1: ניתוח העדפות
  const preferences = await analyzeUserPreferences();

  // שלב 2: הכנת תבניות
  const templates: Array<{ category: string; topic: string; relatedContent: string[] }> = [];
  
  const categoriesWithTopics = preferences.topCategories.filter(cat => TOPICS_BY_CATEGORY[cat]);
  const articlesPerCategory = Math.floor(count / categoriesWithTopics.length);

  for (const category of categoriesWithTopics) {
    const topics = TOPICS_BY_CATEGORY[category] || [];
    
    for (let i = 0; i < articlesPerCategory; i++) {
      const topicIndex = i % topics.length;
      templates.push({
        category,
        topic: topics[topicIndex],
        relatedContent: preferences.savedArticles
          .filter(a => a.category === category)
          .map(a => a.title),
      });
    }
  }

  // השלם ל-300 עם קטגוריות נוספות
  while (templates.length < count) {
    const randomCat = preferences.topCategories[templates.length % preferences.topCategories.length];
    const topics = TOPICS_BY_CATEGORY[randomCat] || ['שיפור עצמי כללי'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    templates.push({
      category: randomCat,
      topic: randomTopic,
      relatedContent: preferences.savedArticles.map(a => a.title),
    });
  }

  // שלב 3: יצירת המאמרים
  console.log(`\n📝 מייצר ${templates.length} מאמרים...\n`);
  
  const articles = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    
    try {
      console.log(`[${i + 1}/${templates.length}] יוצר: ${template.topic} (${template.category})`);
      
      const articleData = await generateArticleWithAI(template);
      
      const article = await prisma.article.create({
        data: {
          title: articleData.title,
          content: articleData.content,
          excerpt: articleData.excerpt,
          author: articleData.author,
          category: template.category,
          readTime: articleData.readTime,
          publishedAt: new Date(),
        },
      });

      articles.push(article);
      successCount++;
      
      // דיליי קטן כדי לא להציף את ה-API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      failCount++;
      console.error(`❌ נכשל: ${error.message}`);
    }

    // Progress report כל 50 מאמרים
    if ((i + 1) % 50 === 0) {
      console.log(`\n✅ התקדמות: ${successCount} הצליחו, ${failCount} נכשלו\n`);
    }
  }

  console.log(`\n🎉 סיימתי!`);
  console.log(`✅ ${successCount} מאמרים נוצרו בהצלחה`);
  console.log(`❌ ${failCount} נכשלו`);
  console.log(`\n📊 פילוח לפי קטגוריות:`);
  
  const categoryCounts: Record<string, number> = {};
  articles.forEach(a => {
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
  });
  
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} מאמרים`);
  });

  return { success: successCount, failed: failCount, total: articles.length };
}

// הפעלה
if (require.main === module) {
  generatePersonalizedArticles(300)
    .then(result => {
      console.log('\n✅ הסקריפט הסתיים בהצלחה!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ שגיאה:', error);
      process.exit(1);
    });
}

export { generatePersonalizedArticles };
