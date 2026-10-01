const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const generateNumber = require('../utils/generateNumber');

// @desc    Get all invoices
// @route   GET /api/invoices
exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('client', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('client', 'name email phone address');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create invoice
// @route   POST /api/invoices
exports.createInvoice = async (req, res) => {
    try {
        const { client, items, dueDate, taxRate, notes } = req.body;

        // Validate client exists
        const clientExists = await Client.findById(client);
        if (!clientExists) return res.status(404).json({ message: 'Client not found' });

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        // Generate invoice number
        const invoiceNumber = await generateNumber('INV');

        const invoice = await Invoice.create({
            invoiceNumber,
            client,
            items,
            dueDate,
            taxRate: taxRate ?? 16,
            notes,
            createdBy: req.user.id
        });

        res.status(201).json(invoice);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to create invoice' });
    }
};

// @desc    Update invoice (limited fields)
// @route   PUT /api/invoices/:id
exports.updateInvoice = async (req, res) => {
    try {
        const { dueDate, notes, taxRate, items } = req.body;
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Prevent editing of paid invoices
        if (invoice.status === 'paid') {
            return res.status(400).json({ message: 'Cannot edit a fully paid invoice' });
        }

        if (dueDate) invoice.dueDate = dueDate;
        if (notes !== undefined) invoice.notes = notes;
        if (taxRate !== undefined) invoice.taxRate = taxRate;
        if (items) invoice.items = items;

        await invoice.save(); // Triggers pre-save recalculation

        res.json(invoice);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to update invoice' });
    }
};

// @desc    Cancel invoice (soft delete)
// @route   DELETE /api/invoices/:id
exports.cancelInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Prevent cancellation if payments exist
        if (invoice.totalPaid > 0) {
            return res.status(400).json({
                message: 'Cannot cancel invoice with recorded payments'
            });
        }

        invoice.status = 'cancelled';
        await invoice.save();
        res.json({ message: 'Invoice cancelled', invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};