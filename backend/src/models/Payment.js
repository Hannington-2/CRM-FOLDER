// backend/src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    paymentNumber: { type: String, required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, default: Date.now },
    method: {
        type: String,
        enum: ['mpesa', 'bank_transfer', 'cash', 'cheque', 'card', 'other'],
        required: true
    },
    reference: String,
    notes: String,
    status: {
        type: String,
        enum: ['active', 'reversed', 'cancelled'],
        default: 'active'
    },

    idempotencyKey: { type: String, default: undefined },

    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ===== UNIQUE PER ORGANIZATION =====
paymentSchema.index({ organization: 1, paymentNumber: 1 }, { unique: true });

// ===== PARTIAL UNIQUE (only when idempotencyKey is a string) =====
paymentSchema.index(
    { organization: 1, idempotencyKey: 1 },
    {
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string' } }
    }
);

module.exports = mongoose.model('Payment', paymentSchema);