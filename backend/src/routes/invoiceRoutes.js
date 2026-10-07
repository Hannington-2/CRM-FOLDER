const express = require('express');
const router = express.Router();
const {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    cancelInvoice,
    downloadInvoicePDF
} = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.route('/')
    .get(getInvoices)
    .post(createInvoice);

// PDF route — MUST be before /:id
router.get('/:id/pdf', downloadInvoicePDF);

router.route('/:id')
    .get(getInvoiceById)
    .put(updateInvoice)
    .delete(cancelInvoice);

module.exports = router;