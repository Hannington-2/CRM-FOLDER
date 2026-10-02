const Counter = require('../models/Counter');

/**
 * Generate a formatted document number.
 *
 * Formats:
 *   Invoice:  {clientCode}{6-digit-sequence}       e.g. KRACU000001
 *   Receipt:  RCT-{clientCode}{6-digit-sequence}   e.g. RCT-KRACU000001
 *   Payment:  PAY-{clientCode}{6-digit-sequence}   e.g. PAY-KRACU000001
 *
 * @param {string} type - 'INV' | 'REC' | 'PAY'
 * @param {string} clientCode - e.g. 'KRACU'
 * @returns {Promise<string>}
 */
const generateNumber = async (type, clientCode = 'GEN') => {
    const cleanCode = String(clientCode).toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Counter key is per client per type, e.g. "inv-KRACU"
    const counterKey = `${type.toLowerCase()}-${cleanCode}`;
    const seq = await Counter.getNextSequence(counterKey);
    const padded = String(seq).padStart(6, '0');

    // Invoice format: KRACU000001 (no prefix, client code acts as prefix)
    // Receipt/Payment: RCT-KRACU000001, PAY-KRACU000001
    if (type === 'INV') {
        return `${cleanCode}${padded}`;
    }
    return `${type}-${cleanCode}${padded}`;
};

module.exports = generateNumber;