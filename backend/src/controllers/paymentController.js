const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Receipt = require('../models/Receipt');
const generateNumber = require('../utils/generateNumber');

// Helper: recalculate invoice totals from all active payments
const recalcInvoice = async (invoiceId) => {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return null;

    // Sum all active payments for this invoice
    const result = await Payment.aggregate([
        { $match: { invoice: invoice._id, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPaid = result[0]?.total || 0;
    invoice.totalPaid = totalPaid;
    invoice.balance = Math.max(0, invoice.total - totalPaid);

    // Update status
    if (invoice.status !== 'cancelled') {
        if (invoice.balance <= 0) invoice.status = 'paid';
        else if (invoice.totalPaid > 0) invoice.status = 'partially_paid';
        else if (new Date() > invoice.dueDate) invoice.status = 'overdue';
        else invoice.status = 'unpaid';
    }

    await invoice.save();
    return invoice;
};

// @desc    Get all payments
// @route   GET /api/payments
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('client', 'name email')
            .populate('invoice', 'invoiceNumber total balance status')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('client', 'name email')
            .populate('invoice', 'invoiceNumber total balance status');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Record a new payment
// @route   POST /api/payments
exports.createPayment = async (req, res) => {
    try {
        const { invoice: invoiceId, amount, method, reference, notes, paymentDate } = req.body;

        // 1. Find the invoice
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot pay a cancelled invoice' });
        }

        // 2. Prevent overpayment
        if (amount > invoice.balance) {
            return res.status(400).json({
                message: `Payment exceeds outstanding balance. Outstanding: KES ${invoice.balance.toLocaleString()}, Entered: KES ${amount.toLocaleString()}`
            });
        }

        // 3. Generate payment number
        const paymentNumber = await generateNumber('PAY');

        // 4. Create the payment
        const payment = await Payment.create({
            paymentNumber,
            invoice: invoice._id,
            client: invoice.client,
            amount,
            method,
            reference,
            notes,
            paymentDate: paymentDate || new Date(),
            recordedBy: req.user.id
        });

        // 5. Recalculate invoice
        const updatedInvoice = await recalcInvoice(invoice._id);

        // 6. Auto-generate a receipt
        const receiptNumber = await generateNumber('REC');
        const receipt = await Receipt.create({
            receiptNumber,
            payment: payment._id,
            invoice: invoice._id,
            client: invoice.client,
            amount,
            issuedBy: req.user.id
        });

        res.status(201).json({
            payment,
            receipt,
            invoice: {
                _id: updatedInvoice._id,
                invoiceNumber: updatedInvoice.invoiceNumber,
                total: updatedInvoice.total,
                totalPaid: updatedInvoice.totalPaid,
                balance: updatedInvoice.balance,
                status: updatedInvoice.status
            }
        });

    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to record payment' });
    }
};

// @desc    Reverse a payment (soft delete + audit trail)
// @route   DELETE /api/payments/:id
exports.reversePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (payment.status === 'reversed') {
            return res.status(400).json({ message: 'Payment already reversed' });
        }

        payment.status = 'reversed';
        await payment.save();

        // Mark receipt as cancelled (or delete — we'll cancel for audit)
        await Receipt.findOneAndUpdate(
            { payment: payment._id },
            { $set: { cancelled: true } }
        );

        // Recalculate invoice
        const updatedInvoice = await recalcInvoice(payment.invoice);

        res.json({
            message: 'Payment reversed',
            payment,
            invoice: {
                invoiceNumber: updatedInvoice.invoiceNumber,
                totalPaid: updatedInvoice.totalPaid,
                balance: updatedInvoice.balance,
                status: updatedInvoice.status
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};