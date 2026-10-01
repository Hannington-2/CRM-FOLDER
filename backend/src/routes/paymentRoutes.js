const express = require('express');
const router = express.Router();
const {
    getPayments,
    getPaymentById,
    createPayment,
    reversePayment
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.route('/')
    .get(getPayments)
    .post(createPayment);

router.route('/:id')
    .get(getPaymentById)
    .delete(reversePayment);

module.exports = router;