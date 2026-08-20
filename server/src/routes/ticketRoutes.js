const express = require('express');
const { registerTicket, getQueueSummary } = require('../controllers/ticketController');
const idempotencyMiddleware = require('../middleware/idempotency');
const { streamTicket } = require('../sse/queueStream');

const router = express.Router();

router.get('/tickets/queue', getQueueSummary);
router.post('/tickets', idempotencyMiddleware, registerTicket);
router.get('/tickets/:id/stream', streamTicket);

module.exports = router;
