import knex, { type Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const environment = process.env.NODE_ENV || 'development';

const baseConfig: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database:
      environment === 'test'
        ? process.env.DB_NAME || 'lendsqr_wallet_test'
        : process.env.DB_NAME || 'lendsqr_wallet',
  },
  pool: {
    min: environment === 'test' ? 1 : 2,
    max: environment === 'test' ? 5 : 10,
  },
  migrations: { directory: './src/database/migrations', extension: 'ts' },
};

export const db = knex(baseConfig);

