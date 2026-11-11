import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose, { type ConnectOptions } from 'mongoose';

const TARGET_DB_NAME = 'anisume';
const FORBIDDEN_DB_NAME = 'animatch';

function ensureEnvLoaded() {
  if (process.env.MONGODB_URI) return;
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(currentDir, '../../../../.env'),
    path.resolve(currentDir, '../../../.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      if (process.env.MONGODB_URI) break;
    }
  }
}

/**
 * Strips password and sensitive credentials from MongoDB URI for safe logging.
 */
export function sanitizeMongoUri(uri: string): string {
  try {
    return uri.replace(
      /(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@.+)/i,
      '$1****$2'
    );
  } catch {
    return '[REDACTED_URI]';
  }
}

export async function connectDB(uri?: string, options?: ConnectOptions): Promise<typeof mongoose> {
  ensureEnvLoaded();
  const rawUri = uri || process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error(
      '[Database Error] MONGODB_URI environment variable is missing. Please set it in .env'
    );
  }

  // Guard against unreplaced template placeholder
  if (rawUri.includes('<PASSWORD>')) {
    throw new Error(
      '[Database Error] MONGODB_URI contains placeholder <PASSWORD>. Please replace it with your MongoDB Atlas password in .env'
    );
  }

  // Guard against accidental use of legacy database path in connection string
  const afterAt = rawUri.split('@')[1];
  if (afterAt) {
    const dbSegment = afterAt.split('/')[1]?.split('?')[0]?.trim().toLowerCase();
    if (dbSegment === FORBIDDEN_DB_NAME) {
      throw new Error(
        `[Database Error] Forbidden database: URI database path specifies '${FORBIDDEN_DB_NAME}'. Anisume must connect to '${TARGET_DB_NAME}' only.`
      );
    }
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const connectOptions: ConnectOptions = {
    dbName: TARGET_DB_NAME,
    autoIndex: true, // Let Mongoose build indexes automatically
    serverSelectionTimeoutMS: 10000,
    ...options,
  };

  try {
    const conn = await mongoose.connect(rawUri, connectOptions);

    // Verify active database name matches anisume
    const activeDbName = conn.connection.db?.databaseName || conn.connection.name;
    if (activeDbName.toLowerCase() === FORBIDDEN_DB_NAME) {
      await mongoose.disconnect();
      throw new Error(
        `[Database Error] Safety trigger: Connected to '${FORBIDDEN_DB_NAME}' database. Terminated connection. Target must be '${TARGET_DB_NAME}'.`
      );
    }

    console.log(
      `[Database] Successfully connected to MongoDB Atlas: ${conn.connection.host}/${activeDbName}`
    );
    return conn;
  } catch (error: unknown) {
    const err = error as Error;
    // Sanitize error message to prevent any credential leakage in logs
    const safeMessage = sanitizeMongoUri(err.message || 'Unknown database connection error');
    console.error('[Database] Connection failed:', safeMessage);
    throw new Error(safeMessage);
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed');
  }
}
