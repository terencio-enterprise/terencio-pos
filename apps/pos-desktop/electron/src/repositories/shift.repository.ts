import { IShiftRepository, Shift } from '@terencio/domain';
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
}
