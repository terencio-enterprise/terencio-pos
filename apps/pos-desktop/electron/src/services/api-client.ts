import { net } from 'electron';
import { config } from '../config';

export class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use the config or fallback to localhost for dev
    this.baseUrl = config.apiBaseUrl || 'http://localhost:8080';
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'POST',
        url: `${this.baseUrl}${endpoint}`,
      });

      request.setHeader('Content-Type', 'application/json');

      request.on('response', (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk.toString();
        });

        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Invalid JSON response from server'));
            }
          } else {
            try {
              const error = JSON.parse(data);
              reject(new Error(error.message || `HTTP Error ${response.statusCode}`));
            } catch {
              reject(new Error(`HTTP Error ${response.statusCode}`));
            }
          }
        });

        response.on('error', (error: any) => {
          reject(error);
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.write(JSON.stringify(body));
      request.end();
    });
  }
}