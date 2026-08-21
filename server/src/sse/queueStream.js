const pool = require('../config/db');

const SSE_HEARTBEAT_SECONDS = 25;

async function streamTicket(req, res, next) {
    const { id } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (eventName, payload) => {
        res.write(`event: ${eventName}\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const sendTicketState = async () => {
        try {
            const ticketResult = await pool.query(
                `SELECT t.id,
                        t.sequence_number,
                        t.status,
                        t.priority_level,
                        t.created_at,
                        p.name,
                        p.language_preference
                 FROM ticket t
                 JOIN patient p ON p.id = t.patient_id
                 WHERE t.id = $1;`,
                [id]
            );

            if (ticketResult.rows.length === 0) {
                return;
            }

            const currentTicket = ticketResult.rows[0];

            const queueResult = await pool.query(
                `SELECT t.id
                 FROM ticket t
                 WHERE t.status IN ('REGISTERED', 'ACTIVE', 'HELD', 'RECALLED', 'IN_CONSULT')
                 ORDER BY
                     CASE t.priority_level
                         WHEN 'scheduled' THEN 1
                         WHEN 'virtual_walkin' THEN 2
                         WHEN 'manual_proxy' THEN 3
                     END,
                     t.sequence_number ASC;`
            );

            const queuePosition = queueResult.rows.findIndex((row) => row.id === id);
            const position = queuePosition >= 0 ? queuePosition + 1 : null;

            sendEvent('queue_update', {
                ticket: currentTicket,
                position,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            sendEvent('queue_update', {
                error: error.message,
            });
        }
    };

    await sendTicketState();

    const interval = setInterval(() => {
        sendEvent('heartbeat', {
            timestamp: new Date().toISOString(),
        });
    }, SSE_HEARTBEAT_SECONDS * 1000);

    req.on('close', () => {
        clearInterval(interval);
    });
}

module.exports = {
    streamTicket,
    SSE_HEARTBEAT_SECONDS,
};