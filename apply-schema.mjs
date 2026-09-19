import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URI;

let connectionConfig;

if (DATABASE_URL) {
  const isLocal = DATABASE_URL.includes('127.0.0.1') || DATABASE_URL.includes('localhost');
  connectionConfig = { connectionString: DATABASE_URL, ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }) };
} else {
  const DB_HOST = process.env.SUPABASE_DB_HOST || '127.0.0.1';
  const DB_PORT = process.env.SUPABASE_DB_PORT || 5432;
  const DB_NAME = process.env.SUPABASE_DB_NAME || 'postgres';
  const DB_USER = process.env.SUPABASE_DB_USER || 'postgres';
  const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

  if (!DB_PASSWORD) {
    console.error('\n❌ ERROR: SUPABASE_DB_PASSWORD or DATABASE_URL environment variable is missing.');
    console.error('Please set DATABASE_URL or SUPABASE_DB_PASSWORD in your .env file.\n');
    process.exit(1);
  }

  const connectionString = `postgresql://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  const isLocal = DB_HOST === '127.0.0.1' || DB_HOST === 'localhost';
  connectionConfig = { connectionString, ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }) };
}

async function run() {
  console.log(`🔌 Connecting to Supabase database...`);
  const client = new Client(connectionConfig);

  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase!');

    console.log('\n📦 Applying schema_all.sql (Steps 1 - 4)...');
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'schema_all.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('✅ Database schema created/updated successfully!');

    console.log('\n🌱 Applying seed.sql (Steps 1 - 4)...');
    const seedSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'seed.sql'), 'utf8');
    await client.query(seedSql);
    console.log('✅ Database seeded successfully!');

    const rbacMigrationPath = path.join(process.cwd(), 'supabase', 'migrations', '063_update_rbac_matrix_and_designations.sql');
    if (fs.existsSync(rbacMigrationPath)) {
      console.log('\n🛡️ Applying 063_update_rbac_matrix_and_designations.sql...');
      const rbacSql = fs.readFileSync(rbacMigrationPath, 'utf8');
      await client.query(rbacSql);
      console.log('✅ RBAC matrix and designations migration applied successfully!');
    }

    const rlsMigrationPath = path.join(process.cwd(), 'supabase', 'migrations', '064_enable_multitenant_rls.sql');
    if (fs.existsSync(rlsMigrationPath)) {
      console.log('\n🔒 Applying 064_enable_multitenant_rls.sql...');
      const rlsSql = fs.readFileSync(rlsMigrationPath, 'utf8');
      await client.query(rlsSql);
      console.log('✅ Multi-Tenant RLS migration applied successfully!');
    }

    const subsequentMigrations = [
      '065_client_master_enhanced_schema.sql',
      '066_client_master_rpc_functions.sql',
      '067_client_master_permissions.sql',
      '068_vendor_master_enhanced_schema.sql',
      '069_vendor_master_rpc_functions.sql',
      '070_vendor_master_permissions.sql',
      '071_seed_admin_login_user.sql',
    ];

    for (const mig of subsequentMigrations) {
      const migPath = path.join(process.cwd(), 'supabase', 'migrations', mig);
      if (fs.existsSync(migPath)) {
        console.log(`\n🚀 Applying ${mig}...`);
        const migSql = fs.readFileSync(migPath, 'utf8');
        await client.query(migSql);
        console.log(`✅ ${mig} applied successfully!`);
      }
    }

    console.log('\n🎉 ALL MIGRATIONS AND SEEDS APPLIED AUTOMATICALLY!\n');
  } catch (err) {
    console.error('\n❌ Error executing SQL script:', err.message);
  } finally {
    await client.end();
  }
}

run();
