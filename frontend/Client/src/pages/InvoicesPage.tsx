import React from 'react';
import { Receipt, Download, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClientInvoice } from '../types/client';

const mockInvoices: ClientInvoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0941',
    invoiceDate: '2026-09-15',
    amount: 14500,
    tax: 2610,
    total: 17110,
    status: 'PENDING',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-0812',
    invoiceDate: '2026-08-20',
    amount: 28000,
    tax: 5040,
    total: 33040,
    status: 'PAID',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-0744',
    invoiceDate: '2026-07-10',
    amount: 19500,
    tax: 3510,
    total: 23010,
    status: 'PAID',
  },
];

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();

  const totalOutstanding = mockInvoices
    .filter((i) => i.status === 'PENDING')
    .reduce((acc, curr) => acc + curr.total, 0);

  const totalBilled = mockInvoices.reduce((acc, curr) => acc + curr.total, 0);

  const handleDownloadInvoice = (invNum: string) => {
    const content = `TAX INVOICE\nInvoice: ${invNum}\nBilled To: ${user?.companyName} (${user?.clientCode})\nDate: ${new Date().toLocaleDateString()}\nStatus: Verified`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invNum}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Invoices & Billing</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review commercial invoices and payment receipts for {user?.companyName}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Outstanding</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">1 pending invoice</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fiscal Billing</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹{totalBilled.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified across 3 transactions</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Billing History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-3 px-5">Invoice Number</th>
                <th className="py-3 px-5">Billing Date</th>
                <th className="py-3 px-5 text-right">Taxable Amount</th>
                <th className="py-3 px-5 text-right">GST (18%)</th>
                <th className="py-3 px-5 text-right">Total Payable</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {mockInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500">
                    {inv.invoiceDate}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-700">
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-500">
                    ₹{inv.tax.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                    ₹{inv.total.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-5">
                    {inv.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" /> Payment Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(inv.invoiceNumber)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
