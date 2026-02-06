import * as bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export async function seedUsers(db: Database.Database) {
  // Check if users already exist
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = stmt.get() as { count: number };
  
  if (result.count > 0) {
    console.log('Users already seeded, skipping...');
    return;
  }

  console.log('Seeding initial users...');

  const saltRounds = 10;
  const defaultPin = '123456';
  const pinHash = await bcrypt.hash(defaultPin, saltRounds);

  const users = [
    {
      uuid: uuidv4(),
      username: 'admin',
      pin_hash: pinHash,
      full_name: 'Administrator',
      role: 'ADMIN',
      is_active: 1
    },
    {
      uuid: uuidv4(),
      username: 'manager',
      pin_hash: pinHash,
      full_name: 'Store Manager',
      role: 'MANAGER',
      is_active: 1
    },
    {
      uuid: uuidv4(),
      username: 'cashier',
      pin_hash: pinHash,
      full_name: 'Cashier',
      role: 'CASHIER',
      is_active: 1
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO users (uuid, username, pin_hash, full_name, role, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    insertStmt.run(
      user.uuid,
      user.username,
      user.pin_hash,
      user.full_name,
      user.role,
      user.is_active
    );
  }

  console.log(`✅ Seeded ${users.length} users with PIN: ${defaultPin}`);
}
