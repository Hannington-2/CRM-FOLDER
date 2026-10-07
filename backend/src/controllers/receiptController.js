const Receipt = require('../models/Receipt');
const { generateReceiptPDF } = require('../services/pdfService');

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
            .populate('invoice', 'invoiceNumber total items subtotal taxAmount createdAt issueDate')
            .populate('payment', 'paymentNumber method reference paymentDate');
        if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
        res.json(receipt);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Download receipt as PDF
// @route   GET /api/receipts/:id/pdf
exports.downloadReceiptPDF = async (req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id)
            .populate('client')
            .populate('invoice')
            .populate('payment');

        if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

        const doc = generateReceiptPDF(
            receipt,
            receipt.payment,
            receipt.invoice,
            receipt.client
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${receipt.receiptNumber}.pdf"`
        );

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('PDF generation failed:', error);
        res.status(500).json({ message: 'Failed to generate PDF' });
};
}