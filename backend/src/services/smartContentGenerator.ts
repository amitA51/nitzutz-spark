import { prisma } from '../db';
import { createAIClientFromAny, getDefaultModel, chatCompletion } from './aiClient';
import { preferenceAnalyzer } from './preferenceAnalyzer';
import { enhancedGoogleDriveService } from './enhancedGoogleDriveService';
import { contentCache } from './contentCache';
import { adaptiveModelSelector } from './adaptiveModelSelector';

interface SmartArticle {
  title: string;
  content: string;
  category: string;
  readTime: number;
  excerpt: string;
  author: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  personalityMatch: number; // 0-100 score
}

interface ContentGenerationPlan {
  totalArticles: number;
  articlesPerCategory: Record<string, number>;
  suggestedTopics: string[];
  targetDifficulty: string;
  contentStyle: string;
  userPersonality: string;
}

export class SmartContentGenerator {

  /**
   * ייצור תוכן חכם ומותאם אישית בהתבסס על פרופיל המשתמש המלא
   */
  async generatePersonalizedContent(requestedCount: number = 5): Promise<SmartArticle[]> {
    console.log(`🧠 [Smart Content Generator] Starting intelligent content generation for ${requestedCount} articles...`);
    
    try {
      // שלב 1: ניתוח מקיף של המשתמש
      const userProfile = await preferenceAnalyzer.analyzeUserProfile();
      console.log(`📊 [Smart Content Generator] User profile: ${userProfile.readingLevel} level, ${userProfile.contentStyle} style`);

      // שלב 2: ניתוח Google Drive אם זמין
      let driveInsights = null;
      try {
        const settings = await prisma.userSettings.findUnique({ where: { id: 'default-user' } });
        if (settings?.googleDriveAuth) {
          const tokens = JSON.parse(settings.googleDriveAuth);
          enhancedGoogleDriveService.setAccessToken(tokens.accessToken, tokens.refreshToken);
          const documentInsights = await enhancedGoogleDriveService.analyzeDocumentsWithAI(15);
          if (documentInsights.length > 0) {
            driveInsights = await enhancedGoogleDriveService.generatePersonalizedContentMix(documentInsights);
            await enhancedGoogleDriveService.saveDocumentInsights(documentInsights);
            console.log(`✅ [Smart Content Generator] Google Drive analysis completed: ${documentInsights.length} documents`);
          } else {
            console.log('📂 [Smart Content Generator] Google Drive connected but no documents found');
          }
        } else {
          console.log('📂 [Smart Content Generator] Google Drive not connected - using basic profile only');
        }
      } catch (error: any) {
        console.warn('⚠️ [Smart Content Generator] Google Drive analysis failed (continuing without Drive data):', error.message || error);
        // המשך בלי Google Drive - זה לא אמור לעצור את כל התהליך
      }

      // שלב 3: יצירת תכנית תוכן מותאמת אישית
      const contentPlan = await this.createContentGenerationPlan(userProfile, driveInsights, requestedCount);
      console.log(`📋 [Smart Content Generator] Content plan created: ${Object.keys(contentPlan.articlesPerCategory).length} categories`);

      // שלב 4: יצירת המאמרים החכמים
      const articles = await this.generateSmartArticles(contentPlan, userProfile, driveInsights);
      console.log(`✅ [Smart Content Generator] Generated ${articles.length} personalized articles`);

      // שלב 5: שמירה למסד הנתונים עם מטאדאטה מורחבת
      const savedArticles = await this.saveSmartArticles(articles, userProfile);
      console.log(`💾 [Smart Content Generator] Saved ${savedArticles.length} articles to database`);

      return savedArticles;

    } catch (error) {
      console.error('❌ [Smart Content Generator] Generation failed:', error);
      throw error;
    }
  }

  /**
   * יצירת תכנית תוכן חכמה המבוססת על פרופיל המשתמש
   */
  private async createContentGenerationPlan(
    userProfile: any, 
    driveInsights: any, 
    totalCount: number
  ): Promise<ContentGenerationPlan> {
    
    // בדיקת מטמון לתכנית תוכן
    const cacheKey = `content_plan_${JSON.stringify({
      readingLevel: userProfile.readingLevel,
      contentStyle: userProfile.contentStyle,
      topCategories: userProfile.topCategories.slice(0, 3),
      totalCount,
      driveTopics: driveInsights?.suggestedTopics?.slice(0, 5)
    })}`;
    
    const cachedPlan = contentCache.get(cacheKey);
    if (cachedPlan) {
      console.log('📋 [Smart Content Generator] Using cached content plan');
      return cachedPlan;
    }
    
    // בחירת מודל אדפטיבי לתכנון תוכן
    const ai = await adaptiveModelSelector.createOptimizedAIClient({
      taskType: 'content_generation',
      complexity: userProfile.readingLevel === 'advanced' ? 'complex' : 
                 userProfile.readingLevel === 'intermediate' ? 'medium' : 'simple',
      outputLength: 'medium',
      language: 'hebrew',
      quality: 'standard',
      urgency: 'medium',
      context: 'content planning educational'
    });
    
    if (!ai) {
      return this.createBasicContentPlan(userProfile, totalCount);
    }

    const planPrompt = `צור תכנית תוכן אינטליגנטית ומותאמת אישית:

## פרופיל המשתמש:
- רמת קריאה: ${userProfile.readingLevel}
- סגנון תוכן מועדף: ${userProfile.contentStyle}
- תחומי עניין מרכזיים: ${userProfile.topCategories.slice(0, 5).map((c: any) => `${c.category} (${Math.round(c.score * 100)}%)`).join(', ')}
- דפוסי אינטראקציה: ${userProfile.interactionPatterns.readingTime} קריאה, ${userProfile.interactionPatterns.questionTypes.join(', ')} שאלות
- נושאים מועדפים: ${userProfile.preferredTopics.slice(0, 8).join(', ')}

${driveInsights ? `## תובנות מ-Google Drive:
- נושאים מוצעים: ${driveInsights.suggestedTopics.join(', ')}
- קהל יעד: ${driveInsights.targetAudience}
- רמת מומחיות: ${driveInsights.expertise_level}
- סגנון תוכן: ${driveInsights.contentStyle}` : ''}

## דרישות:
- סה"כ מאמרים: ${totalCount}
- התאם לרמת הידע והעניין של המשתמש
- שלב נושאים מהמסמכים האישיים (אם קיימים)
- צור מגוון אך בחלוקה נכונה לפי העדפות

החזר JSON בפורמט הבא:
{
  "totalArticles": ${totalCount},
  "articlesPerCategory": {
    "קטגוריה1": מספר_מאמרים,
    "קטגוריה2": מספר_מאמרים
  },
  "suggestedTopics": [
    "נושא ספציפי ומעניין 1",
    "נושא ספציפי ומעניין 2",
    "נושא ספציפי ומעניין 3"
  ],
  "targetDifficulty": "beginner/intermediate/advanced",
  "contentStyle": "practical/theoretical/mixed/creative",
  "userPersonality": "תיאור קצר של אישיות המשתמש הלומד"
}

כללים:
- הקצה יותר מאמרים לקטגוריות שהמשתמש אוהב יותר
- התחשב ברמת הקריאה - אל תיצור תוכן קשה מדי או קל מדי
- שלב בין העדפות קיימות לנושאים חדשים ומעניינים
- הקפד על איזון בין תיאוריה למעשיות לפי הסגנון המועדף`;

    try {
      const completion = await chatCompletion(ai, getDefaultModel(), [
        { role: 'system', content: 'אתה מתכנן תוכן מומחה. החזר JSON תקין בלבד עם כל השדות הנדרשים.' },
        { role: 'user', content: planPrompt },
      ]);

      const responseText = completion.choices?.[0]?.message?.content || '{}';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const plan = {
          totalArticles: parsed.totalArticles || totalCount,
          articlesPerCategory: parsed.articlesPerCategory || {},
          suggestedTopics: Array.isArray(parsed.suggestedTopics) ? parsed.suggestedTopics : [],
          targetDifficulty: parsed.targetDifficulty || userProfile.readingLevel,
          contentStyle: parsed.contentStyle || userProfile.contentStyle,
          userPersonality: parsed.userPersonality || 'לומד מתעניין',
        };
        
        // שמירה במטמון לשימוש עתידי (תוקף של שעה)
        contentCache.set(cacheKey, plan, 60 * 60 * 1000);
        console.log('💾 [Smart Content Generator] Content plan cached for future use');
        
        return plan;
      }
    } catch (error) {
      console.error('❌ [Smart Content Generator] Content planning failed:', error);
    }

    return this.createBasicContentPlan(userProfile, totalCount);
  }

  /**
   * יצירת המאמרים החכמים בפועל
   */
  private async generateSmartArticles(
    contentPlan: ContentGenerationPlan,
    userProfile: any,
    driveInsights: any
  ): Promise<SmartArticle[]> {
    
    // בחירת מודל אדפטיבי ליצירת מאמרים
    const ai = await adaptiveModelSelector.createOptimizedAIClient({
      taskType: 'content_generation',
      complexity: contentPlan.targetDifficulty === 'advanced' ? 'complex' : 
                 contentPlan.targetDifficulty === 'intermediate' ? 'medium' : 'simple',
      outputLength: 'long',
      language: 'hebrew',
      quality: 'premium', // איכות גבוהה למאמרים
      urgency: 'low', // לא במירוץ
      context: `${contentPlan.contentStyle} content for ${contentPlan.userPersonality}`
    });
    
    if (!ai) {
      throw new Error('AI client not available for content generation');
    }

    const articles: SmartArticle[] = [];
    const usedTopics = new Set<string>(); // למניעת כפילויות

    // יצירת הקשר אישי מתקדם
    const personalContext = await preferenceAnalyzer.generatePersonalizedContext(userProfile, driveInsights);
    
    // קבלת מאמרים קיימים למניעת כפילויות
    const existingArticles = await prisma.article.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: { title: true, category: true },
    });
    const existingTitles = existingArticles.map(a => a.title).join(', ');

    for (const [category, count] of Object.entries(contentPlan.articlesPerCategory)) {
      console.log(`📝 [Smart Content Generator] Creating ${count} articles for ${category}...`);
      
      for (let i = 0; i < count; i++) {
        try {
          // בחר נושא מתוך הנושאים המוצעים או צור חדש
          let topic = '';
          let attemptCount = 0;
          
          while ((!topic || usedTopics.has(topic)) && attemptCount < 5) {
            const availableTopics = contentPlan.suggestedTopics.filter(t => !usedTopics.has(t));
            if (availableTopics.length > 0) {
              topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
            } else {
              // צור נושא חדש אם נגמרו הנושאים
              topic = await this.generateNewTopic(category, userProfile, ai);
            }
            attemptCount++;
          }

          if (!topic) {
            console.warn(`⚠️ [Smart Content Generator] Could not generate unique topic for ${category}`);
            continue;
          }

          usedTopics.add(topic);

          // יצירת המאמר החכם
          const smartArticle = await this.createSmartArticle(
            topic, 
            category, 
            contentPlan, 
            personalContext,
            existingTitles,
            ai
          );

          if (smartArticle) {
            articles.push(smartArticle);
            console.log(`✅ [Smart Content Generator] Created: "${smartArticle.title}"`);
          }

          // מניעת הצפה של API
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ [Smart Content Generator] Failed to create article in ${category}:`, error);
        }
      }
    }

    return articles;
  }

  /**
   * יצירת מאמר בודד עם אינטליגנציה מתקדמת
   */
  private async createSmartArticle(
    topic: string,
    category: string,
    contentPlan: ContentGenerationPlan,
    personalContext: string,
    existingTitles: string,
    ai: any
  ): Promise<SmartArticle | null> {

    // בדיקת מטמון למאמר דומה
    const articleCacheKey = `smart_article_${JSON.stringify({
      topic: topic.toLowerCase(),
      category,
      difficulty: contentPlan.targetDifficulty,
      style: contentPlan.contentStyle
    })}`;
    
    const cachedArticle = contentCache.get(articleCacheKey);
    if (cachedArticle) {
      console.log(`📦 [Smart Content Generator] Using cached article for "${topic}"`);
      return cachedArticle;
    }

    const articlePrompt = `כתוב מאמר איכותי ומותאם אישית על הנושא: "${topic}"

${personalContext}

## פרטי המאמר:
- קטגוריה: ${category}
- רמת קושי יעד: ${contentPlan.targetDifficulty}
- סגנון תוכן: ${contentPlan.contentStyle}
- אישיות המשתמש: ${contentPlan.userPersonality}

## מאמרים קיימים (אל תשכפל):
${existingTitles.slice(0, 500)}...

החזר JSON בפורמט הבא:
{
  "title": "כותרת מעניינת וייחודית (עד 60 תווים)",
  "content": "תוכן המאמר המלא - לפחות 400 מילים עם פסקאות מובנות, כותרות משנה, ונקודות מעשיות. כתוב בסגנון אישי ומעניין.",
  "excerpt": "תקציר של 2-3 משפטים",
  "author": "שם מחבר בדוי מתאים לנושא",
  "tags": ["תג1", "תג2", "תג3", "תג4", "תג5"],
  "readTime": זמן_קריאה_בדקות_מספר_בלבד,
  "personalityMatch": ציון_התאמה_לאישיות_המשתמש_0_עד_100
}

דרישות איכות:
- התאם את הטון והרמה בדיוק לפרופיל המשתמש
- שלב דוגמאות מעשיות ורלוונטיות
- הוסף ערך אמיתי - תובנות, טיפים, או ידע חדש
- כתוב בעברית תקנית וזורמת
- ארגן עם כותרות משנה וביטים קצרים לקריאות
- הקפד על רלוונטיות לתחומי העניין של המשתמש
- personalityMatch צריך להיות ציון מדויק (0-100) של כמה המאמר מתאים למשתמש`;

    try {
      const completion = await chatCompletion(ai, getDefaultModel(), [
        { 
          role: 'system', 
          content: 'אתה כותב תוכן מומחה ומתמחה ביצירת מאמרים מותאמים אישית איכותיים. החזר JSON תקין בלבד עם כל השדות.' 
        },
        { role: 'user', content: articlePrompt },
      ]);

      const responseText = completion.choices?.[0]?.message?.content || '{}';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const article = {
          title: parsed.title || `${topic} - מדריך מקיף`,
          content: parsed.content || `מאמר מעמיק על ${topic}...`,
          category: category,
          readTime: typeof parsed.readTime === 'number' ? parsed.readTime : 5,
          excerpt: parsed.excerpt || parsed.content?.slice(0, 200) || '',
          author: parsed.author || 'מומחה בתחום',
          tags: Array.isArray(parsed.tags) ? parsed.tags : [topic, category],
          difficulty: contentPlan.targetDifficulty as any,
          personalityMatch: typeof parsed.personalityMatch === 'number' ? parsed.personalityMatch : 75,
        };
        
        // שמירה במטמון לשימוש עתידי (תוקף של 4 שעות)
        contentCache.set(articleCacheKey, article, 4 * 60 * 60 * 1000);
        console.log(`💾 [Smart Content Generator] Article "${article.title}" cached`);
        
        return article;
      }
    } catch (error) {
      console.error(`❌ [Smart Content Generator] Failed to create smart article for ${topic}:`, error);
    }

    return null;
  }

  /**
   * יצירת נושא חדש כאשר נגמרו הנושאים המוצעים
   */
  private async generateNewTopic(category: string, userProfile: any, ai: any): Promise<string> {
    // בחירת מודל מהיר ליצירת נושא חדש
    const topicAI = await adaptiveModelSelector.createOptimizedAIClient({
      taskType: 'creative',
      complexity: 'simple',
      outputLength: 'short',
      language: 'hebrew',
      quality: 'draft', // לא צריך איכות גבוהה לנושא
      urgency: 'high', // רוצים תשובה מהירה
      context: `topic generation for ${category}`
    }) || ai; // fallback ל-AI קיים אם לא ניתן לבחור מודל
    
    const topicPrompt = `צור נושא חדש ומעניין בקטגוריה "${category}" המתאים לפרופיל:
    
רמת קריאה: ${userProfile.readingLevel}
סגנון מועדף: ${userProfile.contentStyle}
תחומי עניין: ${userProfile.topCategories.slice(0, 3).map((c: any) => c.category).join(', ')}

החזר נושא אחד בלבד (לא JSON) - משפט קצר ובהיר.`;

    try {
      const completion = await chatCompletion(topicAI, (topicAI as any)?.modelName || getDefaultModel(), [
        { role: 'system', content: 'אתה מומחה ביצירת נושאים מעניינים. החזר נושא אחד בלבד.' },
        { role: 'user', content: topicPrompt },
      ]);

      const topic = completion.choices?.[0]?.message?.content?.trim() || '';
      return topic.replace(/["\n\r]/g, '').slice(0, 80);
    } catch (error) {
      console.error('❌ [Smart Content Generator] Failed to generate new topic:', error);
      return `${category} מתקדם`;
    }
  }

  /**
   * שמירת המאמרים החכמים למסד הנתונים עם מטאדאטה מורחבת
   */
  private async saveSmartArticles(articles: SmartArticle[], userProfile: any): Promise<SmartArticle[]> {
    const savedArticles: SmartArticle[] = [];

    for (const article of articles) {
      try {
        const saved = await prisma.article.create({
          data: {
            title: article.title,
            content: article.content,
            category: article.category,
            readTime: article.readTime,
            excerpt: article.excerpt,
            author: article.author,
            publishedAt: new Date(),
          },
        });

        // שמירת מטאדאטה נוספת כ-Insight
        await prisma.insight.create({
          data: {
            type: 'generated_content',
            title: `נוצר: ${article.title}`,
            content: `מאמר מותאם אישית ברמת התאמה של ${article.personalityMatch}%`,
            metadata: JSON.stringify({
              difficulty: article.difficulty,
              personalityMatch: article.personalityMatch,
              tags: article.tags,
              generatedFor: {
                readingLevel: userProfile.readingLevel,
                contentStyle: userProfile.contentStyle,
                topCategory: userProfile.topCategories[0]?.category,
              },
            }),
            sources: JSON.stringify([saved.id]),
          },
        });

        savedArticles.push({
          ...article,
          // @ts-ignore
          id: saved.id,
        });

      } catch (error) {
        console.error(`❌ [Smart Content Generator] Failed to save article "${article.title}":`, error);
      }
    }

    return savedArticles;
  }

  /**
   * יצירת תכנית תוכן בסיסית אם AI לא זמין
   */
  private createBasicContentPlan(userProfile: any, totalCount: number): ContentGenerationPlan {
    const topCategories = userProfile.topCategories.slice(0, 3);
    const articlesPerCategory: Record<string, number> = {};
    
    if (topCategories.length === 0) {
      articlesPerCategory['self-improvement'] = totalCount;
    } else {
      const remainingCount = totalCount;
      topCategories.forEach((cat: any, index: number) => {
        const weight = Math.max(0.6 - index * 0.15, 0.2);
        articlesPerCategory[cat.category] = Math.max(1, Math.floor(remainingCount * weight));
      });
    }

    return {
      totalArticles: totalCount,
      articlesPerCategory,
      suggestedTopics: userProfile.preferredTopics.slice(0, 8) || ['פיתוח אישי', 'פרודוקטיביות'],
      targetDifficulty: userProfile.readingLevel,
      contentStyle: userProfile.contentStyle,
      userPersonality: 'לומד מעוניין בהתפתחות אישית',
    };
  }

  /**
   * יצירת תוכן אוטומטי יומי
   */
  async generateDailyContent(): Promise<void> {
    console.log('📅 [Smart Content Generator] Starting daily content generation...');
    
    try {
      // בדוק אם יש פעילות אחרונה
      const recentActivity = await prisma.userActivity.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 שעות אחרונות
          },
        },
      });

      // אם יש פעילות, צור תוכן
      if (recentActivity.length > 0) {
        const articles = await this.generatePersonalizedContent(2); // 2 מאמרים יומיים
        console.log(`✅ [Smart Content Generator] Daily generation complete: ${articles.length} articles created`);
      } else {
        console.log('📭 [Smart Content Generator] No recent activity, skipping daily generation');
      }

    } catch (error) {
      console.error('❌ [Smart Content Generator] Daily generation failed:', error);
    }
  }
}

export const smartContentGenerator = new SmartContentGenerator();