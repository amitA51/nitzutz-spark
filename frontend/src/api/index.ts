/**
 * Central API exports
 * Import from this file in your components:
 * import { articlesAPI, booksAPI } from '@/api';
 */

export { articlesAPI } from './articles';
export { booksAPI, summariesAPI } from './books';
export { googleDriveAPI } from './googleDrive';
export { insightsAPI } from './insights';
export { default as apiClient } from './client';

// Re-export types for convenience
export type { Article, ArticlesResponse, SearchResponse } from './articles';
export type { Book, Summary } from './books';
export type { GoogleDriveFile, GoogleDriveFilesResponse, GoogleDriveStatus } from './googleDrive';
export type { Insight, InsightsResponse } from './insights';
