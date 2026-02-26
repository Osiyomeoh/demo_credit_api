import 'dotenv/config';
import app from './app';
import { db } from './config/database';

const PORT = process.env.PORT || 3000;

async function main(): Promise<void> {
  try {
    await db.raw('SELECT 1');
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Demo Credit Wallet API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

