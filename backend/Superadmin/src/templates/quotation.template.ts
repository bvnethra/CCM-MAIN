import { escapeHtml, formatDate, formatCurrency, BASE_DOCUMENT_STYLES } from './base.template';

export interface QuotationDocumentData {
    organizationName: string;
    organizationAddress: string;
    organizationPhone?: string;
    organizationEmail?: string;
    quotationNumber: string;
    quotationStatus: string;
    quotationDate: string | Date;
    validUntil: string | Date;
    clientName: string;
    clientEmail?: string;
    requestNumber: string;
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
    termsAndConditions?: string;
    notes?: string;
}

export function renderQuotationHtml(data: QuotationDocumentData): string {
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
    <title>Commercial Quotation - ${escapeHtml(data.quotationNumber)}</title>
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
                <div class="doc-title">COMMERCIAL QUOTATION</div>
                <div class="doc-meta">Quotation No: <strong>${escapeHtml(data.quotationNumber)}</strong></div>
                <div class="doc-meta">Status: <strong>${escapeHtml(data.quotationStatus)}</strong></div>
                <div class="doc-meta">Date: ${escapeHtml(formatDate(data.quotationDate))}</div>
                <div class="doc-meta">Valid Until: ${escapeHtml(formatDate(data.validUntil))}</div>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <table class="info-grid">
        <tr>
            <td>
                <div class="info-label">Quotation To</div>
                <div class="info-val">${escapeHtml(data.clientName)}</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Email: ${escapeHtml(data.clientEmail || 'N/A')}</div>
            </td>
            <td>
                <div class="info-label">Reference Information</div>
                <div class="info-val">Calibration Request: ${escapeHtml(data.requestNumber)}</div>
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
            <td>Grand Total:</td>
            <td>${formatCurrency(data.totalAmount)}</td>
        </tr>
    </table>

    ${data.termsAndConditions ? `
        <div class="terms-box">
            <div class="terms-title">Terms & Conditions</div>
            <div class="terms-text">${escapeHtml(data.termsAndConditions)}</div>
        </div>
    ` : ''}

    ${data.notes ? `
        <div class="terms-box" style="margin-top: 12px;">
            <div class="terms-title">Notes / Special Instructions</div>
            <div class="terms-text">${escapeHtml(data.notes)}</div>
        </div>
    ` : ''}

    <table class="signature-area">
        <tr>
            <td></td>
            <td>
                <div class="sig-line">Authorized Commercial Representative</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Thank you for your business. This is an official commercial quotation generated by Calibration Commercial Module.
    </div>
</body>
</html>`;
}
