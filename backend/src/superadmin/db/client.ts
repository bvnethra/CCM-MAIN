import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env variables from root or backend directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URI || 'postgresql://postgres.owucaqkvoxtupxibracw:Ccm-main123%23%40@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const isLocal = dbUrl.includes('127.0.0.1') || dbUrl.includes('localhost');

const pool = new pg.Pool({
    connectionString: dbUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const client = await pool.connect();
    try {
        const res = await client.query(sql, params);
        return res.rows;
    } finally {
        client.release();
    }
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

export async function withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export { pool };
