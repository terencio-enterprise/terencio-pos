import { Customer } from '@terencio/domain';
import { BaseRepository } from '../base.repository';
import { db } from '../db';

export class CustomerRepository extends BaseRepository<Customer> {
  constructor() {
    super('customers');
  }

  findByTaxId(taxId: string): Customer | undefined {
    if (!db) throw new Error('DB not initialized');
    return db.prepare('SELECT * FROM customers WHERE tax_id = ? AND deleted_at IS NULL').get(taxId) as Customer;
  }
  
  search(query: string): Customer[] {
    if (!db) throw new Error('DB not initialized');
    const term = `%${query}%`;
    return db.prepare(`
      SELECT * FROM customers 
      WHERE (business_name LIKE ? OR trade_name LIKE ? OR tax_id LIKE ? OR phone LIKE ?) 
      AND deleted_at IS NULL
    `).all(term, term, term, term) as Customer[];
  }
}

export const Customers = new CustomerRepository();
