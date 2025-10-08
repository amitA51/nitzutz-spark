import { createAIClientFromAny, chatCompletion } from './aiClient';
import { contentCache } from './contentCache';

interface ModelConfig {
  name: string;
  provider: string;
  strengths: string[];
  weaknesses: string[];
  maxTokens: number;
  costPerToken: number;
  speed: 'fast' | 'medium' | 'slow';
  complexity: 'light' | 'medium' | 'heavy';
  languages: string[];
  specialties: string[];
}

interface TaskRequirements {
  taskType: 'content_generation' | 'question_answering' | 'analysis' | 'translation' | 'coding' | 'creative';
  complexity: 'simple' | 'medium' | 'complex';
  outputLength: 'short' | 'medium' | 'long';
  language: 'hebrew' | 'english' | 'mixed';
  quality: 'draft' | 'standard' | 'premium';
  urgency: 'low' | 'medium' | 'high';
  context?: string;
}

export class AdaptiveModelSelector {
  private availableModels: ModelConfig[] = [
    {
      name: 'deepseek-ai/DeepSeek-V3.2-Exp',
      provider: 'huggingface',
      strengths: ['reasoning', 'code_generation', 'math', 'analysis'],
      weaknesses: ['creative_writing', 'casual_chat'],
      maxTokens: 8192,
      costPerToken: 0.0001,
      speed: 'medium',
      complexity: 'heavy',
      languages: ['hebrew', 'english'],
      specialties: ['technical_content', 'educational', 'problem_solving']
    },
    {
      name: 'microsoft/DialoGPT-medium',
      provider: 'huggingface',
      strengths: ['conversation', 'quick_responses', 'casual_tone'],
      weaknesses: ['complex_reasoning', 'long_content'],
      maxTokens: 1024,
      costPerToken: 0.00001,
      speed: 'fast',
      complexity: 'light',
      languages: ['english'],
      specialties: ['chat', 'simple_qa']
    },
    {
      name: 'meta-llama/Llama-3.2-11B-Vision',
      provider: 'huggingface',
      strengths: ['multimodal', 'creative_writing', 'storytelling'],
      weaknesses: ['mathematical_reasoning', 'code'],
      maxTokens: 4096,
      costPerToken: 0.00005,
      speed: 'medium',
      complexity: 'medium',
      languages: ['hebrew', 'english'],
      specialties: ['creative_content', 'narrative', 'visual_description']
    }
  ];

  /**
   * בחירת המודל המתאים ביותר למשימה
   */
  async selectBestModel(requirements: TaskRequirements): Promise<ModelConfig> {
    console.log(`🤖 [Adaptive Model] Selecting model for ${requirements.taskType} task...`);
    
    // בדיקת cache למודל שנבחר עבור משימה דומה
    const cacheKey = `selected_model_${JSON.stringify(requirements)}`;
    const cachedSelection = contentCache.get<ModelConfig>(cacheKey);
    if (cachedSelection) {
      console.log(`📦 [Adaptive Model] Using cached model selection: ${cachedSelection.name}`);
      return cachedSelection;
    }

    // חישוב ציון התאמה לכל מודל
    const scoredModels = this.availableModels.map(model => ({
      model,
      score: this.calculateModelScore(model, requirements)
    }));

    // מיון לפי ציון התאמה
    scoredModels.sort((a, b) => b.score - a.score);
    
    const selectedModel = scoredModels[0].model;
    const topScore = scoredModels[0].score;

    console.log(`✅ [Adaptive Model] Selected ${selectedModel.name} with score ${topScore.toFixed(2)}`);
    
    // שמירה בcache לשימוש עתידי (10 דקות)
    contentCache.set(cacheKey, selectedModel, 10 * 60 * 1000);
    
    // לוג ההחלטה לניתוח עתידי
    await this.logModelSelection(requirements, selectedModel, topScore, scoredModels);
    
    return selectedModel;
  }

  /**
   * חישוב ציון התאמה של מודל למשימה
   */
  private calculateModelScore(model: ModelConfig, requirements: TaskRequirements): number {
    let score = 0;
    
    // בדיקת התאמה לסוג המשימה
    score += this.getTaskTypeScore(model, requirements.taskType);
    
    // בדיקת התאמה למורכבות
    score += this.getComplexityScore(model, requirements.complexity);
    
    // בדיקת התאמה לאורך הפלט
    score += this.getOutputLengthScore(model, requirements.outputLength);
    
    // בדיקת התאמה לשפה
    score += this.getLanguageScore(model, requirements.language);
    
    // בדיקת איכות נדרשת vs יכולת המודל
    score += this.getQualityScore(model, requirements.quality);
    
    // בדיקת דחיפות (מהירות)
    score += this.getUrgencyScore(model, requirements.urgency);
    
    // בונוס עבור התמחויות מיוחדות
    score += this.getSpecialtyScore(model, requirements);
    
    return Math.max(0, score);
  }

  private getTaskTypeScore(model: ModelConfig, taskType: string): number {
    const taskToStrengthMap: Record<string, string[]> = {
      'content_generation': ['reasoning', 'creative_writing'],
      'question_answering': ['reasoning', 'quick_responses'],
      'analysis': ['reasoning', 'math', 'analysis'],
      'translation': ['multilingual', 'language'],
      'coding': ['code_generation', 'reasoning'],
      'creative': ['creative_writing', 'storytelling']
    };
    
    const relevantStrengths = taskToStrengthMap[taskType] || [];
    const matchingStrengths = model.strengths.filter(strength => 
      relevantStrengths.includes(strength)
    );
    
    return matchingStrengths.length * 20; // 20 נקודות לכל חוזק רלוונטי
  }

  private getComplexityScore(model: ModelConfig, complexity: string): number {
    const complexityMap: Record<string, number> = { 'simple': 1, 'medium': 2, 'complex': 3 };
    const modelMap: Record<string, number> = { 'light': 1, 'medium': 2, 'heavy': 3 };
    
    const taskComplexity = complexityMap[complexity] || 2;
    const modelComplexity = modelMap[model.complexity] || 2;
    
    // מודלים כבדים טובים למשימות מורכבות, מודלים קלים טובים למשימות פשוטות
    const diff = Math.abs(taskComplexity - modelComplexity);
    return Math.max(0, 30 - diff * 10);
  }

  private getOutputLengthScore(model: ModelConfig, outputLength: string): number {
    const lengthRequirements: Record<string, number> = {
      'short': 500,
      'medium': 2000,
      'long': 8000
    };
    
    const requiredTokens = lengthRequirements[outputLength] || 2000;
    
    if (model.maxTokens >= requiredTokens) {
      return 20;
    } else if (model.maxTokens >= requiredTokens * 0.7) {
      return 10;
    }
    
    return -10; // עונש אם המודל לא יכול לטפל באורך הנדרש
  }

  private getLanguageScore(model: ModelConfig, language: string): number {
    if (model.languages.includes(language)) {
      return 25;
    } else if (language === 'mixed' && model.languages.length > 1) {
      return 20;
    } else if (model.languages.includes('english') && language === 'hebrew') {
      return 5; // ציון נמוך אבל לא אפס
    }
    
    return 0;
  }

  private getQualityScore(model: ModelConfig, quality: string): number {
    const qualityToComplexityMap: Record<string, string> = {
      'draft': 'light',
      'standard': 'medium', 
      'premium': 'heavy'
    };
    
    const neededComplexity = qualityToComplexityMap[quality];
    
    if (model.complexity === neededComplexity) {
      return 30;
    } else if (model.complexity === 'heavy' && quality !== 'draft') {
      return 20; // מודלים כבדים תמיד טובים לאיכות
    }
    
    return 10;
  }

  private getUrgencyScore(model: ModelConfig, urgency: string): number {
    const urgencyToSpeedMap: Record<string, string> = {
      'high': 'fast',
      'medium': 'medium',
      'low': 'slow'
    };
    
    const neededSpeed = urgencyToSpeedMap[urgency];
    
    if (model.speed === neededSpeed) {
      return 20;
    } else if (urgency === 'high' && model.speed === 'fast') {
      return 25; // בונוס עבור מהירות בדחיפות גבוהה
    } else if (urgency === 'low' && model.speed === 'slow') {
      return 15; // לא נורא שהמודל איטי אם אין דחיפות
    }
    
    return 5;
  }

  private getSpecialtyScore(model: ModelConfig, requirements: TaskRequirements): number {
    let score = 0;
    
    // בדיקה אם יש התמחות רלוונטיית במודל
    const context = requirements.context?.toLowerCase() || '';
    
    for (const specialty of model.specialties) {
      if (context.includes(specialty.replace('_', ' '))) {
        score += 15;
      }
    }
    
    // בונוס עבור מודלים חינוכיים אם זה תוכן חינוכי
    if (requirements.taskType === 'content_generation' && 
        model.specialties.includes('educational')) {
      score += 20;
    }
    
    return score;
  }

  /**
   * תיעוד החלטת בחירת המודל לאנליטיקה
   */
  private async logModelSelection(
    requirements: TaskRequirements,
    selectedModel: ModelConfig,
    score: number,
    allScores: Array<{model: ModelConfig, score: number}>
  ): Promise<void> {
    try {
      const logData = {
        timestamp: new Date(),
        requirements,
        selectedModel: selectedModel.name,
        score,
        alternativeModels: allScores.slice(1, 3).map(s => ({
          name: s.model.name,
          score: s.score
        })),
        decisionFactors: {
          taskType: requirements.taskType,
          complexity: requirements.complexity,
          language: requirements.language,
          quality: requirements.quality
        }
      };
      
      console.log('📊 [Adaptive Model] Decision logged:', {
        selected: selectedModel.name,
        score: score.toFixed(2),
        for: requirements.taskType
      });
      
    } catch (error) {
      console.warn('⚠️ [Adaptive Model] Failed to log model selection:', error);
    }
  }

  /**
   * יצירת AI client עם המודל שנבחר
   */
  async createOptimizedAIClient(requirements: TaskRequirements): Promise<any> {
    const selectedModel = await this.selectBestModel(requirements);
    
    // ניתן להרחיב כאן ליצור clients שונים לפי provider
    const client = await createAIClientFromAny();
    
    if (client) {
      // הוספת metadata על המודל שנבחר
      (client as any).selectedModel = selectedModel;
      (client as any).modelName = selectedModel.name;
    }
    
    return client;
  }

  /**
   * קבלת המלצה למודל ללא יצירת client
   */
  async getModelRecommendation(requirements: TaskRequirements): Promise<{
    recommended: ModelConfig;
    alternatives: ModelConfig[];
    reasoning: string[];
  }> {
    const selected = await this.selectBestModel(requirements);
    
    const alternatives = this.availableModels
      .filter(m => m.name !== selected.name)
      .sort((a, b) => this.calculateModelScore(b, requirements) - this.calculateModelScore(a, requirements))
      .slice(0, 2);
    
    const reasoning = [
      `Selected for ${requirements.taskType} with ${requirements.complexity} complexity`,
      `Optimized for ${requirements.language} language`,
      `Quality level: ${requirements.quality}`,
      `Speed requirement: ${requirements.urgency}`,
    ];
    
    return {
      recommended: selected,
      alternatives,
      reasoning
    };
  }
}

// יצירת instance יחיד
export const adaptiveModelSelector = new AdaptiveModelSelector();