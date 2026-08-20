require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const hasExplicitPgEnv = Boolean(
    process.env.PGHOST ||
    process.env.PGPORT ||
    process.env.PGUSER ||
    process.env.PGPASSWORD ||
    process.env.PGDATABASE
);

if (hasExplicitPgEnv) {
    delete process.env.DATABASE_URL;
}

const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'track_sd05',
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
    ...connectionConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

async function ensureDatabaseSchema() {
    const tableCheck = await pool.query(`
        SELECT
            EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'patient'
            ) AS patient_exists,
            EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'ticket'
            ) AS ticket_exists;
    `);

    const { patient_exists: patientExists, ticket_exists: ticketExists } = tableCheck.rows[0] || {};

    if (patientExists && ticketExists) {
        return;
    }

    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schemaSql);
    console.log('Database schema initialized from server/src/db/schema.sql');
}

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = Object.assign(pool, { ensureDatabaseSchema });
