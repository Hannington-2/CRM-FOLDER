const Counter = require('../models/Counter');

/**
 * Generate a formatted document number.
 * @param {string} prefix - 'INV', 'PAY', or 'REC'
 * @returns {Promise<string>} e.g. 'INV-2026-000001'
 */
const generateNumber = async (prefix) => {
    const year = new Date().getFullYear();
    const key = `${prefix.toLowerCase()}-${year}`;
    const seq = await Counter.getNextSequence(key);
    const padded = String(seq).padStart(6, '0');
    return `${prefix}-${year}-${padded}`;
};

module.exports = generateNumber;