// backend/src/models/Organization.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    type: {
        type: String,
        enum: ['demo', 'company'],
        required: true
    },
    logoUrl: { type: String, default: '/Nairobi-Forensics-LLP-Logo.webp' },
    themeColor: { type: String, default: '#050A30' },
    isActive: { type: Boolean, default: true },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);