import { IUserRepository, User } from '@terencio/domain';
import { SqliteBaseRepository } from './base.repository';

export class SqliteUserRepository extends SqliteBaseRepository<User> implements IUserRepository {
  protected tableName = 'users';
  protected primaryKey = 'uuid';

  async findByUsername(username: string): Promise<User | null> {
    const stmt = this.getDb().prepare('SELECT * FROM users WHERE username = ?');
    const result = stmt.get(username);
    return (result as User) || null;
  }

  async findAllActive(): Promise<User[]> {
    const stmt = this.getDb().prepare('SELECT * FROM users WHERE is_active = 1 AND deleted_at IS NULL');
    return stmt.all() as User[];
  }

  // Override delete to soft delete
  async delete(id: string): Promise<void> {
     const stmt = this.getDb().prepare('UPDATE users SET deleted_at = CURRENT_TIMESTAMP, is_active = 0 WHERE uuid = ?');
     stmt.run(id);
  }
}
