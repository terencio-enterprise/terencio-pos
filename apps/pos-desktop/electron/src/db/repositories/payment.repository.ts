import { Payment } from '@terencio/domain';
import { BaseRepository } from '../base.repository';
import { db } from '../db';

export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super('payments');
  }

  findBySale(saleUuid: string): Payment[] {
    if (!db) throw new Error('DB not initialized');
    return db.prepare('SELECT * FROM payments WHERE sale_uuid = ?').all(saleUuid) as Payment[];
  }
}

export const Payments = new PaymentRepository();
