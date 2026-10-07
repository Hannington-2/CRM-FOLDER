const express = require('express');
const router = express.Router();
const {
    getReceipts,
    getReceiptById,
    downloadReceiptPDF
} = require('../controllers/receiptController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.route('/')
    .get(getReceipts);

// PDF route — MUST be before /:id
router.get('/:id/pdf', downloadReceiptPDF);

router.route('/:id')
    .get(getReceiptById);

module.exports = router;