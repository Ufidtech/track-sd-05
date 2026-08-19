const express = require('express');
const { pullNextPatient } = require('../controllers/doctorController');

const router = express.Router();

router.post('/doctors/:id/next', pullNextPatient);

module.exports = router;
