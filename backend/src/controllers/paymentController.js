// backend/src/controllers/paymentController.js
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Receipt = require('../models/Receipt');
const Client = require('../models/Client');
const generateNumber = require('../utils/generateNumber');
const notify = require('../utils/notify');

// ===== HELPER: Recalculate invoice totals =====
const recalcInvoice = async (invoiceId) => {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return null;

    const result = await Payment.aggregate([
        { $match: { invoice: invoice._id, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPaid = result[0]?.total || 0;
    invoice.totalPaid = totalPaid;

    const netTotal = invoice.netTotal || invoice.total;
    invoice.balance = Math.max(0, netTotal - totalPaid);

    if (invoice.status !== 'cancelled') {
        if (invoice.balance <= 0) invoice.status = 'paid';
        else if (invoice.totalPaid > 0) invoice.status = 'partially_paid';
        else if (new Date() > invoice.dueDate) invoice.status = 'overdue';
        else invoice.status = 'unpaid';
    }

    await invoice.save();
    return invoice;
};

// ============================================
// @desc    Get all payments
// @route   GET /api/payments
// ============================================
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('client', 'name email code')
            .populate('invoice', 'invoiceNumber total balance status')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// @desc    Get single payment
// @route   GET /api/payments/:id
// ============================================
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('client', 'name email code')
            .populate('invoice', 'invoiceNumber total balance status');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// @desc    Record a new payment (with duplicate prevention)
// @route   POST /api/payments
// ============================================
exports.createPayment = async (req, res) => {
    try {
        const {
            invoice: invoiceId, amount, method, reference, notes,
            paymentDate, idempotencyKey
        } = req.body;

        // ===== 1. IDEMPOTENCY KEY CHECK =====
        if (idempotencyKey) {
            const existing = await Payment.findOne({ idempotencyKey });
            if (existing) {
                console.log(`⚠️ Duplicate payment blocked (idempotency key)`);
                return res.status(409).json({
                    message: 'This payment was already recorded.',
                    duplicate: true,
                    existingPaymentId: existing._id,
                    existingPaymentNumber: existing.paymentNumber
                });
            }
        }

        // ===== 2. 60-SECOND DUPLICATE CHECK =====
        const { findRecentDuplicate } = require('../utils/idempotency');
        const recentDuplicate = await findRecentDuplicate(Payment, {
            invoice: invoiceId,
            amount: Number(amount),
            method: method || 'mpesa',
            reference: reference || null
        }, 60);

        if (recentDuplicate) {
            console.log(`⚠️ Duplicate payment blocked (recent: ${recentDuplicate.paymentNumber})`);
            return res.status(409).json({
                message: 'This payment was just recorded. Please refresh to confirm.',
                duplicate: true,
                existingPaymentId: recentDuplicate._id,
                existingPaymentNumber: recentDuplicate.paymentNumber
            });
        }

        // ===== 3. VALIDATE =====
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        if (invoice.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot pay a cancelled invoice' });
        }

        const clientDoc = await Client.findById(invoice.client);
        if (!clientDoc) return res.status(404).json({ message: 'Client not found' });
        const clientCode = clientDoc.code || 'GEN';

        const paymentAmount = Number(amount);
        if (paymentAmount <= 0) {
            return res.status(400).json({ message: 'Payment amount must be greater than zero' });
        }

        // ===== 4. CREATE PAYMENT =====
        const paymentNumber = await generateNumber('PAY', clientCode, req.organization._id);
        const payment = await Payment.create({
            paymentNumber,
            invoice: invoice._id,
            client: invoice.client,
            amount: paymentAmount,
            method,
            reference,
            notes,
            paymentDate: paymentDate || new Date(),
            idempotencyKey: idempotencyKey || undefined,
            recordedBy: req.user.id
        });

        // ===== 5. RECALCULATE INVOICE =====
        const updatedInvoice = await recalcInvoice(invoice._id);

        // ===== 6. OVERPAYMENT =====
        let excess = 0;
        const invoiceBalanceBefore = invoice.balance;
        if (paymentAmount > invoiceBalanceBefore) {
            excess = paymentAmount - invoiceBalanceBefore;
            clientDoc.creditBalance = (clientDoc.creditBalance || 0) + excess;
            await clientDoc.save();
        }

        // ===== 7. RECEIPT =====
        const receiptNumber = await generateNumber('REC', clientCode, req.organization._id);
        const receipt = await Receipt.create({
            receiptNumber,
            payment: payment._id,
            invoice: invoice._id,
            client: invoice.client,
            amount: paymentAmount,
            issuedBy: req.user.id
        });

        // ===== 8. NOTIFY =====
        notify({
            organizationId: req.organization._id,
            userId: null,
            type: 'payment_received',
            title: '💰 Payment Received',
            message: `${clientDoc.name} paid KES ${paymentAmount.toLocaleString()} (${paymentNumber})`,
            link: '/dashboard/payments',
            data: {
                paymentId: payment._id,
                paymentNumber,
                amount: paymentAmount,
                excess,
                invoiceNumber: invoice.invoiceNumber,
                clientName: clientDoc.name
            }
        }).catch(err => console.error('Notify failed:', err.message));

        notify({
            userId: null,
            type: 'receipt_generated',
            title: '🧾 Receipt Generated',
            message: `${receiptNumber} issued to ${clientDoc.name}`,
            link: '/dashboard/receipts',
            data: { receiptId: receipt._id, receiptNumber, amount: paymentAmount }
        }).catch(err => console.error('Notify failed:', err.message));

        res.status(201).json({
            payment,
            receipt,
            excessCredited: excess,
            invoice: {
                _id: updatedInvoice._id,
                invoiceNumber: updatedInvoice.invoiceNumber,
                total: updatedInvoice.total,
                netTotal: updatedInvoice.netTotal,
                totalPaid: updatedInvoice.totalPaid,
                balance: updatedInvoice.balance,
                status: updatedInvoice.status
            },
            client: {
                _id: clientDoc._id,
                name: clientDoc.name,
                creditBalance: clientDoc.creditBalance
            }
        });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Duplicate payment detected',
                duplicate: true
            });
        }
        res.status(400).json({ message: error.message || 'Failed to record payment' });
    }
};

// ============================================
// @desc    Reverse a payment (soft delete)
// @route   DELETE /api/payments/:id
// ============================================
exports.reversePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        if (payment.status === 'reversed') {
            return res.status(400).json({ message: 'Payment already reversed' });
        }

        payment.status = 'reversed';
        await payment.save();

        await Receipt.findOneAndUpdate(
            { payment: payment._id },
            { $set: { cancelled: true } }
        );

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