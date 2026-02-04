import { Tax } from '@terencio/domain';
import { BaseRepository } from '../base.repository';
import { db } from '../db';

export class TaxRepository extends BaseRepository<Tax> {
  constructor() {
    super('taxes');
  }

  getDefaultTax(): Tax | undefined {
    if (!db) throw new Error('DB not initialized');
    return db.prepare('SELECT * FROM taxes WHERE is_default = 1').get() as Tax;
  }
}

export const Taxes = new TaxRepository();
