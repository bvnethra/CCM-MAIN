import { escapeHtml, formatDate, formatCurrency, BASE_DOCUMENT_STYLES } from './base.template';

export interface InvoiceDocumentData {
    organizationName: string;
    organizationAddress: string;
    organizationPhone?: string;
    organizationEmail?: string;
    invoiceNumber: string;
    invoiceStatus: string;
    invoiceDate: string | Date;
    dueDate: string | Date;
    clientName: string;
    clientEmail?: string;
    requestNumber: string;
    quotationNumber?: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        taxAmount: number;
        lineTotal: number;
    }>;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    notes?: string;
}

export function renderInvoiceHtml(data: InvoiceDocumentData): string {
    const itemRows = data.items.map((item, idx) => `
        <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td>${escapeHtml(item.description)}</td>
            <td style="text-align: right;">${escapeHtml(item.quantity)}</td>
            <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
            <td style="text-align: right;">${escapeHtml(item.taxRate)}% (${formatCurrency(item.taxAmount)})</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(item.lineTotal)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Commercial Invoice - ${escapeHtml(data.invoiceNumber)}</title>
    <style>${BASE_DOCUMENT_STYLES}</style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td>
                <div class="org-title">${escapeHtml(data.organizationName)}</div>
                <div class="org-sub">${escapeHtml(data.organizationAddress)}</div>
                <div class="org-sub">Phone: ${escapeHtml(data.organizationPhone || 'N/A')} | Email: ${escapeHtml(data.organizationEmail || 'N/A')}</div>
            </td>
            <td>
                <div class="doc-title" style="color: #0f172a;">TAX INVOICE</div>
                <div class="doc-meta">Invoice No: <strong>${escapeHtml(data.invoiceNumber)}</strong></div>
                <div class="doc-meta">Status: <strong>${escapeHtml(data.invoiceStatus)}</strong></div>
                <div class="doc-meta">Date: ${escapeHtml(formatDate(data.invoiceDate))}</div>
                <div class="doc-meta">Due Date: ${escapeHtml(formatDate(data.dueDate))}</div>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <table class="info-grid">
        <tr>
            <td>
                <div class="info-label">Billed To</div>
                <div class="info-val">${escapeHtml(data.clientName)}</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Email: ${escapeHtml(data.clientEmail || 'N/A')}</div>
            </td>
            <td>
                <div class="info-label">References</div>
                <div class="info-val">Calibration Request: ${escapeHtml(data.requestNumber)}</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Quotation Ref: ${escapeHtml(data.quotationNumber || 'N/A')}</div>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 40px;">#</th>
                <th>Description</th>
                <th style="text-align: right;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Tax Rate</th>
                <th style="text-align: right;">Line Total</th>
            </tr>
        </thead>
        <tbody>
            ${itemRows}
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Subtotal:</td>
            <td>${formatCurrency(data.subtotal)}</td>
        </tr>
        <tr>
            <td>Tax Amount:</td>
            <td>${formatCurrency(data.taxAmount)}</td>
        </tr>
        ${data.discountAmount > 0 ? `
            <tr>
                <td>Discount:</td>
                <td>- ${formatCurrency(data.discountAmount)}</td>
            </tr>
        ` : ''}
        <tr class="grand-total">
            <td>Total Invoice Amount:</td>
            <td>${formatCurrency(data.totalAmount)}</td>
        </tr>
        <tr>
            <td>Paid Amount:</td>
            <td>${formatCurrency(data.paidAmount)}</td>
        </tr>
        <tr style="font-weight: bold; color: #b91c1c; font-size: 13px;">
            <td>Balance Due:</td>
            <td>${formatCurrency(data.balanceAmount)}</td>
        </tr>
    </table>

    ${data.notes ? `
        <div class="terms-box">
            <div class="terms-title">Invoice Notes & Payment Instructions</div>
            <div class="terms-text">${escapeHtml(data.notes)}</div>
        </div>
    ` : ''}

    <table class="signature-area">
        <tr>
            <td></td>
            <td>
                <div class="sig-line">Authorized Finance / Accounts Signatory</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        This is a computer-generated tax invoice. Payment is due within agreed commercial terms.
    </div>
</body>
</html>`;
}
