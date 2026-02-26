import 'dotenv/config';
import axios from 'axios';

const TARGET_URL =
  process.env.KEEPALIVE_URL || 'https://your-service.onrender.com/api/v1/health';
const INTERVAL_MS = Number(process.env.KEEPALIVE_INTERVAL_MS || 5 * 60 * 1000);

async function ping() {
  try {
    await axios.get(TARGET_URL, { timeout: 5000 });
    console.log(`[keepalive] OK -> ${TARGET_URL}`);
  } catch (err) {
    console.error('[keepalive] ERROR', (err as Error).message);
  }
}

console.log(`[keepalive] starting; interval=${INTERVAL_MS}ms, url=${TARGET_URL}`);
setInterval(ping, INTERVAL_MS);
ping();