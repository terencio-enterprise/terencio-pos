import { Shift, ShiftStatus } from '@terencio/domain';
import { BaseRepository } from '../base.repository';
import { db } from '../db';

export class ShiftRepository extends BaseRepository<Shift> {
  constructor() {
    super('shifts');
  }

  findOpenShiftByUser(userUuid: string): Shift | undefined {
    if (!db) throw new Error('DB not initialized');
    return db.prepare(`
      SELECT * FROM shifts 
      WHERE user_uuid = ? AND status = ?
    `).get(userUuid, ShiftStatus.OPEN) as Shift;
  }

  closeShift(uuid: string, endTime: string, countedCash: number, discrepancy: number): void {
     if (!db) throw new Error('DB not initialized');
     db.prepare(`
        UPDATE shifts 
        SET status = ?, end_time = ?, counted_cash = ?, discrepancy = ?
        WHERE uuid = ?
     `).run(ShiftStatus.CLOSED, endTime, countedCash, discrepancy, uuid);
  }
}

export const Shifts = new ShiftRepository();
