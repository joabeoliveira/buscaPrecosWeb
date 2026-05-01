import { searchWorker } from './SearchWorker';
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Load environment variables using Next.js built-in env loader
const projectDir = process.cwd();
loadEnvConfig(projectDir);

console.log('👷 BullMQ Worker is starting...');

// The worker itself starts listening because we didn't explicitly pause it,
// but since we passed `autorun: false` to the Worker config earlier, we should start it now.
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
