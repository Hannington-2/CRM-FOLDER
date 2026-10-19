// backend/src/models/Receipt.js
const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    receiptNumber: { type: String, required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    amount: { type: Number, required: true },
    issuedDate: { type: Date, default: Date.now },
    cancelled: { type: Boolean, default: false },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ===== UNIQUE PER ORGANIZATION =====
receiptSchema.index({ organization: 1, receiptNumber: 1 }, { unique: true });

// One receipt per payment
receiptSchema.index({ organization: 1, payment: 1 }, { unique: true });

module.exports = mongoose.model('Receipt', receiptSchema);