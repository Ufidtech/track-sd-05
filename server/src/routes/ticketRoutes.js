const express = require('express');
const { registerTicket } = require('../controllers/ticketController');
const idempotencyMiddleware = require('../middleware/idempotency');
const { streamTicket } = require('../sse/queueStream');

const router = express.Router();

router.post('/tickets', idempotencyMiddleware, registerTicket);
router.get('/tickets/:id/stream', streamTicket);

module.exports = router;
