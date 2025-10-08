import { contentCache } from './contentCache';
import { adaptiveModelSelector } from './adaptiveModelSelector';
import { createAIClientFromAny, getDefaultModel, chatCompletion } from './aiClient';

interface PerformanceMetrics {
  timestamp: Date;
  service: string;
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

interface UserBehaviorAnalytics {
  sessionId: string;
  userId: string;
  actions: UserAction[];
  sessionDuration: number;
  engagementScore: number;
  deviceInfo?: DeviceInfo;
}

interface UserAction {
  timestamp: Date;
  type: string;
  target: string;
  details: Record<string, any>;
  duration?: number;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
}

interface SystemInsights {
  performance: {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    cacheHitRate: number;
  };
  userBehavior: {
    averageSessionDuration: number;
    mostPopularContent: string[];
    peakUsageHours: string[];
    contentEngagement: Record<string, number>;
  };
  contentMetrics: {
    topPerformingArticles: string[];
    categoryDistribution: Record<string, number>;
    avgReadingTime: number;
    completionRates: Record<string, number>;
  };
  aiMetrics: {
    modelUsage: Record<string, number>;
    avgGenerationTime: number;
    userSatisfaction: number;
    topQueries: string[];
  };
  recommendations: string[];
  alerts: SystemAlert[];
}

interface SystemAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  service: string;
  details?: Record<string, any>;
}

export class AdvancedAnalytics {
  private performanceData: PerformanceMetrics[] = [];
  private userBehaviorData: UserBehaviorAnalytics[] = [];
  private systemAlerts: SystemAlert[] = [];
  private analyticsCache: Map<string, any> = new Map();

  constructor() {
    this.initializeAnalytics();
  }

  private initializeAnalytics(): void {
    console.log('📊 [Advanced Analytics] Initializing analytics system...');
    
    // ניקוי נתונים ישנים כל 30 דקות
    setInterval(() => {
      this.cleanupOldData();
    }, 30 * 60 * 1000);

    // יצירת תובנות אוטומטיות כל שעה
    setInterval(() => {
      this.generateAutomaticInsights();
    }, 60 * 60 * 1000);

    console.log('✅ [Advanced Analytics] Analytics system initialized');
  }

  /**
   * רישום מטריקת ביצועים
   */
  trackPerformance(
    service: string,
    operation: string,
    duration: number,
    success: boolean = true,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetrics = {
      timestamp: new Date(),
      service,
      operation,
      duration,
      success,
      metadata
    };

    this.performanceData.push(metric);
    
    // שמירה במטמון לגישה מהירה
    const key = `perf_${service}_${operation}`;
    const existing = this.analyticsCache.get(key) || [];
    existing.push(metric);
    this.analyticsCache.set(key, existing.slice(-100)); // שמור רק 100 נתונים אחרונים

    // אזהרה אוטומטית על ביצועים גרועים
    if (duration > 5000 || !success) {
      this.addAlert('warning', `Performance issue in ${service}.${operation}`, service, {
        duration,
        success,
        metadata
      });
    }
  }

  /**
   * רישום התנהגות משתמש
   */
  trackUserBehavior(
    sessionId: string,
    userId: string,
    actionType: string,
    target: string,
    details: Record<string, any> = {},
    deviceInfo?: DeviceInfo
  ): void {
    const action: UserAction = {
      timestamp: new Date(),
      type: actionType,
      target,
      details
    };

    // מציאה או יצירת session
    let session = this.userBehaviorData.find(s => s.sessionId === sessionId);
    if (!session) {
      session = {
        sessionId,
        userId,
        actions: [],
        sessionDuration: 0,
        engagementScore: 0,
        deviceInfo
      };
      this.userBehaviorData.push(session);
    }

    session.actions.push(action);
    
    // עדכון מטריקות session
    this.updateSessionMetrics(session);
  }

  /**
   * יצירת תובנות מקיפות על המערכת
   */
  async generateSystemInsights(): Promise<SystemInsights> {
    console.log('🔍 [Advanced Analytics] Generating comprehensive system insights...');

    const cacheKey = 'system_insights';
    const cachedInsights = this.analyticsCache.get(cacheKey);
    if (cachedInsights && Date.now() - cachedInsights.timestamp < 15 * 60 * 1000) {
      return cachedInsights.data;
    }

    try {
      // ביצועי מערכת
      const performance = this.analyzePerformanceMetrics();
      
      // התנהגות משתמשים
      const userBehavior = this.analyzeUserBehavior();
      
      // מטריקות תוכן
      const contentMetrics = await this.analyzeContentMetrics();
      
      // מטריקות AI
      const aiMetrics = this.analyzeAIMetrics();
      
      // המלצות לשיפור
      const recommendations = await this.generateSystemRecommendations(
        performance,
        userBehavior,
        contentMetrics,
        aiMetrics
      );

      const insights: SystemInsights = {
        performance,
        userBehavior,
        contentMetrics,
        aiMetrics,
        recommendations,
        alerts: this.getRecentAlerts()
      };

      // שמירה במטמון
      this.analyticsCache.set(cacheKey, {
        data: insights,
        timestamp: Date.now()
      });

      console.log('✅ [Advanced Analytics] System insights generated successfully');
      return insights;

    } catch (error) {
      console.error('❌ [Advanced Analytics] Failed to generate insights:', error);
      throw error;
    }
  }

  /**
   * ניתוח מטריקות ביצועים
   */
  private analyzePerformanceMetrics() {
    const recentMetrics = this.performanceData.filter(
      m => Date.now() - m.timestamp.getTime() < 24 * 60 * 60 * 1000 // 24 שעות אחרונות
    );

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        cacheHitRate: 0
      };
    }

    const successfulMetrics = recentMetrics.filter(m => m.success);
    const averageResponseTime = successfulMetrics.reduce((sum, m) => sum + m.duration, 0) / successfulMetrics.length;
    const errorRate = (recentMetrics.length - successfulMetrics.length) / recentMetrics.length * 100;
    const throughput = recentMetrics.length / 24; // פעולות לשעה

    // ניתוח cache hit rate מתוך המטמון
    const cacheStats = contentCache.getStats();
    const cacheHitRate = cacheStats.hitRate ? cacheStats.hitRate * 100 : 0;

    return {
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    };
  }

  /**
   * ניתוח התנהגות משתמשים
   */
  private analyzeUserBehavior() {
    const recentSessions = this.userBehaviorData.filter(
      s => s.actions.length > 0 &&
           Date.now() - s.actions[s.actions.length - 1].timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (recentSessions.length === 0) {
      return {
        averageSessionDuration: 0,
        mostPopularContent: [],
        peakUsageHours: [],
        contentEngagement: {}
      };
    }

    // חישוב משך session ממוצע
    const averageSessionDuration = recentSessions.reduce((sum, s) => sum + s.sessionDuration, 0) / recentSessions.length;

    // תוכן פופולרי
    const contentCounts: Record<string, number> = {};
    recentSessions.forEach(session => {
      session.actions.forEach(action => {
        if (action.type === 'article_read' || action.type === 'content_view') {
          contentCounts[action.target] = (contentCounts[action.target] || 0) + 1;
        }
      });
    });

    const mostPopularContent = Object.entries(contentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([content]) => content);

    // שעות פיק
    const hourCounts: Record<number, number> = {};
    recentSessions.forEach(session => {
      session.actions.forEach(action => {
        const hour = action.timestamp.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
    });

    const peakUsageHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${parseInt(hour) + 1}:00`);

    // מעורבות תוכן
    const engagementTypes = ['article_save', 'ai_question', 'share', 'like'];
    const contentEngagement: Record<string, number> = {};
    
    engagementTypes.forEach(type => {
      const count = recentSessions.reduce((sum, session) => 
        sum + session.actions.filter(a => a.type === type).length, 0
      );
      contentEngagement[type] = count;
    });

    return {
      averageSessionDuration: Math.round(averageSessionDuration / 1000 / 60), // דקות
      mostPopularContent,
      peakUsageHours,
      contentEngagement
    };
  }

  /**
   * ניתוח מטריקות תוכן
   */
  private async analyzeContentMetrics() {
    // סימולציה של נתונים (במציאות יבוא מ-DB)
    return {
      topPerformingArticles: ['AI Article 1', 'Tech Article 2', 'Business Guide 3'],
      categoryDistribution: {
        'technology': 35,
        'business': 25,
        'science': 20,
        'self-improvement': 20
      },
      avgReadingTime: 8.5,
      completionRates: {
        'short': 0.85,
        'medium': 0.72,
        'long': 0.58
      }
    };
  }

  /**
   * ניתוח מטריקות AI
   */
  private analyzeAIMetrics() {
    const aiMetrics = this.performanceData.filter(m => 
      m.service.includes('ai') || m.service.includes('model') || m.service.includes('content')
    );

    const modelUsage: Record<string, number> = {};
    let totalGenerationTime = 0;
    let generationCount = 0;

    aiMetrics.forEach(metric => {
      if (metric.metadata?.modelName) {
        modelUsage[metric.metadata.modelName] = (modelUsage[metric.metadata.modelName] || 0) + 1;
      }
      if (metric.operation.includes('generation')) {
        totalGenerationTime += metric.duration;
        generationCount++;
      }
    });

    const avgGenerationTime = generationCount > 0 ? totalGenerationTime / generationCount : 0;

    return {
      modelUsage,
      avgGenerationTime: Math.round(avgGenerationTime),
      userSatisfaction: 0.78, // יבוא מנתוני feedback בעתיד
      topQueries: ['איך ללמוד AI?', 'מה זה ChatGPT?', 'פיתוח תוכנה', 'יזמות טכנולוגית']
    };
  }

  /**
   * יצירת המלצות לשיפור מערכת
   */
  private async generateSystemRecommendations(
    performance: any,
    userBehavior: any,
    contentMetrics: any,
    aiMetrics: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // המלצות ביצועים
    if (performance.averageResponseTime > 2000) {
      recommendations.push('שקול שיפור ביצועים - זמן תגובה ממוצע גבוה');
    }

    if (performance.errorRate > 5) {
      recommendations.push('בדוק טיפול בשגיאות - שיעור שגיאות גבוה');
    }

    if (performance.cacheHitRate < 70) {
      recommendations.push('שפר אסטרטגיית מטמון - שיעור פגיעות נמוך');
    }

    // המלצות משתמשים
    if (userBehavior.averageSessionDuration < 5) {
      recommendations.push('שפר מעורבות משתמשים - זמן session קצר');
    }

    if (Object.keys(userBehavior.contentEngagement).length === 0) {
      recommendations.push('עודד אינטראקציה עם התוכן');
    }

    // המלצות AI
    if (aiMetrics.avgGenerationTime > 5000) {
      recommendations.push('בחן מעבר למודלים מהירים יותר');
    }

    if (aiMetrics.userSatisfaction < 0.7) {
      recommendations.push('שפר איכות תוכן שנוצר על ידי AI');
    }

    return recommendations;
  }

  /**
   * עדכון מטריקות session
   */
  private updateSessionMetrics(session: UserBehaviorAnalytics): void {
    if (session.actions.length === 0) return;

    const firstAction = session.actions[0];
    const lastAction = session.actions[session.actions.length - 1];
    
    session.sessionDuration = lastAction.timestamp.getTime() - firstAction.timestamp.getTime();

    // חישוב ציון מעורבות
    let engagementScore = 0;
    session.actions.forEach(action => {
      switch (action.type) {
        case 'article_read': engagementScore += 1; break;
        case 'article_save': engagementScore += 3; break;
        case 'ai_question': engagementScore += 5; break;
        case 'share': engagementScore += 4; break;
        case 'like': engagementScore += 2; break;
      }
    });

    session.engagementScore = engagementScore;
  }

  /**
   * הוספת התראה
   */
  private addAlert(
    level: 'info' | 'warning' | 'error' | 'critical',
    message: string,
    service: string,
    details?: Record<string, any>
  ): void {
    const alert: SystemAlert = {
      level,
      message,
      timestamp: new Date(),
      service,
      details
    };

    this.systemAlerts.push(alert);
    console.log(`🚨 [Advanced Analytics] ${level.toUpperCase()}: ${message}`);

    // שמירת רק 100 התראות אחרונות
    if (this.systemAlerts.length > 100) {
      this.systemAlerts = this.systemAlerts.slice(-100);
    }
  }

  /**
   * קבלת התראות אחרונות
   */
  private getRecentAlerts(): SystemAlert[] {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return this.systemAlerts
      .filter(alert => alert.timestamp.getTime() > twentyFourHoursAgo)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * יצירת תובנות אוטומטיות
   */
  private async generateAutomaticInsights(): Promise<void> {
    try {
      console.log('🤖 [Advanced Analytics] Generating automatic insights...');
      
      const insights = await this.generateSystemInsights();
      
      // יצירת דוח אוטומטי
      const report = this.generateInsightsReport(insights);
      console.log('📊 [Advanced Analytics] Automatic insights:', report.summary);
      
    } catch (error) {
      console.error('❌ [Advanced Analytics] Failed to generate automatic insights:', error);
    }
  }

  /**
   * יצירת דוח תובנות
   */
  private generateInsightsReport(insights: SystemInsights) {
    const summary = `Performance: ${insights.performance.averageResponseTime}ms avg, ` +
      `${insights.performance.errorRate}% errors, ` +
      `Cache: ${insights.performance.cacheHitRate}% hit rate`;

    const userSummary = `Users: ${insights.userBehavior.averageSessionDuration} min avg session, ` +
      `Peak hours: ${insights.userBehavior.peakUsageHours.slice(0, 2).join(', ')}`;

    return {
      summary,
      userSummary,
      recommendations: insights.recommendations.slice(0, 3),
      alerts: insights.alerts.filter(a => a.level === 'critical' || a.level === 'error').length
    };
  }

  /**
   * ניקוי נתונים ישנים
   */
  private cleanupOldData(): void {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // ניקוי מטריקות ביצועים ישנות
    this.performanceData = this.performanceData.filter(
      metric => metric.timestamp.getTime() > sevenDaysAgo
    );

    // ניקוי נתוני התנהגות ישנים
    this.userBehaviorData = this.userBehaviorData.filter(
      session => session.actions.length > 0 &&
                session.actions[session.actions.length - 1].timestamp.getTime() > sevenDaysAgo
    );

    // ניקוי מטמון ישן
    this.analyticsCache.clear();

    console.log('🧹 [Advanced Analytics] Cleaned up old analytics data');
  }

  /**
   * קבלת סטטיסטיקות כלליות
   */
  getAnalyticsStats() {
    return {
      performanceMetrics: this.performanceData.length,
      userSessions: this.userBehaviorData.length,
      systemAlerts: this.systemAlerts.length,
      cacheEntries: this.analyticsCache.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * יצוא נתונים לדוח
   */
  exportAnalyticsData(format: 'json' | 'csv' = 'json') {
    const data = {
      timestamp: new Date().toISOString(),
      performance: this.performanceData.slice(-1000), // 1000 אחרונים
      userBehavior: this.userBehaviorData.slice(-100), // 100 אחרונים
      alerts: this.systemAlerts.slice(-50), // 50 אחרונות
      stats: this.getAnalyticsStats()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // המרה ל-CSV (מיושם פשוט)
    return 'CSV export not implemented yet';
  }
}

// יצירת instance יחיד
export const advancedAnalytics = new AdvancedAnalytics();