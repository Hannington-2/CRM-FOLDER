const express = require('express');
const router = express.Router();
const {
    getReceipts,
    getReceiptById
} = require('../controllers/receiptController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.route('/')
    .get(getReceipts);

router.route('/:id')
    .get(getReceiptById);

module.exports = router;