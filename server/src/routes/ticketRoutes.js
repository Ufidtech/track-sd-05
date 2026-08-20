const express = require('express');
const {
    registerTicket,
    getQueueSummary,
    updateTicketStatus,
} = require('../controllers/ticketController');
const idempotencyMiddleware = require('../middleware/idempotency');
const { streamTicket } = require('../sse/queueStream');

const router = express.Router();

router.get('/tickets/queue', getQueueSummary);
router.post('/tickets', idempotencyMiddleware, registerTicket);
router.get('/tickets/:id/stream', streamTicket);

router.post('/tickets/:id/hold', async (req, res) => {
    try {
        const ticket = await updateTicketStatus(req.params.id, 'HELD');
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ticket held',
            ticket,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to hold ticket',
            error: error.message,
        });
    }
});

router.post('/tickets/:id/recall', async (req, res) => {
    try {
        const ticket = await updateTicketStatus(req.params.id, 'RECALLED');
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ticket recalled',
            ticket,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to recall ticket',
            error: error.message,
        });
    }
});

module.exports = router;