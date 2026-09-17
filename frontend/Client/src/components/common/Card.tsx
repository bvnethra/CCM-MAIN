import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  footer,
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden flex flex-col ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-6 flex-1">{children}</div>
      {footer && <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">{footer}</div>}
    </div>
  );
};
