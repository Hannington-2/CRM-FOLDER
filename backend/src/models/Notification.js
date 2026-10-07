const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
        type: String,
        enum: ['invoice_created', 'payment_received', 'receipt_generated', 'client_added', 'invoice_overdue', 'system'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    data: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: Date
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);