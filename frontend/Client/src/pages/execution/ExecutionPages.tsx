import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSignature,
  Send,
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  PenTool,
  Upload,
  AlertCircle,
  FileCheck2,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { DigitalSignature, DispatchRecord, DeliveryRecord, SignatureType } from '../../types/dispatch';
import { signatureService, dispatchService, deliveryService } from '../../services/executionServices';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SignatureModal, Modal } from '../../components/modals/AppModals';
import { TextInput, SelectInput, Textarea } from '../../components/forms/FormControls';
import { useNotification } from '../../context/NotificationContext';
import { mockStore } from '../../mock/initialStore';

// SIGNATURES PAGE: Separate Invoice and Delivery events
export const SignatureManagementPage: React.FC = () => {
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [activeSignTarget, setActiveSignTarget] = useState<{
    type: SignatureType;
    refId: string;
    clientName: string;
  } | null>(null);

  const { showToast } = useNotification();

  const loadSignatures = async () => {
    setLoading(true);
    try {
      const data = await signatureService.getAll();
      setSignatures(data);
    } catch {
      showToast('Error loading digital signatures', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignatures();
  }, []);

  const handleCapture = (type: SignatureType, refId: string, clientName: string) => {
    setActiveSignTarget({ type, refId, clientName });
    setSigModalOpen(true);
  };

  const handleSaveSignature = async (name: string, designation: string, data: string) => {
    if (!activeSignTarget) return;
    try {
      await signatureService.sign(
        activeSignTarget.type,
        activeSignTarget.refId,
        name,
        designation,
        data,
        'Digitally authenticated client acceptance'
      );
      showToast(`${activeSignTarget.type} signature captured successfully!`, 'success');
      setSigModalOpen(false);
      loadSignatures();
    } catch {
      showToast('Error recording signature', 'error');
    }
  };

  // Find unsigned invoices
  const unsignedInvoices = mockStore.data.invoices.filter((i) => !i.isSigned);

  const columns: Column<DigitalSignature>[] = [
    {
      key: 'type',
      header: 'Signature Event Type',
      render: (s) => (
        <span
          className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${
            s.type === 'INVOICE'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-teal-50 text-teal-800 border-teal-200'
          }`}
        >
          {s.type} SIGNATURE
        </span>
      ),
    },
    {
      key: 'referenceNumber',
      header: 'Target Document / Job',
      sortable: true,
      render: (s) => <span className="font-mono font-bold text-xs text-slate-800">{s.referenceNumber}</span>,
    },
    {
      key: 'clientName',
      header: 'Client Enterprise',
      sortable: true,
      render: (s) => <span className="font-semibold text-slate-900 text-xs">{s.clientName}</span>,
    },
    {
      key: 'signatoryName',
      header: 'Signatory Officer',
      render: (s) => (
        <div>
          <span className="font-medium text-slate-800 text-xs block">{s.signatoryName}</span>
          <span className="text-[10px] text-slate-400">{s.signatoryDesignation}</span>
        </div>
      ),
    },
    {
      key: 'signedDate',
      header: 'Timestamp',
      render: (s) => <span className="font-mono text-xs text-slate-500">{s.signedDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <StatusBadge status={s.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Digital Signatures</h1>
          <p className="text-xs text-slate-500 mt-1">
            Separated legal audit milestones: Commercial Invoice Sign-off vs Equipment Physical Delivery Acceptance.
          </p>
        </div>
      </div>

      {/* Pending Invoices to Sign */}
      {unsignedInvoices.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Pending Commercial Invoice Signatures ({unsignedInvoices.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unsignedInvoices.map((inv) => (
              <div key={inv.id} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-xs">{inv.invoiceNumber}</span>
                  <span className="text-[11px] text-slate-500 block">{inv.clientName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCapture('INVOICE', inv.id, inv.clientName)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Capture Sign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable data={signatures} columns={columns} loading={loading} />

      {activeSignTarget && (
        <SignatureModal
          isOpen={sigModalOpen}
          onClose={() => setSigModalOpen(false)}
          onSave={handleSaveSignature}
          type={activeSignTarget.type}
          title={`Sign ${activeSignTarget.type}: ${activeSignTarget.clientName}`}
        />
      )}
    </div>
  );
};

// DISPATCH PAGE
export const DispatchListPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Create modal states
  const [requestId, setRequestId] = useState(mockStore.data.requests[0]?.id || '');
  const [transportMode, setTransportMode] = useState<any>('COURIER');
  const [courierName, setCourierName] = useState('Blue Dart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [totalPackages, setTotalPackages] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('Client Works, Manufacturing Plant');

  const { showToast } = useNotification();

  const loadDispatches = async () => {
    setLoading(true);
    try {
      const data = await dispatchService.getAll();
      setDispatches(data);
    } catch {
      showToast('Error loading dispatches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const req = mockStore.data.requests.find((r) => r.id === requestId);
    if (!req) return;

    try {
      const created = await dispatchService.create({
        requestId: req.id,
        requestNumber: req.requestNumber,
        clientId: req.clientId,
        clientName: req.clientName,
        dispatchDate: new Date().toISOString().split('T')[0],
        transportMode,
        courierName,
        trackingNumber: trackingNumber || `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`,
        contactPerson: 'Quality Officer',
        deliveryAddress,
        items: req.items.map((it) => ({
          id: `di-${Date.now()}`,
          requestItemId: it.id,
          itemName: it.itemName,
          serialNumber: it.serialNumber,
          quantity: it.receivedQuantity || 1,
        })),
        totalPackages,
        remarks: 'Tamper evident seal applied. Calibration certificates enclosed.',
      });

      showToast(`Dispatch ${created.dispatchNumber} booked!`, 'success');
      setCreateModalOpen(false);
      loadDispatches();
    } catch {
      showToast('Error creating dispatch', 'error');
    }
  };

  const columns: Column<DispatchRecord>[] = [
    {
      key: 'dispatchNumber',
      header: 'Dispatch No',
      sortable: true,
      render: (d) => <span className="font-mono font-bold text-indigo-700 text-xs">{d.dispatchNumber}</span>,
    },
    {
      key: 'clientName',
      header: 'Destination Client',
      sortable: true,
      render: (d) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{d.clientName}</span>
          <span className="text-[11px] text-slate-400 font-mono">{d.requestNumber}</span>
        </div>
      ),
    },
    {
      key: 'transportMode',
      header: 'Logistics Courier',
      render: (d) => (
        <div>
          <span className="font-medium text-slate-800 text-xs block">{d.courierName || d.transportMode}</span>
          <span className="font-mono text-[10px] text-slate-500">AWB: {d.trackingNumber}</span>
        </div>
      ),
    },
    {
      key: 'dispatchDate',
      header: 'Dispatch Date',
      render: (d) => <span className="font-mono text-xs text-slate-500">{d.dispatchDate}</span>,
    },
    {
      key: 'packages',
      header: 'Packages',
      render: (d) => <span className="font-mono text-xs">{d.totalPackages} pkgs ({d.items.length} items)</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <StatusBadge status={d.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Instrument Dispatch</h1>
          <p className="text-xs text-slate-500 mt-1">
            Packing, courier airway bills, security tape tagging, and outbound shipment tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create Shipment Dispatch
        </button>
      </div>

      <DataTable data={dispatches} columns={columns} loading={loading} />

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Outbound Dispatch"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <SelectInput
            label="Calibration Request Ready to Dispatch"
            required
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            options={mockStore.data.requests.map((r) => ({
              value: r.id,
              label: `${r.requestNumber} - ${r.clientName} (${r.status})`,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="Transport Mode"
              required
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value)}
              options={[
                { value: 'COURIER', label: 'Express Courier' },
                { value: 'HAND_DELIVERY', label: 'Direct Hand Delivery' },
                { value: 'LOGISTICS_PARTNER', label: 'Dedicated Logistics Truck' },
                { value: 'CLIENT_PICKUP', label: 'Client Self Pickup' },
              ]}
            />
            <TextInput
              label="Courier / Logistics Partner"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. Blue Dart / DTDC"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="AWB / Tracking Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Leave blank for auto-generated AWB"
            />
            <TextInput
              type="number"
              label="Total Packages"
              min={1}
              value={String(totalPackages)}
              onChange={(e) => setTotalPackages(Number(e.target.value) || 1)}
            />
          </div>

          <TextInput
            label="Delivery Destination Address"
            required
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Book Dispatch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// DELIVERIES PAGE
export const DeliveryListPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryRecord | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // Signature modal
  const [signModalOpen, setSignModalOpen] = useState(false);

  const { showToast } = useNotification();

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await deliveryService.getAll();
      setDeliveries(data);
    } catch {
      showToast('Error loading deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handleMarkReceived = (d: DeliveryRecord) => {
    setActiveDelivery(d);
    setRecipientName('');
    setRecipientPhone('');
    setRecipientModalOpen(true);
  };

  const confirmReceived = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDelivery || !recipientName.trim()) return;
    try {
      await deliveryService.markReceived(activeDelivery.id, recipientName, recipientPhone);
      showToast(`Shipment marked RECEIVED by ${recipientName}`, 'success');
      setRecipientModalOpen(false);
      loadDeliveries();
    } catch {
      showToast('Failed to mark received', 'error');
    }
  };

  const handleSaveDeliverySign = async (name: string, designation: string, signatureData: string) => {
    if (!activeDelivery) return;
    try {
      await signatureService.sign('DELIVERY', activeDelivery.id, name, designation, signatureData);
      showToast('Delivery acknowledgement signature captured. Order COMPLETED!', 'success');
      setSignModalOpen(false);
      loadDeliveries();
    } catch {
      showToast('Error capturing signature', 'error');
    }
  };

  const columns: Column<DeliveryRecord>[] = [
    {
      key: 'deliveryNumber',
      header: 'Delivery No',
      sortable: true,
      render: (d) => <span className="font-mono font-bold text-teal-700 text-xs">{d.deliveryNumber}</span>,
    },
    {
      key: 'clientName',
      header: 'Recipient Client',
      sortable: true,
      render: (d) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{d.clientName}</span>
          <span className="text-[10px] text-slate-400 font-mono">{d.requestNumber}</span>
        </div>
      ),
    },
    {
      key: 'dispatchNumber',
      header: 'Dispatch Reference',
      render: (d) => <span className="font-mono text-xs text-slate-600">{d.dispatchNumber}</span>,
    },
    {
      key: 'status',
      header: 'Shipment Status',
      render: (d) => <StatusBadge status={d.status} size="sm" />,
    },
    {
      key: 'recipient',
      header: 'Acknowledged By',
      render: (d) => (
        d.recipientName ? (
          <div>
            <span className="font-medium text-slate-800 text-xs block">{d.recipientName}</span>
            <span className="text-[10px] text-slate-400 font-mono">{d.receivedDate}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">In Transit</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          {d.status === 'IN_TRANSIT' && (
            <button
              type="button"
              onClick={() => handleMarkReceived(d)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Mark Received
            </button>
          )}
          {d.status === 'RECEIVED' && (
            <button
              type="button"
              onClick={() => {
                setActiveDelivery(d);
                setSignModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5" />
              Capture Sign
            </button>
          )}
          {d.status === 'SIGNATURE_CAPTURED' && (
            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Fulfilled
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Delivery Acknowledgements</h1>
        <p className="text-xs text-slate-500 mt-1">
          Proof of delivery tracking, recipient sign-off, and final order completion milestone.
        </p>
      </div>

      <DataTable data={deliveries} columns={columns} loading={loading} />

      {/* Mark Received Modal */}
      <Modal
        isOpen={recipientModalOpen}
        onClose={() => setRecipientModalOpen(false)}
        title="Acknowledge Shipment Receipt"
        maxWidth="max-w-sm"
      >
        <form onSubmit={confirmReceived} className="space-y-4">
          <TextInput
            label="Recipient Full Name"
            required
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Santosh Jadhav"
          />
          <TextInput
            label="Recipient Contact Phone"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="+91 98000 00000"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRecipientModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Confirm Received
            </button>
          </div>
        </form>
      </Modal>

      {/* Delivery Signature Modal */}
      {activeDelivery && (
        <SignatureModal
          isOpen={signModalOpen}
          onClose={() => setSignModalOpen(false)}
          onSave={handleSaveDeliverySign}
          type="DELIVERY"
          title={`Delivery Receipt Signature: ${activeDelivery.deliveryNumber}`}
        />
      )}
    </div>
  );
};
