import { PosConfig } from '@terencio/domain';
import { db } from '../db/db';

/**
 * Repository for POS Configuration
 */
export class SqlitePOSConfigRepository {
  /**
   * Get the current POS configuration
   */
  async getConfiguration(): Promise<PosConfig | null> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = db.prepare('SELECT * FROM pos_config WHERE id = 1');
      const result = stmt.get() as PosConfig | undefined;
      return result || null;
    } catch (error) {
      console.error('Error getting POS configuration:', error);
      throw error;
    }
  }

  /**
   * Save POS configuration from registration
   */
  async saveConfiguration(config: PosConfig): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO pos_config
        (id, pos_uuid, pos_serial_code, store_id, license_key, verifactu_enabled, test_mode, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        config.pos_uuid,
        config.pos_serial_code,
        config.store_id,
        config.license_key,
        config.verifactu_enabled,
        config.test_mode,
        config.updated_at
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
        UPDATE pos_config
        SET updated_at = ?
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
