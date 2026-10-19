// backend/src/utils/generateNumber.js
const Counter = require('../models/Counter');

/**
 * Generate a formatted document number, scoped per organization.
 */
const generateNumber = async (type, clientCode = 'GEN', organizationId = null) => {
    const cleanCode = String(clientCode).toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Include organization in the counter key so each org has its own sequence
    const orgPrefix = organizationId ? `${organizationId}-` : '';
    const counterKey = `${orgPrefix}${type.toLowerCase()}-${cleanCode}`;

    const seq = await Counter.getNextSequence(counterKey);
    const padded = String(seq).padStart(6, '0');

    if (type === 'INV') return `${cleanCode}${padded}`;
    return `${type}-${cleanCode}${padded}`;
};

module.exports = generateNumber;