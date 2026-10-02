const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 6
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);