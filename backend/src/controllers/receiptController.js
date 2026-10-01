const Receipt = require('../models/Receipt');

// @desc    Get all receipts
// @route   GET /api/receipts
exports.getReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.find()
            .populate('client', 'name email')
            .populate('invoice', 'invoiceNumber total')
            .populate('payment', 'paymentNumber method reference')
            .sort({ createdAt: -1 });
        res.json(receipts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single receipt
// @route   GET /api/receipts/:id
exports.getReceiptById = async (req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id)
            .populate('client', 'name email phone address kraPin')
            .populate('invoice', 'invoiceNumber total items subtotal taxAmount')
            .populate('payment', 'paymentNumber method reference paymentDate');
        if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
        res.json(receipt);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};