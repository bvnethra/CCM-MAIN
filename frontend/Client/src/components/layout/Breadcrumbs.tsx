import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4 select-none font-medium">
      <Link to="/admin/dashboard" className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>Home</span>
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        const formatted = name
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return (
          <React.Fragment key={name}>
            <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-300 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 px-2 py-0.5 rounded-md bg-slate-100/80 truncate">{formatted}</span>
            ) : (
              <Link to={routeTo} className="hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100/70 transition-colors truncate">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
