import { escapeHtml, formatDate, BASE_DOCUMENT_STYLES } from './base.template';

export interface CalibrationCertificateData {
    organizationName: string;
    organizationAddress: string;
    organizationPhone?: string;
    organizationEmail?: string;
    certificateNumber: string;
    certificateDate: string | Date;
    clientName: string;
    clientEmail?: string;
    requestNumber: string;
    itemName: string;
    itemCode: string;
    serialNumber?: string;
    calibrationDate: string | Date;
    calibrationMethod?: string;
    calibrationLocation?: string;
    calibrationResult: string;
    calibrationFrequencyDays?: number;
    nextDueDate?: string | Date;
    measurements: Array<{
        parameterName: string;
        nominalValue: number;
        measuredValue: number;
        unit: string;
        toleranceMin?: number;
        toleranceMax?: number;
        result: string;
    }>;
    issuedByName?: string;
    remarks?: string;
}

export function renderCalibrationCertificateHtml(data: CalibrationCertificateData): string {
    const isPass = data.calibrationResult === 'PASS' || data.calibrationResult === 'PASSED';
    const resultBadgeClass = isPass ? 'badge-pass' : 'badge-fail';

    const measurementRows = data.measurements && data.measurements.length > 0
        ? data.measurements.map(m => {
            const mPass = m.result === 'PASS' || m.result === 'PASSED';
            const badgeClass = mPass ? 'badge-pass' : 'badge-fail';
            return `
                <tr>
                    <td>${escapeHtml(m.parameterName)}</td>
                    <td>${escapeHtml(m.nominalValue)} ${escapeHtml(m.unit)}</td>
                    <td>${escapeHtml(m.measuredValue)} ${escapeHtml(m.unit)}</td>
                    <td>${m.toleranceMin !== undefined && m.toleranceMax !== undefined ? `${escapeHtml(m.toleranceMin)} to ${escapeHtml(m.toleranceMax)}` : 'N/A'}</td>
                    <td><span class="${badgeClass}">${escapeHtml(m.result)}</span></td>
                </tr>
            `;
        }).join('')
        : `<tr><td colspan="5" style="text-align: center; color: #64748b;">No individual parameter measurements recorded.</td></tr>`;

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Calibration Certificate - ${escapeHtml(data.certificateNumber)}</title>
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
                <div class="doc-title">Calibration Certificate</div>
                <div class="doc-meta">Certificate No: <strong>${escapeHtml(data.certificateNumber)}</strong></div>
                <div class="doc-meta">Date: ${escapeHtml(formatDate(data.certificateDate))}</div>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <table class="info-grid">
        <tr>
            <td>
                <div class="info-label">Customer Details</div>
                <div class="info-val">${escapeHtml(data.clientName)}</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Email: ${escapeHtml(data.clientEmail || 'N/A')}</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Request No: ${escapeHtml(data.requestNumber)}</div>
            </td>
            <td>
                <div class="info-label">Equipment Under Test (EUT)</div>
                <div class="info-val">${escapeHtml(data.itemName)}</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Item Code: ${escapeHtml(data.itemCode)}</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Serial No: ${escapeHtml(data.serialNumber || 'N/A')}</div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="info-label">Calibration Process Details</div>
                <div class="info-val">Date: ${escapeHtml(formatDate(data.calibrationDate))}</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Method: ${escapeHtml(data.calibrationMethod || 'Standard Comparison')}</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Location: ${escapeHtml(data.calibrationLocation || 'Main Calibration Laboratory')}</div>
            </td>
            <td>
                <div class="info-label">Calibration Outcome & Due Date</div>
                <div class="info-val" style="margin-bottom: 4px;">Result: <span class="${resultBadgeClass}">${escapeHtml(data.calibrationResult)}</span></div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Frequency: ${escapeHtml(data.calibrationFrequencyDays || 365)} days</div>
                <div class="info-val" style="font-size: 11px; font-weight: normal; color: #475569;">Next Due Date: <strong>${escapeHtml(formatDate(data.nextDueDate))}</strong></div>
            </td>
        </tr>
    </table>

    <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 16px; margin-bottom: 8px;">Calibration Parameter Measurements</div>

    <table class="data-table">
        <thead>
            <tr>
                <th>Parameter Name</th>
                <th>Nominal Value</th>
                <th>Measured Value</th>
                <th>Specified Tolerance</th>
                <th>Result</th>
            </tr>
        </thead>
        <tbody>
            ${measurementRows}
        </tbody>
    </table>

    ${data.remarks ? `
        <div class="terms-box">
            <div class="terms-title">Calibration Remarks & Traceability Notes</div>
            <div class="terms-text">${escapeHtml(data.remarks)}</div>
        </div>
    ` : ''}

    <table class="signature-area">
        <tr>
            <td>
                <div class="sig-line">Calibrated By / Metrologist</div>
            </td>
            <td>
                <div class="sig-line">Authorized Signatory / Technical Manager</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        This certificate relates only to the item calibrated. Traceable to national measurement standards. ISO/IEC 17025 Accredited Laboratory.
    </div>
</body>
</html>`;
}
