import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

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

export default app;

