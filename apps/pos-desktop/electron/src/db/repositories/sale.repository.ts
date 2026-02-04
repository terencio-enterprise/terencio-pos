import { Sale, SaleLine } from '@terencio/domain';
import { BaseRepository } from '../base.repository';
import { db } from '../db';

export class SaleRepository extends BaseRepository<Sale> {
  constructor() {
    super('sales');
  }

  createSaleWithLines(sale: Sale, lines: SaleLine[]): void {
    if (!db) throw new Error('DB not initialized');

    const insertSale = db.prepare(`
      INSERT INTO sales (uuid, doc_number, doc_type, user_uuid, customer_uuid, shift_uuid, total_amount, total_net, total_taxes, status, created_at, updated_at)
      VALUES (@uuid, @doc_number, @doc_type, @user_uuid, @customer_uuid, @shift_uuid, @total_amount, @total_net, @total_taxes, @status, @created_at, @updated_at)
    `);

    const insertLine = db.prepare(`
      INSERT INTO sale_lines (uuid, sale_uuid, product_uuid, product_name, quantity, unit_price, total_line, tax_rate, discount_percent, discount_amount, created_at)
      VALUES (@uuid, @sale_uuid, @product_uuid, @product_name, @quantity, @unit_price, @total_line, @tax_rate, @discount_percent, @discount_amount, @created_at)
    `);

    const createTransaction = db.transaction((saleData: Sale, linesData: SaleLine[]) => {
      insertSale.run(saleData);
      for (const line of linesData) insertLine.run(line);
    });

    createTransaction(sale, lines);
  }
  
  findByDocNumber(docNumber: string): Sale | undefined {
    if (!db) throw new Error('DB not initialized');
    return db.prepare('SELECT * FROM sales WHERE doc_number = ?').get(docNumber) as Sale;
  }
}

export const Sales = new SaleRepository();
