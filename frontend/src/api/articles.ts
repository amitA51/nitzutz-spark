import apiClient from './client';

export interface Article {
  id: string;
  title: string;
  content: string;
  author?: string;
  sourceUrl?: string;
  category: string;
  publishedAt?: string;
  imageUrl?: string;
  excerpt?: string;
  readTime?: number;
  createdAt: string;
  updatedAt: string;
  isSaved: boolean;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchResponse {
  articles: Article[];
  count: number;
  query: string;
}

export const articlesAPI = {
  /**
   * Get paginated articles with optional category filter
   * includeContent defaults to true to preserve current UI behavior.
   */
  getAll: async (page: number = 1, limit: number = 10, category?: string, includeContent: boolean = true): Promise<ArticlesResponse> => {
    const params: any = { page, limit, includeContent: includeContent ? 1 : 0 };
    if (category) params.category = category;

    const response = await apiClient.get<ArticlesResponse>('/articles', { params });
    return response.data;
  },

  /**
   * Get single article by ID
   */
  getById: async (id: string): Promise<Article> => {
    const response = await apiClient.get<Article>(`/articles/${id}`);
    return response.data;
  },

  /**
   * Create new article
   */
  create: async (data: Partial<Article>): Promise<Article> => {
    const response = await apiClient.post<Article>('/articles', data);
    return response.data;
  },

  /**
   * Search articles
   */
  search: async (query: string): Promise<SearchResponse> => {
    const response = await apiClient.get<SearchResponse>('/articles/search', {
      params: { q: query },
    });
    return response.data;
  },

  /**
   * Get all unique categories
   */
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/articles/categories/list');
    return response.data;
  },

  /**
   * Seed dummy articles for demo
   */
  seedDummyArticles: async (): Promise<{ message: string; count: number }> => {
    const response = await apiClient.post('/articles/seed');
    return response.data;
  },
};
