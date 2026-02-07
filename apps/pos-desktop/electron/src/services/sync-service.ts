import { POSRegistrationResponse, User } from '@terencio/domain';
import * as bcrypt from 'bcryptjs';
import { db } from '../db/db';
import { ApiClient } from './api-client';

/**
 * Service for POS synchronization with backend
 */
export class SyncService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Register POS with backend using 6-letter code
   */
  async registerPOS(code: string): Promise<POSRegistrationResponse> {
    if (!code || code.length !== 6) {
      throw new Error('Registration code must be exactly 6 characters');
    }

    try {
      // TODO: CHECK API CALL LATER - UNCOMMENT REAL API INTEGRATION WHEN BACKEND IS READY
      /*
      const response = await this.apiClient.post<POSRegistrationResponse>('/api/v1/pos/register', {
        registrationCode: code.toUpperCase(),
      });
      */

      
  const saltRounds = 10;
  const defaultPin = '123456';
  const pinHash = await bcrypt.hash(defaultPin, saltRounds);

      // TODO: REMOVE MOCK DATA ONCE API IS CONNECTED
      // Mock delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response: POSRegistrationResponse = {
        posId: 'mock-pos-id-123',
        posName: 'Terencio POS (Mock)',
        storeId: 'mock-store-id-456',
        storeName: 'Mock Store Location',
        deviceId: 'MOCK-DEVICE-001',
        users: [
          {
            uuid: 'mock-user-1',
            username: 'admin',
            full_name: 'Admin User',
            role: 'admin',
            // bcrypt hash for "123456"
            pin_hash: pinHash,
            is_active: 1,
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      };

      // Validate response
      if (!response.posId || !response.deviceId || !response.users) {
        throw new Error('Invalid response from server');
      }

      // Save users to local database
      await this.saveUsers(response.users);

      console.log('✅ POS registered successfully (MOCKED):', response.posName);
      return response;
    } catch (error: any) {
      console.error('❌ POS registration failed:', error);
      throw new Error(error.message || 'Failed to register POS');
    }
  }

  /**
   * Save users from backend to local database
   */
  private async saveUsers(users: User[]): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO users (uuid, username, pin_hash, full_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((users: User[]) => {
        for (const user of users) {
          insertStmt.run(
            user.uuid,
            user.username,
            user.pin_hash,
            user.full_name,
            user.role,
            user.is_active ?? 1,
            user.created_at || new Date().toISOString(),
            user.updated_at || new Date().toISOString()
          );
        }
      });

      transaction(users);
      console.log(`✅ Saved ${users.length} users to local database`);
    } catch (error) {
      console.error('❌ Failed to save users:', error);
      throw new Error('Failed to save users to local database');
    }
  }

  /**
   * Sync data from backend (for future use)
   */
  async syncData(): Promise<void> {
    // TODO: Implement periodic sync for products, customers, etc.
    console.log('🔄 Data sync not yet implemented');
  }
}
