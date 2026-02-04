import Database from 'better-sqlite3';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// Export the specific Database type
export let db: Database.Database | null = null;

export const initDb = () => {
  const isDev = !app.isPackaged;
  
  // 1. Determine Schema Path
  let schemaPath: string;
  if (isDev) {
    schemaPath = path.join(__dirname, '../../../../database/schema/schema.sql');
  } else {
    schemaPath = path.join(__dirname, '../schema/schema.sql');
  }

  // 2. Determine DB Path (Always use userData)
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'terencio.sqlite');

  console.log(`📂 Database path: ${dbPath}`);

  // 3. Initialize (Synchronous)
  try {
    // verbose: console.log prints all queries (great for dev)
    db = new Database(dbPath, { verbose: isDev ? console.log : undefined });
    
    // Performance optimization for SQLite
    db.pragma('journal_mode = WAL');
    
    console.log('✅ Connected to SQLite database (better-sqlite3)');
    configureDatabase(schemaPath);
  } catch (err) {
    console.error('❌ Could not connect to database:', err);
  }
};

function configureDatabase(schemaPath: string) {
  if (!db) return;

  // Sync query to check table existence
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();

  if (!row) {
    console.log('⚠️ Empty Database detected. Running Schema...');
    try {
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        // Sync execution of the schema script
        db.exec(schemaSql);
        console.log('✅ Schema applied successfully.');
      } else {
        console.error('❌ Schema file missing at:', schemaPath);
      }
    } catch (error) {
      console.error('❌ Error reading/applying schema:', error);
    }
  } else {
    console.log('✅ Database tables already exist.');
  }
}