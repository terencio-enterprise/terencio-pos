import { IUserRepository, User } from '@terencio/domain';
import * as bcrypt from 'bcryptjs';
import { SqliteBaseRepository } from './base.repository';

export class SqliteUserRepository extends SqliteBaseRepository<User> implements IUserRepository {
  protected tableName = 'users';
  protected primaryKey = 'id';

  async findByUsername(username: string): Promise<User | null> {
    const stmt = this.getDb().prepare('SELECT * FROM users WHERE username = ?');
    const result = stmt.get(username);
    return (result as User) || null;
  }

  async findAllActive(): Promise<User[]> {
    const stmt = this.getDb().prepare('SELECT * FROM users WHERE is_active = 1 AND deleted_at IS NULL');
    return stmt.all() as User[];
  }

  async authenticateWithPin(username: string, pin: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    
    if (!user || !user.is_active || user.deleted_at) {
      return null;
    }

    // If no PIN hash is set, reject authentication
    if (!user.pin_hash) {
      return null;
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, user.pin_hash);
    
    if (!isValid) {
      return null;
    }

    return user;
  }

  async updatePin(userId: number, newPin: string): Promise<void> {
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(newPin, saltRounds);
    
    const stmt = this.getDb().prepare('UPDATE users SET pin_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(pinHash, userId);
  }

  // Override delete to soft delete
  async delete(id: string | number): Promise<void> {
     const stmt = this.getDb().prepare('UPDATE users SET deleted_at = CURRENT_TIMESTAMP, is_active = 0 WHERE id = ?');
     stmt.run(id);
  }
}

