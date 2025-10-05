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

export const aiContentAPI = {
  /**
   * Generate new articles based on Google Drive content
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
   * Generate articles based on topics only (without Google Drive)
   */
  generateByTopics: async (options: GenerateContentOptions = {}): Promise<GenerateResponse> => {
    const response = await apiClient.post<GenerateResponse>(
      '/ai-content/generate-by-topics',
      options
    );
    return response.data;
  },
};
