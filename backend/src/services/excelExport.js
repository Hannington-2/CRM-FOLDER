// backend/src/services/excelExport.js
const ExcelJS = require('exceljs');

// ============ BRAND COLORS ============
const COLORS = {
    navy: 'FF181C58',
    red: 'FFD32F2F',
    green: 'FF1F8A4C',
    ink: 'FF1F2340',
    muted: 'FF737791',
    pale: 'FFF3F4F9',
    white: 'FFFFFFFF',
    paleGreen: 'FFEAF6EE',
    paleRed: 'FFFFEBEE',
    paleYellow: 'FFFFF8E1'
};

// ============ HELPERS ============
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatKES = (amount) => Number(amount || 0);

/**
 * Build a single client's block on a worksheet.
 * Writes: header + summary + table of payments + totals
 *
 * @returns {number} the next row index after this client block
 */
const writeClientBlock = (worksheet, client, payments, receipts, invoiceMap, startRow) => {
    let row = startRow;

    // ===== CLIENT HEADER =====
    worksheet.mergeCells(`A${row}:J${row}`);
    const headerCell = worksheet.getCell(`A${row}`);
    headerCell.value = `${client.name}  (${client.code || 'N/A'})`;
    headerCell.font = { bold: true, size: 14, color: { argb: COLORS.white } };
    headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.navy }
    };
    headerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    worksheet.getRow(row).height = 30;
    row++;

    // ===== CLIENT CONTACT ROW =====
    worksheet.mergeCells(`A${row}:J${row}`);
    const contactCell = worksheet.getCell(`A${row}`);
    const contactParts = [];
    if (client.phone) contactParts.push(`📞 ${client.phone}`);
    if (client.email) contactParts.push(`✉️ ${client.email}`);
    if (client.kraPin) contactParts.push(`KRA PIN: ${client.kraPin}`);
    contactCell.value = contactParts.join('  |  ');
    contactCell.font = { size: 10, color: { argb: COLORS.muted }, italic: true };
    contactCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    row++;

    // ===== SUMMARY BLOCK =====
    const totalInvoiced = client._totalInvoiced || 0;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, totalInvoiced - totalPaid);

    worksheet.mergeCells(`A${row}:E${row}`);
    worksheet.getCell(`A${row}`).value = 'Total Invoiced';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 10, color: { argb: COLORS.muted } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', indent: 1 };

    worksheet.mergeCells(`F${row}:J${row}`);
    worksheet.getCell(`F${row}`).value = formatKES(totalInvoiced);
    worksheet.getCell(`F${row}`).numFmt = '#,##0.00';
    worksheet.getCell(`F${row}`).font = { bold: true, size: 10, color: { argb: COLORS.ink } };
    worksheet.getCell(`F${row}`).alignment = { horizontal: 'right', indent: 1 };
    row++;

    worksheet.mergeCells(`A${row}:E${row}`);
    worksheet.getCell(`A${row}`).value = 'Total Paid';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 10, color: { argb: COLORS.muted } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', indent: 1 };

    worksheet.mergeCells(`F${row}:J${row}`);
    worksheet.getCell(`F${row}`).value = formatKES(totalPaid);
    worksheet.getCell(`F${row}`).numFmt = '#,##0.00';
    worksheet.getCell(`F${row}`).font = { bold: true, size: 10, color: { argb: COLORS.green } };
    worksheet.getCell(`F${row}`).alignment = { horizontal: 'right', indent: 1 };
    row++;

    // Balance row — color-coded
    worksheet.mergeCells(`A${row}:E${row}`);
    worksheet.getCell(`A${row}`).value = 'Balance Due';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 10, color: { argb: COLORS.muted } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', indent: 1 };

    worksheet.mergeCells(`F${row}:J${row}`);
    const balanceCell = worksheet.getCell(`F${row}`);
    balanceCell.value = formatKES(balance);
    balanceCell.numFmt = '#,##0.00';
    balanceCell.font = { bold: true, size: 11, color: { argb: balance > 0 ? COLORS.red : COLORS.green } };
    balanceCell.alignment = { horizontal: 'right', indent: 1 };
    balanceCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: balance > 0 ? COLORS.paleRed : COLORS.paleGreen }
    };
    row++;

    // Status row
    worksheet.mergeCells(`A${row}:J${row}`);
    const statusCell = worksheet.getCell(`A${row}`);
    statusCell.value = balance > 0
        ? `⚠️  OUTSTANDING — Client still owes KES ${balance.toLocaleString()}`
        : `✅  PAID IN FULL`;
    statusCell.font = { bold: true, size: 10, color: { argb: balance > 0 ? COLORS.red : COLORS.green } };
    statusCell.alignment = { horizontal: 'left', indent: 1 };
    row += 2; // leave a blank row

    // ===== TABLE HEADER =====
    const headers = [
        { key: 'date', label: 'DATE', width: 12 },
        { key: 'payment', label: 'PAYMENT #', width: 20 },
        { key: 'invoice', label: 'INVOICE #', width: 20 },
        { key: 'method', label: 'METHOD', width: 15 },
        { key: 'reference', label: 'REFERENCE', width: 18 },
        { key: 'amount', label: 'AMOUNT PAID', width: 15 },
        { key: 'before', label: 'BAL. BEFORE', width: 15 },
        { key: 'after', label: 'BAL. AFTER', width: 15 },
        { key: 'receipt', label: 'RECEIPT #', width: 20 },
        { key: 'status', label: 'STATUS', width: 12 }
    ];

    headers.forEach((h, i) => {
        const cell = worksheet.getCell(row, i + 1);
        cell.value = h.label;
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.ink }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin', color: { argb: COLORS.ink } },
            bottom: { style: 'thin', color: { argb: COLORS.ink } }
        };
        worksheet.getColumn(i + 1).width = h.width;
    });
    worksheet.getRow(row).height = 22;
    row++;

    // ===== PAYMENT ROWS =====
    // Sort payments oldest first
    const sortedPayments = [...payments].sort(
        (a, b) => new Date(a.paymentDate) - new Date(b.paymentDate)
    );

    // Track running balance per invoice as we go
    const balanceTracker = {};

    // Initialize each invoice's balance tracker
    Object.keys(invoiceMap).forEach(invId => {
        balanceTracker[invId] = invoiceMap[invId].netTotal || invoiceMap[invId].total || 0;
    });

    if (sortedPayments.length === 0) {
        worksheet.mergeCells(`A${row}:J${row}`);
        const emptyCell = worksheet.getCell(`A${row}`);
        emptyCell.value = 'No payments recorded yet.';
        emptyCell.font = { italic: true, size: 10, color: { argb: COLORS.muted } };
        emptyCell.alignment = { horizontal: 'center' };
        row++;
    } else {
        sortedPayments.forEach((payment, idx) => {
            const invId = payment.invoice?._id?.toString() || payment.invoice?.toString();
            const inv = invoiceMap[invId] || {};
            const balanceBefore = balanceTracker[invId] || 0;
            const balanceAfter = Math.max(0, balanceBefore - payment.amount);
            balanceTracker[invId] = balanceAfter;

            const receipt = receipts.find(
                r => r.payment?._id?.toString() === payment._id?.toString() ||
                     r.payment?.toString() === payment._id?.toString()
            );

            const rowData = [
                formatDate(payment.paymentDate),
                payment.paymentNumber || '',
                inv.invoiceNumber || payment.invoice?.invoiceNumber || '',
                (payment.method || '').replace('_', ' '),
                payment.reference || '',
                formatKES(payment.amount),
                formatKES(balanceBefore),
                formatKES(balanceAfter),
                receipt?.receiptNumber || '',
                payment.status === 'active' ? 'Active' : payment.status || 'Active'
            ];

            rowData.forEach((val, colIdx) => {
                const cell = worksheet.getCell(row, colIdx + 1);
                cell.value = val;
                cell.font = { size: 10, color: { argb: COLORS.ink } };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: colIdx >= 5 && colIdx <= 7 ? 'right' : 'left'
                };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } }
                };

                // Currency formatting for amount columns
                if (colIdx >= 5 && colIdx <= 7) {
                    cell.numFmt = '#,##0.00';
                }

                // Alternate row shading
                if (idx % 2 === 1) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF8F9FB' }
                    };
                }
            });
            worksheet.getRow(row).height = 20;
            row++;
        });
    }

    // ===== GRAND TOTAL ROW =====
    if (sortedPayments.length > 0) {
        worksheet.mergeCells(`A${row}:E${row}`);
        const totalLabel = worksheet.getCell(`A${row}`);
        totalLabel.value = 'TOTAL PAID:';
        totalLabel.font = { bold: true, size: 11, color: { argb: COLORS.ink } };
        totalLabel.alignment = { horizontal: 'right' };

        const totalValue = worksheet.getCell(`F${row}`);
        totalValue.value = formatKES(totalPaid);
        totalValue.numFmt = '#,##0.00';
        totalValue.font = { bold: true, size: 11, color: { argb: COLORS.green } };
        totalValue.alignment = { horizontal: 'right' };
        totalValue.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.paleGreen }
        };
        row++;
    }

    // Empty spacer row + bottom border
    row += 2;
    return row;
};

/**
 * Generate an Excel workbook with payment ledger.
 * @param {Array} clients - array of client objects
 * @param {Array} payments - all payments (populated)
 * @param {Array} receipts - all receipts (populated)
 * @param {Array} invoices - all invoices (populated)
 * @param {Object} opts
 * @param {boolean} [opts.singleClient] - if true, one sheet only
 * @param {string} [opts.title] - report title
 * @returns {Promise<Buffer>} Excel file buffer
 */
const generatePaymentLedger = async (clients, payments, receipts, invoices, opts = {}) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nairobi Forensics CRM';
    workbook.created = new Date();

    // Build invoice map by ID
    const invoiceMap = {};
    invoices.forEach(inv => {
        invoiceMap[inv._id.toString()] = inv;
    });

    // Calculate invoiced totals per client
    const clientInvoicedTotals = {};
    invoices.forEach(inv => {
        if (inv.status === 'cancelled') return;
        const clientId = inv.client?._id?.toString() || inv.client?.toString();
        if (!clientId) return;
        if (!clientInvoicedTotals[clientId]) clientInvoicedTotals[clientId] = 0;
        clientInvoicedTotals[clientId] += inv.netTotal || inv.total || 0;
    });

    // Group data by client
    const clientBlocks = clients.map(client => {
        const clientId = client._id.toString();
        const clientPayments = payments.filter(p => {
            const pClientId = p.client?._id?.toString() || p.client?.toString();
            return pClientId === clientId;
        });

        // Compute totals
        const totalInvoiced = clientInvoicedTotals[clientId] || 0;
        const totalPaid = clientPayments.reduce((s, p) => s + p.amount, 0);
        const balance = Math.max(0, totalInvoiced - totalPaid);

        return {
            client: { ...client.toObject ? client.toObject() : client, _totalInvoiced: totalInvoiced },
            payments: clientPayments,
            balance,
            hasPayments: clientPayments.length > 0
        };
    });

    // Sort: open clients first (balance > 0), then paid
    clientBlocks.sort((a, b) => {
        if (a.balance > 0 && b.balance <= 0) return -1;
        if (a.balance <= 0 && b.balance > 0) return 1;
        return a.client.name.localeCompare(b.client.name);
    });

    // ===== SINGLE SHEET MODE (one client, or one summary sheet) =====
    const sheetName = opts.singleClient
        ? (clientBlocks[0]?.client?.name || 'Client').substring(0, 31)
        : 'Payment Ledger';

    const sheet = workbook.addWorksheet(sheetName, {
        views: [{ state: 'frozen', ySplit: 1 }]
    });

    // ===== TITLE ROW =====
    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = opts.title || 'Client Payment Ledger';
    titleCell.font = { bold: true, size: 18, color: { argb: COLORS.navy } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 40;

    sheet.mergeCells('A2:J2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Generated on ${new Date().toLocaleString('en-KE', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`;
    subCell.font = { size: 9, color: { argb: COLORS.muted }, italic: true };
    subCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // ===== WRITE CLIENT BLOCKS =====
    let currentRow = 4;

    if (clientBlocks.length === 0) {
        sheet.mergeCells(`A${currentRow}:J${currentRow}`);
        const emptyCell = sheet.getCell(`A${currentRow}`);
        emptyCell.value = 'No data to export.';
        emptyCell.font = { italic: true, color: { argb: COLORS.muted } };
    } else {
        clientBlocks.forEach((block, idx) => {
            currentRow = writeClientBlock(
                sheet,
                block.client,
                block.payments,
                receipts,
                invoiceMap,
                currentRow
            );
        });

        // ===== GRAND SUMMARY AT THE BOTTOM =====
        currentRow += 2;

        sheet.mergeCells(`A${currentRow}:J${currentRow}`);
        const summaryTitle = sheet.getCell(`A${currentRow}`);
        summaryTitle.value = '════════  GRAND SUMMARY  ════════';
        summaryTitle.font = { bold: true, size: 12, color: { argb: COLORS.navy } };
        summaryTitle.alignment = { horizontal: 'center' };
        sheet.getRow(currentRow).height = 26;
        currentRow++;

        const totalClients = clientBlocks.length;
        const openClients = clientBlocks.filter(b => b.balance > 0).length;
        const paidClients = clientBlocks.filter(b => b.balance <= 0).length;
        const grandInvoiced = clientBlocks.reduce((s, b) => s + (b.client._totalInvoiced || 0), 0);
        const grandPaid = clientBlocks.reduce(
            (s, b) => s + b.payments.reduce((ps, p) => ps + p.amount, 0),
            0
        );
        const grandOutstanding = grandInvoiced - grandPaid;

        const summaryRows = [
            ['Total Clients:', totalClients],
            ['Open Clients (Outstanding):', openClients],
            ['Paid Clients:', paidClients],
            ['Grand Total Invoiced:', formatKES(grandInvoiced)],
            ['Grand Total Paid:', formatKES(grandPaid)],
            ['Grand Outstanding:', formatKES(grandOutstanding)]
        ];

        summaryRows.forEach(([label, value]) => {
            sheet.mergeCells(`A${currentRow}:E${currentRow}`);
            sheet.getCell(`A${currentRow}`).value = label;
            sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10, color: { argb: COLORS.muted } };
            sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right', indent: 1 };

            sheet.mergeCells(`F${currentRow}:J${currentRow}`);
            const valCell = sheet.getCell(`F${currentRow}`);
            valCell.value = value;
            valCell.font = { bold: true, size: 11, color: { argb: COLORS.ink } };
            valCell.alignment = { horizontal: 'right', indent: 1 };
            if (typeof value === 'number') {
                valCell.numFmt = '#,##0.00';
            }

            // Color the outstanding row
            if (label.includes('Outstanding')) {
                valCell.font = { bold: true, size: 12, color: { argb: COLORS.red } };
                valCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: COLORS.paleRed }
                };
            }
            if (label.includes('Paid:')) {
                valCell.font = { bold: true, size: 11, color: { argb: COLORS.green } };
            }
            currentRow++;
        });
    }

    // Auto-size row for last known
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

module.exports = { generatePaymentLedger };