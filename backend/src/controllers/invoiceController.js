// backend/src/controllers/invoiceController.js
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const generateNumber = require('../utils/generateNumber');
const notify = require('../utils/notify');

// ===== ID VALIDATION HELPER =====
const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') return false;
    if (id === 'undefined' || id === 'null' || id === '') return false;
    return /^[a-fA-F0-9]{24}$/.test(id);
};

// @desc    Get all invoices
// @route   GET /api/invoices
exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('client', 'name email phone code')
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
        const { id } = req.params;

        // ✅ GUARD: reject invalid IDs immediately — prevents the crash
        if (!isValidObjectId(id)) {
            console.warn(`⚠️ getInvoiceById called with invalid ID: "${id}"`);
            return res.status(400).json({ message: 'Invalid invoice ID' });
        }

        const invoice = await Invoice.findById(id)
            .populate('client', 'name email phone code address kraPin');
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

        const clientDoc = await Client.findById(client);
        if (!clientDoc) return res.status(404).json({ message: 'Client not found' });

        if (!clientDoc.code) {
            return res.status(400).json({
                message: 'Client has no code. Please edit the client and add a code first.'
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        const invoiceNumber = await generateNumber('INV', clientDoc.code);

        const invoice = await Invoice.create({
            invoiceNumber,
            client,
            items,
            dueDate,
            taxRate: taxRate ?? 16,
            notes,
            createdBy: req.user.id
        });

        notify({
            userId: null,
            type: 'invoice_created',
            title: '📄 New Invoice Created',
            message: `${clientDoc.name} — ${invoiceNumber} for KES ${invoice.total.toLocaleString()}`,
            link: '/dashboard/invoices',
            data: {
                invoiceId: invoice._id,
                invoiceNumber,
                amount: invoice.total,
                clientName: clientDoc.name
            }
        }).catch(err => console.error('Notify failed:', err.message));

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
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid invoice ID' });
        }

        const { dueDate, notes, taxRate, items } = req.body;
        const invoice = await Invoice.findById(id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.status === 'paid') {
            return res.status(400).json({ message: 'Cannot edit a fully paid invoice' });
        }

        if (dueDate) invoice.dueDate = dueDate;
        if (notes !== undefined) invoice.notes = notes;
        if (taxRate !== undefined) invoice.taxRate = taxRate;
        if (items) invoice.items = items;

        await invoice.save();
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
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid invoice ID' });
        }

        const invoice = await Invoice.findById(id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

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

// @desc    Download invoice as PDF
// @route   GET /api/invoices/:id/pdf
exports.downloadInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid invoice ID' });
        }

        const { generateInvoicePDF } = require('../services/pdfService');
        const invoice = await Invoice.findById(id).populate('client');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const doc = generateInvoicePDF(invoice, invoice.client);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${invoice.invoiceNumber}.pdf"`
        );

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('PDF generation failed:', error);
        res.status(500).json({ message: 'Failed to generate PDF' });
    }
};