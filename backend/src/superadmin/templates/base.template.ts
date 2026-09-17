export function escapeHtml(str: string | number | boolean | null | undefined): string {
    if (str === null || str === undefined) return '';
    const s = String(str);
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function formatCurrency(amount: number | string | null | undefined): string {
    const num = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
}

export function formatDate(dateVal: string | Date | null | undefined): string {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
}

export const BASE_DOCUMENT_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #1e293b; background-color: #ffffff; padding: 24px; line-height: 1.5; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .header-table td { vertical-align: top; }
    .org-title { font-size: 20px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
    .org-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
    .doc-title { font-size: 18px; font-weight: bold; color: #2563eb; text-align: right; text-transform: uppercase; }
    .doc-meta { font-size: 11px; color: #475569; text-align: right; margin-top: 4px; }
    .divider { border-bottom: 2px solid #e2e8f0; margin: 16px 0; }
    .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .info-grid td { width: 50%; vertical-align: top; padding: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; }
    .info-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
    .info-val { font-size: 12px; font-weight: 600; color: #0f172a; }
    .data-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .data-table th { background-color: #1e293b; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 8px; text-align: left; font-weight: 600; }
    .data-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; }
    .data-table tr:nth-child(even) { background-color: #f8fafc; }
    .badge-pass { background-color: #dcfce7; color: #15803d; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 11px; }
    .badge-fail { background-color: #fee2e2; color: #b91c1c; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 11px; }
    .totals-table { width: 320px; margin-left: auto; border-collapse: collapse; margin-top: 16px; }
    .totals-table td { padding: 6px 12px; font-size: 11px; text-align: right; }
    .totals-table .grand-total { font-size: 14px; font-weight: bold; color: #0f172a; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; background-color: #f1f5f9; }
    .terms-box { margin-top: 24px; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
    .terms-title { font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 4px; text-transform: uppercase; }
    .terms-text { font-size: 10px; color: #64748b; white-space: pre-wrap; }
    .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
    .signature-area { margin-top: 40px; width: 100%; border-collapse: collapse; }
    .signature-area td { width: 50%; text-align: center; vertical-align: bottom; height: 80px; }
    .sig-line { border-top: 1px solid #94a3b8; width: 80%; margin: 0 auto; padding-top: 4px; font-weight: bold; color: #334155; font-size: 11px; }
`;
