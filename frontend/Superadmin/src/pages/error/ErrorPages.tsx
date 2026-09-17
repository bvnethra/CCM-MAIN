import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AccessDeniedModal } from '../../components/common/AccessDeniedModal';

export const Forbidden403Page: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <AccessDeniedModal
        isOpen={true}
        routePath={location.pathname}
        onClose={() => navigate('/admin/dashboard', { replace: true })}
      />
    </div>
  );
};

export const NotFound404Page: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-subtle">
        <span className="text-4xl font-extrabold text-slate-300 font-mono">404</span>
        <h2 className="text-xl font-bold text-slate-900 mt-2 mb-2">Page Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested page or route does not exist in the calibration management system.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
