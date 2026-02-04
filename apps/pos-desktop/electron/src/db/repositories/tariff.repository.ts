import { Tariff } from '@terencio/domain';
import { BaseRepository } from '../base.repository';
import { db } from '../db';

export class TariffRepository extends BaseRepository<Tariff> {
  constructor() {
    super('tariffs');
  }

  getOrderedByPriority(): Tariff[] {
    if (!db) throw new Error('DB not initialized');
    return db.prepare('SELECT * FROM tariffs ORDER BY priority ASC').all() as Tariff[];
  }
}

export const Tariffs = new TariffRepository();
