import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  AlertTriangle,
  Clock,
  Eye,
  Send,
  ShoppingBag,
  FileSpreadsheet,
} from 'lucide-react';
import { Quotation, QuotationFormData } from '../../types/quotation';
import { ApprovalRecord, PurchaseOrder, Invoice, InvoiceType } from '../../types/invoice';
import { quotationService, approvalService, purchaseOrderService, invoiceService } from '../../services/commercialServices';
import { clientService, itemService } from '../../services/clientService';
import { requestService } from '../../services/requestService';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApprovalModal, Modal } from '../../components/modals/AppModals';
import { TextInput, SelectInput, Textarea } from '../../components/forms/FormControls';
import { useNotification } from '../../context/NotificationContext';

export const QuotationListPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    quotationService.getAll().then((data) => {
      setQuotations(data);
      setLoading(false);
    });
  }, []);

  const columns: Column<Quotation>[] = [
    {
      key: 'quotationNumber',
      header: 'Quotation Number',
      sortable: true,
      render: (q) => (
        <div>
          <span className="font-mono font-bold text-amber-700 text-xs block">{q.quotationNumber}</span>
          <span className="text-[10px] text-slate-400 font-mono">{q.quotationDate}</span>
        </div>
      ),
    },
    {
      key: 'clientName',
      header: 'Client Enterprise',
      sortable: true,
      render: (q) => <span className="font-semibold text-slate-900 text-xs">{q.clientName}</span>,
    },
    {
      key: 'requestNumber',
      header: 'Linked Request',
      render: (q) => (
        <span className="font-mono text-xs text-indigo-700 font-semibold">{q.requestNumber || 'Standalone'}</span>
      ),
    },
    {
      key: 'items',
      header: 'Items Count',
      render: (q) => <span className="font-mono text-xs">{q.items.length} items</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Value',
      sortable: true,
      render: (q) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          ₹ {q.totalAmount.toLocaleString()} {q.currency}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (q) => <StatusBadge status={q.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (q) => (
        <button
          type="button"
          onClick={() => navigate(`/commercial/quotations/${q.id}`)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Commercial Quotations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pricing proposals, standard rate enforcement, rate overrides with audit justification, and client approvals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/commercial/quotations/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create Quotation
        </button>
      </div>

      <DataTable data={quotations} columns={columns} loading={loading} />
    </div>
  );
};

export const QuotationCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryReqId = searchParams.get('requestId') || '';

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);

  const [clientId, setClientId] = useState('');
  const [requestId, setRequestId] = useState(queryReqId);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      clientService.getAll(),
      requestService.getAll(),
      itemService.getAll(),
    ])
      .then(([cList, rList, iList]) => {
        if (!isMounted) return;
        setClients(cList || []);
        setRequests(rList || []);
        setCatalogItems(iList || []);

        const targetReq = queryReqId ? rList.find((r) => r.id === queryReqId) : undefined;
        const initialClient = targetReq?.clientId || cList[0]?.id || '';
        setClientId(initialClient);

        if (targetReq) {
          setRequestId(targetReq.id);
          setRemarks(`Quotation draft for Request ${targetReq.requestNumber}`);
          if (targetReq.items && targetReq.items.length > 0) {
            setItems(
              targetReq.items.map((it: any) => {
                const itemObj = iList.find((i) => i.id === it.itemId);
                return {
                  itemId: it.itemId || itemObj?.id || '',
                  itemName: it.itemName || itemObj?.itemName || 'Instrument',
                  itemCode: it.itemCode || itemObj?.itemCode || 'ITM-001',
                  standardCost: Number(it.standardCost || itemObj?.standardCost) || 1200,
                  overrideCost: undefined,
                  overrideReason: '',
                  quantity: it.requestedQuantity || 1,
                  taxRate: 18,
                };
              })
            );
          } else if (iList.length > 0) {
            setItems([
              {
                itemId: iList[0].id,
                itemName: iList[0].itemName,
                itemCode: iList[0].itemCode,
                standardCost: Number(iList[0].standardCost) || 1000,
                overrideCost: undefined,
                overrideReason: '',
                quantity: 1,
                taxRate: 18,
              },
            ]);
          }
        } else if (iList.length > 0) {
          setItems([
            {
              itemId: iList[0].id,
              itemName: iList[0].itemName,
              itemCode: iList[0].itemCode,
              standardCost: Number(iList[0].standardCost) || 1000,
              overrideCost: undefined,
              overrideReason: '',
              quantity: 1,
              taxRate: 18,
            },
          ]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching quotation dependencies:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [queryReqId]);

  const handleAddItem = (itemMasterId: string) => {
    const it = catalogItems.find((i) => i.id === itemMasterId);
    if (!it) return;
    setItems([
      ...items,
      {
        itemId: it.id,
        itemName: it.itemName,
        itemCode: it.itemCode,
        standardCost: Number(it.standardCost) || 1000,
        overrideCost: undefined,
        overrideReason: '',
        quantity: 1,
        taxRate: 18,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce(
    (acc, it) =>
      acc +
      (it.overrideCost !== undefined && it.overrideCost !== ''
        ? Number(it.overrideCost)
        : Number(it.standardCost) || 0) *
        (it.quantity || 1),
    0
  );
  const taxAmount = (subtotal * 18) / 100;
  const total = subtotal + taxAmount - Number(discountAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Add at least one item', 'warning');
      return;
    }

    const invalidOverride = items.find(
      (it) =>
        it.overrideCost !== undefined &&
        it.overrideCost !== '' &&
        (!it.overrideReason || it.overrideReason.trim().length < 3)
    );
    if (invalidOverride) {
      showToast(
        `Override reason is mandatory for ${invalidOverride.itemName} when standard cost is modified`,
        'warning'
      );
      return;
    }

    try {
      const created = await quotationService.create({
        clientId,
        requestId,
        validUntil,
        currency: 'INR',
        discountAmount,
        remarks,
        items,
      });

      showToast(`Quotation ${created.quotationNumber} submitted for Approver sign-off!`, 'success');
      navigate('/commercial/approvals');
    } catch {
      showToast('Error creating quotation', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Commercial Quotation</h1>
          <p className="text-xs text-slate-500">
            Standard pricing defaults with auditable price overrides and automatic tax calculation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/commercial/quotations')}
          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectInput
              label="Select Client"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              options={clients.map((c) => ({ value: c.id, label: c.clientName }))}
            />
            <SelectInput
              label="Linked Calibration Request"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              options={[
                { value: '', label: 'Standalone Commercial Proposal' },
                ...requests.map((r) => ({
                  value: r.id,
                  label: `${r.requestNumber} (${r.clientName})`,
                })),
              ]}
            />
            <TextInput
              type="date"
              label="Proposal Valid Until"
              required
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        </div>

        {/* Items Pricing Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Items Pricing Matrix</h3>
              <span className="text-[11px] text-slate-500">
                Standard cost loaded from Master Data. Overrides trigger highlighted audit review.
              </span>
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) handleAddItem(e.target.value);
                e.target.value = '';
              }}
              className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="">+ Add Item from Catalog...</option>
              {catalogItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.itemName} (Std: ₹{(Number(i.standardCost) || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="px-5 py-3">Equipment</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3">Standard Rate</th>
                  <th className="px-4 py-3">Override Rate (Optional)</th>
                  <th className="px-4 py-3">Override Reason (Mandatory if modified)</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => {
                  const hasOverride = it.overrideCost !== undefined && it.overrideCost !== '';
                  const stdCost = Number(it.standardCost) || 0;
                  const rate = hasOverride ? Number(it.overrideCost) : stdCost;
                  const lineTotal = rate * (it.quantity || 1);

                  return (
                    <tr
                      key={idx}
                      className={hasOverride ? 'bg-amber-50/40 transition' : 'hover:bg-slate-50 transition'}
                    >
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {it.itemName}
                        <span className="block font-mono text-[10px] text-slate-400">{it.itemCode}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value) || 1)}
                          className="w-12 text-center p-1 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-500">
                        ₹ {stdCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          placeholder="Leave empty for standard"
                          value={it.overrideCost !== undefined ? it.overrideCost : ''}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              'overrideCost',
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className={`w-32 p-1.5 border rounded-lg text-xs font-mono ${
                            hasOverride
                              ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                              : 'border-slate-200 text-slate-700'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {hasOverride ? (
                          <input
                            type="text"
                            required
                            placeholder="Mandatory justification..."
                            value={it.overrideReason || ''}
                            onChange={(e) => handleUpdateItem(idx, 'overrideReason', e.target.value)}
                            className="w-full p-1.5 border border-amber-300 rounded-lg text-xs bg-white text-slate-800"
                          />
                        ) : (
                          <span className="text-slate-400 select-none">Standard Rate Applied</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ₹ {lineTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 text-xs"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-4">
            <div className="w-full sm:w-80">
              <TextInput
                type="number"
                label="Contract Discount (₹)"
                value={String(discountAmount)}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
              />
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-slate-800">₹ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (18%):</span>
                <span className="font-mono font-semibold text-slate-800">₹ {taxAmount.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span className="font-mono">- ₹ {Number(discountAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Amount:</span>
                <span className="font-mono text-indigo-700">₹ {total.toLocaleString()} INR</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2"
            >
              <span>Submit for Approver Review</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export const ApprovalQueuePage: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeApproval, setActiveApproval] = useState<ApprovalRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await approvalService.getAll();
      setApprovals(data);
    } catch {
      showToast('Error loading approvals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (action: any, comments: string) => {
    if (!activeApproval) return;
    try {
      await approvalService.processApproval(activeApproval.id, action, comments);
      showToast(`Quotation ${activeApproval.quotationNumber} decision: ${action}`, 'success');
      loadData();
    } catch {
      showToast('Failed to process approval', 'error');
    }
  };

  const columns: Column<ApprovalRecord>[] = [
    {
      key: 'quotationNumber',
      header: 'Quotation Number',
      sortable: true,
      render: (a) => (
        <span className="font-mono font-bold text-amber-700 text-xs">{a.quotationNumber}</span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client Enterprise',
      sortable: true,
      render: (a) => <span className="font-semibold text-slate-900 text-xs">{a.clientName}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Quotation Amount',
      sortable: true,
      render: (a) => (
        <span className="font-mono font-bold text-xs text-slate-800">
          ₹ {a.totalAmount.toLocaleString()} {a.currency}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Submitted By',
      render: (a) => <span className="text-xs text-slate-600">{a.createdBy}</span>,
    },
    {
      key: 'status',
      header: 'Decision Status',
      render: (a) => <StatusBadge status={a.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (a) =>
        a.status === 'PENDING' ? (
          <button
            type="button"
            onClick={() => {
              setActiveApproval(a);
              setModalOpen(true);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Review & Sign-Off
          </button>
        ) : (
          <span className="text-xs text-slate-400 font-mono">Reviewed</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Approvals Desk</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized management sign-off for quotations, commercial discounts, rate overrides, and client exceptions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-subtle">
          <span className="text-xs text-slate-400 font-bold uppercase">Pending Decision</span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {approvals.filter((a) => a.status === 'PENDING').length}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-subtle">
          <span className="text-xs text-slate-400 font-bold uppercase">Approved</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {approvals.filter((a) => a.status === 'APPROVED').length}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-subtle">
          <span className="text-xs text-slate-400 font-bold uppercase">Revision Requested</span>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {approvals.filter((a) => a.status === 'REVISION_REQUIRED' || a.status === 'REJECTED').length}
          </div>
        </div>
      </div>

      <DataTable data={approvals} columns={columns} loading={loading} />

      {activeApproval && (
        <ApprovalModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onAction={handleAction}
          referenceTitle={`${activeApproval.quotationNumber} - ${activeApproval.clientName}`}
          amount={activeApproval.totalAmount}
        />
      )}
    </div>
  );
};
