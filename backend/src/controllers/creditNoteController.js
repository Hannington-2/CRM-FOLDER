// backend/src/controllers/creditNoteController.js
const CreditNote = require('../models/CreditNote');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const generateNumber = require('../utils/generateNumber');
const notify = require('../utils/notify');

const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') return false;
    if (id === 'undefined' || id === 'null' || id === '') return false;
    return /^[a-fA-F0-9]{24}$/.test(id);
};

// Helper: recalculate invoice totals after credits
const recalcInvoiceWithCredits = async (invoiceId) => {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return null;

    const result = await CreditNote.aggregate([
        { $match: { invoice: invoice._id, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCredited = result[0]?.total || 0;

    invoice.totalCredited = totalCredited;
    invoice.netTotal = Math.max(0, invoice.total - totalCredited);
    invoice.balance = Math.max(0, invoice.netTotal - invoice.totalPaid);

    if (invoice.status !== 'cancelled') {
        if (invoice.balance <= 0) invoice.status = 'paid';
        else if (invoice.totalPaid > 0) invoice.status = 'partially_paid';
        else if (new Date() > invoice.dueDate) invoice.status = 'overdue';
        else invoice.status = 'unpaid';
    }

    await invoice.save();
    return invoice;
};

// @desc    Get all credit notes
// @route   GET /api/credit-notes
exports.getCreditNotes = async (req, res) => {
    try {
        const notes = await CreditNote.find()
            .populate('client', 'name email code')
            .populate('invoice', 'invoiceNumber total')
            .populate('issuedBy', 'name')
            .sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single credit note
// @route   GET /api/credit-notes/:id
exports.getCreditNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid credit note ID' });
        }

        const note = await CreditNote.findById(id)
            .populate('client')
            .populate('invoice')
            .populate('issuedBy', 'name email');
        if (!note) return res.status(404).json({ message: 'Credit note not found' });
        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a credit note
// @route   POST /api/credit-notes
exports.createCreditNote = async (req, res) => {
    try {
        const { invoice: invoiceId, amount, reason, notes } = req.body;

        if (!invoiceId || !amount || !reason) {
            return res.status(400).json({
                message: 'Invoice, amount, and reason are required'
            });
        }

        if (!isValidObjectId(invoiceId)) {
            return res.status(400).json({ message: 'Invalid invoice ID' });
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        if (invoice.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot credit a cancelled invoice' });
        }

        const existing = await CreditNote.aggregate([
            { $match: { invoice: invoice._id, status: 'active' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const alreadyCredited = existing[0]?.total || 0;
        const remainingCreditable = invoice.total - alreadyCredited;

        if (Number(amount) > remainingCreditable) {
            return res.status(400).json({
                message: `Credit amount exceeds remaining creditable balance. Remaining: KES ${remainingCreditable.toLocaleString()}`
            });
        }

        const client = await Client.findById(invoice.client);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        const creditNoteNumber = await generateNumber('CRN', client.code, req.organization._id);

        const creditNote = await CreditNote.create({
            creditNoteNumber,
            client: client._id,
            invoice: invoice._id,
            amount: Number(amount),
            reason,
            notes,
            issuedBy: req.user.id
        });

        const updatedInvoice = await recalcInvoiceWithCredits(invoice._id);

        notify({
            organizationId: req.organization._id,
            userId: null,
            type: 'invoice_created',
            title: '📝 Credit Note Issued',
            message: `${client.name} — ${creditNoteNumber} for KES ${amount.toLocaleString()}`,
            link: '/dashboard/invoices',
            data: {
                creditNoteId: creditNote._id,
                creditNoteNumber,
                amount,
                invoiceNumber: invoice.invoiceNumber
            }
        }).catch(err => console.error('Notify failed:', err.message));

        res.status(201).json({
            creditNote,
            invoice: {
                _id: updatedInvoice._id,
                invoiceNumber: updatedInvoice.invoiceNumber,
                total: updatedInvoice.total,
                totalCredited: updatedInvoice.totalCredited,
                netTotal: updatedInvoice.netTotal,
                totalPaid: updatedInvoice.totalPaid,
                balance: updatedInvoice.balance,
                status: updatedInvoice.status
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to create credit note' });
    }
};

// @desc    Cancel a credit note (soft delete)
// @route   DELETE /api/credit-notes/:id
exports.cancelCreditNote = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid credit note ID' });
        }

        const note = await CreditNote.findById(id);
        if (!note) return res.status(404).json({ message: 'Credit note not found' });
        if (note.status === 'cancelled') {
            return res.status(400).json({ message: 'Credit note already cancelled' });
        }

        note.status = 'cancelled';
        note.cancelledAt = new Date();
        note.cancelledBy = req.user.id;
        await note.save();

        const updatedInvoice = await recalcInvoiceWithCredits(note.invoice);

        res.json({
            message: 'Credit note cancelled',
            creditNote: note,
            invoice: updatedInvoice
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.recalcInvoiceWithCredits = recalcInvoiceWithCredits;