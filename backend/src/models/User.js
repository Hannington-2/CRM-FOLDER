const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false // Security: never return password by default in queries
    },
    role: {
        type: String,
        enum: ['admin', 'staff', 'client'],
        default: 'staff'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);