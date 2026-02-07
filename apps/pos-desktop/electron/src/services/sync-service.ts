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
   * Preview registration data without saving (for confirmation screen)
   */
  async previewRegistration(code: string): Promise<POSRegistrationResponse> {
    if (!code || code.length !== 6) {
      throw new Error('Registration code must be exactly 6 characters');
    }

    try {
      // TODO: CHECK API CALL LATER - UNCOMMENT REAL API INTEGRATION WHEN BACKEND IS READY
      /*
      const response = await this.apiClient.post<POSRegistrationResponse>('/api/v1/pos/preview', {
        registrationCode: code.toUpperCase(),
      });
      */

      const saltRounds = 10;
      const defaultPin = '123456';
      const pinHash = await bcrypt.hash(defaultPin, saltRounds);

      // TODO: REMOVE MOCK DATA ONCE API IS CONNECTED
      // Mock delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1200));

      const response: POSRegistrationResponse = {
        posId: `pos-${code.toLowerCase()}`,
        posName: `Terminal ${code.substring(0, 3)}`,
        storeId: `store-${code.substring(3)}`,
        storeName: 'Main Store Location',
        deviceId: `DEV-${code}`,
        users: [
          {
            uuid: `user-${code}`,
            username: 'admin',
            full_name: 'Administrator',
            role: 'ADMIN',
            pin_hash: pinHash,
            is_active: 1,
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            uuid: `user-${code}-2`,
            username: 'cashier',
            full_name: 'Cashier User',
            role: 'CASHIER',
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

      console.log('✅ Preview data fetched:', response.posName);
      return response;
    } catch (error: any) {
      console.error('❌ Preview fetch failed:', error);
      throw new Error(error.message || 'Failed to fetch registration preview');
    }
  }

  /**
   * Register POS and save configuration (call after preview confirmation)
   */
  async registerPOS(registrationData: POSRegistrationResponse, code: string): Promise<void> {
    try {
      // Save users to local database
      await this.saveUsers(registrationData.users);

      console.log('✅ POS registered successfully:', registrationData.posName);
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
