import React from 'react';
import { CYCLE_INFO, DOMAIN_STYLES, REGULATORY_TARGETS } from '../data/regulations';
import { CycleId } from '../types/timetable';
import { formatDuration } from '../utils/timeUtils';

interface OfficialFrameworkViewProps {
  activeCycle: CycleId;
  onSelectCycle: (cycle: CycleId) => void;
  onGoToAtelier: () => void;
}

export const OfficialFrameworkView: React.FC<OfficialFrameworkViewProps> = ({
  activeCycle,
  onSelectCycle,
  onGoToAtelier,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Cadre officiel et prescriptions pédagogiques
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Références issues du BOEN n°31 du 30 juillet 2020, du socle commun, des programmes 2020-2024 et du guide méthodologique SYNADEC.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToAtelier}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer shrink-0"
        >
          Construire l’emploi du temps
        </button>
      </div>

      {/* Reference Tables for Cycle 2 & Cycle 3 + Cycle 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['cycle2', 'cycle3'] as const).map((cid) => {
          const isCurrent = activeCycle === cid;
          const rows = REGULATORY_TARGETS[cid];
          return (
            <div
              key={cid}
              className={`bg-white border rounded-xl overflow-hidden ${
                isCurrent ? 'border-blue-300' : 'border-slate-200'
              }`}
            >
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {CYCLE_INFO[cid].label}
                  </h2>
                  <p className="text-xs text-slate-500">{CYCLE_INFO[cid].levels}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCycle(cid)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isCurrent ? 'Cycle actif' : 'Utiliser ce cycle'}
                </button>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-5 font-semibold">Matière / Domaine</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Horaire légal</th>
                    <th className="py-2.5 px-5 text-right font-semibold">
                      Avec récréations (22/24)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => {
                    const style = DOMAIN_STYLES[r.domainIds[0]];
                    return (
                      <tr key={r.id}>
                        <td className="py-2.5 px-5 font-medium text-slate-900 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: style.swatchHex }}
                          />
                          <span>{r.label}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-600">
                          {formatDuration(r.legalMinutes)}
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono-tabular font-semibold text-slate-900">
                          {formatDuration(r.adjustedMinutes)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                    <td className="py-2.5 px-5">TOTAL HEBDOMADAIRE</td>
                    <td className="py-2.5 px-4 text-right font-mono-tabular">24h00</td>
                    <td className="py-2.5 px-5 text-right font-mono-tabular text-blue-700">
                      22h00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Cycle 1 Card */}
      <div
        className={`bg-white border rounded-xl p-6 ${
          activeCycle === 'cycle1' ? 'border-blue-300' : 'border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {CYCLE_INFO.cycle1.label} ({CYCLE_INFO.cycle1.levels})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Aucun volume horaire fixe imposé par les programmes, mais un équilibre souhaité et 5 recommandations structurantes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectCycle('cycle1')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
              activeCycle === 'cycle1'
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {activeCycle === 'cycle1' ? 'Cycle actif' : 'Utiliser le Cycle 1'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
          <div>
            <h3 className="text-xs font-bold text-slate-900 mb-2">
              Recommandations essentielles
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
              <li>30 minutes d’activité physique quotidienne</li>
              <li>Un temps de récréation d’environ 30 minutes</li>
              <li>Un temps de repos pour les enfants qui en ont besoin</li>
              <li>Une exposition quotidienne au langage oral et écrit</li>
              <li>Des temps différenciés selon les niveaux et la progression</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 mb-2">
              Répartition hebdomadaire approximative (24h)
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
              <li>Langage : 7h à 8h</li>
              <li>Mathématiques : 4h à 5h</li>
              <li>Activités physiques : 2h</li>
              <li>Arts visuels et musique : 2h</li>
              <li>Explorer le monde : 2h</li>
              <li>Autres temps (accueil, routines, autonomie, projet de classe) : 5h</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pedagogical Principles & Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Principes pédagogiques et rythme cognitif
          </h2>
          <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">1. Domaines identifiables :</strong> Chaque domaine doit être explicitement nommé, même dans un projet transversal (ex. « Rédiger un article d’école » relève du Français + EMC + Arts visuels).
            </li>
            <li>
              <strong className="text-slate-900">2. Plages cognitives optimales :</strong> Réserver le matin (8h45–11h15 environ) aux apprentissages fondamentaux et alterner concentration et temps moteurs ou créatifs.
            </li>
            <li>
              <strong className="text-slate-900">3. Temps continus :</strong> Privilégier 1h complète pour les fondamentaux plutôt que 4 × 15 min, hors rituels.
            </li>
            <li>
              <strong className="text-slate-900">4. Différenciation & rituels :</strong> Prévoir chaque jour 15–20 min d’ateliers/remédiation, 10–15 min de lecture quotidienne, 5–10 min de calcul mental et de l’expression orale.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Méthode en 5 étapes & Catéchèse
          </h2>
          <ol className="space-y-2 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
            <li>
              <strong className="text-slate-900">Fixer les incontournables :</strong> récréations, pause méridienne, créneaux d’EPS (salle/gymnase).
            </li>
            <li>
              <strong className="text-slate-900">Placer les fondamentaux :</strong> Français et Mathématiques en matinée.
            </li>
            <li>
              <strong className="text-slate-900">Intégrer les autres domaines :</strong> sciences, arts, EMC, langue vivante, projets l’après-midi.
            </li>
            <li>
              <strong className="text-slate-900">Vérifier la conformité :</strong> additionner les temps par domaine et vérifier le vocabulaire officiel.
            </li>
            <li>
              <strong className="text-slate-900">Affichage & souplesse :</strong> consigner une trace écrite claire affichée en classe et signée par la direction.
            </li>
          </ol>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
            <strong className="text-slate-900">Catéchèse ou éveil à la foi :</strong> à placer en début ou fin de journée pour permettre aux élèves qui n’y participent pas d’arriver plus tard ou de partir plus tôt (sinon surveillance interne requise).
          </div>
        </div>
      </div>
    </div>
  );
};
