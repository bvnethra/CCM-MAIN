import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  ShoppingBag,
  Eye,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Download,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { Invoice, InvoiceType, PurchaseOrder } from '../../types/invoice';
import { invoiceService, purchaseOrderService } from '../../services/commercialServices';
import { clientService } from '../../services/clientService';
import { requestService } from '../../services/requestService';
import { vendorService } from '../../services/vendorService';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/modals/AppModals';
import { SelectInput, TextInput, Textarea } from '../../components/forms/FormControls';
import { useNotification } from '../../context/NotificationContext';
import { Client } from '../../types/client';
import { CalibrationRequest } from '../../types/request';
import { Vendor } from '../../types/vendor';

export const InvoiceListPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getAll();
      setInvoices(data);
    } catch {
      showToast('Error loading invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice Number',
      sortable: true,
      render: (i) => (
        <div>
          <span className="font-mono font-bold text-teal-700 text-xs block">{i.invoiceNumber}</span>
          <span className="text-[10px] text-slate-400 font-mono">Due: {i.dueDate}</span>
        </div>
      ),
    },
    {
      key: 'invoiceType',
      header: 'Invoice Type',
      render: (i) => (
        <span className="font-mono text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
          {i.invoiceType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      sortable: true,
      render: (i) => <span className="font-semibold text-slate-900 text-xs">{i.clientName}</span>,
    },
    {
      key: 'requestNumber',
      header: 'Order Reference',
      render: (i) => <span className="font-mono text-xs text-slate-600">{i.requestNumber || 'Standalone'}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Value',
      sortable: true,
      render: (i) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          ₹ {i.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <StatusBadge status={i.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (i) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInvoice(i);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-xl transition"
        >
          <Eye className="w-3.5 h-3.5" />
          View Invoice
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tax Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Commercial billing records, full-request invoices, advance payments, and digital signatures.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/invoices/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Generate Tax Invoice
        </button>
      </div>

      <DataTable data={invoices} columns={columns} loading={loading} />

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Tax Invoice: ${selectedInvoice.invoiceNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="border border-slate-200 p-6 rounded-xl bg-white space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Apex Precision Labs Bangalore</h3>
                  <span className="text-[11px] text-slate-500">GSTIN: 29AAACA1234F1Z5</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-bold text-indigo-700 block">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">Date: {selectedInvoice.invoiceDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">BILLED TO:</span>
                  <strong className="text-slate-900">{selectedInvoice.clientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">PAYMENT DUE:</span>
                  <strong className="text-slate-900 font-mono">{selectedInvoice.dueDate}</strong>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Rate</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {selectedInvoice.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 px-3 font-sans font-medium text-slate-800">{it.description}</td>
                      <td className="py-2 px-3 text-center">{it.quantity}</td>
                      <td className="py-2 px-3 text-right">₹{it.rate}</td>
                      <td className="py-2 px-3 text-right font-bold">₹{it.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <div className="w-56 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tax (GST 18%):</span>
                    <span className="font-mono">₹{selectedInvoice.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1">
                    <span>Grand Total:</span>
                    <span className="font-mono text-indigo-700">
                      ₹{selectedInvoice.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export const AddInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<CalibrationRequest[]>([]);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('FULL_REQUEST');
  const [clientId, setClientId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clientService.getAll().then((data) => {
      setClients(data);
      if (data.length > 0) setClientId(data[0].id);
    });
    requestService.getAll().then((data) => {
      setRequests(data);
      if (data.length > 0) setRequestId(data[0].id);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      showToast('Please select a client', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const created = await invoiceService.create(invoiceType, clientId, requestId || undefined, undefined, notes);
      showToast(`Tax Invoice ${created.invoiceNumber} generated successfully!`, 'success');
      navigate('/commercial/invoices');
    } catch {
      showToast('Failed to generate invoice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/commercial/invoices')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Generate Tax Invoice</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create a formal tax invoice linked to a calibration request order or client account.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label="Invoice Billing Type"
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
              options={[
                { value: 'FULL_REQUEST', label: 'Full Request Order Billing' },
                { value: 'PARTIAL', label: 'Partial Completed Items Billing' },
                { value: 'INVOICE_ONLY', label: 'Standalone Direct Invoice' },
              ]}
            />

            <SelectInput
              label="Client Enterprise"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              options={clients.map((c) => ({
                value: c.id,
                label: `${c.clientName} (${c.clientCode})`,
              }))}
            />
          </div>

          {invoiceType !== 'INVOICE_ONLY' && (
            <SelectInput
              label="Linked Calibration Request"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              options={requests.map((r) => ({
                value: r.id,
                label: `${r.requestNumber} - ${r.clientName} (${r.items.length} items)`,
              }))}
            />
          )}

          <Textarea
            label="Invoice Notes & Payment Terms"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms: Due within 30 days via RTGS / NEFT. Mention GSTIN for tax credit..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/commercial/invoices')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Generate Tax Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PurchaseOrderListPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    purchaseOrderService.getAll().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO Number',
      sortable: true,
      render: (p) => <span className="font-mono font-bold text-indigo-700 text-xs">{p.poNumber}</span>,
    },
    {
      key: 'vendorName',
      header: 'Accredited Supplier Vendor',
      sortable: true,
      render: (p) => <span className="font-semibold text-slate-900 text-xs">{p.vendorName}</span>,
    },
    {
      key: 'requestNumber',
      header: 'Linked Calibration Request',
      render: (p) => <span className="font-mono text-xs text-slate-600">{p.requestNumber || 'Stock'}</span>,
    },
    {
      key: 'totalAmount',
      header: 'PO Value',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          ₹ {p.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'expectedDate',
      header: 'Expected Delivery',
      render: (p) => <span className="font-mono text-xs text-slate-500">{p.expectedDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <StatusBadge status={p.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track outsourcing purchase orders to external accredited laboratories and standard parts vendors.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/purchase-orders/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Issue Purchase Order
        </button>
      </div>

      <DataTable data={orders} columns={columns} loading={loading} />
    </div>
  );
};

export const AddPurchaseOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<CalibrationRequest[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [amount, setAmount] = useState('15000');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    vendorService.getAll().then((data) => {
      setVendors(data);
      if (data.length > 0) setVendorId(data[0].id);
    });
    requestService.getAll().then((data) => {
      setRequests(data);
      if (data.length > 0) setRequestId(data[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      showToast('Please select a vendor', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      showToast('Purchase Order issued successfully!', 'success');
      navigate('/commercial/purchase-orders');
    } catch {
      showToast('Failed to issue purchase order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/commercial/purchase-orders')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Purchase Orders
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Issue Purchase Order</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an official outsourcing PO for external accredited partner labs or supplier vendors.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label="Supplier Vendor"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              options={vendors.map((v) => ({
                value: v.id,
                label: `${v.vendorName} (${v.vendorCode})`,
              }))}
            />

            <SelectInput
              label="Linked Calibration Request"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              options={requests.map((r) => ({
                value: r.id,
                label: `${r.requestNumber} - ${r.clientName}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              type="date"
              label="Expected Delivery Date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
            <TextInput
              type="number"
              label="Total PO Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Textarea
            label="Outsourcing Instructions / Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Specify calibration standards, NABL traceability scope, packaging requirements..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/commercial/purchase-orders')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Issue Purchase Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
