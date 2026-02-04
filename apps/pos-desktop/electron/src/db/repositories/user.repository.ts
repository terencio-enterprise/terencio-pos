import { User, UserRole } from '@terencio/domain';
import { BaseRepository } from '../base.repository';
import { db } from '../db';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  findByUsername(username: string): User | undefined {
    if (!db) throw new Error('DB not initialized');
    return db.prepare('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL').get(username) as User;
  }

  findByRole(role: UserRole): User[] {
    if (!db) throw new Error('DB not initialized');
    return db.prepare('SELECT * FROM users WHERE role = ? AND deleted_at IS NULL').all(role) as User[];
  }
}

export const Users = new UserRepository();
