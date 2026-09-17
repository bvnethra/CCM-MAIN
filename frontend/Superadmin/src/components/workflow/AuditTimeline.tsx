import React from 'react';
import { Clock, User, Shield, ArrowRight } from 'lucide-react';
import { AuditLogEntry } from '../../types/dispatch';

export const AuditTimeline: React.FC<{ logs: AuditLogEntry[] }> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-400">
        No audit entries recorded for this entity yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {logs.map((log) => (
        <div key={log.id} className="relative group">
          <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 shadow-xs" />
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 hover:bg-white hover:shadow-xs transition">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">{log.userName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 font-mono">
                  {log.role}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{log.timestamp}</span>
              </div>
            </div>

            <div className="text-xs text-slate-700 font-medium mb-1">
              Action:{' '}
              <span className="font-mono text-indigo-700 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                {log.module}.{log.action}
              </span>{' '}
              on <span className="font-mono font-semibold">{log.recordIdentifier}</span>
            </div>

            {(log.oldValue || log.newValue) && (
              <div className="mt-2 text-xs bg-white border border-slate-200 rounded-lg p-2.5 font-mono text-slate-600 space-y-1">
                {log.oldValue && (
                  <div className="text-rose-600 line-through">
                    - {log.oldValue}
                  </div>
                )}
                {log.newValue && (
                  <div className="text-emerald-700">
                    + {log.newValue}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
