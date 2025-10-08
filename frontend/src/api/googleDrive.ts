import apiClient from './client';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  thumbnailLink?: string;
  description?: string;
}

export interface GoogleDriveFilesResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

export interface GoogleDriveStatus {
  connected: boolean;
  hasTokens: boolean;
}

export interface FileAnalysis {
  fileId: string;
  fileName: string;
  analysisType: string;
  analysis: {
    summary: string;
    keyTopics?: string[];
    difficulty?: string;
    estimatedTime?: string;
    learningPath?: Array<{
      step: number;
      title: string;
      description: string;
      duration: string;
    }>;
    prerequisites?: string[];
    relatedTopics?: string[];
  };
}

export const googleDriveAPI = {
  /**
   * Get OAuth URL to initiate Google Drive connection
   */
  getAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response = await apiClient.get('/google-drive/auth/url');
    return response.data;
  },

  /**
   * Check if Google Drive is connected
   */
  getStatus: async (): Promise<GoogleDriveStatus> => {
    const response = await apiClient.get('/google-drive/status');
    return response.data;
  },

  /**
   * Disconnect Google Drive
   */
  disconnect: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/google-drive/disconnect');
    return response.data;
  },

  /**
   * List files from Google Drive
   */
  listFiles: async (params?: {
    pageToken?: string;
    search?: string;
  }): Promise<GoogleDriveFilesResponse> => {
    const response = await apiClient.get('/google-drive/files', { params });
    return response.data;
  },

  /**
   * Get recent documents
   */
  getRecentFiles: async (): Promise<GoogleDriveFilesResponse> => {
    const response = await apiClient.get('/google-drive/files/recent');
    return response.data;
  },

  /**
   * Get file content
   */
  getFileContent: async (fileId: string): Promise<{
    metadata: GoogleDriveFile;
    content: string;
  }> => {
    const response = await apiClient.get(`/google-drive/files/${fileId}/content`);
    return response.data;
  },

  /**
   * Analyze file with AI
   */
  analyzeFile: async (
    fileId: string,
    analysisType: 'learning-plan' | 'summary' = 'learning-plan'
  ): Promise<FileAnalysis> => {
    const response = await apiClient.post(`/google-drive/files/${fileId}/analyze`, {
      analysisType,
    });
    return response.data;
  },

  /**
   * Ask AI about a Google Drive file before import
   */
  askAboutFile: async (
    fileId: string,
    question: string,
  ): Promise<{ answer: string }> => {
    const response = await apiClient.post(`/google-drive/files/${fileId}/ask`, { question });
    return response.data;
  },

  /**
   * Open Google Drive auth in popup and handle callback
   */
  connectWithPopup: async (): Promise<boolean> => {
    try {
      // Get auth URL
      const { authUrl } = await googleDriveAPI.getAuthUrl();

      // Open popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'Google Drive Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Failed to open popup. Please allow popups for this site.');
      }

      // Wait for popup to close or redirect
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          try {
            // Check if popup closed
            if (popup.closed) {
              clearInterval(checkInterval);
              // Check connection status
              googleDriveAPI.getStatus()
                .then(status => resolve(status.connected))
                .catch(() => resolve(false));
            }

            // Try to check if popup redirected to our domain
            try {
              if (popup.location.href.includes(window.location.origin)) {
                popup.close();
                clearInterval(checkInterval);
                resolve(true);
              }
            } catch {
              // Cross-origin error is expected when on Google's domain
            }
          } catch (error) {
            clearInterval(checkInterval);
            reject(error);
          }
        }, 500);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Authentication timeout'));
        }, 5 * 60 * 1000);
      });
    } catch (error) {
      console.error('Failed to connect Google Drive:', error);
      throw error;
    }
  },
};
