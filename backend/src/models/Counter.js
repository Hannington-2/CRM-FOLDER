const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // e.g. "invoice-2026"
    sequence: { type: Number, default: 0 }
});

counterSchema.statics.getNextSequence = async function (key) {
    const counter = await this.findByIdAndUpdate(
        key,
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
    );
    return counter.sequence;
};

module.exports = mongoose.model('Counter', counterSchema);