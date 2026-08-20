const express = require('express');
const { pullNextPatient, completeConsultation } = require('../controllers/doctorController');

const router = express.Router();

router.post('/doctors/:id/next', pullNextPatient);
router.post('/doctors/:id/complete', completeConsultation);

module.exports = router;