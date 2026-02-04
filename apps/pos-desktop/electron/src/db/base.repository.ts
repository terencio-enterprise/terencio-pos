import { RunResult } from 'better-sqlite3';
import { db } from './db';

export abstract class BaseRepository<T> {
  constructor(protected readonly tableName: string) {}

  findAll(): T[] {
    if (!db) throw new Error('DB not initialized');
    return db.prepare(`SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`).all() as T[];
  }

  findById(uuid: string): T | undefined {
    if (!db) throw new Error('DB not initialized');
    return db.prepare(`SELECT * FROM ${this.tableName} WHERE uuid = ?`).get(uuid) as T;
  }

  create(data: T): RunResult {
    if (!db) throw new Error('DB not initialized');
    
    // We filter out any keys that might not exist in the DB columns if strictly mapped,
    // but usually 'data' should match the table schema.
    const keys = Object.keys(data as object);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    return db.prepare(sql).run(...Object.values(data as object));
  }
  
  update(uuid: string, data: Partial<T>): RunResult {
    if (!db) throw new Error('DB not initialized');
    
    const keys = Object.keys(data as object);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = Object.values(data as object);
    
    const sql = `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE uuid = ?`;
    return db.prepare(sql).run(...values, uuid);
  }

  softDelete(uuid: string): RunResult {
    if (!db) throw new Error('DB not initialized');
    return db.prepare(`UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE uuid = ?`).run(uuid);
  }
}
