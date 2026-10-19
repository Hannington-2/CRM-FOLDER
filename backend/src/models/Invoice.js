// backend/src/models/Invoice.js
const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, default: 0, min: 0 }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    invoiceNumber: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, default: 16 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    totalCredited: { type: Number, default: 0 },
    netTotal: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'],
        default: 'unpaid'
    },
    notes: String,

    idempotencyKey: { type: String, default: undefined },
    duplicateFingerprint: { type: String, default: undefined },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ===== UNIQUE PER ORGANIZATION =====
invoiceSchema.index({ organization: 1, invoiceNumber: 1 }, { unique: true });

// ===== PARTIAL UNIQUE (only when idempotencyKey is a string) =====
invoiceSchema.index(
    { organization: 1, idempotencyKey: 1 },
    {
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string' } }
    }
);

invoiceSchema.pre('save', function () {
    this.items.forEach(item => {
        item.amount = item.quantity * item.unitPrice;
    });
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
    this.taxAmount = (this.subtotal * (this.taxRate || 0)) / 100;
    this.total = this.subtotal + this.taxAmount;
    this.netTotal = Math.max(0, this.total - (this.totalCredited || 0));
    this.balance = Math.max(0, this.netTotal - (this.totalPaid || 0));

    if (this.status !== 'cancelled') {
        if (this.balance <= 0) this.status = 'paid';
        else if (this.totalPaid > 0) this.status = 'partially_paid';
        else if (new Date() > this.dueDate) this.status = 'overdue';
        else this.status = 'unpaid';
    }
});

module.exports = mongoose.model('Invoice', invoiceSchema);