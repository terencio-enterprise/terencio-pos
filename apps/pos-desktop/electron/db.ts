import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export const initDb = () => {
  const isDev = !app.isPackaged;
  let schemaPath: string;

  if (isDev) {
    // DEV: defined relative to apps/pos-desktop/electron/dist/db.js
    // Go up: dist -> electron -> pos-desktop -> apps -> root -> database
    schemaPath = path.join(__dirname, '../../../../database/schema/schema.sql');
  } else {
    // PROD: Defined in electron-builder.
    // We mapped "apps/pos-desktop/electron/dist" to "electron"
    // We mapped "database/schema" to "schema"
    // So relative to "electron/db.js", the schema is at "../schema/schema.sql"
    schemaPath = path.join(__dirname, '../schema/schema.sql');
  }

  try {
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      console.log('✅ Database Schema loaded:', schemaPath);
      // Run your DB exec here
    } else {
      console.error('❌ Schema file missing at:', schemaPath);
    }
  } catch (error) {
    console.error('❌ DB Init failed:', error);
  }
};