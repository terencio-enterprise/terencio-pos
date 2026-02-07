import { IBaseRepository } from '@terencio/domain';
import { Database } from 'better-sqlite3';
import { db } from '../db/db';

export abstract class SqliteBaseRepository<T> implements IBaseRepository<T> {
  protected abstract tableName: string;
  protected abstract primaryKey: string;

  protected getDb(): Database {
    if (!db) {
      throw new Error('Database not initialized');
    }
    return db;
  }

  async findAll(): Promise<T[]> {
    const stmt = this.getDb().prepare(`SELECT * FROM ${this.tableName}`);
    return stmt.all() as T[];
  }

  async findById(id: string | number): Promise<T | null> {
    const stmt = this.getDb().prepare(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`);
    const result = stmt.get(id);
    return (result as T) || null;
  }

  async create(data: T): Promise<void> {
    const keys = Object.keys(data as any);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(data as any);

    const stmt = this.getDb().prepare(`INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`);
    stmt.run(...values);
  }

  async update(id: string | number, data: Partial<T>): Promise<void> {
    const keys = Object.keys(data);
    if (keys.length === 0) return;

    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const stmt = this.getDb().prepare(`UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`);
    stmt.run(...values);
  }

  async delete(id: string | number): Promise<void> {
    const stmt = this.getDb().prepare(`DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`);
    stmt.run(id);
  }

  // Helper for soft delete if needed, though interface says delete
  async softDelete(id: string): Promise<void> {
     // Check if 'deleted_at' column exists or assume it does for entities that need it
     // For now, implementing generic delete as hard delete based on interface, 
     // but specific repos can override.
     try {
       const stmt = this.getDb().prepare(`UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE ${this.primaryKey} = ?`);
       stmt.run(id);
     } catch (error) {
       // Fallback or error if column doesn't exist. 
       // Ideally we check schema or explicit configuration.
       console.warn(`Soft delete failed for ${this.tableName}, falling back to hard delete? No, strictly following schema.`);
     }
  }
}
