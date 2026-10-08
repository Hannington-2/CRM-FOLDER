// backend/src/utils/generateNumber.js
const Counter = require('../models/Counter');

/**
 * Generate a formatted document number.
 *
 * Formats:
 *   Invoice:     {clientCode}{6-digit-sequence}       e.g. KRACU000001
 *   Receipt:     RCT-{clientCode}{6-digit-sequence}   e.g. RCT-KRACU000001
 *   Payment:     PAY-{clientCode}{6-digit-sequence}   e.g. PAY-KRACU000001
 *   Credit Note: CRN-{clientCode}{6-digit-sequence}   e.g. CRN-KRACU000001
 */
const generateNumber = async (type, clientCode = 'GEN') => {
    const cleanCode = String(clientCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const counterKey = `${type.toLowerCase()}-${cleanCode}`;
    const seq = await Counter.getNextSequence(counterKey);
    const padded = String(seq).padStart(6, '0');

    if (type === 'INV') {
        return `${cleanCode}${padded}`;
    }
    return `${type}-${cleanCode}${padded}`;
};

module.exports = generateNumber;