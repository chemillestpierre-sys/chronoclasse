import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Trash2, X } from 'lucide-react';
import {
  DOMAIN_STYLES,
  evaluateBlockVocabulary,
  getDomainLabelForCycle,
} from '../data/regulations';
import {
  CycleId,
  DayId,
  DomainId,
  PedagogicalNature,
  ScheduledBlock,
  SchoolSettings,
} from '../types/timetable';
import {
  DAY_LABELS,
  formatTimeInput,
  getActiveDays,
  parseTimeInput,
} from '../utils/timeUtils';

interface BlockEditorModalProps {
  mode: 'edit' | 'create';
  initialBlock: ScheduledBlock;
  settings: SchoolSettings;
  onSave: (block: ScheduledBlock) => void;
  onDelete?: (blockId: string) => void;
  onDuplicate?: (block: ScheduledBlock) => void;
  onClose: () => void;
}

const DOMAIN_OPTIONS_BY_CYCLE: Record<CycleId, DomainId[]> = {
  cycle1: ['francais', 'mathematiques', 'eps', 'artistique', 'qlm', 'autres_c1', 'catechese'],
  cycle2: ['francais', 'mathematiques', 'langues', 'eps', 'artistique', 'qlm', 'emc', 'catechese'],
  cycle3: [
    'francais',
    'mathematiques',
    'langues',
    'eps',
    'sciences',
    'histoire_geo',
    'emc',
    'artistique',
    'catechese',
  ],
};

export const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  mode,
  initialBlock,
  settings,
  onSave,
  onDelete,
  onDuplicate,
  onClose,
}) => {
  const [draft, setDraft] = useState<ScheduledBlock>(initialBlock);
  const activeDays = getActiveDays(settings);
  const domainChoices = DOMAIN_OPTIONS_BY_CYCLE[settings.cycle].filter(
    (d) =>
      d !== 'catechese' ||
      settings.schoolType === 'catholique' ||
      draft.domainId === 'catechese'
  );

  const vocabIssue = useMemo(
    () => evaluateBlockVocabulary(draft, settings.cycle),
    [draft, settings.cycle]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...draft,
      title: draft.title.trim() || getDomainLabelForCycle(draft.domainId, settings.cycle),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 id="block-modal-title" className="text-base font-semibold text-slate-900">
            {mode === 'create' ? 'Créer une étiquette' : 'Modifier la séance'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Primary Domain */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Domaine réglementaire principal
            </label>
            <select
              value={draft.domainId}
              onChange={(e) => {
                const nextDomain = e.target.value as DomainId;
                setDraft((prev) => ({
                  ...prev,
                  domainId: nextDomain,
                  title:
                    mode === 'create'
                      ? getDomainLabelForCycle(nextDomain, settings.cycle)
                      : prev.title,
                }));
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            >
              {domainChoices.map((did) => (
                <option key={did} value={did}>
                  {getDomainLabelForCycle(did, settings.cycle)}
                </option>
              ))}
            </select>
          </div>

          {/* Title + live vocabulary check */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Intitulé affiché sur l’emploi du temps
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Ex. Français — Lecture et compréhension"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
            {vocabIssue ? (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Vocabulaire à préciser : </span>
                    {vocabIssue.reason}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, title: vocabIssue.suggestedTitle })}
                  className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  Appliquer l’intitulé réglementaire : « {vocabIssue.suggestedTitle} »
                </button>
              </div>
            ) : (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Appellation conforme au vocabulaire officiel.</span>
              </div>
            )}
          </div>

          {/* Day, Start time, Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jour
              </label>
              <select
                value={draft.day}
                onChange={(e) => setDraft({ ...draft, day: e.target.value as DayId })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                {activeDays.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Début
              </label>
              <input
                type="time"
                value={formatTimeInput(draft.startMinutes)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    startMinutes: parseTimeInput(e.target.value, draft.startMinutes),
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Durée (min)
              </label>
              <input
                type="number"
                min={5}
                max={240}
                step={5}
                value={draft.durationMinutes}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    durationMinutes: Math.max(5, Math.min(240, Number(e.target.value) || 15)),
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Nature & Interdisciplinary integration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nature pédagogique
              </label>
              <select
                value={draft.nature}
                onChange={(e) =>
                  setDraft({ ...draft, nature: e.target.value as PedagogicalNature })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="apprentissage">Apprentissage continu</option>
                <option value="rituel">Rituel quotidien</option>
                <option value="differenciation">Différenciation / Ateliers</option>
                <option value="lecture_plaisir">Lecture-plaisir (hors évaluation)</option>
                <option value="projet">Projet interdisciplinaire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Point d’intégration (optionnel)
              </label>
              <select
                value={draft.secondaryDomainId || ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    secondaryDomainId: (e.target.value || undefined) as DomainId | undefined,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">Aucun domaine secondaire</option>
                {domainChoices
                  .filter((d) => d !== draft.domainId && d !== 'catechese')
                  .map((did) => (
                    <option key={did} value={did}>
                      + {DOMAIN_STYLES[did].shortLabel}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Précisions (salle, groupe, projet…)
            </label>
            <input
              type="text"
              value={draft.notes || ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Ex. Gymnase municipal · Demi-groupe"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {mode === 'edit' && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(draft.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              )}
              {mode === 'edit' && onDuplicate && (
                <button
                  type="button"
                  onClick={() => onDuplicate(draft)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Dupliquer</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                {mode === 'create' ? 'Ajouter à la grille' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
