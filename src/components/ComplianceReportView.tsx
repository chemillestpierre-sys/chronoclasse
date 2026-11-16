import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Wand2,
  XCircle,
} from 'lucide-react';
import { CYCLE_INFO, DOMAIN_STYLES } from '../data/regulations';
import { ComplianceReport, ComplianceSeverity, SchoolSettings } from '../types/timetable';
import {
  DAY_LABELS,
  formatDuration,
  formatSignedDelta,
  formatTime,
} from '../utils/timeUtils';

interface ComplianceReportViewProps {
  settings: SchoolSettings;
  report: ComplianceReport;
  onFixVocabulary: (blockId: string, suggestedTitle: string) => void;
  onFixAllVocabulary: () => void;
  onGoToAtelier: () => void;
  onOpenExport: () => void;
}

const SEVERITY_CONFIG: Record<
  ComplianceSeverity,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bannerBg: string;
    bannerBorder: string;
    bannerText: string;
    textCls: string;
  }
> = {
  conforme: {
    label: 'Emploi du temps conforme',
    icon: CheckCircle2,
    bannerBg: 'bg-emerald-50',
    bannerBorder: 'border-emerald-200',
    bannerText: 'text-emerald-900',
    textCls: 'text-emerald-700',
  },
  recommandation: {
    label: 'Conforme avec recommandations pédagogiques',
    icon: AlertTriangle,
    bannerBg: 'bg-amber-50',
    bannerBorder: 'border-amber-200',
    bannerText: 'text-amber-900',
    textCls: 'text-amber-700',
  },
  non_conforme: {
    label: 'Ajustements réglementaires requis',
    icon: XCircle,
    bannerBg: 'bg-rose-50',
    bannerBorder: 'border-rose-200',
    bannerText: 'text-rose-900',
    textCls: 'text-rose-700',
  },
};

const CATEGORY_LABELS: Record<'volumes' | 'vocabulaire' | 'rythme' | 'cadre', string> = {
  volumes: '1. Volumes horaires & récréations',
  vocabulaire: '2. Vocabulaire & appellations réglementaires',
  rythme: '3. Rythme cognitif & principes pédagogiques',
  cadre: '4. Vie scolaire & affichage réglementaire',
};

export const ComplianceReportView: React.FC<ComplianceReportViewProps> = ({
  settings,
  report,
  onFixVocabulary,
  onFixAllVocabulary,
  onGoToAtelier,
  onOpenExport,
}) => {
  const sev = SEVERITY_CONFIG[report.overallStatus];
  const SevIcon = sev.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Verdict Banner */}
      <div
        className={`border rounded-xl p-6 ${sev.bannerBg} ${sev.bannerBorder} ${sev.bannerText}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <SevIcon className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-bold">{sev.label}</h1>
              <p className="mt-1 text-sm opacity-90">
                Audit réglementaire établi pour {CYCLE_INFO[settings.cycle].label} (
                {CYCLE_INFO[settings.cycle].referenceText}).
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium">
                <span>{report.summaryCounts.conforme} critère(s) conforme(s)</span>
                <span aria-hidden="true">·</span>
                <span>
                  {report.summaryCounts.recommandation} recommandation(s)
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {report.summaryCounts.non_conforme} non-conformité(s)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoToAtelier}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Modifier la grille
            </button>
            <button
              type="button"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter PDF / Image</span>
            </button>
          </div>
        </div>
      </div>

      {/* Domain Volumes Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Tableau de conformité des volumes horaires
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.cycle === 'cycle1'
                ? 'Cycle 1 : comparaison aux repères indicatifs hebdomadaires.'
                : 'Horaires légaux recalés selon le coefficient 22/24 (temps de récréations déduits).'}
            </p>
          </div>
          <div className="text-xs text-slate-600 font-mono-tabular">
            Total enseignement : {formatDuration(report.totalScheduledTeachingMinutes)} /{' '}
            {formatDuration(report.expectedTeachingMinutes)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">Domaine réglementaire</th>
                <th className="py-3 px-4 text-right">Horaire légal</th>
                <th className="py-3 px-4 text-right">
                  {settings.cycle === 'cycle1' ? 'Plage indicative' : 'Avec récréations (22/24)'}
                </th>
                <th className="py-3 px-4 text-right">Temps placé</th>
                <th className="py-3 px-4 text-right">Écart</th>
                <th className="py-3 px-6">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {report.domainRows.map((row) => {
                const domStyle = DOMAIN_STYLES[row.group.domainIds[0]];
                return (
                  <tr key={row.group.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: domStyle.swatchHex }}
                        />
                        <div>
                          <div className="font-medium text-slate-900">
                            {row.group.label}
                          </div>
                          {row.group.note && (
                            <div className="text-xs text-slate-500">{row.group.note}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular text-slate-600">
                      {formatDuration(row.group.legalMinutes)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular text-slate-700">
                      {settings.cycle === 'cycle1'
                        ? `${formatDuration(row.group.minRecommendedMinutes || 0)}–${formatDuration(row.group.maxRecommendedMinutes || 0)}`
                        : formatDuration(row.proRataTargetMinutes)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular font-semibold text-slate-900">
                      {formatDuration(row.scheduledMinutes)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular text-slate-600">
                      {settings.cycle === 'cycle1'
                        ? '—'
                        : formatSignedDelta(row.deltaFromProRata)}
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          row.status === 'ok'
                            ? 'text-emerald-700'
                            : row.status === 'warning'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {row.status === 'ok' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : row.status === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{row.message}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vocabulary Corrections Panel (if any issues) */}
      {report.vocabularyIssues.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-amber-50/60 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Corrections de vocabulaire réglementaire ({report.vocabularyIssues.length})
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                L’emploi du temps affiché en classe doit reprendre les appellations officielles des programmes.
              </p>
            </div>
            <button
              type="button"
              onClick={onFixAllVocabulary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Tout normaliser automatiquement</span>
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {report.vocabularyIssues.map((issue) => (
              <div
                key={issue.blockId}
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="text-xs text-slate-500 font-mono-tabular">
                    {DAY_LABELS[issue.day]} à {formatTime(issue.startMinutes)} · Terme détecté :{' '}
                    <span className="font-semibold text-amber-800">{issue.detectedTerm}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    « {issue.currentTitle} » →{' '}
                    <span className="text-blue-700 font-semibold">
                      « {issue.suggestedTitle} »
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{issue.reason}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onFixVocabulary(issue.blockId, issue.suggestedTitle)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer shrink-0"
                >
                  Appliquer la correction
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Checklists by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['volumes', 'vocabulaire', 'rythme', 'cadre'] as const).map((cat) => {
          const catChecks = report.checks.filter((c) => c.category === cat);
          if (catChecks.length === 0) return null;
          return (
            <div
              key={cat}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="space-y-3">
                {catChecks.map((chk) => {
                  const cfg = SEVERITY_CONFIG[chk.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={chk.id} className="flex items-start gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.textCls}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900">
                          {chk.title}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {chk.detail}
                        </p>
                        {chk.actionHint && (
                          <p className="text-xs font-medium text-blue-700 mt-1">
                            {chk.actionHint}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
