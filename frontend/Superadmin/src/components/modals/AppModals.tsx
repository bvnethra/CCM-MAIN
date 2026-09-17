import React, { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, FileText, PenTool, Search, ArrowLeft } from 'lucide-react';
import { ApprovalActionType } from '../../types/invoice';

// Generic Modal Container
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  fullPage?: boolean;
}> = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-md', fullPage = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-y-auto animate-fade-in">
        {/* Full Page Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 py-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{title || 'Form Details'}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              ESC to exit
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Full Page Body Content */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full ${maxWidth} max-h-[92vh] flex flex-col overflow-hidden transform transition-all animate-scale-up`}
      >
        {title && (
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
export const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  loading?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  itemName,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" fullPage={false}>
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
        {itemName && (
          <span className="text-xs font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700 mb-2">
            {itemName}
          </span>
        )}
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 px-3 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Commercial Approval Modal
export const ApprovalModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: ApprovalActionType, comments: string) => void;
  referenceTitle: string;
  amount: number;
  currency?: string;
}> = ({ isOpen, onClose, onAction, referenceTitle, amount, currency = 'INR' }) => {
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (action: ApprovalActionType) => {
    if ((action === 'REJECT' || action === 'REVISE') && !comments.trim()) {
      setError('Comments / reason are mandatory for rejection or revision requests.');
      return;
    }
    setError('');
    onAction(action, comments);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Quotation for Approval" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Record:</span>
          <div className="text-sm font-semibold text-slate-800">{referenceTitle}</div>
          <div className="mt-2 text-xs text-slate-500">
            Total Value:{' '}
            <span className="text-sm font-bold text-slate-900 font-mono">
              ₹ {amount.toLocaleString()} {currency}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Reviewer Remarks / Feedback
          </label>
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => {
              setComments(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter reason or special terms for this decision..."
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800"
          />
          {error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit('REVISE')}
            className="px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition"
          >
            Revise & Resubmit
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('REJECT')}
            className="px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('APPROVE')}
            className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
          >
            Approve Quotation
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Digital Signature Capture Modal
export const SignatureModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, designation: string, signatureData: string) => void;
  type: 'INVOICE' | 'DELIVERY';
  title?: string;
}> = ({ isOpen, onClose, onSave, type, title }) => {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [signMode, setSignMode] = useState<'type' | 'draw'>('draw');
  const [typedSign, setTypedSign] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isOpen && signMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isOpen, signMode]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    let sigData = '';
    if (signMode === 'draw' && canvasRef.current) {
      sigData = canvasRef.current.toDataURL();
    } else {
      sigData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="60"><text x="10" y="42" font-family="cursive" font-size="28" fill="%231e293b">${encodeURIComponent(
        typedSign || name
      )}</text></svg>`;
    }
    onSave(name, designation || 'Client Authorized Signatory', sigData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (type === 'INVOICE' ? 'Capture Client Commercial Invoice Signature' : 'Capture Client Delivery Receipt Signature')}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Signatory Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anand Kulkarni"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Designation / Title
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Quality Assurance Head"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Mode switcher */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-semibold text-slate-700">Signature Capture</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setSignMode('draw')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                signMode === 'draw' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Draw
            </button>
            <button
              type="button"
              onClick={() => setSignMode('type')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                signMode === 'type' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Type
            </button>
          </div>
        </div>

        {signMode === 'draw' ? (
          <div>
            <div className="relative border border-slate-300 rounded-xl bg-slate-50/50 overflow-hidden cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={440}
                height={140}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="w-full h-36"
              />
              <span className="absolute bottom-2 left-3 text-[10px] text-slate-400 select-none pointer-events-none">
                Sign inside the box using mouse or touch
              </span>
            </div>
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
              >
                Clear Pad
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={typedSign}
              onChange={(e) => setTypedSign(e.target.value)}
              placeholder="Type signature..."
              className="w-full text-xl font-serif italic p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
            />
          </div>
        )}

        <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl">
          By signing, you confirm authority to acknowledge commercial acceptance under client agreement. IP & timestamp logged for audit trail.
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition"
          >
            Sign & Acknowledge
          </button>
        </div>
      </div>
    </Modal>
  );
};
