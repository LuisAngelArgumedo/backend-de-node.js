const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/registrar', authController.registrar);
router.post('/solicitar-reset', authController.solicitarReset);
router.post('/resetear', authController.resetear);

module.exports = router;

