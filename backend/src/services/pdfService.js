// backend/src/services/pdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ============ BRAND COLORS ============
const COLORS = {
    navy: '#181C58',
    red: '#D32F2F',
    green: '#1F8A4C',
    ink: '#1F2340',
    muted: '#737791',
    line: '#DADCE6',
    pale: '#F3F4F9'
};

// ============ PDF LOCKING ============
const PDF_OPTIONS = {
    size: 'A4',
    margin: 50,
    userPassword: '',
    ownerPassword: process.env.PDF_OWNER_PASSWORD || 'NairobiForensics@2026!#Secret',
    permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false
    }
};

// ============ HELPERS ============
const formatKES = (amount) => {
    const n = Number(amount || 0);
    return `KSh ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatKESNoDecimal = (amount) => {
    const n = Number(amount || 0);
    return `KSh ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

// ============ FIND LOGO ============
// Looks for the logo in multiple locations (PNG or WebP)
const findLogo = () => {
    const candidates = [
        // Backend public folder
        path.join(__dirname, '../../public/logo.png'),
        path.join(__dirname, '../../public/Nairobi-Forensics-LLP-Logo.png'),
        path.join(__dirname, '../../public/Nairobi-Forensics-LLP-Logo.webp'),
        
        // Frontend public folder (fallback if backend doesn't have it)
        path.join(__dirname, '../../../nairobi-forensics-crm/public/logo.png'),
        path.join(__dirname, '../../../nairobi-forensics-crm/public/Nairobi-Forensics-LLP-Logo.webp'),
        
        // Square icons as last resort
        path.join(__dirname, '../../public/icons/icon-512.png'),
        path.join(__dirname, '../../../nairobi-forensics-crm/public/icons/icon-512.png')
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            console.log('📄 PDF: Using logo from', p);
            return p;
        }
    }
    console.warn('⚠️ PDF: No logo file found — using text fallback');
    return null;
};

// ============ SHARED HEADER ============
const drawHeader = (doc, documentType, subtitle = null) => {
    const logoPath = findLogo();

    // Left side: the logo
    if (logoPath) {
        try {
            // Place the logo at the top-left, keeping aspect ratio
            doc.image(logoPath, 50, 45, {
                fit: [170, 75],
                align: 'left',
                valign: 'top'
            });
        } catch (err) {
            console.error('⚠️ PDF: Failed to render logo:', err.message);
            drawTextLogo(doc);
        }
    } else {
        drawTextLogo(doc);
    }

    // Right side: document type
    const typeLabel = documentType === 'receipt' ? 'Receipt' : 'Invoice';
    doc.font('Helvetica-Bold')
        .fontSize(32)
        .fillColor(COLORS.navy)
        .text(typeLabel, 300, 48, { width: 250, align: 'right' });

    // Optional pill (PAYMENT RECEIVED)
    if (subtitle) {
        doc.save();
        doc.roundedRect(428, 92, 122, 20, 10).fill('#EAF6EE');
        doc.font('Helvetica-Bold')
            .fontSize(8)
            .fillColor(COLORS.green)
            .text(subtitle, 428, 98, { width: 122, align: 'center' });
        doc.restore();
    }

    // Divider — placed well below the logo
    doc.moveTo(50, 135).lineTo(550, 135)
        .lineWidth(1.5)
        .strokeColor(COLORS.navy)
        .stroke();
};

const drawTextLogo = (doc) => {
    doc.font('Helvetica-Bold')
        .fontSize(20)
        .fillColor(COLORS.navy)
        .text('Nairobi Forensics', 50, 55);

    doc.font('Helvetica-Oblique')
        .fontSize(10)
        .fillColor(COLORS.red)
        .text('Turning Vision Into Value', 50, 82);
};

// ============ RECEIPT PDF ============
const generateReceiptPDF = (receipt, payment, invoice, client) => {
    const doc = new PDFDocument({
        ...PDF_OPTIONS,
        info: {
            Title: `Receipt ${receipt.receiptNumber}`,
            Author: 'Nairobi Forensics LLP',
            Subject: `Payment Receipt for Invoice ${invoice?.invoiceNumber || ''}`,
            Keywords: 'receipt, payment, Nairobi Forensics',
            Creator: 'Nairobi Forensics CRM',
            Producer: 'Nairobi Forensics LLP',
            CreationDate: new Date()
        }
    });

    // Header
    drawHeader(doc, 'receipt', 'PAYMENT RECEIVED');

    // ---------- META ----------
    const META_Y = 150;
    const col1X = 50;
    const col2X = 260;
    const col3X = 420;

    doc.save();
    doc.rect(45, META_Y - 8, 510, 40).fillOpacity(0.5).fill(COLORS.pale);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.muted);
    doc.text('RECEIPT NO.', col1X, META_Y);
    doc.text('DATE RECEIVED', col2X, META_Y);
    doc.text('METHOD', col3X, META_Y);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.ink);
    doc.text(receipt.receiptNumber || '', col1X, META_Y + 16, { width: 200 });
    doc.text(formatDate(receipt.issuedDate), col2X, META_Y + 16, { width: 150 });
    const method = (payment?.method || 'cash').replace('_', ' ');
    doc.text(method.charAt(0).toUpperCase() + method.slice(1), col3X, META_Y + 16, { width: 130 });

    // ---------- RECEIVED BY / FROM ----------
    let yPos = 210;

    doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.muted);
    doc.text('RECEIVED BY', col1X, yPos);
    doc.text('RECEIVED FROM', col2X, yPos);

    yPos += 14;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.ink);
    doc.text('Nairobi Forensics Limited', col1X, yPos, { width: 200 });
    doc.text(client?.name || 'Client', col2X, yPos, { width: 290 });

    yPos += 16;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.ink);
    doc.text('Liability Partnership', col1X, yPos, { width: 200 });

    // ---------- PAYMENT FOR ----------
    yPos = 270;

    doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.muted);
    doc.text('PAYMENT FOR', col1X, yPos);

    yPos += 14;
    const description = invoice?.items?.[0]?.description || 'Forensic Accounting and Reviews';

    doc.save();
    doc.rect(45, yPos, 510, 60).fillOpacity(0.5).fill(COLORS.pale);
    doc.restore();

    doc.save();
    doc.rect(45, yPos, 4, 60).fill(COLORS.navy);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.ink);
    doc.text(description, 65, yPos + 15, { width: 340 });

    doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.navy);
    doc.text(formatKES(receipt.amount), 400, yPos + 18, { width: 145, align: 'right' });

    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
    doc.text(
        `Ref. Invoice ${invoice?.invoiceNumber || ''} · Dated ${formatDate(invoice?.issueDate || invoice?.createdAt)}`,
        65,
        yPos + 38,
        { width: 340 }
    );

    // ---------- SUMMARY ----------
    yPos = 365;

    doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.muted);
    doc.text('SUMMARY', col1X, yPos);

    yPos += 16;

    const invoiceTotal = invoice?.total || 0;
    const amountPaid = receipt.amount || 0;
    const balanceDue = Math.max(0, invoiceTotal - amountPaid);
    const isPaidInFull = balanceDue <= 0.01;

    const drawSummaryRow = (label, value, y) => {
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted);
        doc.text(label, col1X, y, { width: 200 });
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.ink);
        doc.text(value, col1X + 130, y, { width: 180, align: 'right' });
        doc.save();
        doc.moveTo(col1X, y + 14).lineTo(col1X + 290, y + 14)
            .lineWidth(0.5).dash(2, { space: 2 }).strokeColor(COLORS.line).stroke();
        doc.undash().restore();
    };

    drawSummaryRow('Invoice total', formatKES(invoiceTotal), yPos);
    drawSummaryRow(`Amount paid (${method.toLowerCase()})`, formatKES(amountPaid), yPos + 24);
    drawSummaryRow('Balance due', formatKES(balanceDue), yPos + 48);

    // AMOUNT RECEIVED card
    const cardX = 370;
    const cardY = yPos - 5;
    const cardWidth = 180;
    const cardHeight = 75;

    doc.save();
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4).fill(COLORS.navy);
    doc.rect(cardX, cardY + cardHeight - 4, cardWidth, 4).fill(COLORS.green);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(7).fillColor('#B9C0D0');
    doc.text('AMOUNT RECEIVED', cardX + 15, cardY + 14, { width: cardWidth - 30 });

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF');
    doc.text(formatKESNoDecimal(amountPaid), cardX + 15, cardY + 30, { width: cardWidth - 30 });

    doc.font('Helvetica').fontSize(8).fillColor('#B9C0D0');
    doc.text(
        `${isPaidInFull ? 'Paid in full' : 'Partially paid'} · ${method.charAt(0).toUpperCase() + method.slice(1)}`,
        cardX + 15,
        cardY + 55,
        { width: cardWidth - 30 }
    );

    // ---------- SOURCE INVOICE ----------
    yPos = 460;

    doc.moveTo(50, yPos).lineTo(550, yPos).lineWidth(0.5).strokeColor(COLORS.line).stroke();
    yPos += 14;

    doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.muted);
    doc.text('SOURCE INVOICE', col1X, yPos);

    yPos += 14;
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.ink);
    doc.text(invoice?.invoiceNumber || '', col1X, yPos, { width: 200 });
    doc.text(
        `Dated ${formatDateTime(invoice?.createdAt || invoice?.issueDate)}`,
        col1X + 200,
        yPos,
        { width: 200 }
    );

    // ---------- FOOTER ----------
    yPos = 520;
    doc.moveTo(50, yPos).lineTo(550, yPos).lineWidth(0.5).strokeColor(COLORS.line).stroke();

    yPos += 12;
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLORS.muted);
    doc.text('This receipt confirms payment against the invoice above.', col1X, yPos, { width: 400 });
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
    doc.text('Nairobi Forensics LLP', 400, yPos, { width: 150, align: 'right' });

    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
    doc.text('Page 1 / 1', 500, 780, { width: 50, align: 'right' });

    return doc;
};

// ============ INVOICE PDF ============
const generateInvoicePDF = (invoice, client) => {
    const doc = new PDFDocument({
        ...PDF_OPTIONS,
        info: {
            Title: `Invoice ${invoice.invoiceNumber}`,
            Author: 'Nairobi Forensics LLP',
            Subject: `Invoice for ${client?.name || 'Client'}`,
            Keywords: 'invoice, Nairobi Forensics',
            Creator: 'Nairobi Forensics CRM',
            Producer: 'Nairobi Forensics LLP',
            CreationDate: new Date()
        }
    });

    drawHeader(doc, 'invoice');

    let yPos = 155;

    doc.save();
    doc.rect(45, yPos - 8, 510, 55).fillOpacity(0.5).fill(COLORS.pale);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.muted);
    doc.text('BILL TO', 60, yPos);
    doc.text('INVOICE NO.', 260, yPos);
    doc.text('ISSUE DATE', 380, yPos);
    doc.text('DUE DATE', 480, yPos);

    yPos += 16;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.ink);
    doc.text(client?.name || 'Client', 60, yPos, { width: 190 });
    doc.text(invoice.invoiceNumber || '', 260, yPos, { width: 110 });
    doc.text(formatDate(invoice.issueDate || invoice.createdAt), 380, yPos, { width: 90 });
    doc.text(formatDate(invoice.dueDate), 480, yPos, { width: 70 });

    yPos += 18;
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
    const details = [];
    if (client?.email) details.push(client.email);
    if (client?.phone) details.push(client.phone);
    if (client?.address?.city) details.push(`${client.address.city}, ${client.address.country || ''}`);
    if (client?.kraPin) details.push(`KRA PIN: ${client.kraPin}`);
    if (details.length) {
        doc.text(details.join('  ·  '), 60, yPos, { width: 480 });
    }

    // ---------- ITEMS ----------
    yPos = 245;

    doc.save();
    doc.rect(50, yPos - 8, 500, 22).fill(COLORS.pale);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted);
    doc.text('DESCRIPTION', 60, yPos);
    doc.text('QTY', 340, yPos, { width: 50, align: 'right' });
    doc.text('UNIT PRICE', 400, yPos, { width: 70, align: 'right' });
    doc.text('AMOUNT', 480, yPos, { width: 70, align: 'right' });

    yPos += 25;
    (invoice.items || []).forEach((item) => {
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.ink);
        doc.text(item.description || '', 60, yPos, { width: 270 });
        doc.text(String(item.quantity || 0), 340, yPos, { width: 50, align: 'right' });
        doc.text(formatKES(item.unitPrice), 400, yPos, { width: 70, align: 'right' });
        doc.text(formatKES(item.amount), 480, yPos, { width: 70, align: 'right' });
        yPos += 18;
        doc.moveTo(50, yPos).lineTo(550, yPos).lineWidth(0.3).strokeColor(COLORS.line).stroke();
        yPos += 8;
    });

    // Totals
    yPos += 20;
    const totalBoxX = 340;

    const drawTotalRow = (label, value, y, bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9).fillColor(COLORS.ink);
        doc.text(label, totalBoxX, y, { width: 100 });
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9).fillColor(COLORS.ink);
        doc.text(value, totalBoxX + 110, y, { width: 100, align: 'right' });
    };

    drawTotalRow('Subtotal', formatKES(invoice.subtotal), yPos);
    yPos += 18;
    drawTotalRow(`Tax (${invoice.taxRate}%)`, formatKES(invoice.taxAmount), yPos);
    yPos += 22;

    doc.moveTo(totalBoxX, yPos).lineTo(550, yPos).lineWidth(0.5).strokeColor(COLORS.line).stroke();
    yPos += 8;
    drawTotalRow('Total', formatKES(invoice.total), yPos, true);

    if (invoice.totalPaid > 0) {
        yPos += 22;
        drawTotalRow('Paid', `- ${formatKES(invoice.totalPaid)}`, yPos);
        yPos += 18;
        drawTotalRow('Balance Due', formatKES(invoice.balance), yPos, true);
    }

    doc.moveTo(50, 750).lineTo(550, 750).lineWidth(0.5).strokeColor(COLORS.line).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
    doc.text('Thank you for your business.', 50, 765);
    doc.text('Nairobi Forensics LLP · Turning Vision Into Value', 300, 765, { width: 250, align: 'right' });

    return doc;
};

module.exports = {
    generateReceiptPDF,
    generateInvoicePDF
};