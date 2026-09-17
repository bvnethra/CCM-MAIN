import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  PauseCircle,
  FileCheck,
  Upload,
  AlertTriangle,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { CalibrationRequest, RequestItem } from '../../types/request';
import { requestService } from '../../services/requestService';
import { verificationService } from '../../services/verificationService';
import { documentService } from '../../services/documentService';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TextInput, SelectInput, Textarea } from '../../components/forms/FormControls';
import { DocumentManager } from '../../components/documents/DocumentManager';
import { useNotification } from '../../context/NotificationContext';

export const LabQueuePage: React.FC = () => {
  const [requests, setRequests] = useState<CalibrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await requestService.getAll();
      // Show requests in intake, lab queue, verification, on_hold
      const labRequests = data.filter((r) =>
        ['COLLECTED', 'LAB_QUEUE', 'VERIFICATION', 'ON_HOLD'].includes(r.status)
      );
      setRequests(labRequests);
    } catch {
      showToast('Unable to load laboratory intake queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handlePutOnHold = async (r: CalibrationRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await requestService.updateStatus(r.id, 'ON_HOLD', 'Hold placed during laboratory intake review');
      showToast(`Request ${r.requestNumber} placed ON HOLD`, 'warning');
      loadQueue();
    } catch {
      showToast('Failed to put request on hold', 'error');
    }
  };

  const filtered = requests.filter((r) => {
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    return true;
  });

  const columns: Column<CalibrationRequest>[] = [
    {
      key: 'requestNumber',
      header: 'Request / Intake Number',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-indigo-700 block text-xs">{r.requestNumber}</span>
          <span className="text-[10px] text-slate-400">{r.createdAt}</span>
        </div>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      sortable: true,
      render: (r) => <span className="font-semibold text-slate-900 text-xs">{r.clientName}</span>,
    },
    {
      key: 'items',
      header: 'Items Count',
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-slate-800">{r.items.length} units</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (r) => (
        <span
          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            r.priority === 'URGENT'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {r.priority}
        </span>
      ),
    },
    {
      key: 'labReceivedDate',
      header: 'Lab Received Date',
      render: (r) => (
        <span className="font-mono text-xs text-slate-500">{r.labReceivedDate || r.collectionDate}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/verification/${r.id}`)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Verify
          </button>
          <button
            type="button"
            onClick={(e) => handlePutOnHold(r, e)}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="Put On Hold"
          >
            <PauseCircle className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laboratory Intake Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage incoming instruments, physical box unpacking, verification checklists, and lab hold actions.
          </p>
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-2xs"
        >
          <option value="ALL">All SLA Priorities</option>
          <option value="URGENT">Urgent Express SLA</option>
          <option value="NORMAL">Normal Standard SLA</option>
        </select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search lab queue by request number, client, serial..."
        onRowClick={(r) => navigate(`/verification/${r.id}`)}
      />
    </div>
  );
};

export const ItemVerificationPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<CalibrationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RequestItem | null>(null);

  // Form states
  const [itemMatchStatus, setItemMatchStatus] = useState<'MATCHED' | 'NOT_MATCHED'>('MATCHED');
  const [serialMatchStatus, setSerialMatchStatus] = useState<'MATCHED' | 'NOT_MATCHED' | 'NOT_APPLICABLE'>('MATCHED');
  const [receivedQuantity, setReceivedQuantity] = useState(1);
  const [quantityStatus, setQuantityStatus] = useState<'MATCHED' | 'SHORT' | 'EXCESS'>('MATCHED');
  const [condition, setCondition] = useState<'GOOD' | 'DAMAGED' | 'FAULTY' | 'OTHER'>('GOOD');
  const [verificationResult, setVerificationResult] = useState<'VERIFIED' | 'DISCREPANCY' | 'SHORT' | 'EXCEPTION'>('VERIFIED');
  const [remarks, setRemarks] = useState('');
  const [validationBlocker, setValidationBlocker] = useState<string | null>(null);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadData = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const data = await requestService.getById(requestId);
      setRequest(data);
      if (data && data.items.length > 0) {
        setSelectedItem(data.items[0]);
        setReceivedQuantity(data.items[0].receivedQuantity || data.items[0].requestedQuantity);
      }
    } catch {
      showToast('Error loading verification data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [requestId]);

  const handleSelectItem = (it: RequestItem) => {
    setSelectedItem(it);
    setReceivedQuantity(it.receivedQuantity || it.requestedQuantity);
    setItemMatchStatus(it.itemMatchStatus || 'MATCHED');
    setSerialMatchStatus(it.serialMatchStatus || 'MATCHED');
    setCondition(it.condition || 'GOOD');
    setVerificationResult(it.verificationResult || 'VERIFIED');
    setRemarks(it.verificationRemarks || '');
    setValidationBlocker(null);
  };

  const handleVerifyItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !selectedItem) return;

    setValidationBlocker(null);

    // Architectural Rule: Verification blocked when mandatory docs missing
    const docCheck = await documentService.checkMandatoryDocuments(request.id);
    if (!docCheck.valid) {
      setValidationBlocker(
        `Verification Blocked: Mandatory compliance documents missing (${docCheck.missing.join(
          ', '
        )}). You must attach proof documents in the Document Manager below before progressing.`
      );
      showToast('Mandatory document missing. Cannot verify.', 'error');
      return;
    }

    try {
      const updated = await verificationService.submitVerification({
        requestId: request.id,
        requestItemId: selectedItem.id,
        itemMatchStatus,
        serialMatchStatus,
        expectedQuantity: selectedItem.requestedQuantity,
        receivedQuantity,
        quantityStatus,
        condition,
        verificationResult,
        remarks,
        documents: [],
      });

      setRequest(updated);
      showToast(`Item ${selectedItem.serialNumber} verified as ${verificationResult}`, 'success');
      loadData();
    } catch (err: any) {
      setValidationBlocker(err.message);
      showToast(err.message, 'error');
    }
  };

  if (loading || !request) {
    return <div className="text-center py-16 text-xs text-slate-400">Loading item verification workspace...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold text-slate-900">{request.requestNumber}</span>
            <StatusBadge status={request.status} size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Physical Inspection Desk • Client: <strong className="text-slate-800">{request.clientName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/requests/${request.id}`)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Open Central Workspace
          </button>
        </div>
      </div>

      {/* Blocker Alert if active */}
      {validationBlocker && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 font-medium animate-shake">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Physical Verification Blocked:</span>
            <span>{validationBlocker}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Items Picker, Right Verification Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Item list picker */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Request Items ({request.items.length})
            </h3>
            <span className="text-[11px] text-slate-400">Select to inspect</span>
          </div>

          <div className="space-y-2">
            {request.items.map((it) => {
              const isSelected = selectedItem?.id === it.id;
              return (
                <div
                  key={it.id}
                  onClick={() => handleSelectItem(it)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-100'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{it.itemName}</span>
                    <StatusBadge status={it.verificationResult || 'PENDING'} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>SN: {it.serialNumber}</span>
                    <span>Qty: {it.requestedQuantity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Item Inspection Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedItem && (
            <form
              onSubmit={handleVerifyItem}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle space-y-5"
            >
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Inspecting: {selectedItem.itemName}
                  </h3>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    SN: {selectedItem.serialNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Cross-verify physical serial number, match against gate pass documentation, and inspect outer casing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectInput
                  label="Item Specification Match"
                  required
                  value={itemMatchStatus}
                  onChange={(e) => setItemMatchStatus(e.target.value as any)}
                  options={[
                    { value: 'MATCHED', label: 'MATCHED - Matches physical equipment' },
                    { value: 'NOT_MATCHED', label: 'NOT_MATCHED - Different model/gauge' },
                  ]}
                />

                <SelectInput
                  label="Serial Number Tag Verification"
                  required
                  value={serialMatchStatus}
                  onChange={(e) => setSerialMatchStatus(e.target.value as any)}
                  options={[
                    { value: 'MATCHED', label: 'MATCHED - Serial tag matches paperwork' },
                    { value: 'NOT_MATCHED', label: 'NOT_MATCHED - Mismatched serial tag' },
                    { value: 'NOT_APPLICABLE', label: 'NOT_APPLICABLE - No serial tag' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextInput
                  type="number"
                  label="Received Quantity"
                  min={0}
                  value={String(receivedQuantity)}
                  onChange={(e) => setReceivedQuantity(Number(e.target.value) || 0)}
                  helperText={`Expected: ${selectedItem.requestedQuantity}`}
                />

                <SelectInput
                  label="Quantity Status"
                  value={quantityStatus}
                  onChange={(e) => setQuantityStatus(e.target.value as any)}
                  options={[
                    { value: 'MATCHED', label: 'MATCHED - Correct Quantity' },
                    { value: 'SHORT', label: 'SHORT - Quantity missing' },
                    { value: 'EXCESS', label: 'EXCESS - Extra items received' },
                  ]}
                />

                <SelectInput
                  label="Physical Condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  options={[
                    { value: 'GOOD', label: 'GOOD - Clean / No damage' },
                    { value: 'DAMAGED', label: 'DAMAGED - Physical scratches/bent' },
                    { value: 'FAULTY', label: 'FAULTY - Jammed / broken mechanism' },
                    { value: 'OTHER', label: 'OTHER' },
                  ]}
                />
              </div>

              <SelectInput
                label="Final Item Verification Outcome"
                required
                value={verificationResult}
                onChange={(e) => setVerificationResult(e.target.value as any)}
                options={[
                  { value: 'VERIFIED', label: 'VERIFIED - Cleared for Calibration Testing' },
                  { value: 'DISCREPANCY', label: 'DISCREPANCY - Document mismatch' },
                  { value: 'SHORT', label: 'SHORT - Missing physical items' },
                  { value: 'EXCEPTION', label: 'EXCEPTION - Lab Hold' },
                ]}
              />

              <Textarea
                label="Verification Remarks / Observations"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Note any physical wear, battery condition, or cable damages..."
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Verification Outcome
                </button>
              </div>
            </form>
          )}

          {/* Embedded Document Manager for Uploading Required Proofs */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Mandatory Inspection Proof & Gate Pass Documents
            </h3>
            <DocumentManager
              requestId={request.id}
              onDocumentsChange={() => {
                setValidationBlocker(null);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
