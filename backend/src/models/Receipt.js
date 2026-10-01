const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    receiptNumber: { type: String, required: true, unique: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, unique: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

    amount: { type: Number, required: true },
    issuedDate: { type: Date, default: Date.now },

    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);