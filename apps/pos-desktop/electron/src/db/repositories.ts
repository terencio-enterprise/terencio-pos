import {
  Product,
  Sale,
  User
} from '@terencio/domain';
import { RunResult } from 'better-sqlite3';
import { db } from '../../db';

// ==========================================
// Base Generic Repository
// ==========================================
export class BaseRepository<T> {
  constructor(private readonly tableName: string) {}

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
    
    const keys = Object.keys(data as object);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    return db.prepare(sql).run(...Object.values(data as object));
  }
  
  softDelete(uuid: string): RunResult {
    if (!db) throw new Error('DB not initialized');
    return db.prepare(`UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE uuid = ?`).run(uuid);
  }
}

// ==========================================
// Specific Repositories
// ==========================================

export class ProductRepository extends BaseRepository<Product> {
  constructor() { super('products'); }

  // Example: Custom query specific to Products
  findByBarcode(barcode: string): Product | undefined {
    if (!db) throw new Error('DB not initialized');
    return db.prepare('SELECT * FROM products WHERE barcode = ? AND deleted_at IS NULL').get(barcode) as Product;
  }

  search(query: string): Product[] {
    if (!db) throw new Error('DB not initialized');
    const term = `%${query}%`;
    return db.prepare(`
      SELECT * FROM products 
      WHERE (name LIKE ? OR barcode LIKE ? OR reference LIKE ?) 
      AND deleted_at IS NULL
    `).all(term, term, term) as Product[];
  }
}

export class UserRepository extends BaseRepository<User> {
  constructor() { super('users'); }
  
  findByUsername(username: string): User | undefined {
    if (!db) throw new Error('DB not initialized');
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User;
  }
}

export class SaleRepository extends BaseRepository<Sale> {
  constructor() { super('sales'); }

  // Complex transaction example
  createSaleWithLines(sale: Sale, lines: any[]): void {
    if (!db) throw new Error('DB not initialized');

    const insertSale = db.prepare(`
      INSERT INTO sales (uuid, doc_number, user_uuid, total_amount, total_net, total_taxes)
      VALUES (@uuid, @doc_number, @user_uuid, @total_amount, @total_net, @total_taxes)
    `);

    const insertLine = db.prepare(`
      INSERT INTO sale_lines (uuid, sale_uuid, product_name, quantity, unit_price, total_line, tax_rate)
      VALUES (@uuid, @sale_uuid, @product_name, @quantity, @unit_price, @total_line, @tax_rate)
    `);

    const createTransaction = db.transaction((saleData, linesData) => {
      insertSale.run(saleData);
      for (const line of linesData) insertLine.run(line);
    });

    createTransaction(sale, lines);
  }
}

// ==========================================
// Singleton Exports
// ==========================================
export const Products = new ProductRepository();
export const Users = new UserRepository();
export const Sales = new SaleRepository();