import { AppSetting } from '@terencio/domain';
import { BaseRepository } from '../base.repository';
import { db } from '../db';

export class AppSettingsRepository extends BaseRepository<AppSetting> {
  constructor() {
    super('app_settings');
  }

  get(key: string): string | null {
    if (!db) throw new Error('DB not initialized');
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as AppSetting;
    return row ? row.value : null;
  }

  set(key: string, value: string, description?: string): void {
    if (!db) throw new Error('DB not initialized');
    const stmt = db.prepare(`
      INSERT INTO app_settings (key, value, description) 
      VALUES (?, ?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, description = excluded.description
    `);
    stmt.run(key, value, description || null);
  }
}

export const AppSettings = new AppSettingsRepository();
