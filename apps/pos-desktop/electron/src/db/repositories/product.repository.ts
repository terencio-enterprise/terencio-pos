import { Product } from '@terencio/domain';
import { BaseRepository } from '../base.repository';
import { db } from '../db';

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super('products');
  }

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

export const Products = new ProductRepository();
