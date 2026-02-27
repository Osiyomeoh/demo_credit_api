import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import axios from 'axios';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { swaggerSpec } from './docs/swagger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// API docs
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  })
);

app.use('/api/v1', routes);

app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
  });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    status: 'error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : (err as Error).message,
  });
};

app.use(errorHandler);

// Internal keep-alive ping to prevent Render free dyno from idling.
// Only runs when KEEPALIVE_URL is configured (typically in production).
if (process.env.KEEPALIVE_URL) {
  const targetUrl =
    process.env.KEEPALIVE_URL ||
    'https://demo-credit-api-3dci.onrender.com/api/v1/health';
  const intervalMs = Number(
    process.env.KEEPALIVE_INTERVAL_MS || 5 * 60 * 1000
  );

  const ping = async () => {
    try {
      await axios.get(targetUrl, { timeout: 5000 });
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[keepalive] OK -> ${targetUrl}`);
      }
    } catch (err) {
      console.error(
        '[keepalive] ERROR',
        (err as Error).message ?? String(err)
      );
    }
  };

  console.log(
    `[keepalive] starting; interval=${intervalMs}ms, url=${targetUrl}`
  );
  setInterval(ping, intervalMs);
  void ping();
}

export default app;

