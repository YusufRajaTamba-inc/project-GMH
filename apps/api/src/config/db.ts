import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = {
  query: <T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> => {
    return pool.query<T>(text, params);
  },
  getClient: () => pool.connect(),
  testConnection: async (): Promise<boolean> => {
    try {
      const res = await pool.query('SELECT NOW() as current_time');
      console.log(`[Database] PostgreSQL connected successfully at: ${res.rows[0].current_time}`);
      return true;
    } catch (err: any) {
      console.error(`[Database] PostgreSQL connection error:`, err.message);
      return false;
    }
  },
};
