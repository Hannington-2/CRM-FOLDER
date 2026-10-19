// backend/src/models/Client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 10
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    kraPin: { type: String, trim: true },
    address: {
        street: String,
        city: String,
        postalCode: String,
        country: { type: String, default: 'Kenya' }
    },
    contactPerson: {
        name: String,
        email: String,
        phone: String
    },
    notes: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    creditBalance: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ===== UNIQUE PER ORGANIZATION =====
// Client code must be unique within the same organization
clientSchema.index({ organization: 1, code: 1 }, { unique: true });

// Client email must be unique within the same organization
clientSchema.index(
    { organization: 1, email: 1 },
    {
        unique: true,
        partialFilterExpression: { email: { $type: 'string', $ne: '' } }
    }
);

// Combined name + email must be unique within organization
clientSchema.index(
    { organization: 1, name: 1, email: 1 },
    {
        unique: true,
        partialFilterExpression: { email: { $type: 'string', $ne: '' } }
    }
);

module.exports = mongoose.model('Client', clientSchema);