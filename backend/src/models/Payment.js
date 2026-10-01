const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentNumber: { type: String, required: true, unique: true },
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

    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);