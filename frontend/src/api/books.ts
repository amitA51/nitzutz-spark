import apiClient from './client';

export interface Book {
  id: string;
  bookTitle: string;
  currentPage: number;
  totalPages?: number;
  author?: string;
  isbn?: string;
  createdAt: string;
  updatedAt: string;
  summaries?: Summary[];
}

export interface Summary {
  id: string;
  bookId: string;
  content: string;
  chapterNumber?: number;
  chapterTitle?: string;
  pageRange?: string;
  createdAt: string;
  updatedAt: string;
}

export const booksAPI = {
  /**
   * Get all books
   */
  getAll: async (): Promise<Book[]> => {
    const response = await apiClient.get<Book[]>('/books');
    return response.data;
  },

  /**
   * Import from Google Drive
   */
  importFromGoogleDrive: async (
    fileId: string, 
    metadata: {
      bookTitle?: string;
      bookAuthor?: string;
      tags?: string[];
    }
  ) => {
    const response = await apiClient.post(`/google-drive/import-summary/${fileId}`, metadata);
    return response.data;
  },

  /**
   * Get single book by ID
   */
  getById: async (id: string): Promise<Book> => {
    const response = await apiClient.get<Book>(`/books/${id}`);
    return response.data;
  },

  /**
   * Create new book
   */
  create: async (data: Partial<Book>): Promise<Book> => {
    const response = await apiClient.post<Book>('/books', data);
    return response.data;
  },

  /**
   * Update book
   */
  update: async (id: string, data: Partial<Book>): Promise<Book> => {
    const response = await apiClient.put<Book>(`/books/${id}`, data);
    return response.data;
  },

  /**
   * Delete book
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/books/${id}`);
  },
};

export const summariesAPI = {
  /**
   * Get all summaries for a book
   */
  getByBookId: async (bookId: string): Promise<Summary[]> => {
    const response = await apiClient.get<Summary[]>(`/summaries/book/${bookId}`);
    return response.data;
  },

  /**
   * Get single summary by ID
   */
  getById: async (id: string): Promise<Summary> => {
    const response = await apiClient.get<Summary>(`/summaries/${id}`);
    return response.data;
  },

  /**
   * Create new summary
   */
  create: async (data: Partial<Summary>): Promise<Summary> => {
    const response = await apiClient.post<Summary>('/summaries', data);
    return response.data;
  },

  /**
   * Update summary
   */
  update: async (id: string, data: Partial<Summary>): Promise<Summary> => {
    const response = await apiClient.put<Summary>(`/summaries/${id}`, data);
    return response.data;
  },

  /**
   * Delete summary
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/summaries/${id}`);
  },
};
