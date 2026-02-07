import {
    IProductPriceRepository,
    IProductRepository,
    Product,
    ProductPrice
} from '@terencio/domain';
import { db } from '../db/db';
import { SqliteBaseRepository } from './base.repository';

export class SqliteProductRepository extends SqliteBaseRepository<Product> implements IProductRepository {
  protected tableName = 'products';
  protected primaryKey = 'id';

  async findByBarcode(barcode: string): Promise<Product | null> {
    const stmt = this.getDb().prepare('SELECT * FROM products WHERE barcode = ?');
    return (stmt.get(barcode) as Product) || null;
  }

  async findByReference(reference: string): Promise<Product | null> {
    const stmt = this.getDb().prepare('SELECT * FROM products WHERE reference = ?');
    return (stmt.get(reference) as Product) || null;
  }

  async search(query: string): Promise<Product[]> {
    const likeQuery = `%${query}%`;
    const stmt = this.getDb().prepare(`
      SELECT * FROM products 
      WHERE (name LIKE ? OR barcode LIKE ? OR reference LIKE ?)
      AND deleted_at IS NULL
    `);
    return stmt.all(likeQuery, likeQuery, likeQuery) as Product[];
  }

  async findAllActive(): Promise<Product[]> {
    const stmt = this.getDb().prepare('SELECT * FROM products WHERE active = 1 AND deleted_at IS NULL');
    return stmt.all() as Product[];
  }

  async delete(id: string | number): Promise<void> {
    const stmt = this.getDb().prepare('UPDATE products SET deleted_at = CURRENT_TIMESTAMP, active = 0 WHERE id = ?');
    stmt.run(id);
  }
}

export class SqliteProductPriceRepository implements IProductPriceRepository {
  private getDb() {
    if (!db) throw new Error('Database not initialized');
    return db;
  }

  async findByProduct(productId: number): Promise<ProductPrice[]> {
    const stmt = this.getDb().prepare('SELECT * FROM product_prices WHERE product_id = ?');
    return stmt.all(productId) as ProductPrice[];
  }

  async findByTariff(tariffId: number): Promise<ProductPrice[]> {
    const stmt = this.getDb().prepare('SELECT * FROM product_prices WHERE tariff_id = ?');
    return stmt.all(tariffId) as ProductPrice[];
  }

  async getPrice(productId: number, tariffId: number): Promise<ProductPrice | null> {
    const stmt = this.getDb().prepare('SELECT * FROM product_prices WHERE product_id = ? AND tariff_id = ?');
    return (stmt.get(productId, tariffId) as ProductPrice) || null;
  }

  async setPrice(price: ProductPrice): Promise<void> {
    const stmt = this.getDb().prepare(`
      INSERT INTO product_prices (product_id, tariff_id, price, updated_at) 
      VALUES (@product_id, @tariff_id, @price, CURRENT_TIMESTAMP)
      ON CONFLICT(product_id, tariff_id) DO UPDATE SET
      price = excluded.price,
      updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(price);
  }
}
