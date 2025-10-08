import apiClient from './client';

export interface Insight {
  id: string;
  type: 'weekly_summary' | 'connection' | 'recommendation' | 'question';
  title: string;
  content: string;
  sources: string; // JSON
  createdAt: string;
  viewed: boolean;
}

export interface InsightsResponse {
  insights: Insight[];
  unviewedCount: number;
}

export const insightsAPI = {
  async getAll(): Promise<InsightsResponse> {
    const res = await apiClient.get<InsightsResponse>('/insights');
    return res.data;
  },
  async markAsViewed(id: string): Promise<void> {
    await apiClient.put(`/insights/${id}/view`);
  },
  async dismiss(id: string): Promise<void> {
    await apiClient.delete(`/insights/${id}`);
  },
  async generateManually(): Promise<void> {
    await apiClient.post('/insights/generate');
  },
};
