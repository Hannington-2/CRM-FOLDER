const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [100, 'Name is too long']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'staff', 'client'],
        default: 'staff'
    },

    // ===== SECURITY FIELDS =====
    failedLoginAttempts: {
        type: Number,
        default: 0,
        select: false
    },
    lockoutUntil: {
        type: Date,
        select: false
    },
    lastLogin: Date,
    lastLoginIP: String,
    passwordChangedAt: Date,
    isActive: {
        type: Boolean,
        default: true
    },

    // Track password reset flow
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false }

}, { timestamps: true });

// Method to check if account is locked
userSchema.methods.isLocked = function () {
    return !!(this.lockoutUntil && this.lockoutUntil > Date.now());
};

module.exports = mongoose.model('User', userSchema);