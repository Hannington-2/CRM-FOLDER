// backend/src/controllers/exportController.js
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Invoice = require('../models/Invoice');
const { generatePaymentLedger } = require('../services/excelExport');

const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') return false;
    if (id === 'undefined' || id === 'null' || id === '') return false;
    return /^[a-fA-F0-9]{24}$/.test(id);
};

// @desc    Export payment ledger for ONE client
// @route   GET /api/exports/client/:id
// @access  Private
exports.exportClientLedger = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid client ID' });
        }

        const client = await Client.findById(id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        // Fetch all related data
        const [payments, receipts, invoices] = await Promise.all([
            Payment.find({ client: client._id, status: 'active' })
                .populate('invoice', 'invoiceNumber total netTotal')
                .sort({ paymentDate: 1 }),
            Receipt.find({ client: client._id }).populate('payment', '_id'),
            Invoice.find({ client: client._id }).populate('client', 'name code')
        ]);

        const buffer = await generatePaymentLedger(
            [client],
            payments,
            receipts,
            invoices,
            {
                singleClient: true,
                title: `${client.name} — Payment Ledger`
            }
        );

        const safeName = client.name.replace(/[^a-zA-Z0-9]/g, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${safeName}-Payments-${dateStr}.xlsx`;

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Export client ledger failed:', error);
        res.status(500).json({ message: 'Failed to generate Excel export' });
    }
};

// @desc    Export payment ledger for ALL clients
// @route   GET /api/exports/payments
// @access  Private
exports.exportAllPayments = async (req, res) => {
    try {
        const [clients, payments, receipts, invoices] = await Promise.all([
            Client.find().sort({ name: 1 }),
            Payment.find({ status: 'active' })
                .populate('client', 'name code')
                .populate('invoice', 'invoiceNumber total netTotal')
                .sort({ paymentDate: 1 }),
            Receipt.find().populate('payment', '_id'),
            Invoice.find({ status: { $ne: 'cancelled' } }).populate('client', 'name code')
        ]);

        const buffer = await generatePaymentLedger(clients, payments, receipts, invoices, {
            title: 'All Clients — Payment Ledger'
        });

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `All-Clients-Payments-${dateStr}.xlsx`;

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Export all payments failed:', error);
        res.status(500).json({ message: 'Failed to generate Excel export' });
    }
};