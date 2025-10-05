import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GoogleDriveService {
  private oauth2Client: OAuth2Client;
  private drive: drive_v3.Drive | null = null;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth2 URL for user authentication
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
      ],
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    };
  }

  /**
   * Set access token and initialize Drive API
   */
  setAccessToken(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return {
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date,
    };
  }

  /**
   * List files from Google Drive
   * Supports filtering by MIME types for documents
   */
  async listFiles(options: {
    pageSize?: number;
    pageToken?: string;
    query?: string;
    orderBy?: string;
  } = {}) {
    if (!this.drive) {
      throw new Error('Drive API not initialized. Set access token first.');
    }

    const {
      pageSize = 20,
      pageToken,
      query = "mimeType contains 'application/vnd.google-apps' or mimeType contains 'application/pdf' or mimeType contains 'text/'",
      orderBy = 'modifiedTime desc',
    } = options;

    const response = await this.drive.files.list({
      pageSize,
      pageToken,
      q: query,
      orderBy,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, iconLink, webViewLink, thumbnailLink, description)',
    });

    return {
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken,
    };
  }

  /**
   * Get file content by ID
   * Supports Google Docs, Sheets, PDFs, and text files
   */
  async getFileContent(fileId: string, mimeType: string): Promise<string> {
    if (!this.drive) {
      throw new Error('Drive API not initialized');
    }

    let content = '';

    // Handle Google Docs - export as plain text
    if (mimeType === 'application/vnd.google-apps.document') {
      const response = await this.drive.files.export({
        fileId,
        mimeType: 'text/plain',
      }, { responseType: 'text' });
      content = response.data as string;
    }
    // Handle Google Sheets - export as CSV
    else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      const response = await this.drive.files.export({
        fileId,
        mimeType: 'text/csv',
      }, { responseType: 'text' });
      content = response.data as string;
    }
    // Handle PDFs and regular files
    else {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      }, { responseType: 'text' });
      content = response.data as string;
    }

    return content;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string) {
    if (!this.drive) {
      throw new Error('Drive API not initialized');
    }

    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, description, webViewLink, owners, lastModifyingUser',
    });

    return response.data;
  }

  /**
   * Search files by name or content
   */
  async searchFiles(searchTerm: string) {
    const query = `fullText contains '${searchTerm}' and (mimeType contains 'application/vnd.google-apps' or mimeType contains 'application/pdf' or mimeType contains 'text/')`;
    
    return this.listFiles({ query, pageSize: 10 });
  }

  /**
   * Get recent documents (modified in last 30 days)
   */
  async getRecentDocuments() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const query = `modifiedTime > '${thirtyDaysAgo.toISOString()}' and (mimeType contains 'application/vnd.google-apps' or mimeType contains 'application/pdf')`;
    
    return this.listFiles({ query, pageSize: 20 });
  }
}
