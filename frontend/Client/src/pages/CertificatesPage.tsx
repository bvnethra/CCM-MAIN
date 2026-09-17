import React, { useState } from 'react';
import { Search, Download, Award, Calendar, CheckCircle2, FileCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CertificateRecord {
  id: string;
  certNumber: string;
  equipment: string;
  serialNumber: string;
  issueDate: string;
  validUntil: string;
  calibrationResult: 'PASS' | 'PASS_WITH_TOLERANCE';
  technician: string;
}

const mockCertificates: CertificateRecord[] = [
  {
    id: 'cert-1',
    certNumber: 'CERT-2026-079',
    equipment: 'External Micrometer Gauge 25-50mm',
    serialNumber: 'MG-44211',
    issueDate: '2026-09-15',
    validUntil: '2027-09-14',
    calibrationResult: 'PASS',
    technician: 'Senior Metrologist R. K.',
  },
  {
    id: 'cert-2',
    certNumber: 'CERT-2026-072',
    equipment: 'Dial Indicator 0-10mm / 0.01mm resolution',
    serialNumber: 'DI-10992',
    issueDate: '2026-09-12',
    validUntil: '2027-09-11',
    calibrationResult: 'PASS',
    technician: 'Quality Lead S. Nair',
  },
  {
    id: 'cert-3',
    certNumber: 'CERT-2026-060',
    equipment: 'Pressure Gauge 0-600 PSI',
    serialNumber: 'PG-33100',
    issueDate: '2026-09-12',
    validUntil: '2027-09-11',
    calibrationResult: 'PASS_WITH_TOLERANCE',
    technician: 'Calibration Engr M. V.',
  },
  {
    id: 'cert-4',
    certNumber: 'CERT-2026-031',
    equipment: 'Surface Plate Grade 0 (Granite)',
    serialNumber: 'SP-1004',
    issueDate: '2026-08-01',
    validUntil: '2027-07-31',
    calibrationResult: 'PASS',
    technician: 'Lead Metrologist P. D.',
  },
];

export const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const filtered = mockCertificates.filter(
    (c) =>
      c.certNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.equipment.toLowerCase().includes(search.toLowerCase()) ||
      c.serialNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (certNumber: string) => {
    // Generate simple dynamic dummy certificate file trigger
    const content = `CALIBRATION CERTIFICATE\nCertificate No: ${certNumber}\nClient: ${user?.companyName}\nClient Code: ${user?.clientCode}\nIssued Date: ${new Date().toISOString()}\nStatus: Verified & Approved`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Certificates Vault</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Download certified calibration test reports issued for {user?.companyName}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search certificate number, equipment, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cert) => (
          <div
            key={cert.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 hover:shadow-sm transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-600">{cert.certNumber}</div>
                    <div className="text-[11px] text-slate-400">NABL Traceable</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> {cert.calibrationResult.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{cert.equipment}</h3>
                <div className="text-xs text-slate-500 font-mono mt-1">Serial: {cert.serialNumber}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Issued On</span>
                  <span className="font-medium text-slate-700">{cert.issueDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Valid Until</span>
                  <span className="font-semibold text-slate-900">{cert.validUntil}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 italic">Signatory: {cert.technician}</span>
              <button
                onClick={() => handleDownload(cert.certNumber)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            No certificates found matching your query.
          </div>
        )}
      </div>
    </div>
  );
};
