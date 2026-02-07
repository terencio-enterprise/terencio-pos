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
    const stmt = this.getDb().prepare(`
      SELECT p.* FROM products p
      JOIN product_barcodes b ON p.id = b.product_id
      WHERE b.barcode = ?
    `);
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
      WHERE (name LIKE ? OR reference LIKE ?)
      AND active = 1
    `);
    return stmt.all(likeQuery, likeQuery) as Product[];
  }

  async findAllActive(): Promise<Product[]> {
    const stmt = this.getDb().prepare('SELECT * FROM products WHERE active = 1');
    return stmt.all() as Product[];
  }

  async updateStock(productId: number, quantityChange: number): Promise<void> {
    const stmt = this.getDb().prepare('UPDATE products SET stock_current = stock_current + ? WHERE id = ?');
    stmt.run(quantityChange, productId);
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
      INSERT INTO product_prices (product_id, tariff_id, price, created_at) 
      VALUES (@product_id, @tariff_id, @price, CURRENT_TIMESTAMP)
      ON CONFLICT(product_id, tariff_id) DO UPDATE SET
      price = excluded.price
    `);
    stmt.run(price);
  }
}