import { Customer, ICustomerRepository } from '@terencio/domain';
import { SqliteBaseRepository } from './base.repository';

export class SqliteCustomerRepository extends SqliteBaseRepository<Customer> implements ICustomerRepository {
  protected tableName = 'customers';
  protected primaryKey = 'id';

  async search(query: string): Promise<Customer[]> {
    const likeQuery = `%${query}%`;
    const stmt = this.getDb().prepare(`
      SELECT * FROM customers 
      WHERE (business_name LIKE ? OR trade_name LIKE ? OR tax_id LIKE ? OR phone LIKE ?)
      AND deleted_at IS NULL
    `);
    // Pass the parameter 4 times for the 4 placeholders
    return stmt.all(likeQuery, likeQuery, likeQuery, likeQuery) as Customer[];
  }

  async findAllActive(): Promise<Customer[]> {
    const stmt = this.getDb().prepare('SELECT * FROM customers WHERE active = 1 AND deleted_at IS NULL');
    return stmt.all() as Customer[];
  }

  async delete(id: string | number): Promise<void> {
    const stmt = this.getDb().prepare('UPDATE customers SET deleted_at = CURRENT_TIMESTAMP, active = 0 WHERE id = ?');
    stmt.run(id);
  }
}
