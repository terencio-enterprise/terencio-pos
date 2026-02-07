import { BooleanInt, IShiftRepository, Shift, ShiftStatus } from '@terencio/domain';
import { v4 as uuidv4 } from 'uuid';
import { SqliteBaseRepository } from './base.repository';

export class SqliteShiftRepository extends SqliteBaseRepository<Shift> implements IShiftRepository {
  protected tableName = 'shifts';
  protected primaryKey = 'uuid';

  async findOpenShiftByUserId(userId: number): Promise<Shift | null> {
    const stmt = this.getDb().prepare("SELECT * FROM shifts WHERE user_id = ? AND status = 'OPEN'");
    return (stmt.get(userId) as Shift) || null;
  }

  async findAllByUserId(userId: number): Promise<Shift[]> {
    const stmt = this.getDb().prepare('SELECT * FROM shifts WHERE user_id = ? ORDER BY opened_at DESC');
    return stmt.all(userId) as Shift[];
  }

  async findByUuid(uuid: string): Promise<Shift | null> {
    const stmt = this.getDb().prepare('SELECT * FROM shifts WHERE uuid = ?');
    return (stmt.get(uuid) as Shift) || null;
  }

  async startShift(userId: number, posId: string, amountInitial: number): Promise<Shift> {
    // Check if user already has an open shift
    const existingShift = await this.findOpenShiftByUserId(userId);
    if (existingShift) {
      throw new Error('User already has an open shift. Please close the existing shift before starting a new one.');
    }

    const shift: Omit<Shift, 'id'> = {
      uuid: uuidv4(),
      user_id: userId,
      pos_id: posId,
      opened_at: new Date().toISOString(),
      closed_at: null,
      amount_initial: amountInitial,
      amount_system: amountInitial,
      amount_counted: 0,
      amount_diff: 0,
      status: 'OPEN' as ShiftStatus,
      z_report_number: null,
      z_series: null,
      z_year: null,
      z_report_hash: null,
      z_report_signature: null,
      reopened: 0 as BooleanInt,
      reopened_by_user_id: null,
      reopened_reason: null
    };

    const id = await this.create(shift);
    return { ...shift, id: id as number } as Shift;
  }

  async endShift(shiftId: string, countedCash: number, notes?: string): Promise<Shift> {
    const shift = await this.findByUuid(shiftId);
    
    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.status === 'CLOSED') {
      throw new Error('Shift is already closed');
    }

    // Calculate expected cash from sales
    const expectedCash = await this.calculateExpectedCash(shiftId);
    
    const discrepancy = countedCash - expectedCash;

    const stmt = this.getDb().prepare(`
      UPDATE shifts 
      SET closed_at = ?, 
          status = 'CLOSED', 
          amount_counted = ?, 
          amount_system = ?,
          amount_diff = ?,
          notes = ?,
          updated_at = ?
      WHERE uuid = ?
    `);

    stmt.run(
      new Date().toISOString(),
      countedCash,
      expectedCash,
      discrepancy,
      notes || null,
      new Date().toISOString(),
      shiftId
    );

    // Return updated shift
    return await this.findByUuid(shiftId) as Shift;
  }

  async autoCloseShift(shiftId: string): Promise<Shift> {
    const shift = await this.findByUuid(shiftId);
    
    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.status === 'CLOSED') {
      throw new Error('Shift is already closed');
    }

    // Calculate expected cash from sales
    const expectedCash = await this.calculateExpectedCash(shiftId);
    
    // Auto-close: counted_cash = expected_cash (no discrepancy)
    const stmt = this.getDb().prepare(`
      UPDATE shifts 
      SET closed_at = ?, 
          status = 'CLOSED', 
          amount_counted = ?, 
          amount_system = ?,
          amount_diff = 0,
          notes = 'Auto-closed on logout',
          updated_at = ?
      WHERE uuid = ?
    `);

    stmt.run(
      new Date().toISOString(),
      expectedCash,
      expectedCash,
      new Date().toISOString(),
      shiftId
    );

    // Return updated shift
    return await this.findByUuid(shiftId) as Shift;
  }

  private async calculateExpectedCash(shiftId: string): Promise<number> {
    // Query sales table to get total cash sales for this shift
    const stmt = this.getDb().prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as cash_total
      FROM payments p
      INNER JOIN sales s ON p.sale_uuid = s.uuid
      WHERE s.shift_uuid = ? AND p.method = 'CASH'
    `);
    
    const result = stmt.get(shiftId) as { cash_total: number };
    
    // Get the shift's starting cash
    const shift = await this.findByUuid(shiftId);
    const startingCash = shift?.amount_initial || 0;
    
    return startingCash + result.cash_total;
  }
}
