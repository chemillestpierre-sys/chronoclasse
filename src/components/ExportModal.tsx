import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileImage, FileText, X } from 'lucide-react';
import { ComplianceReport, ScheduledBlock, SchoolSettings } from '../types/timetable';
import {
  exportTimetableAsPdf,
  exportTimetableAsPng,
  ExportOptions,
  getTimetablePreviewDataUrl,
} from '../utils/exportGenerator';

interface ExportModalProps {
  settings: SchoolSettings;
  blocks: ScheduledBlock[];
  report: ComplianceReport;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  settings,
  blocks,
  report,
  onClose,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    includeSummaryTable: true,
    includeSignatureBlock: true,
  });

  const previewUrl = useMemo(
    () => getTimetablePreviewDataUrl(settings, blocks, report, options),
    [settings, blocks, report, options]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="export-modal-title" className="text-base font-bold text-slate-900">
              Exporter l’emploi du temps (Format A4 Paysage)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Document prêt pour l’affichage réglementaire en classe et le visa de la direction.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options & Compliance Notice */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-700">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeSummaryTable}
                onChange={(e) =>
                  setOptions({ ...options, includeSummaryTable: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-blue-700"
              />
              <span className="font-medium">
                Inclure le tableau récapitulatif des domaines
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeSignatureBlock}
                onChange={(e) =>
                  setOptions({ ...options, includeSignatureBlock: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-blue-700"
              />
              <span className="font-medium">
                Inclure l’encart de signature et visa de la direction
              </span>
            </label>
          </div>

          <div className="text-xs font-medium flex items-center gap-1.5">
            {report.overallStatus === 'conforme' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Emploi du temps conforme</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {report.summaryCounts.non_conforme > 0
                    ? `${report.summaryCounts.non_conforme} point(s) réglementaire(s) à vérifier`
                    : `${report.summaryCounts.recommandation} recommandation(s) en attente`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100 flex items-center justify-center">
          <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden max-w-4xl w-full">
            <img
              src={previewUrl}
              alt="Aperçu de l’emploi du temps prêt à imprimer"
              className="w-full h-auto block"
            />
          </div>
        </div>

        {/* Download Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Rendu haute définition (2480 × 1754 px) · Format A4 paysage
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => exportTimetableAsPng(settings, blocks, report, options)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <FileImage className="w-4 h-4 text-slate-600" />
              <span>Télécharger en Image (PNG)</span>
            </button>
            <button
              type="button"
              onClick={() => exportTimetableAsPdf(settings, blocks, report, options)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Télécharger en PDF (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
