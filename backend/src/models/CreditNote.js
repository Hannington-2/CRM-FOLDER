// backend/src/models/CreditNote.js
const mongoose = require('mongoose');

const creditNoteSchema = new mongoose.Schema({
    creditNoteNumber: { type: String, required: true, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    reason: {
        type: String,
        required: true,
        enum: [
            'data_entry_error',
            'discount',
            'service_not_rendered',
            'client_complaint',
            'billing_adjustment',
            'other'
        ]
    },
    notes: { type: String, trim: true },
    status: {
        type: String,
        enum: ['active', 'cancelled'],
        default: 'active'
    },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now },
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

creditNoteSchema.index({ client: 1, createdAt: -1 });
creditNoteSchema.index({ invoice: 1 });

module.exports = mongoose.model('CreditNote', creditNoteSchema);