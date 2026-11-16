import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { TIMETABLE_MODELS } from '../data/models';
import { CYCLE_INFO, DOMAIN_STYLES } from '../data/regulations';
import { GradeLevelId, SchoolType } from '../types/timetable';
import { runComplianceAudit } from '../utils/complianceEngine';
import { formatDuration } from '../utils/timeUtils';

interface ModelsGalleryViewProps {
  schoolType: SchoolType;
  onChangeSchoolType: (schoolType: SchoolType) => void;
  onApplyModel: (modelId: GradeLevelId) => void;
  onGoToAtelier: () => void;
}

export const ModelsGalleryView: React.FC<ModelsGalleryViewProps> = ({
  schoolType,
  onChangeSchoolType,
  onApplyModel,
  onGoToAtelier,
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Modèles d’emplois du temps par niveau (Maternelle & Élémentaire)
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Exemples complets construits selon les prescriptions BOEN n°31 et SYNADEC, avec répartition des domaines d’apprentissage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeSchoolType('publique')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
                schoolType === 'publique'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              École publique
            </button>
            <button
              type="button"
              onClick={() => onChangeSchoolType('catholique')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
                schoolType === 'catholique'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              École privée catholique (+1h)
            </button>
          </div>

          <button
            type="button"
            onClick={onGoToAtelier}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
          >
            Retour à la grille
          </button>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {TIMETABLE_MODELS.map((model) => {
          const settings = model.buildSettings(schoolType);
          const blocks = model.buildBlocks(schoolType);
          const report = runComplianceAudit(settings, blocks);

          return (
            <article
              key={model.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      {model.schoolCategory} · {CYCLE_INFO[model.cycle].shortLabel}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      {model.title}
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conforme</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {model.summary}
                </p>

                {/* Domain Breakdown computed from real model blocks */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Répartition des domaines d’apprentissage</span>
                    <span className="font-mono-tabular text-slate-500">
                      {formatDuration(report.totalScheduledTeachingMinutes)} effectives
                      {report.totalCatecheseMinutes > 0
                        ? ` + ${formatDuration(report.totalCatecheseMinutes)} caractère propre`
                        : ''}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {report.domainRows.map((row) => {
                      const style = DOMAIN_STYLES[row.group.domainIds[0]];
                      return (
                        <div
                          key={row.group.id}
                          className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-sm shrink-0"
                              style={{ backgroundColor: style.swatchHex }}
                            />
                            <span className="text-slate-800 truncate">
                              {row.group.label}
                            </span>
                          </div>
                          <span className="font-mono-tabular font-semibold text-slate-900 shrink-0">
                            {formatDuration(row.scheduledMinutes)}
                          </span>
                        </div>
                      );
                    })}
                    {schoolType === 'catholique' && (
                      <div className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs bg-purple-50/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: DOMAIN_STYLES.catechese.swatchHex }}
                          />
                          <span className="text-purple-950 font-medium truncate">
                            Caractère propre — Catéchèse ou éveil à la foi (fin de journée)
                          </span>
                        </div>
                        <span className="font-mono-tabular font-semibold text-purple-900 shrink-0">
                          {formatDuration(report.totalCatecheseMinutes)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-mono-tabular">
                  Récréations : {formatDuration(report.totalRecessMinutes)} · Présence :{' '}
                  {formatDuration(report.totalPresenceMinutes)}
                </span>
                <button
                  type="button"
                  onClick={() => onApplyModel(model.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer shrink-0"
                >
                  <span>Utiliser ce modèle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
