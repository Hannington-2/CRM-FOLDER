// backend/src/controllers/clientController.js
const Client = require('../models/Client');
const notify = require('../utils/notify');

// ===== HELPERS =====
const generateClientCode = (name) => {
    if (!name) return 'CLI';
    const words = String(name).trim().split(/\s+/);
    let code = words.map(w => w[0]).join('').toUpperCase();

    if (code.length < 3) {
        code = String(name).replace(/[^A-Za-z]/g, '').substring(0, 5).toUpperCase();
    }

    return code.substring(0, 6);
};

const ensureUniqueCode = async (baseCode, excludeId = null) => {
    let code = baseCode;
    let suffix = 0;
    let exists = true;

    while (exists) {
        const query = { code };
        if (excludeId) query._id = { $ne: excludeId };
        const found = await Client.findOne(query);
        if (!found) {
            exists = false;
        } else {
            suffix += 1;
            code = `${baseCode}${suffix}`.substring(0, 6);
        }
    }

    return code;
};

// ============================================
// @desc    Get all clients
// @route   GET /api/clients
// ============================================
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// @desc    Get single client
// @route   GET /api/clients/:id
// ============================================
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// @desc    Create client (with duplicate prevention)
// @route   POST /api/clients
// ============================================
exports.createClient = async (req, res) => {
    try {
        const { name, code, email, phone, ...rest } = req.body;

        // ===== DUPLICATE PREVENTION =====
        if (email && email.trim()) {
            const existing = await Client.findOne({
                email: email.toLowerCase().trim()
            });
            if (existing) {
                return res.status(409).json({
                    message: `A client with this email already exists: ${existing.name} (${existing.code})`,
                    existingClientId: existing._id
                });
            }
        }

        if (!email && name && phone) {
            const existing = await Client.findOne({
                name: name.trim(),
                phone: phone.trim()
            });
            if (existing) {
                return res.status(409).json({
                    message: `A client with this name and phone already exists: ${existing.code}`,
                    existingClientId: existing._id
                });
            }
        }

        // ===== AUTO-GENERATE CODE =====
        let clientCode = code && code.trim()
            ? code.trim().toUpperCase()
            : generateClientCode(name);
        clientCode = await ensureUniqueCode(clientCode);

        // ===== CREATE =====
        const client = await Client.create({
            ...rest,
            name: name.trim(),
            email: email ? email.toLowerCase().trim() : '',
            phone: phone ? phone.trim() : '',
            code: clientCode,
            createdBy: req.user.id
        });

        notify({
            userId: null,
            type: 'client_added',
            title: '👤 New Client Added',
            message: `${client.name} (${clientCode}) has been added to the system`,
            link: '/dashboard/clients',
            data: { clientId: client._id, clientName: client.name, clientCode }
        }).catch(err => console.error('Notify failed:', err.message));

        res.status(201).json(client);
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'A client with this email already exists'
            });
        }
        res.status(400).json({ message: error.message || 'Failed to create client' });
    }
};

// ============================================
// @desc    Update client
// @route   PUT /api/clients/:id
// ============================================
exports.updateClient = async (req, res) => {
    try {
        const { code, ...rest } = req.body;

        if (code) {
            rest.code = await ensureUniqueCode(
                code.trim().toUpperCase(),
                req.params.id
            );
        }

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            rest,
            { new: true, runValidators: true }
        );
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.json(client);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to update client' });
    }
};

// ============================================
// @desc    Delete client
// @route   DELETE /api/clients/:id
// ============================================
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// @desc    Migrate existing clients to have codes
// @route   POST /api/clients/migrate-codes
// ============================================
exports.migrateClientCodes = async (req, res) => {
    try {
        const clientsWithoutCode = await Client.find({
            $or: [
                { code: { $exists: false } },
                { code: null },
                { code: '' }
            ]
        });

        let updated = 0;
        for (const client of clientsWithoutCode) {
            const baseCode = generateClientCode(client.name);
            const uniqueCode = await ensureUniqueCode(baseCode, client._id);
            client.code = uniqueCode;
            await client.save();
            updated++;
        }

        res.json({
            message: `Migration complete. ${updated} clients updated.`,
            updated
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Migration failed', error: error.message });
    }
};

// ============================================
// @desc    Get full financial statement for a client
// @route   GET /api/clients/:id/statement
// ============================================
exports.getClientStatement = async (req, res) => {
    try {
        const Invoice = require('../models/Invoice');
        const Payment = require('../models/Payment');
        const CreditNote = require('../models/CreditNote');
        const Receipt = require('../models/Receipt');

        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        const [invoices, payments, creditNotes, receipts] = await Promise.all([
            Invoice.find({ client: client._id }).sort({ createdAt: 1 }),
            Payment.find({ client: client._id, status: 'active' }).sort({ paymentDate: 1 }),
            CreditNote.find({ client: client._id, status: 'active' }).sort({ issuedAt: 1 }),
            Receipt.find({ client: client._id }).sort({ issuedDate: 1 })
        ]);

        const ledger = [];

        invoices.forEach(inv => {
            ledger.push({
                date: inv.issueDate || inv.createdAt,
                type: 'invoice',
                reference: inv.invoiceNumber,
                description: `Invoice — ${inv.items?.[0]?.description || 'Services'}`,
                debit: inv.total,
                credit: 0,
                documentId: inv._id,
                link: '/dashboard/invoices'
            });
        });

        creditNotes.forEach(cn => {
            ledger.push({
                date: cn.issuedAt || cn.createdAt,
                type: 'credit_note',
                reference: cn.creditNoteNumber,
                description: `Credit Note — ${(cn.reason || '').replace('_', ' ')}`,
                debit: 0,
                credit: cn.amount,
                documentId: cn._id,
                link: '/dashboard/invoices'
            });
        });

        payments.forEach(p => {
            ledger.push({
                date: p.paymentDate || p.createdAt,
                type: 'payment',
                reference: p.paymentNumber,
                description: `Payment — ${(p.method || '').replace('_', ' ')}${p.reference ? ` (${p.reference})` : ''}`,
                debit: 0,
                credit: p.amount,
                documentId: p._id,
                link: '/dashboard/payments'
            });
        });

        ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

        let runningBalance = 0;
        const ledgerWithBalance = ledger.map(entry => {
            runningBalance += entry.debit - entry.credit;
            return { ...entry, runningBalance };
        });

        const totalInvoiced = invoices
            .filter(i => i.status !== 'cancelled')
            .reduce((s, i) => s + i.total, 0);
        const totalCredited = creditNotes.reduce((s, c) => s + c.amount, 0);
        const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
        const outstanding = invoices
            .filter(i => i.status !== 'cancelled')
            .reduce((s, i) => s + i.balance, 0);

        res.json({
            client: {
                _id: client._id,
                code: client.code,
                name: client.name,
                email: client.email,
                phone: client.phone,
                creditBalance: client.creditBalance || 0
            },
            summary: {
                totalInvoiced,
                totalCredited,
                totalPaid,
                outstanding,
                creditBalance: client.creditBalance || 0,
                invoiceCount: invoices.filter(i => i.status !== 'cancelled').length,
                paymentCount: payments.length,
                creditNoteCount: creditNotes.length,
                receiptCount: receipts.length
            },
            ledger: ledgerWithBalance,
            receipts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};