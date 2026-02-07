import {
    AppSetting,
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
// TAX (Synced from backend)
// ==================================================================================
export class SqliteTaxRepository extends SqliteBaseRepository<Tax> implements ITaxRepository {
  protected tableName = 'taxes';
  protected primaryKey = 'id';

  async findAllActive(): Promise<Tax[]> {
    const stmt = this.getDb().prepare('SELECT * FROM taxes WHERE active = 1');
    return stmt.all() as Tax[];
  }

  async findDefault(): Promise<Tax | null> {
    const stmt = this.getDb().prepare('SELECT * FROM taxes WHERE active = 1 LIMIT 1');
    return (stmt.get() as Tax) || null;
  }
}

// ==================================================================================
// TARIFF (Synced from backend)
// ==================================================================================
export class SqliteTariffRepository extends SqliteBaseRepository<Tariff> implements ITariffRepository {
  protected tableName = 'tariffs';
  protected primaryKey = 'id';

  async findAllActive(): Promise<Tariff[]> {
    const stmt = this.getDb().prepare('SELECT * FROM tariffs WHERE active = 1 ORDER BY priority DESC');
    return stmt.all() as Tariff[];
  }
}

// ==================================================================================
// PROMOTION (Synced from backend)
// ==================================================================================
export class SqlitePromotionRepository extends SqliteBaseRepository<Promotion> implements IPromotionRepository {
  protected tableName = 'promotions';
  protected primaryKey = 'id';

  async findAllActive(): Promise<Promotion[]> {
    const now = new Date().toISOString();
    const stmt = this.getDb().prepare(`
      SELECT * FROM promotions 
      WHERE active = 1 
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

  async getAll(): Promise<AppSetting[]> {
    const stmt = this.getDb().prepare('SELECT * FROM app_settings');
    return stmt.all() as AppSetting[];
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

  async getNextValue(series: string, year: number): Promise<number> {
    const stmt = this.getDb().prepare(`
      INSERT INTO doc_sequences (series, year, current_value)
      VALUES (@series, @year, 1)
      ON CONFLICT(series, year) DO UPDATE SET
      current_value = current_value + 1
      RETURNING current_value
    `);
    
    const result = stmt.get({ series, year }) as { current_value: number };
    return result.current_value;
  }

  async getCurrentValue(series: string, year: number): Promise<number> {
     const stmt = this.getDb().prepare('SELECT current_value FROM doc_sequences WHERE series = ? AND year = ?');
     const result = stmt.get(series, year) as { current_value: number } | undefined;
     return result ? result.current_value : 0;
  }
}