// backend/src/utils/idempotency.js
const crypto = require('crypto');

exports.fingerprint = (data) => {
    const str = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(str).digest('hex');
};

exports.findRecentDuplicate = async (model, query, seconds = 60) => {
    const cutoff = new Date(Date.now() - seconds * 1000);
    return model.findOne({
        ...query,
        createdAt: { $gte: cutoff },
        status: { $ne: 'cancelled' }
    }).sort({ createdAt: -1 });
};

exports.findByKey = async (model, key) => {
    if (!key) return null;
    return model.findOne({ idempotencyKey: key });
};