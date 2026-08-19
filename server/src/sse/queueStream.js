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
            const result = await pool.query(
                `SELECT t.id, t.sequence_number, t.status, t.priority_level,
                        p.name, p.language_preference
                 FROM ticket t
                 JOIN patient p ON p.id = t.patient_id
                 WHERE t.id = $1;`,
                [id]
            );

            if (result.rows.length > 0) {
                sendEvent('queue_update', {
                    ticket: result.rows[0],
                    updatedAt: new Date().toISOString(),
                });
            }
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
