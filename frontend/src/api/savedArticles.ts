import apiClient from './client';
import type { Article } from './articles';

export interface SavedArticle {
  id: string;
  articleId: string;
  notes?: string | null;
  tags?: string | null;
  savedAt: string;
  article?: Article;
}

export const savedArticlesAPI = {
  getAll: async (): Promise<SavedArticle[]> => {
    const res = await apiClient.get<SavedArticle[]>('/saved-articles');
    return res.data;
  },
  save: async (articleId: string, data?: { notes?: string; tags?: string }): Promise<SavedArticle> => {
    const res = await apiClient.post<SavedArticle>('/saved-articles', { articleId, ...(data || {}) });
    return res.data;
  },
  update: async (articleId: string, updates: { notes?: string; tags?: string }): Promise<SavedArticle> => {
    const res = await apiClient.put<SavedArticle>(`/saved-articles/${articleId}`, updates);
    return res.data;
  },
  remove: async (articleId: string): Promise<void> => {
    await apiClient.delete(`/saved-articles/${articleId}`);
  },
  getByArticleId: async (articleId: string): Promise<SavedArticle> => {
    const res = await apiClient.get<SavedArticle>(`/saved-articles/${articleId}`);
    return res.data;
  },
};
