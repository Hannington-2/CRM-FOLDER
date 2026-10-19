// backend/src/routes/exportRoutes.js
const express = require('express');
const router = express.Router();
const {
    exportClientLedger,
    exportAllPayments
} = require('../controllers/exportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/client/:id', exportClientLedger);
router.get('/payments', exportAllPayments);

module.exports = router;