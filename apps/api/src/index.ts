import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Automatically locate .env from root or parent directories
function loadEnvironment() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(currentDir, '../../../.env'), // repo root from apps/api/src
    path.resolve(currentDir, '../../.env'),    // repo root from apps/api/dist
    path.resolve(process.cwd(), '../../.env'), // when cwd is apps/api
    path.resolve(process.cwd(), '.env'),       // when cwd is root or apps/api has .env
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      if (process.env.MONGODB_URI) {
        break;
      }
    }
  }
  dotenv.config(); // fallback
}

loadEnvironment();

import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await connectDB();
    const app = createApp();
    const portNum = Number(PORT);
    app.listen(portNum, '0.0.0.0', () => {
      console.log(`[Server] Anisume API server listening on http://0.0.0.0:${portNum}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
