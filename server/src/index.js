require('dotenv').config();
const express = require('express');
const db = require('./config/db');
const pool = db;
const { ensureDatabaseSchema } = db;
const ticketRoutes = require('./routes/ticketRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.disable('x-powered-by');

app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const isAllowedOrigin = !requestOrigin || allowedOrigins.includes(requestOrigin);
    const chosenOrigin = isAllowedOrigin ? (requestOrigin || allowedOrigins[0]) : allowedOrigins[0];

    res.setHeader('Access-Control-Allow-Origin', chosenOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, Origin, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    return next();
});

app.use(express.json());

app.get('/health/db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name');
        res.json({
            success: true,
            database: result.rows[0].db_name,
            current_time: result.rows[0].current_time,
            environment: process.env.NODE_ENV || 'development',
        });
    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message,
        });
    }
});

app.use(ticketRoutes);
app.use(doctorRoutes);

async function startServer() {
    try {
        await ensureDatabaseSchema();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize application database schema:', error);
        process.exit(1);
    }
}

startServer();
