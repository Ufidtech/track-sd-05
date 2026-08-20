async function updateTicketStatus(ticketId, nextStatus) {
    const validStatuses = new Set([...TICKET_STATUS_FLOW, 'HELD', 'RECALLED', 'EXPIRED']);

    if (!validStatuses.has(nextStatus)) {
        throw new Error(`Unsupported ticket status: ${nextStatus}`);
    }

    const result = await pool.query(
        `UPDATE ticket
         SET status = $1
         WHERE id = $2
         RETURNING id, patient_id, sequence_number, priority_level, visual_identifier, status, created_at;`,
        [nextStatus, ticketId]
    );

    return result.rows[0] || null;
}