import {
    FiscalRecord,
    IFiscalRecordRepository,
    IPaymentRepository,
    ISaleLineRepository,
    ISaleRepository,
    ISaleTaxSummaryRepository,
    Payment,
    Sale,
    SaleLine,
    SaleTaxSummary
} from '@terencio/domain';
import { db } from '../db/db';
import { SqliteBaseRepository } from './base.repository';

export class SqliteSaleRepository extends SqliteBaseRepository<Sale> implements ISaleRepository {
  protected tableName = 'sales';
  protected primaryKey = 'uuid';

  async findByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    const stmt = this.getDb().prepare('SELECT * FROM sales WHERE issue_date BETWEEN ? AND ? ORDER BY issue_date DESC');
    return stmt.all(startDate, endDate) as Sale[];
  }

  async findByShiftId(shiftId: string): Promise<Sale[]> {
    const stmt = this.getDb().prepare('SELECT * FROM sales WHERE shift_uuid = ? ORDER BY issue_date DESC');
    return stmt.all(shiftId) as Sale[];
  }

  async findFullSale(saleId: string): Promise<{ 
    sale: Sale; 
    lines: SaleLine[]; 
    payments: Payment[]; 
    taxes: SaleTaxSummary[] 
  } | null> {
    // Transactional read for consistency
    const run = this.getDb().transaction(() => {
        const saleStmt = this.getDb().prepare('SELECT * FROM sales WHERE uuid = ?');
        const sale = saleStmt.get(saleId) as Sale;
        
        if (!sale) return null;

        const linesStmt = this.getDb().prepare('SELECT * FROM sale_lines WHERE sale_uuid = ?');
        const lines = linesStmt.all(saleId) as SaleLine[];

        const payStmt = this.getDb().prepare('SELECT * FROM payments WHERE sale_uuid = ?');
        const payments = payStmt.all(saleId) as Payment[];

        const taxStmt = this.getDb().prepare('SELECT * FROM sale_tax_summary WHERE sale_uuid = ?');
        const taxes = taxStmt.all(saleId) as SaleTaxSummary[];

        return { sale, lines, payments, taxes };
    });

    return run();
  }
}

export class SqliteSaleLineRepository extends SqliteBaseRepository<SaleLine> implements ISaleLineRepository {
  protected tableName = 'sale_lines';
  protected primaryKey = 'uuid';

  async findBySaleId(saleId: string): Promise<SaleLine[]> {
    const stmt = this.getDb().prepare('SELECT * FROM sale_lines WHERE sale_uuid = ?');
    return stmt.all(saleId) as SaleLine[];
  }

  async deleteBySaleId(saleId: string): Promise<void> {
    const stmt = this.getDb().prepare('DELETE FROM sale_lines WHERE sale_uuid = ?');
    stmt.run(saleId);
  }
}

export class SqlitePaymentRepository extends SqliteBaseRepository<Payment> implements IPaymentRepository {
  protected tableName = 'payments';
  protected primaryKey = 'uuid';

  async findBySaleId(saleId: string): Promise<Payment[]> {
    const stmt = this.getDb().prepare('SELECT * FROM payments WHERE sale_uuid = ?');
    return stmt.all(saleId) as Payment[];
  }
}

export class SqliteSaleTaxSummaryRepository implements ISaleTaxSummaryRepository {
  private getDb() {
    if (!db) throw new Error('Database not initialized');
    return db;
  }

  async findBySaleId(saleId: string): Promise<SaleTaxSummary[]> {
    const stmt = this.getDb().prepare('SELECT * FROM sale_tax_summary WHERE sale_uuid = ?');
    return stmt.all(saleId) as SaleTaxSummary[];
  }

  async replaceForSale(saleId: string, summaries: SaleTaxSummary[]): Promise<void> {
    const deleteStmt = this.getDb().prepare('DELETE FROM sale_tax_summary WHERE sale_uuid = ?');
    const insertStmt = this.getDb().prepare(`
      INSERT INTO sale_tax_summary (sale_uuid, tax_uuid, tax_name_snapshot, tax_rate_snapshot, base_amount, tax_amount)
      VALUES (@sale_uuid, @tax_uuid, @tax_name_snapshot, @tax_rate_snapshot, @base_amount, @tax_amount)
    `);

    const run = this.getDb().transaction(() => {
       deleteStmt.run(saleId);
       for (const s of summaries) {
         insertStmt.run(s);
       }
    });

    run();
  }
}

export class SqliteFiscalRecordRepository extends SqliteBaseRepository<FiscalRecord> implements IFiscalRecordRepository {
  protected tableName = 'fiscal_records';
  protected primaryKey = 'uuid';

  async findBySaleId(saleId: string): Promise<FiscalRecord[]> {
    const stmt = this.getDb().prepare('SELECT * FROM fiscal_records WHERE sale_uuid = ? ORDER BY fiscal_sequence ASC');
    return stmt.all(saleId) as FiscalRecord[];
  }
  
  async getLastRecord(): Promise<FiscalRecord | null> {
    const stmt = this.getDb().prepare('SELECT * FROM fiscal_records ORDER BY fiscal_sequence DESC LIMIT 1');
    return (stmt.get() as FiscalRecord) || null;
  }
}
