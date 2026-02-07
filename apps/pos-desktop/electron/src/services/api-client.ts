import { config } from '../config';

/**
 * API Client for backend communication
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.timeout = config.apiTimeout;
  }

  /**
   * Make a POST request to the backend
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      this.handleError(error);
    }
  }

  /**
   * Make a GET request to the backend
   */
  async get<T>(endpoint: string): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      this.handleError(error);
    }
  }

  /**
   * Handle and format errors
   */
  private handleError(error: any): never {
    console.error('API Error:', error);
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('An unexpected error occurred while communicating with the server');
  }
}
