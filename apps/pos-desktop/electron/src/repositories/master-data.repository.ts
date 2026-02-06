import {
    AppSettings,
    IAppSettingsRepository,
    IDocumentSequenceRepository,
    IPromotionRepository,
    ITariffRepository,
    ITaxRepository,
    Promotion,
    Tariff,
    Tax
} from '@terencio/domain';
import { db } from '../db/db';
import { SqliteBaseRepository } from './base.repository';

// ==================================================================================
// TAX
// ==================================================================================
export class SqliteTaxRepository extends SqliteBaseRepository<Tax> implements ITaxRepository {
  protected tableName = 'taxes';
  protected primaryKey = 'uuid';

  async findAllActive(): Promise<Tax[]> {
    const stmt = this.getDb().prepare('SELECT * FROM taxes WHERE active = 1 AND deleted_at IS NULL');
    return stmt.all() as Tax[];
  }

  async findDefault(): Promise<Tax | null> {
    const stmt = this.getDb().prepare('SELECT * FROM taxes WHERE is_default = 1 AND active = 1 AND deleted_at IS NULL LIMIT 1');
    return (stmt.get() as Tax) || null;
  }
}

// ==================================================================================
// TARIFF
// ==================================================================================
export class SqliteTariffRepository extends SqliteBaseRepository<Tariff> implements ITariffRepository {
  protected tableName = 'tariffs';
  protected primaryKey = 'uuid';

  async findAllActive(): Promise<Tariff[]> {
    const stmt = this.getDb().prepare('SELECT * FROM tariffs WHERE active = 1 AND deleted_at IS NULL ORDER BY priority DESC');
    return stmt.all() as Tariff[];
  }
}

// ==================================================================================
// PROMOTION
// ==================================================================================
export class SqlitePromotionRepository extends SqliteBaseRepository<Promotion> implements IPromotionRepository {
  protected tableName = 'promotions';
  protected primaryKey = 'uuid';

  async findAllActive(): Promise<Promotion[]> {
    const now = new Date().toISOString(); // Simple string compare works for ISO
    // Check dates if present (NULL means infinite)
    const stmt = this.getDb().prepare(`
      SELECT * FROM promotions 
      WHERE active = 1 
      AND deleted_at IS NULL
      AND (start_date IS NULL OR start_date <= ?)
      AND (end_date IS NULL OR end_date >= ?)
      ORDER BY priority DESC
    `);
    return stmt.all(now, now) as Promotion[];
  }
}

// ==================================================================================
// APP SETTINGS
// ==================================================================================
export class SqliteAppSettingsRepository implements IAppSettingsRepository {
  private getDb() {
    if (!db) throw new Error('Database not initialized');
    return db;
  }

  async getAll(): Promise<AppSettings[]> {
    const stmt = this.getDb().prepare('SELECT * FROM app_settings');
    return stmt.all() as AppSettings[];
  }

  async get(key: string): Promise<string | null> {
    const stmt = this.getDb().prepare('SELECT value FROM app_settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result ? result.value : null;
  }

  async set(key: string, value: string, description?: string): Promise<void> {
    const stmt = this.getDb().prepare(`
      INSERT INTO app_settings (key, value, description)
      VALUES (@key, @value, @description)
      ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      description = coalesce(excluded.description, app_settings.description)
    `);
    stmt.run({ key, value, description });
  }
}

// ==================================================================================
// DOCUMENT SEQUENCES
// ==================================================================================
export class SqliteDocumentSequenceRepository implements IDocumentSequenceRepository {
  private getDb() {
    if (!db) throw new Error('Database not initialized');
    return db;
  }

  async getNextValue(series: string, deviceId: string): Promise<number> {
    // Determine next value atomically
    // We increment current_value and return it
    // If row doesn't exist, Create it with 1
    
    // SQLite upsert with returning is cleanest
    const stmt = this.getDb().prepare(`
      INSERT INTO document_sequences (series, device_id, current_value)
      VALUES (@series, @deviceId, 1)
      ON CONFLICT(series, device_id) DO UPDATE SET
      current_value = current_value + 1
      RETURNING current_value
    `);
    
    const result = stmt.get({ series, deviceId }) as { current_value: number };
    return result.current_value;
  }

  async getCurrentValue(series: string, deviceId: string): Promise<number> {
     const stmt = this.getDb().prepare('SELECT current_value FROM document_sequences WHERE series = ? AND device_id = ?');
     const result = stmt.get(series, deviceId) as { current_value: number } | undefined;
     return result ? result.current_value : 0;
  }
}
