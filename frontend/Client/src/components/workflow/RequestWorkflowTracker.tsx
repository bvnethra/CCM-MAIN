import React from 'react';
import { Check, AlertTriangle, Clock } from 'lucide-react';
import { RequestStatus, RequestWorkflowStatus } from '../../types/request';
import { WORKFLOW_STAGES, EXCEPTION_STATUSES } from '../../constants/workflow';

interface RequestWorkflowTrackerProps {
  currentStatus: RequestStatus;
  className?: string;
  onStageClick?: (status: RequestWorkflowStatus) => void;
}

export const RequestWorkflowTracker: React.FC<RequestWorkflowTrackerProps> = ({
  currentStatus,
  className = '',
  onStageClick,
}) => {
  const isException = Object.keys(EXCEPTION_STATUSES).includes(currentStatus);

  // Find index of current stage in WORKFLOW_STAGES
  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.status === currentStatus);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Operational Lifecycle Workflow
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-semibold text-indigo-600 font-mono">
            {currentStatus.replace(/_/g, ' ')}
          </span>
        </div>

        {isException && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Exception State: {EXCEPTION_STATUSES[currentStatus as keyof typeof EXCEPTION_STATUSES]?.label}</span>
          </div>
        )}
      </div>

      {/* Horizontal Scrollable Stepper */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-[1000px] justify-between relative">
          {/* Background Connecting Line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

          {WORKFLOW_STAGES.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;
            const isUpcoming = currentStageIndex < idx;

            let circleClass = 'bg-white border-2 border-slate-300 text-slate-400';
            let icon = <span className="text-[11px] font-semibold">{idx + 1}</span>;
            let textClass = 'text-slate-400 font-medium';

            if (isCompleted) {
              circleClass = 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-xs';
              icon = <Check className="w-3.5 h-3.5 stroke-[3]" />;
              textClass = 'text-emerald-700 font-semibold';
            } else if (isCurrent) {
              if (isException) {
                circleClass = 'bg-amber-500 border-2 border-amber-500 text-white ring-4 ring-amber-100 shadow-xs';
                icon = <AlertTriangle className="w-3.5 h-3.5" />;
                textClass = 'text-amber-800 font-bold';
              } else {
                circleClass = 'bg-indigo-600 border-2 border-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs';
                icon = <Clock className="w-3.5 h-3.5 animate-pulse" />;
                textClass = 'text-indigo-700 font-bold';
              }
            }

            return (
              <div
                key={stage.status}
                onClick={() => onStageClick && onStageClick(stage.status)}
                className={`relative z-10 flex flex-col items-center group ${
                  onStageClick ? 'cursor-pointer' : ''
                }`}
                style={{ width: `${100 / WORKFLOW_STAGES.length}%` }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${circleClass} group-hover:scale-110`}
                >
                  {icon}
                </div>
                <span className={`text-[11px] mt-2 text-center tracking-tight leading-tight ${textClass}`}>
                  {stage.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
