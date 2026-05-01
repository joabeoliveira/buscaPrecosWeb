import { loadEnvConfig } from '@next/env';
import path from 'path';

// Load environment variables BEFORE importing anything else
// because imports evaluate connection.ts which needs REDIS_URL
const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function start() {
  console.log('👷 BullMQ Worker is starting...');

  // Dynamically import so the env is guaranteed to be set
  const { searchWorker } = await import('./SearchWorker');

  searchWorker.run().catch((err) => {
    console.error('Failed to run worker', err);
  });

  console.log(`👷 Worker is running and listening to queue: ${searchWorker.name}`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...');
    await searchWorker.close();
    process.exit(0);
  });
}

start();
