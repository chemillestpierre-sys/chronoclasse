import React, { useMemo, useState } from 'react';
import { GripVertical, Plus, Search } from 'lucide-react';
import { CYCLE_INFO, DOMAIN_STYLES, PRESET_LABELS } from '../data/regulations';
import { CycleId, LabelTemplate, PedagogicalNature, SchoolType } from '../types/timetable';

interface DomainPaletteProps {
  cycle: CycleId;
  schoolType: SchoolType;
  onChangeCycle: (cycle: CycleId) => void;
  onChangeSchoolType: (schoolType: SchoolType) => void;
  onQuickAddTemplate: (template: LabelTemplate) => void;
  onOpenCustomLabel: () => void;
  onDragTemplateStart: (template: LabelTemplate) => void;
  onDragEnd: () => void;
}

const NATURE_LABELS: Record<PedagogicalNature, string> = {
  apprentissage: 'Apprentissage',
  rituel: 'Rituel',
  differenciation: 'Ateliers / Remédiation',
  lecture_plaisir: 'Lecture-plaisir',
  projet: 'Projet / Transverse',
};

export const DomainPalette: React.FC<DomainPaletteProps> = ({
  cycle,
  schoolType,
  onChangeCycle,
  onChangeSchoolType,
  onQuickAddTemplate,
  onOpenCustomLabel,
  onDragTemplateStart,
  onDragEnd,
}) => {
  const [search, setSearch] = useState('');
  const [natureFilter, setNatureFilter] = useState<'all' | PedagogicalNature>('all');

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PRESET_LABELS.filter((tpl) => {
      if (!tpl.cycles.includes(cycle)) return false;
      if (tpl.schoolTypes && !tpl.schoolTypes.includes(schoolType)) return false;
      if (natureFilter !== 'all' && tpl.nature !== natureFilter) return false;
      if (!q) return true;
      const domLabel = DOMAIN_STYLES[tpl.domainId].officialLabel.toLowerCase();
      return tpl.title.toLowerCase().includes(q) || domLabel.includes(q);
    });
  }, [cycle, schoolType, search, natureFilter]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tpl: LabelTemplate) => {
    onDragTemplateStart(tpl);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(
      'application/x-chronoclasse-label',
      JSON.stringify({ type: 'template', template: tpl })
    );
    // Fallback text for browser compatibility
    e.dataTransfer.setData('text/plain', tpl.title);
  };

  return (
    <aside className="w-full lg:w-[296px] shrink-0 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
      {/* Cycle selector */}
      <div className="p-4 border-b border-slate-200">
        <div className="text-xs font-semibold text-slate-500 mb-2">
          Cycle d’enseignement
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
          {(['cycle1', 'cycle2', 'cycle3'] as CycleId[]).map((cid) => {
            const active = cycle === cid;
            return (
              <button
                key={cid}
                type="button"
                onClick={() => onChangeCycle(cid)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cid === 'cycle1' ? 'Cycle 1' : cid === 'cycle2' ? 'Cycle 2' : 'Cycle 3'}
              </button>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
            Statut de l’école
          </div>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeSchoolType('publique')}
              className={`py-1 px-2 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                schoolType === 'publique'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Publique
            </button>
            <button
              type="button"
              onClick={() => onChangeSchoolType('catholique')}
              className={`py-1 px-2 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                schoolType === 'catholique'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Privée catholique
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          {CYCLE_INFO[cycle].levels} · Glissez une étiquette sur la grille hebdomadaire.
        </p>
      </div>

      {/* Search & nature filter */}
      <div className="p-3 border-b border-slate-200 space-y-2.5 bg-slate-50/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer un domaine ou intitulé…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {(
            [
              { id: 'all', label: 'Tout' },
              { id: 'apprentissage', label: 'Séances' },
              { id: 'rituel', label: 'Rituels' },
              { id: 'differenciation', label: 'Ateliers' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setNatureFilter(f.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                natureFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Draggable colored labels */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[580px]">
        {filteredTemplates.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Aucune étiquette ne correspond à ce filtre.
          </div>
        ) : (
          filteredTemplates.map((tpl) => {
            const style = DOMAIN_STYLES[tpl.domainId];
            return (
              <div
                key={tpl.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tpl)}
                onDragEnd={onDragEnd}
                style={{
                  backgroundColor: style.bgHex,
                  borderColor: style.borderHex,
                  color: style.textHex,
                }}
                className="group relative border rounded-lg p-2.5 cursor-grab active:cursor-grabbing transition-transform duration-150 hover:-translate-y-0.5 select-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50 group-hover:opacity-90" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold leading-snug">
                        {tpl.title}
                      </div>
                      <div className="mt-1 text-[11px] opacity-80 font-mono-tabular">
                        {tpl.defaultDurationMinutes} min · {NATURE_LABELS[tpl.nature]}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Ajouter à la grille"
                    onClick={() => onQuickAddTemplate(tpl)}
                    className="p-1 rounded hover:bg-black/10 transition-colors shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom label creator */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={onOpenCustomLabel}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Créer une étiquette personnalisée</span>
        </button>
      </div>
    </aside>
  );
};
