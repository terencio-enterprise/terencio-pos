import { POSConfiguration } from '@terencio/domain';
import { db } from '../db/db';

/**
 * Repository for POS Configuration
 */
export class SqlitePOSConfigRepository {
  /**
   * Get the current POS configuration
   */
  async getConfiguration(): Promise<POSConfiguration | null> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = db.prepare('SELECT * FROM pos_configuration WHERE id = 1');
      const result = stmt.get() as POSConfiguration | undefined;
      return result || null;
    } catch (error) {
      console.error('Error getting POS configuration:', error);
      throw error;
    }
  }

  /**
   * Save POS configuration from registration
   */
  async saveConfiguration(config: POSConfiguration): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO pos_configuration
        (id, pos_id, pos_name, store_id, store_name, device_id, registration_code, registered_at, is_active)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        config.pos_id,
        config.pos_name,
        config.store_id,
        config.store_name,
        config.device_id,
        config.registration_code || null,
        config.registered_at,
        config.is_active ?? 1
      );

      console.log('✅ POS configuration saved');
    } catch (error) {
      console.error('Error saving POS configuration:', error);
      throw error;
    }
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = db.prepare(`
        UPDATE pos_configuration
        SET last_sync_at = ?
        WHERE id = 1
      `);

      stmt.run(new Date().toISOString());
      console.log('✅ Last sync timestamp updated');
    } catch (error) {
      console.error('Error updating last sync:', error);
      throw error;
    }
  }

  /**
   * Check if POS is registered
   */
  async isRegistered(): Promise<boolean> {
    const config = await this.getConfiguration();
    return config !== null && config.is_active === 1;
  }
}
