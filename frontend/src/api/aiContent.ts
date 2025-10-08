import apiClient from './client';

export interface GenerateContentOptions {
  topics?: string[];
  count?: number;
  level?: 'קל' | 'בינוני' | 'מתקדם';
}

export interface GeneratedArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  readTime: string;
  createdAt: string;
}

export interface GenerateResponse {
  success: boolean;
  message: string;
  articles: GeneratedArticle[];
  analyzed?: {
    documentsCount: number;
    existingArticlesCount: number;
  };
}

export interface UserProfile {
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  contentStyle: 'practical' | 'theoretical' | 'mixed';
  topCategories: Array<{ category: string; score: number }>;
  interactionPatterns: {
    readingTime: 'quick' | 'detailed' | 'mixed';
    questionTypes: string[];
    saveFrequency: number;
  };
  preferredTopics: string[];
}

export interface ProfileResponse {
  success: boolean;
  profile: UserProfile;
  recommendations: string[];
  message: string;
}

export interface InsightResponse {
  success: boolean;
  insights: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    createdAt: string;
    metadata?: string;
  }>;
  count: number;
  message: string;
}

export const aiContentAPI = {
  /**
   * Generate smart personalized content using advanced AI
   */
  generateSmart: async (options: GenerateContentOptions = {}): Promise<GenerateResponse> => {
    const response = await apiClient.post<GenerateResponse>(
      '/ai-content/generate-smart',
      options
    );
    return response.data;
  },

  /**
   * Get detailed user profile analysis
   */
  getUserProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>(
      '/ai-content/user-profile'
    );
    return response.data;
  },

  /**
   * Generate mentor insights manually
   */
  generateMentorInsights: async (): Promise<InsightResponse> => {
    const response = await apiClient.post<InsightResponse>(
      '/ai-content/generate-mentor-insights'
    );
    return response.data;
  },

  /**
   * Analyze Google Drive documents with advanced AI
   */
  analyzeDriveAdvanced: async (maxDocs: number = 15): Promise<any> => {
    const response = await apiClient.post(
      '/ai-content/analyze-drive-advanced',
      { maxDocs }
    );
    return response.data;
  },

  /**
   * Generate daily automated content
   */
  generateDaily: async (): Promise<any> => {
    const response = await apiClient.post(
      '/ai-content/generate-daily'
    );
    return response.data;
  },

  /**
   * LEGACY: Generate new articles based on Google Drive content
   * Analyzes user's Drive documents to create personalized content
   */
  generateFromDrive: async (options: GenerateContentOptions = {}): Promise<GenerateResponse> => {
    const response = await apiClient.post<GenerateResponse>(
      '/ai-content/generate-from-drive',
      options
    );
    return response.data;
  },

  /**
   * LEGACY: Generate articles based on topics only (without Google Drive)
   */
  generateByTopics: async (options: GenerateContentOptions = {}): Promise<GenerateResponse> => {
    const response = await apiClient.post<GenerateResponse>(
      '/ai-content/generate-by-topics',
      options
    );
    return response.data;
  },
};
