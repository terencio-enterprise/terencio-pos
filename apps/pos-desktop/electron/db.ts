import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export const initDb = () => {
  const isDev = !app.isPackaged;
  let schemaPath: string;

  if (isDev) {
    // In Dev: Navigate up from apps/pos-desktop/electron/dist/ to database/schema
    schemaPath = path.join(__dirname, '../../../../database/schema/schema.sql');
  } else {
    // In Prod: configured in electron-builder to be in resources/app/schema
    schemaPath = path.join(process.resourcesPath, 'app/schema/schema.sql');
  }

  try {
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      console.log('Database Schema loaded successfully from:', schemaPath);
      // TODO: Execute schemaSql using your SQLite driver here (e.g., db.exec(schemaSql))
    } else {
      console.error('Schema file not found at:', schemaPath);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};