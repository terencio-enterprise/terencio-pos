import { PosConfig } from '@terencio/domain';
import { db } from '../db/db';

export class SqlitePOSConfigRepository {
  async getConfiguration(): Promise<PosConfig | null> {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare('SELECT * FROM pos_config WHERE id = 1');
    const result = stmt.get() as PosConfig | undefined;
    return result || null;
  }

  async saveConfiguration(config: PosConfig): Promise<void> {
    if (!db) throw new Error('Database not initialized');
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
  }

  async updateLastSync(): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare('UPDATE pos_config SET updated_at = ? WHERE id = 1');
    stmt.run(new Date().toISOString());
  }

  async isRegistered(): Promise<boolean> {
    const config = await this.getConfiguration();
    return config !== null && config.license_key !== null; 
  }
}