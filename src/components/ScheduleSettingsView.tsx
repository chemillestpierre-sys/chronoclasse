import React, { useState } from 'react';
import { Check, Clock, CopyCheck } from 'lucide-react';
import { CYCLE_INFO } from '../data/regulations';
import { CycleId, DayId, HalfDayConfig, SchoolSettings, SchoolType } from '../types/timetable';
import {
  computeSchoolTimeTotals,
  DAY_LABELS,
  DAY_ORDER,
  formatDuration,
  formatTimeInput,
  parseTimeInput,
} from '../utils/timeUtils';

interface ScheduleSettingsViewProps {
  settings: SchoolSettings;
  onUpdateSettings: (next: SchoolSettings) => void;
  onChangeCycle: (cycle: CycleId) => void;
  onChangeSchoolType: (schoolType: SchoolType) => void;
  onGoToAtelier: () => void;
}

export const ScheduleSettingsView: React.FC<ScheduleSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onChangeCycle,
  onChangeSchoolType,
  onGoToAtelier,
}) => {
  const [copiedMsg, setCopiedMsg] = useState(false);
  const totals = computeSchoolTimeTotals(settings);

  const handleWeekTypeChange = (weekType: '4days' | '4.5days') => {
    const nextDays = { ...settings.days };
    if (weekType === '4days') {
      nextDays.mercredi = { ...nextDays.mercredi, enabled: false };
    } else {
      nextDays.mercredi = {
        ...nextDays.mercredi,
        enabled: true,
        morning: {
          ...nextDays.mercredi.morning,
          enabled: true,
          startMinutes: 8 * 60 + 30,
          endMinutes: 11 * 60 + 30,
          recessEnabled: true,
          recessStartMinutes: 10 * 60,
          recessDurationMinutes: settings.cycle === 'cycle1' ? 30 : 15,
        },
        afternoon: { ...nextDays.mercredi.afternoon, enabled: false },
      };
    }
    onUpdateSettings({ ...settings, weekType, days: nextDays });
  };

  const updateHalfDay = (
    day: DayId,
    period: 'morning' | 'afternoon',
    patch: Partial<HalfDayConfig>
  ) => {
    const currentDay = settings.days[day];
    onUpdateSettings({
      ...settings,
      days: {
        ...settings.days,
        [day]: {
          ...currentDay,
          [period]: {
            ...currentDay[period],
            ...patch,
          },
        },
      },
    });
  };

  const applyMondayToAllFullDays = () => {
    const template = settings.days.lundi;
    const nextDays = { ...settings.days };
    (['mardi', 'jeudi', 'vendredi'] as DayId[]).forEach((dayId) => {
      if (nextDays[dayId].enabled) {
        nextDays[dayId] = {
          ...nextDays[dayId],
          morning: { ...template.morning },
          afternoon: { ...template.afternoon },
        };
      }
    });
    onUpdateSettings({ ...settings, days: nextDays });
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Paramétrage des demi-journées et des récréations
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Définissez les heures d’entrée et de sortie de chaque demi-journée ainsi que les créneaux de récréation. L’application recalcule automatiquement le temps d’enseignement effectif.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToAtelier}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
        >
          Retour à l’emploi du temps
        </button>
      </div>

      {/* Totals Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Présence hebdomadaire</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono-tabular">
            {formatDuration(totals.totalPresenceMinutes)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Référence légale : 24h00</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Total des récréations</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono-tabular">
            {formatDuration(totals.totalRecessMinutes)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Sur {totals.halfDaysCount} demi-journées
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Enseignement effectif</div>
          <div className="mt-1 text-2xl font-bold text-blue-700 font-mono-tabular">
            {formatDuration(totals.totalEffectiveTeachingMinutes)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Cible 22/24 : 22h00</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Rythme scolaire</div>
          <div className="mt-2 grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleWeekTypeChange('4days')}
              className={`py-1 text-xs font-semibold rounded-md cursor-pointer ${
                settings.weekType === '4days'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              4 jours
            </button>
            <button
              type="button"
              onClick={() => handleWeekTypeChange('4.5days')}
              className={`py-1 text-xs font-semibold rounded-md cursor-pointer ${
                settings.weekType === '4.5days'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              4,5 jours
            </button>
          </div>
        </div>
      </div>

      {/* School & Class Identification */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Identification de la classe (pour affichage et visa de la direction)
          </h2>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeSchoolType('publique')}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                settings.schoolType === 'publique'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              École publique
            </button>
            <button
              type="button"
              onClick={() => onChangeSchoolType('catholique')}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                settings.schoolType === 'catholique'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              École privée catholique
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cycle</label>
            <select
              value={settings.cycle}
              onChange={(e) => onChangeCycle(e.target.value as CycleId)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900"
            >
              {(['cycle1', 'cycle2', 'cycle3'] as CycleId[]).map((cid) => (
                <option key={cid} value={cid}>
                  {CYCLE_INFO[cid].shortLabel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Niveau / Classe
            </label>
            <input
              type="text"
              value={settings.classLevel}
              onChange={(e) =>
                onUpdateSettings({ ...settings, classLevel: e.target.value })
              }
              placeholder="Ex. CE1–CE2"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nom de l’école
            </label>
            <input
              type="text"
              value={settings.schoolName}
              onChange={(e) =>
                onUpdateSettings({ ...settings, schoolName: e.target.value })
              }
              placeholder="Ex. École Jean Jaurès"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enseignant(e)
            </label>
            <input
              type="text"
              value={settings.teacherName}
              onChange={(e) =>
                onUpdateSettings({ ...settings, teacherName: e.target.value })
              }
              placeholder="Prénom Nom"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Half-Days & Recesses */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Horaires par demi-journée et récréations
            </h2>
          </div>
          <button
            type="button"
            onClick={applyMondayToAllFullDays}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {copiedMsg ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Horaires du lundi appliqués</span>
              </>
            ) : (
              <>
                <CopyCheck className="w-3.5 h-3.5" />
                <span>Appliquer les horaires du lundi aux autres jours</span>
              </>
            )}
          </button>
        </div>

        <div className="divide-y divide-slate-200">
          {DAY_ORDER.map((dayId) => {
            const dayCfg = settings.days[dayId];
            return (
              <div
                key={dayId}
                className={`p-5 transition-opacity ${
                  dayCfg.enabled ? 'bg-white' : 'bg-slate-50/70 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dayCfg.enabled}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            days: {
                              ...settings.days,
                              [dayId]: { ...dayCfg, enabled: e.target.checked },
                            },
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-blue-700"
                      />
                      <span className="text-sm font-bold text-slate-900">
                        {DAY_LABELS[dayId]}
                      </span>
                    </label>
                    {!dayCfg.enabled && (
                      <span className="text-xs text-slate-500">Jour non travaillé</span>
                    )}
                  </div>
                </div>

                {dayCfg.enabled && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(['morning', 'afternoon'] as const).map((period) => {
                      const hd = dayCfg[period];
                      const periodLabel = period === 'morning' ? 'Matin' : 'Après-midi';
                      return (
                        <div
                          key={period}
                          className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hd.enabled}
                                onChange={(e) =>
                                  updateHalfDay(dayId, period, { enabled: e.target.checked })
                                }
                                className="w-4 h-4 rounded border-slate-300 text-blue-700"
                              />
                              <span className="text-xs font-semibold text-slate-800">
                                {periodLabel}
                              </span>
                            </label>

                            {hd.enabled && (
                              <span className="text-xs text-slate-500 font-mono-tabular">
                                Durée brute :{' '}
                                {formatDuration(Math.max(0, hd.endMinutes - hd.startMinutes))}
                              </span>
                            )}
                          </div>

                          {hd.enabled && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">
                                  Début
                                </label>
                                <input
                                  type="time"
                                  value={formatTimeInput(hd.startMinutes)}
                                  onChange={(e) =>
                                    updateHalfDay(dayId, period, {
                                      startMinutes: parseTimeInput(
                                        e.target.value,
                                        hd.startMinutes
                                      ),
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-xs font-mono-tabular bg-white border border-slate-200 rounded-md"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">
                                  Fin
                                </label>
                                <input
                                  type="time"
                                  value={formatTimeInput(hd.endMinutes)}
                                  onChange={(e) =>
                                    updateHalfDay(dayId, period, {
                                      endMinutes: parseTimeInput(
                                        e.target.value,
                                        hd.endMinutes
                                      ),
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-xs font-mono-tabular bg-white border border-slate-200 rounded-md"
                                />
                              </div>

                              <div>
                                <label className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                                  <input
                                    type="checkbox"
                                    checked={hd.recessEnabled}
                                    onChange={(e) =>
                                      updateHalfDay(dayId, period, {
                                        recessEnabled: e.target.checked,
                                      })
                                    }
                                    className="w-3 h-3 rounded border-slate-300"
                                  />
                                  <span>Récréation</span>
                                </label>
                                <input
                                  type="time"
                                  disabled={!hd.recessEnabled}
                                  value={formatTimeInput(hd.recessStartMinutes)}
                                  onChange={(e) =>
                                    updateHalfDay(dayId, period, {
                                      recessStartMinutes: parseTimeInput(
                                        e.target.value,
                                        hd.recessStartMinutes
                                      ),
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-xs font-mono-tabular bg-white border border-slate-200 rounded-md disabled:opacity-50"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">
                                  Durée récré (min)
                                </label>
                                <input
                                  type="number"
                                  min={5}
                                  max={60}
                                  step={5}
                                  disabled={!hd.recessEnabled}
                                  value={hd.recessDurationMinutes}
                                  onChange={(e) =>
                                    updateHalfDay(dayId, period, {
                                      recessDurationMinutes: Math.max(
                                        5,
                                        Math.min(60, Number(e.target.value) || 15)
                                      ),
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-xs font-mono-tabular bg-white border border-slate-200 rounded-md disabled:opacity-50"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
