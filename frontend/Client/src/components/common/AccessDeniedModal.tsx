import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose?: () => void;
  requiredPermission?: string;
  routePath?: string;
}

export const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({
  isOpen,
  onClose,
  requiredPermission,
  routePath,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/admin/dashboard', { replace: true });
    }
  };

  const handleReturnDashboard = () => {
    navigate('/admin/dashboard', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative transform transition-all animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Badge Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-mono font-bold tracking-wide uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>HTTP 403 Access Denied</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3 mb-2 tracking-tight">
            Insufficient Permissions
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            Your current assigned role does not possess the granular privileges required to access this resource or execute this business operation.
          </p>
        </div>

        {/* Path & Permission Context Details */}
        <div className="mt-5 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs text-left">
          {routePath && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Requested URL:</span>
              <span className="font-mono text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 truncate max-w-[200px]">
                {routePath}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Your Role:</span>
            <span className="font-semibold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded">
              {user?.roleName || user?.role || 'Guest'}
            </span>
          </div>

          {requiredPermission && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Required Privilege:</span>
              <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                {requiredPermission}
              </span>
            </div>
          )}

          <div className="pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-400">
            Protected by Metrology RBAC &amp; ISO/IEC 17025 security policies.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleReturnDashboard}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
