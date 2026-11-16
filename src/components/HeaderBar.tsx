import React from 'react';
import { Download } from 'lucide-react';

export type AppView = 'atelier' | 'modeles' | 'horaires' | 'conformite' | 'cadre';

interface HeaderBarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenExport: () => void;
}

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'atelier', label: 'Emploi du temps' },
  { id: 'modeles', label: 'Modèles' },
  { id: 'horaires', label: 'Horaires & Récréations' },
  { id: 'conformite', label: 'Conformité' },
  { id: 'cadre', label: 'Cadre officiel' },
];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeView,
  onSelectView,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between gap-8">
      {/* Zone 1: Single-element wordmark */}
      <button
        type="button"
        onClick={() => onSelectView('atelier')}
        className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 cursor-pointer"
      >
        ChronoClasse
      </button>

      {/* Zone 2: Concise single-line navigation links */}
      <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-7">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isActive
                  ? 'text-blue-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-700"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile compact nav */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto">
        <select
          aria-label="Navigation"
          value={activeView}
          onChange={(e) => onSelectView(e.target.value as AppView)}
          className="text-sm font-medium text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5"
        >
          {NAV_ITEMS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Zone 3: Single primary action */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Exporter PDF / Image</span>
        </button>
      </div>
    </header>
  );
};
