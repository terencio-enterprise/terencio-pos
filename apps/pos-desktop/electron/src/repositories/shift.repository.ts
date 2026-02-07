import { IShiftRepository, Shift } from '@terencio/domain';
import { v4 as uuidv4 } from 'uuid';
import { SqliteBaseRepository } from './base.repository';

export class SqliteShiftRepository extends SqliteBaseRepository<Shift> implements IShiftRepository {
  protected tableName = 'shifts';
  protected primaryKey = 'uuid';

  async findOpenShiftByUserId(userId: string): Promise<Shift | null> {
    const stmt = this.getDb().prepare("SELECT * FROM shifts WHERE user_uuid = ? AND status = 'OPEN'");
    return (stmt.get(userId) as Shift) || null;
  }

  async findAllByUserId(userId: string): Promise<Shift[]> {
    const stmt = this.getDb().prepare('SELECT * FROM shifts WHERE user_uuid = ? ORDER BY start_time DESC');
    return stmt.all(userId) as Shift[];
  }

  async startShift(userId: string, deviceId: string, startingCash: number): Promise<Shift> {
    // Check if user already has an open shift
    const existingShift = await this.findOpenShiftByUserId(userId);
    if (existingShift) {
      throw new Error('User already has an open shift. Please close the existing shift before starting a new one.');
    }

    const shift: Shift = {
      uuid: uuidv4(),
      user_uuid: userId,
      device_id: deviceId,
      start_time: new Date().toISOString(),
      end_time: null,
      starting_cash: startingCash,
      expected_cash: startingCash, // Will be updated when shift ends
      counted_cash: 0,
      discrepancy: 0,
      status: 'OPEN',
      notes: null,
      synced: 0
    };

    await this.create(shift);
    return shift;
  }

  async endShift(shiftId: string, countedCash: number, notes?: string): Promise<Shift> {
    const shift = await this.findById(shiftId);
    
    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.status === 'CLOSED') {
      throw new Error('Shift is already closed');
    }

    // Calculate expected cash from sales
    // For now, we'll use starting_cash + sales total
    // TODO: Add logic to calculate from sales table
    const expectedCash = await this.calculateExpectedCash(shiftId);
    
    const discrepancy = countedCash - expectedCash;

    const stmt = this.getDb().prepare(`
      UPDATE shifts 
      SET end_time = ?, 
          status = 'CLOSED', 
          counted_cash = ?, 
          expected_cash = ?,
          discrepancy = ?,
          notes = ?
      WHERE uuid = ?
    `);

    stmt.run(
      new Date().toISOString(),
      countedCash,
      expectedCash,
      discrepancy,
      notes || null,
      shiftId
    );

    // Return updated shift
    return await this.findById(shiftId) as Shift;
  }

  async autoCloseShift(shiftId: string): Promise<Shift> {
    const shift = await this.findById(shiftId);
    
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
      SET end_time = ?, 
          status = 'CLOSED', 
          counted_cash = ?, 
          expected_cash = ?,
          discrepancy = 0,
          notes = 'Auto-closed on logout'
      WHERE uuid = ?
    `);

    stmt.run(
      new Date().toISOString(),
      expectedCash,
      expectedCash,
      shiftId
    );

    // Return updated shift
    return await this.findById(shiftId) as Shift;
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
    const shift = await this.findById(shiftId);
    const startingCash = shift?.starting_cash || 0;
    
    return startingCash + result.cash_total;
  }
}
