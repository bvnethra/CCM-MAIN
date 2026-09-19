import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  CalendarClock,
  Clock,
  ArrowRight,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Building,
  CheckCircle2,
  Share2,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { CalibrationOutcome } from '../../types/calibration';
import { CalibrationCertificate } from '../../types/certificate';
import { CalibrationRequest, RequestItem } from '../../types/request';
import { calibrationService } from '../../services/calibrationService';
import { requestService } from '../../services/requestService';
import { vendorService } from '../../services/vendorService';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/modals/AppModals';
import { TextInput, SelectInput, Textarea } from '../../components/forms/FormControls';
import { useNotification } from '../../context/NotificationContext';
import { Vendor } from '../../types/vendor';

export const CalibrationQueuePage: React.FC = () => {
  const [requests, setRequests] = useState<CalibrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [activeCert, setActiveCert] = useState<CalibrationCertificate | null>(null);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await requestService.getAll();
      setRequests(data);
    } catch {
      showToast('Unable to load calibration queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<{ req: CalibrationRequest; item: RequestItem }>[] = [
    {
      key: 'reqNumber',
      header: 'Request Reference',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-indigo-700 text-xs block">{row.req.requestNumber}</span>
          <span className="text-[11px] text-slate-400">{row.req.clientName}</span>
        </div>
      ),
    },
    {
      key: 'itemName',
      header: 'Equipment & Serial #',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{row.item.itemName}</span>
          <span className="font-mono text-[11px] text-slate-500">
            SN: {row.item.serialNumber || 'N/A'} • Code: {row.item.itemCode || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Physical Check',
      render: (row) => (
        <span
          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
            row.item.verificationResult === 'VERIFIED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {row.item.verificationResult || 'VERIFIED'}
        </span>
      ),
    },
    {
      key: 'itemStatus',
      header: 'Testing Stage',
      render: (row) => <StatusBadge status={row.item.calibrationStatus || 'PENDING'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/calibrations/new?reqId=${row.req.id}&itemId=${row.item.id}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
        >
          <FileCheck className="w-3.5 h-3.5" />
          Perform Calibration
        </button>
      ),
    },
  ];

  const queueRows = requests.flatMap((req) => req.items.map((item) => ({ req, item })));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Calibration Testing Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Execute precision measurement procedures, log calibration data, handle faulty items, or generate certificates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/calibrations/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <FileCheck className="w-4 h-4" />
          Perform Calibration Test
        </button>
      </div>

      <DataTable data={queueRows} columns={columns} loading={loading} />

      {/* Certificate Viewer Modal */}
      {activeCert && (
        <Modal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          title={`Calibration Certificate: ${activeCert.certificateNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="border border-slate-200 p-6 rounded-xl bg-white space-y-4 font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Apex Precision Metrology Laboratory</h3>
                  <span className="text-[11px] text-indigo-700 font-mono font-bold block">
                    NABL ISO/IEC 17025 Accredited (Cert # CC-2891)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-bold text-indigo-700 block">
                    {activeCert.certificateNumber}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">Issue Date: {activeCert.certificateDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">CLIENT NAME:</span>
                  <strong className="text-slate-900">{activeCert.clientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">EQUIPMENT TESTED:</span>
                  <strong className="text-slate-900">{activeCert.itemName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">SERIAL NUMBER:</span>
                  <span className="font-mono font-bold text-slate-800">{activeCert.serialNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">NEXT DUE DATE:</span>
                  <span className="font-mono font-bold text-emerald-700">{activeCert.nextDueDate}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">CALIBRATED BY:</span>
                  <strong className="text-slate-800">{activeCert.calibratedBy}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">APPROVED BY:</span>
                  <strong className="text-slate-800">{activeCert.authorizedSignatory}</strong>
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
                Print Certificate
              </button>
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
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

// Re-export Container as the named export AppRoutes expects
export { PerformCalibrationContainer as PerformCalibrationPage } from './PerformCalibrationContainer';

export const CalibrationDueListPage: React.FC = () => {
  const [dueItems, setDueItems] = useState<any[]>([]);

  useEffect(() => {
    calibrationService.getDueList().then(setDueItems);
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'certificateNumber',
      header: 'Last Certificate #',
      render: (d) => <span className="font-mono font-bold text-indigo-700 text-xs">{d.certificateNumber}</span>,
    },
    {
      key: 'clientName',
      header: 'Client Enterprise',
      sortable: true,
      render: (d) => <span className="font-semibold text-slate-900 text-xs">{d.clientName}</span>,
    },
    {
      key: 'itemName',
      header: 'Instrument & Serial',
      render: (d) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{d.itemName}</span>
          <span className="font-mono text-[11px] text-slate-400">SN: {d.serialNumber}</span>
        </div>
      ),
    },
    {
      key: 'nextDueDate',
      header: 'Next Calibration Due',
      sortable: true,
      render: (d) => <span className="font-mono text-xs font-bold text-slate-800">{d.nextDueDate}</span>,
    },
    {
      key: 'daysRemaining',
      header: 'Due Status',
      sortable: true,
      render: (d) => (
        <span
          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
            d.daysRemaining < 0
              ? 'bg-rose-50 text-rose-700'
              : d.daysRemaining <= 15
              ? 'bg-amber-50 text-amber-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {d.daysRemaining < 0 ? `${Math.abs(d.daysRemaining)} Days Overdue` : `Due in ${d.daysRemaining} Days`}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Calibration Due List & Recalibration Recall</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor upcoming calibration expiration dates and issue automated recalibration notices to clients.
        </p>
      </div>

      <DataTable data={dueItems} columns={columns} />
    </div>
  );
};
