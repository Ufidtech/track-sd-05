const pool = require('../config/db');
const { updateTicketStatus } = require('./ticketController');

async function pullNextPatient(req, res) {
    const { id: doctorId } = req.params;

    if (!doctorId) {
        return res.status(400).json({
            success: false,
            message: 'Doctor id is required',
        });
    }

    try {
        const nextTicketQuery = await pool.query(
            `SELECT t.id, t.sequence_number, t.priority_level, t.visual_identifier, t.status,
                    p.name, p.phone, p.language_preference, p.registration_channel
             FROM ticket t
             JOIN patient p ON p.id = t.patient_id
             WHERE t.status IN ('REGISTERED', 'ACTIVE')
             ORDER BY
                 CASE t.priority_level
                     WHEN 'scheduled' THEN 1
                     WHEN 'virtual_walkin' THEN 2
                     WHEN 'manual_proxy' THEN 3
                 END,
                 t.sequence_number ASC
             LIMIT 1;`
        );

        if (nextTicketQuery.rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No patient is currently waiting in the queue',
                ticket: null,
            });
        }

        const nextTicket = nextTicketQuery.rows[0];

        const updatedTicket = await pool.query(
            `UPDATE ticket
             SET status = 'IN_CONSULT'
             WHERE id = $1
             RETURNING id, patient_id, sequence_number, priority_level, visual_identifier, status, created_at;`,
            [nextTicket.id]
        );

        const consultationRecord = await pool.query(
            `INSERT INTO consultation (ticket_id, doctor_id, started_at, ended_at, delta_minutes)
             VALUES ($1, $2, NOW(), NULL, NULL)
             RETURNING id, ticket_id, doctor_id, started_at;`,
            [nextTicket.id, doctorId]
        );

        return res.status(200).json({
            success: true,
            ticket: updatedTicket.rows[0],
            patient: {
                name: nextTicket.name,
                phone: nextTicket.phone,
                language_preference: nextTicket.language_preference,
                registration_channel: nextTicket.registration_channel,
            },
            consultation: consultationRecord.rows[0],
        });
    } catch (error) {
        console.error('Failed to pull next patient:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to pull next patient from queue',
            error: error.message,
        });
    }
}

async function completeConsultation(req, res) {
    const { id: doctorId } = req.params;
    const { ticketId } = req.body || {};

    if (!doctorId) {
        return res.status(400).json({
            success: false,
            message: 'Doctor id is required',
        });
    }

    if (!ticketId) {
        return res.status(400).json({
            success: false,
            message: 'ticketId is required',
        });
    }

    try {
        const consultationResult = await pool.query(
            `SELECT id, ticket_id, doctor_id, started_at
             FROM consultation
             WHERE ticket_id = $1
               AND doctor_id = $2
               AND ended_at IS NULL
             ORDER BY started_at DESC
             LIMIT 1;`,
            [ticketId, doctorId]
        );

        if (consultationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Active consultation not found for this doctor and ticket',
            });
        }

        const consultation = consultationResult.rows[0];

        await pool.query(
            `UPDATE consultation
             SET ended_at = NOW(),
                 delta_minutes = GREATEST(
                     0,
                     EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
                 )::int
             WHERE id = $1;`,
            [consultation.id]
        );

        const updatedTicket = await updateTicketStatus(ticketId, 'COMPLETE');

        return res.status(200).json({
            success: true,
            message: 'Consultation completed',
            ticket: updatedTicket,
            consultation: {
                ...consultation,
                ended_at: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Failed to complete consultation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to complete consultation',
            error: error.message,
        });
    }
}

module.exports = {
    pullNextPatient,
    completeConsultation,
};