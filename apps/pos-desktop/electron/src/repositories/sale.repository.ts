import {
    FiscalChainRecord,
    IFiscalChainRepository,
    IPaymentRepository,
    ISaleLineRepository,
    ISaleRepository,
    Payment,
    Sale,
    SaleBillingInfo,
    SaleLine
} from '@terencio/domain';
import { SqliteBaseRepository } from './base.repository';

export class SqliteSaleRepository extends SqliteBaseRepository<Sale> implements ISaleRepository {
  protected tableName = 'sales';
  protected primaryKey = 'uuid';

  async findByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    const stmt = this.getDb().prepare('SELECT * FROM sales WHERE issued_at BETWEEN ? AND ? ORDER BY issued_at DESC');
    return stmt.all(startDate, endDate) as Sale[];
  }

  async findByShiftId(shiftUuid: string): Promise<Sale[]> {
    const stmt = this.getDb().prepare('SELECT * FROM sales WHERE shift_uuid = ? ORDER BY issued_at DESC');
    return stmt.all(shiftUuid) as Sale[];
  }

  async findFullSale(saleUuid: string): Promise<{ 
    sale: Sale; 
    lines: SaleLine[]; 
    payments: Payment[]; 
    billingInfo: SaleBillingInfo | null 
  } | null> {
    const run = this.getDb().transaction(() => {
        const saleStmt = this.getDb().prepare('SELECT * FROM sales WHERE uuid = ?');
        const sale = saleStmt.get(saleUuid) as Sale;
        
        if (!sale) return null;

        const linesStmt = this.getDb().prepare('SELECT * FROM sale_lines WHERE sale_uuid = ?');
        const lines = linesStmt.all(saleUuid) as SaleLine[];

        const payStmt = this.getDb().prepare('SELECT * FROM payments WHERE sale_uuid = ?');
        const payments = payStmt.all(saleUuid) as Payment[];

        const billStmt = this.getDb().prepare('SELECT * FROM sale_billing_info WHERE sale_uuid = ?');
        const billingInfo = (billStmt.get(saleUuid) as SaleBillingInfo) || null;

        return { sale, lines, payments, billingInfo };
    });

    return run();
  }

  async finalizeSale(saleUuid: string): Promise<void> {
    // TODO: Implement VeriFactu Chaining Logic here
    const stmt = this.getDb().prepare('UPDATE sales SET is_fiscal_issued = 1, issued_at = CURRENT_TIMESTAMP WHERE uuid = ?');
    stmt.run(saleUuid);
  }
}

export class SqliteSaleLineRepository extends SqliteBaseRepository<SaleLine> implements ISaleLineRepository {
  protected tableName = 'sale_lines';
  protected primaryKey = 'id';

  async findBySaleId(saleUuid: string): Promise<SaleLine[]> {
    const stmt = this.getDb().prepare('SELECT * FROM sale_lines WHERE sale_uuid = ?');
    return stmt.all(saleUuid) as SaleLine[];
  }

  async deleteBySaleId(saleUuid: string): Promise<void> {
    const stmt = this.getDb().prepare('DELETE FROM sale_lines WHERE sale_uuid = ?');
    stmt.run(saleUuid);
  }

  async voidLine(lineId: number, managerId: number, reason: string): Promise<void> {
     // Transaction to update line and log override
     const run = this.getDb().transaction(() => {
        this.getDb().prepare("UPDATE sale_lines SET status = 'VOIDED' WHERE id = ?").run(lineId);
        this.getDb().prepare("INSERT INTO manager_overrides (line_id, manager_user_id, reason) VALUES (?, ?, ?)").run(lineId, managerId, reason);
     });
     run();
  }
}

export class SqlitePaymentRepository extends SqliteBaseRepository<Payment> implements IPaymentRepository {
  protected tableName = 'payments';
  protected primaryKey = 'id';

  async findBySaleId(saleUuid: string): Promise<Payment[]> {
    const stmt = this.getDb().prepare('SELECT * FROM payments WHERE sale_uuid = ?');
    return stmt.all(saleUuid) as Payment[];
  }
}

export class SqliteFiscalChainRepository extends SqliteBaseRepository<FiscalChainRecord> implements IFiscalChainRepository {
  protected tableName = 'fiscal_chain';
  protected primaryKey = 'id';

  async findBySaleUuid(saleUuid: string): Promise<FiscalChainRecord | null> {
    const stmt = this.getDb().prepare('SELECT * FROM fiscal_chain WHERE sale_uuid = ?');
    return (stmt.get(saleUuid) as FiscalChainRecord) || null;
  }
  
  async getChainHead(deviceSerial: string): Promise<FiscalChainRecord | null> {
    const stmt = this.getDb().prepare('SELECT * FROM fiscal_chain WHERE device_serial = ? ORDER BY chain_sequence_id DESC LIMIT 1');
    return (stmt.get(deviceSerial) as FiscalChainRecord) || null;
  }

  async validateChainIntegrity(deviceSerial: string): Promise<boolean> {
      // Stub for now
      return true;
  }
}