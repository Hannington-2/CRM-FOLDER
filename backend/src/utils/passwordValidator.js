// backend/src/utils/passwordValidator.js

const COMMON_PASSWORDS = [
    'password', 'password123', '12345678', '123456789', 'qwerty123',
    'admin123', 'letmein', 'welcome', 'monkey', 'dragon',
    'abc12345', 'password1', 'admin@123', 'welcome123'
];

/**
 * Validate password strength.
 * Returns { valid: boolean, errors: string[] }
 */
exports.validatePassword = (password) => {
    const errors = [];

    if (!password) {
        return { valid: false, errors: ['Password is required'] };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
        errors.push('Password is too long (max 128 characters)');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Optional: require special character
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //     errors.push('Password must contain at least one special character');
    // }

    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        errors.push('Password is too common. Please choose a stronger one');
    }

    return { valid: errors.length === 0, errors };
};