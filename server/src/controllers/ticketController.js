const pool = require('../config/db');

const TICKET_STATUS_FLOW = ['REGISTERED', 'ACTIVE', 'IN_CONSULT', 'COMPLETE'];

function nextTicketStatus(currentStatus) {
    const currentIndex = TICKET_STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === TICKET_STATUS_FLOW.length - 1) {
        return currentStatus;
    }

    return TICKET_STATUS_FLOW[currentIndex + 1];
}

async function updateTicketStatus(ticketId, nextStatus) {
    const validStatuses = new Set([...TICKET_STATUS_FLOW, 'HELD', 'RECALLED', 'EXPIRED']);

    if (!validStatuses.has(nextStatus)) {
        throw new Error(`Unsupported ticket status: ${nextStatus}`);
    }

    const result = await pool.query(
        `UPDATE ticket
         SET status = $1
         WHERE id = $2
         RETURNING id, status;`,
        [nextStatus, ticketId]
    );

    return result.rows[0] || null;
}

async function expireStaleTickets() {
    const result = await pool.query(
        `UPDATE ticket
         SET status = 'EXPIRED'
         WHERE status NOT IN ('COMPLETE', 'EXPIRED')
           AND created_at < NOW() - INTERVAL '3 hours';
         RETURNING id, status;`
    );

    return result.rows;
}

async function registerTicket(req, res) {
    const {
        name,
        phone,
        language_preference,
        registration_channel,
        priority_level,
        visual_identifier,
    } = req.body || {};

    const key = req.idempotencyKey;
    const { idempotencyStore } = req;

    if (!name || !phone || !language_preference || !registration_channel || !priority_level || !visual_identifier) {
        return res.status(400).json({
            success: false,
            message: 'Missing required registration fields',
        });
    }

    if (!['app', 'proxy'].includes(registration_channel)) {
        return res.status(400).json({
            success: false,
            message: 'registration_channel must be app or proxy',
        });
    }

    if (!['scheduled', 'virtual_walkin', 'manual_proxy'].includes(priority_level)) {
        return res.status(400).json({
            success: false,
            message: 'priority_level must be scheduled, virtual_walkin, or manual_proxy',
        });
    }

    try {
        const patientInsert = await pool.query(
            `INSERT INTO patient (name, phone, language_preference, registration_channel)
             VALUES ($1, $2, $3, $4)
             RETURNING id;`,
            [name, phone, language_preference, registration_channel]
        );

        const patientId = patientInsert.rows[0].id;

        const sequenceResult = await pool.query(
            `SELECT nextval('ticket_number_seq') AS sequence_number;`
        );
        const sequenceNumber = sequenceResult.rows[0].sequence_number;

        const ticketInsert = await pool.query(
            `INSERT INTO ticket (patient_id, sequence_number, priority_level, visual_identifier, status)
             VALUES ($1, $2, $3, $4, 'REGISTERED')
             RETURNING id, patient_id, sequence_number, priority_level, visual_identifier, status, created_at;`,
            [patientId, sequenceNumber, priority_level, visual_identifier]
        );

        const response = {
            success: true,
            ticket: ticketInsert.rows[0],
        };

        idempotencyStore.set(key, {
            statusCode: 201,
            body: response,
        });

        return res.status(201).json(response);
    } catch (error) {
        console.error('Ticket registration failed:', error);
        const failureResponse = {
            success: false,
            message: 'Ticket registration failed',
            error: error.message,
        };

        idempotencyStore.set(key, {
            statusCode: 400,
            body: failureResponse,
        });

        return res.status(400).json(failureResponse);
    }
}

module.exports = {
    registerTicket,
    nextTicketStatus,
    updateTicketStatus,
    expireStaleTickets,
};
