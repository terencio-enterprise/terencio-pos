import Database from 'better-sqlite3';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// Export the specific Database type
export let db: Database.Database | null = null;

export const initDb = () => {
  const isDev = !app.isPackaged;
  
  // 1. Determine Paths
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'terencio.sqlite');
  
  // Resolve migrations folder path
  // In Dev: It's relative to apps/pos-desktop/electron/dist/main.js -> ../../../../database/migrations
  // In Prod: We will copy it to resources/app/migrations, so it's relative to main.js -> ../migrations
  const migrationsPath = isDev
    ? path.join(__dirname, '../../../../database/migrations')
    : path.join(__dirname, '../migrations');

  console.log(`📂 Database path: ${dbPath}`);
  console.log(`📂 Migrations path: ${migrationsPath}`);

  // 2. Initialize Database
  try {
    db = new Database(dbPath, { verbose: isDev ? console.log : undefined });
    
    // Performance optimizations
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON'); // Crucial for consistency
    
    console.log('✅ Connected to SQLite database');
    
    // 3. Run Migrations
    runMigrations(migrationsPath);
    
  } catch (err) {
    console.error('❌ Database Initialization Error:', err);
    throw err; // Fatal error, app should probably crash or show dialog
  }
};

/**
 * The Migration Runner
 * Compares files in the migrations folder against the _migrations table.
 */
function runMigrations(migrationsPath: string) {
  if (!db) return;

  // A. Ensure tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // B. Get list of applied migrations
  const appliedMigrations = db.prepare('SELECT name FROM _migrations').all() as { name: string }[];
  const appliedNames = new Set(appliedMigrations.map(m => m.name));

  // C. Get list of file migrations
  if (!fs.existsSync(migrationsPath)) {
    console.error(`❌ Migration directory not found at: ${migrationsPath}`);
    return;
  }

  const files = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure alphanumeric sort (00_, 01_, 02_)

  // D. Iterate and Apply
  let migrationCount = 0;

  for (const file of files) {
    if (!appliedNames.has(file)) {
      console.log(`🚀 Applying migration: ${file}`);
      
      const filePath = path.join(migrationsPath, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute inside a transaction for safety
      const runMigration = db.transaction(() => {
        if (!db) return;
        db.exec(sql);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
      });

      try {
        runMigration();
        console.log(`✅ Applied: ${file}`);
        migrationCount++;
      } catch (err) {
        console.error(`❌ Failed to apply migration: ${file}`);
        console.error(err);
        throw err; // Stop the sequence immediately
      }
    }
  }

  if (migrationCount === 0) {
    console.log('✨ Database is up to date.');
  } else {
    console.log(`✅ Successfully applied ${migrationCount} migrations.`);
  }
}