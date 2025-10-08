import { prisma } from '../db';
import { preferenceAnalyzer } from './preferenceAnalyzer';
import { contentCache } from './contentCache';
import { adaptiveModelSelector } from './adaptiveModelSelector';
import { createAIClientFromAny, getDefaultModel, chatCompletion } from './aiClient';

interface UserRecommendations {
  articles: RecommendedArticle[];
  topics: string[];
  categories: string[];
  difficulty: string;
  reasoning: string;
  confidence: number;
}

interface RecommendedArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: number;
  personalityMatch: number;
  relevanceScore: number;
  reasoning: string[];
  tags: string[];
}

interface UserBehaviorPattern {
  readingVelocity: number;
  engagementLevel: number;
  preferredTimeSlots: string[];
  contentDepthPreference: 'shallow' | 'medium' | 'deep';
  interactionStyle: 'passive' | 'active' | 'mixed';
  learningGoals: string[];
}

export class EnhancedRecommendationEngine {

  /**
   * יצירת המלצות מתקדמות מבוססות על ניתוח מקיף של המשתמש
   */
  async generatePersonalizedRecommendations(userId: string = 'default-user', limit: number = 10): Promise<UserRecommendations> {
    console.log(`🎯 [Recommendation Engine] Generating personalized recommendations for user ${userId}...`);

    // בדיקת cache להמלצות אחרונות
    const cacheKey = `recommendations_${userId}_${limit}`;
    const cachedRecommendations = contentCache.get<UserRecommendations>(cacheKey);
    if (cachedRecommendations) {
      console.log('📦 [Recommendation Engine] Using cached recommendations');
      return cachedRecommendations;
    }

    try {
      // שלב 1: ניתוח פרופיל מורחב
      const userProfile = await preferenceAnalyzer.analyzeUserProfile();
      const behaviorPattern = await this.analyzeBehaviorPattern(userId);
      
      console.log(`📊 [Recommendation Engine] User profile: ${userProfile.readingLevel}, behavior: ${behaviorPattern.interactionStyle}`);

      // שלב 2: איסוף מאמרים מועמדים
      const candidateArticles = await this.getCandidateArticles(userProfile, limit * 3);
      console.log(`📚 [Recommendation Engine] Found ${candidateArticles.length} candidate articles`);

      // שלב 3: חישוב ציוני רלוונטיות מתקדמים
      const scoredArticles = await this.scoreArticleRelevance(candidateArticles, userProfile, behaviorPattern);

      // שלב 4: יצירת המלצות מותאמות עם AI
      const aiRecommendations = await this.generateAIEnhancedRecommendations(
        scoredArticles.slice(0, limit),
        userProfile,
        behaviorPattern
      );

      // שלב 5: יצירת נושאים מוצעים נוספים
      const suggestedTopics = await this.generateSuggestedTopics(userProfile, behaviorPattern);
      const suggestedCategories = await this.generateSuggestedCategories(userProfile);

      const recommendations: UserRecommendations = {
        articles: aiRecommendations,
        topics: suggestedTopics,
        categories: suggestedCategories,
        difficulty: userProfile.readingLevel,
        reasoning: await this.generateRecommendationReasoning(userProfile, behaviorPattern),
        confidence: this.calculateConfidenceScore(userProfile, behaviorPattern, candidateArticles.length)
      };

      // שמירה ב-cache לשימוש עתידי (10 דקות)
      contentCache.set(cacheKey, recommendations, 10 * 60 * 1000);
      console.log(`✅ [Recommendation Engine] Generated ${recommendations.articles.length} personalized recommendations`);

      // שמירת לוג ההמלצות למעקב וניתוח
      await this.logRecommendations(userId, recommendations);

      return recommendations;

    } catch (error) {
      console.error('❌ [Recommendation Engine] Failed to generate recommendations:', error);
      
      // Fallback להמלצות בסיסיות
      return this.generateBasicRecommendations(limit);
    }
  }

  /**
   * ניתוח דפוסי התנהגות מתקדם של המשתמש
   */
  private async analyzeBehaviorPattern(userId: string): Promise<UserBehaviorPattern> {
    const recentActivity = await prisma.userActivity.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 ימים אחרונים
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const savedArticles = await prisma.savedArticle.findMany({
      include: { article: true },
      orderBy: { savedAt: 'desc' },
      take: 50,
    });

    const questions = await prisma.aiQuestion.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // חישוב מהירות קריאה
    const readingActions = recentActivity.filter(a => a.action === 'article_read');
    const readingVelocity = readingActions.length / Math.max(recentActivity.length, 1);

    // חישוב רמת מעורבות
    const engagementActions = recentActivity.filter(a => 
      a.action === 'article_save' || a.action === 'ai_question' || a.action === 'article_share'
    );
    const engagementLevel = engagementActions.length / Math.max(readingActions.length, 1);

    // ניתוח עומק תוכן מועדף
    const longArticles = savedArticles.filter(sa => sa.article.readTime && sa.article.readTime > 8).length;
    const totalSaved = savedArticles.length;
    const contentDepthPreference: 'shallow' | 'medium' | 'deep' = 
      longArticles / Math.max(totalSaved, 1) > 0.6 ? 'deep' :
      longArticles / Math.max(totalSaved, 1) > 0.3 ? 'medium' : 'shallow';

    // ניתוח סגנון אינטראקציה
    const interactionStyle: 'passive' | 'active' | 'mixed' =
      questions.length > savedArticles.length ? 'active' :
      questions.length > savedArticles.length * 0.5 ? 'mixed' : 'passive';

    // ניתוח זמני פעילות (לעתיד)
    const preferredTimeSlots = ['morning', 'afternoon', 'evening']; // simplified

    return {
      readingVelocity,
      engagementLevel,
      preferredTimeSlots,
      contentDepthPreference,
      interactionStyle,
      learningGoals: this.extractLearningGoals(questions, savedArticles)
    };
  }

  /**
   * איסוף מאמרים מועמדים חכם
   */
  private async getCandidateArticles(userProfile: any, limit: number) {
    const topCategories = userProfile.topCategories.slice(0, 5);
    
    const candidateArticles = [];

    // מאמרים מקטגוריות מועדפות (70% מההמלצות)
    for (const category of topCategories) {
      const articles = await prisma.article.findMany({
        where: {
          category: category.category,
          // מניעת מאמרים שכבר נקראו
          NOT: {
            id: {
              in: await this.getReadArticleIds()
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        take: Math.ceil(limit * 0.7 / topCategories.length),
      });
      candidateArticles.push(...articles);
    }

    // מאמרים מקטגוריות חדשות לגיוון (30%)
    const newCategories = await prisma.article.groupBy({
      by: ['category'],
      where: {
        category: {
          notIn: topCategories.map((c: any) => c.category)
        }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 3,
    });

    for (const categoryGroup of newCategories) {
      const articles = await prisma.article.findMany({
        where: { category: categoryGroup.category },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit * 0.3 / newCategories.length),
      });
      candidateArticles.push(...articles);
    }

    return candidateArticles;
  }

  /**
   * מערכת ניקוד מתקדמת לרלוונטיות מאמרים
   */
  private async scoreArticleRelevance(
    articles: any[], 
    userProfile: any, 
    behaviorPattern: UserBehaviorPattern
  ): Promise<RecommendedArticle[]> {
    
    const scoredArticles: RecommendedArticle[] = [];

    for (const article of articles) {
      let relevanceScore = 0;
      const reasoning: string[] = [];

      // ציון לפי קטגוריה מועדפת
      const categoryMatch = userProfile.topCategories.find((c: any) => c.category === article.category);
      if (categoryMatch) {
        const categoryScore = categoryMatch.score * 40;
        relevanceScore += categoryScore;
        reasoning.push(`קטגוריה מועדפת: ${article.category} (+${categoryScore.toFixed(1)})`);
      }

      // ציון לפי אורך המאמר והעדפות עומק
      const lengthScore = this.calculateLengthScore(article.readTime, behaviorPattern.contentDepthPreference);
      relevanceScore += lengthScore;
      if (lengthScore > 0) {
        reasoning.push(`אורך מתאים: ${article.readTime} דק׳ (+${lengthScore.toFixed(1)})`);
      }

      // ציון לפי נושאים מועדפים
      const topicScore = this.calculateTopicScore(article.title + ' ' + article.content, userProfile.preferredTopics);
      relevanceScore += topicScore;
      if (topicScore > 0) {
        reasoning.push(`נושאים רלוונטיים (+${topicScore.toFixed(1)})`);
      }

      // ציון לפי חדות המאמר
      const freshnessScore = this.calculateFreshnessScore(article.createdAt);
      relevanceScore += freshnessScore;
      if (freshnessScore > 5) {
        reasoning.push(`תוכן עדכני (+${freshnessScore.toFixed(1)})`);
      }

      // ציון מותאמות אישית מתקדם
      const personalityMatch = await this.calculatePersonalityMatch(article, userProfile, behaviorPattern);

      scoredArticles.push({
        id: article.id,
        title: article.title,
        category: article.category,
        excerpt: article.excerpt || article.content.slice(0, 200),
        readTime: article.readTime,
        personalityMatch,
        relevanceScore: Math.max(0, relevanceScore),
        reasoning,
        tags: this.extractArticleTags(article)
      });
    }

    return scoredArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * חישוב התאמה אישיותית מתקדמת
   */
  private async calculatePersonalityMatch(article: any, userProfile: any, behaviorPattern: UserBehaviorPattern): Promise<number> {
    let match = 70; // בסיס

    // התאמה לסגנון תוכן
    if (userProfile.contentStyle === 'practical' && 
        (article.title.includes('איך') || article.title.includes('מדריך'))) {
      match += 10;
    }

    // התאמה לרמת אינטראקציה
    if (behaviorPattern.interactionStyle === 'active' && article.content.includes('?')) {
      match += 5; // מאמרים עם שאלות לאנשים אקטיביים
    }

    // התאמה לעומק התוכן
    if (behaviorPattern.contentDepthPreference === 'deep' && article.readTime > 10) {
      match += 15;
    } else if (behaviorPattern.contentDepthPreference === 'shallow' && article.readTime < 5) {
      match += 10;
    }

    return Math.min(100, match);
  }

  /**
   * יצירת המלצות מועשרות בAI
   */
  private async generateAIEnhancedRecommendations(
    articles: RecommendedArticle[],
    userProfile: any,
    behaviorPattern: UserBehaviorPattern
  ): Promise<RecommendedArticle[]> {

    try {
      // בחירת מודל מתאים להמלצות
      const ai = await adaptiveModelSelector.createOptimizedAIClient({
        taskType: 'analysis',
        complexity: 'medium',
        outputLength: 'medium',
        language: 'hebrew',
        quality: 'standard',
        urgency: 'medium',
        context: 'personalized recommendations analysis'
      });

      if (!ai) {
        return articles; // fallback
      }

      // יצירת הקשר AI להמלצות
      const recommendationPrompt = `נתח את המאמרים הבאים ושפר את ההמלצות עבור משתמש עם הפרופיל הבא:

פרופיל משתמש:
- רמת קריאה: ${userProfile.readingLevel}
- סגנון מועדף: ${userProfile.contentStyle}
- קטגוריות עיקריות: ${userProfile.topCategories.slice(0, 3).map((c: any) => c.category).join(', ')}
- עומק תוכן מועדף: ${behaviorPattern.contentDepthPreference}
- סגנון אינטראקציה: ${behaviorPattern.interactionStyle}

מאמרים מועמדים:
${articles.slice(0, 5).map((a, i) => `${i+1}. "${a.title}" - ${a.category} (${a.readTime} דק׳)`).join('\n')}

הוסף לכל מאמר:
1. ציון התאמה אישית מעודכן (0-100)
2. סיבה קצרה למה המאמר מתאים למשתמש זה
3. תגים רלוונטיים

החזר JSON array עם המבנה:
[{"index": 1, "personalityMatch": ציון, "reasoning": "סיבה", "tags": ["תג1", "תג2"]}]`;

      const completion = await chatCompletion(ai, (ai as any)?.modelName || getDefaultModel(), [
        { role: 'system', content: 'אתה מומחה המלצות תוכן אישיות. החזר JSON תקין בלבד.' },
        { role: 'user', content: recommendationPrompt },
      ]);

      const responseText = completion.choices?.[0]?.message?.content || '[]';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const aiEnhancements = JSON.parse(jsonMatch[0]);
        
        // שילוב שיפורי AI עם המאמרים
        aiEnhancements.forEach((enhancement: any) => {
          const articleIndex = enhancement.index - 1;
          if (articles[articleIndex]) {
            articles[articleIndex].personalityMatch = enhancement.personalityMatch || articles[articleIndex].personalityMatch;
            articles[articleIndex].reasoning.push(`AI: ${enhancement.reasoning}`);
            articles[articleIndex].tags = [...new Set([...articles[articleIndex].tags, ...(enhancement.tags || [])])];
          }
        });
      }

    } catch (error) {
      console.warn('⚠️ [Recommendation Engine] AI enhancement failed, using base recommendations:', error);
    }

    return articles;
  }

  /**
   * יצירת נושאים מוצעים
   */
  private async generateSuggestedTopics(userProfile: any, behaviorPattern: UserBehaviorPattern): Promise<string[]> {
    const baseTopics = userProfile.preferredTopics.slice(0, 5);
    
    // נושאים חדשים בהתבסס על קטגוריות מועדפות
    const expandedTopics = [];
    
    for (const category of userProfile.topCategories.slice(0, 3)) {
      const categoryTopics = await this.getTopicsForCategory(category.category);
      expandedTopics.push(...categoryTopics);
    }
    
    return [...new Set([...baseTopics, ...expandedTopics])].slice(0, 8);
  }

  /**
   * יצירת קטגוריות מוצעות
   */
  private async generateSuggestedCategories(userProfile: any): Promise<string[]> {
    const currentCategories = userProfile.topCategories.map((c: any) => c.category);
    
    // קטגוריות פופולריות שהמשתמש עדיין לא חקר
    const popularCategories = await prisma.article.groupBy({
      by: ['category'],
      where: {
        category: {
          notIn: currentCategories
        }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });
    
    return popularCategories.map(c => c.category);
  }

  // Helper methods
  private calculateLengthScore(readTime: number, preference: string): number {
    switch (preference) {
      case 'shallow': return readTime <= 5 ? 20 : readTime <= 8 ? 10 : 0;
      case 'medium': return readTime >= 5 && readTime <= 10 ? 20 : 10;
      case 'deep': return readTime >= 8 ? 20 : readTime >= 5 ? 10 : 0;
      default: return 10;
    }
  }

  private calculateTopicScore(content: string, preferredTopics: string[]): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    
    for (const topic of preferredTopics) {
      if (lowerContent.includes(topic.toLowerCase())) {
        score += 10;
      }
    }
    
    return Math.min(30, score);
  }

  private calculateFreshnessScore(createdAt: Date): number {
    const daysDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 1) return 15;
    if (daysDiff <= 7) return 10;
    if (daysDiff <= 30) return 5;
    return 0;
  }

  private extractLearningGoals(questions: any[], articles: any[]): string[] {
    // ניתוח פשוט של מטרות למידה מתוך שאלות ומאמרים שמורים
    const goals = new Set<string>();
    
    questions.forEach(q => {
      if (q.question.includes('איך')) goals.add('מיומנויות מעשיות');
      if (q.question.includes('מה זה') || q.question.includes('מהו')) goals.add('הבנה תיאורטית');
    });
    
    articles.forEach(sa => {
      if (sa.article?.category === 'technology') goals.add('טכנולוגיה');
      if (sa.article?.category === 'self-improvement') goals.add('פיתוח אישי');
    });
    
    return Array.from(goals).slice(0, 3);
  }

  private extractArticleTags(article: any): string[] {
    const tags = new Set<string>();
    
    // תגים מהקטגוריה
    tags.add(article.category);
    
    // תגים מהכותרת
    const titleWords = article.title.split(' ').filter((w: string) => w.length > 3);
    titleWords.slice(0, 2).forEach((w: string) => tags.add(w));
    
    return Array.from(tags);
  }

  private async getReadArticleIds(): Promise<string[]> {
    const readActivity = await prisma.userActivity.findMany({
      where: { action: 'article_read' },
      select: { targetId: true },
      distinct: ['targetId'],
    });
    
    return readActivity.map(a => a.targetId).filter(id => id !== null) as string[];
  }

  private async getTopicsForCategory(category: string): Promise<string[]> {
    // יצירת נושאים חדשים בהתבסס על קטגוריה
    const categoryMap: Record<string, string[]> = {
      'technology': ['בינה מלאכותית', 'פיתוח תוכנה', 'אבטחת מידע'],
      'self-improvement': ['מנהיגות', 'פרודוקטיביות', 'משמעת עצמית'],
      'business': ['יזמות', 'ניהול', 'שיווק דיגיטלי'],
      'science': ['מדע הנתונים', 'ביולוגיה', 'פיזיקה קוונטית'],
    };
    
    return categoryMap[category] || [];
  }

  private calculateConfidenceScore(userProfile: any, behaviorPattern: UserBehaviorPattern, candidatesCount: number): number {
    let confidence = 60; // בסיס
    
    // ביטחון גבוה יותר עם יותר נתונים על המשתמש
    if (userProfile.topCategories.length >= 3) confidence += 15;
    if (behaviorPattern.readingVelocity > 0.3) confidence += 10;
    if (candidatesCount >= 20) confidence += 10;
    
    return Math.min(95, confidence);
  }

  private async generateRecommendationReasoning(userProfile: any, behaviorPattern: UserBehaviorPattern): Promise<string> {
    const reasons = [];
    
    if (userProfile.readingLevel === 'advanced') {
      reasons.push('בחרנו תוכן מתקדם המתאים לרמתך הגבוהה');
    }
    
    if (behaviorPattern.interactionStyle === 'active') {
      reasons.push('כללנו מאמרים שמעודדים אינטראקציה וחשיבה');
    }
    
    if (behaviorPattern.contentDepthPreference === 'deep') {
      reasons.push('התמקדנו במאמרים מפורטים ומעמיקים');
    }
    
    return reasons.join(', ') || 'המלצות מבוססות על ההעדפות והפעילות שלך';
  }

  private async generateBasicRecommendations(limit: number): Promise<UserRecommendations> {
    const recentArticles = await prisma.article.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    
    const basicRecommendations: RecommendedArticle[] = recentArticles.map(article => ({
      id: article.id,
      title: article.title,
      category: article.category,
      excerpt: article.excerpt || article.content.slice(0, 200),
      readTime: article.readTime || 5,
      personalityMatch: 70,
      relevanceScore: 50,
      reasoning: ['המלצה בסיסית'],
      tags: [article.category]
    }));
    
    return {
      articles: basicRecommendations,
      topics: ['פיתוח אישי', 'טכנולוגיה'],
      categories: ['self-improvement', 'technology'],
      difficulty: 'intermediate',
      reasoning: 'המלצות בסיסיות עקב מחסור בנתונים',
      confidence: 40
    };
  }

  private async logRecommendations(userId: string, recommendations: UserRecommendations): Promise<void> {
    try {
      console.log(`📊 [Recommendation Engine] Logged recommendations for ${userId}: ${recommendations.articles.length} articles, confidence: ${recommendations.confidence}%`);
    } catch (error) {
      console.warn('⚠️ [Recommendation Engine] Failed to log recommendations:', error);
    }
  }
}

// יצירת instance יחיד
export const enhancedRecommendationEngine = new EnhancedRecommendationEngine();