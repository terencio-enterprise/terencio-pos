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
  protected primaryKey = 'uuid';

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

  async delete(id: string): Promise<void> {
    const stmt = this.getDb().prepare('UPDATE products SET deleted_at = CURRENT_TIMESTAMP, active = 0 WHERE uuid = ?');
    stmt.run(id);
  }
}

export class SqliteProductPriceRepository implements IProductPriceRepository {
  private getDb() {
    if (!db) throw new Error('Database not initialized');
    return db;
  }

  async findByProduct(productUuid: string): Promise<ProductPrice[]> {
    const stmt = this.getDb().prepare('SELECT * FROM product_prices WHERE product_uuid = ?');
    return stmt.all(productUuid) as ProductPrice[];
  }

  async findByTariff(tariffUuid: string): Promise<ProductPrice[]> {
    const stmt = this.getDb().prepare('SELECT * FROM product_prices WHERE tariff_uuid = ?');
    return stmt.all(tariffUuid) as ProductPrice[];
  }

  async getPrice(productUuid: string, tariffUuid: string): Promise<ProductPrice | null> {
    const stmt = this.getDb().prepare('SELECT * FROM product_prices WHERE product_uuid = ? AND tariff_uuid = ?');
    return (stmt.get(productUuid, tariffUuid) as ProductPrice) || null;
  }

  async setPrice(price: ProductPrice): Promise<void> {
    const stmt = this.getDb().prepare(`
      INSERT INTO product_prices (product_uuid, tariff_uuid, price, updated_at) 
      VALUES (@product_uuid, @tariff_uuid, @price, CURRENT_TIMESTAMP)
      ON CONFLICT(product_uuid, tariff_uuid) DO UPDATE SET
      price = excluded.price,
      updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(price);
  }
}
