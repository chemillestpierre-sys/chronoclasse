import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { DOMAIN_STYLES, evaluateBlockVocabulary } from '../data/regulations';
import {
  ComplianceReport,
  DayId,
  LabelTemplate,
  ScheduledBlock,
  SchoolSettings,
} from '../types/timetable';
import {
  DAY_LABELS,
  formatDuration,
  formatSignedDelta,
  formatTime,
  getActiveDays,
  getDayBounds,
  getHalfDayRecessRange,
  getTeachingSegmentsForDay,
  resolveValidPlacement,
  snapMinutes,
} from '../utils/timeUtils';

export type ActiveDragItem =
  | { type: 'template'; template: LabelTemplate }
  | { type: 'existing'; block: ScheduledBlock }
  | null;

interface TimetableGridProps {
  settings: SchoolSettings;
  blocks: ScheduledBlock[];
  report: ComplianceReport;
  activeDragItem: ActiveDragItem;
  onDragBlockStart: (block: ScheduledBlock) => void;
  onDragAnyEnd: () => void;
  onPlaceNewBlock: (
    template: LabelTemplate,
    day: DayId,
    desiredStartMinutes: number
  ) => void;
  onMoveBlock: (
    blockId: string,
    targetDay: DayId,
    desiredStartMinutes: number
  ) => void;
  onResizeBlock: (blockId: string, newDurationMinutes: number) => void;
  onSelectBlock: (block: ScheduledBlock) => void;
  onVerifyCompliance: () => void;
  onLoadSample: () => void;
  onOpenModels: () => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
}

interface DropGhost {
  day: DayId;
  startMinutes: number;
  durationMinutes: number;
  title: string;
  bgHex: string;
  borderHex: string;
  accentHex: string;
  textHex: string;
}

const PX_PER_MINUTE = 1.48; // ~89px per hour for crisp readability

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  settings,
  blocks,
  report,
  activeDragItem,
  onDragBlockStart,
  onDragAnyEnd,
  onPlaceNewBlock,
  onMoveBlock,
  onResizeBlock,
  onSelectBlock,
  onVerifyCompliance,
  onLoadSample,
  onOpenModels,
  onClearAll,
  onOpenSettings,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [dropGhost, setDropGhost] = useState<DropGhost | null>(null);
  const [resizingState, setResizingState] = useState<{
    blockId: string;
    previewDuration: number;
  } | null>(null);

  const dragMetaRef = useRef<ActiveDragItem>(null);

  const activeDays = getActiveDays(settings);
  const { minStart, maxEnd } = getDayBounds(settings);
  const totalSpanMinutes = Math.max(60, maxEnd - minStart);
  const gridHeightPx = Math.round(totalSpanMinutes * PX_PER_MINUTE);

  const minutesToTopPx = (minutes: number) => (minutes - minStart) * PX_PER_MINUTE;

  const clientYToMinutes = (colEl: HTMLElement, clientY: number) => {
    const rect = colEl.getBoundingClientRect();
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return snapMinutes(minStart + relY / PX_PER_MINUTE, 5);
  };

  // Hour & half-hour ticks
  const timeTicks: number[] = [];
  const firstTick = Math.ceil(minStart / 30) * 30;
  for (let m = firstTick; m <= maxEnd; m += 30) {
    timeTicks.push(m);
  }

  // Morning cognitive optimal band (8h45 - 11h15)
  const optimalTop = minutesToTopPx(Math.max(minStart, 8 * 60 + 45));
  const optimalBottom = minutesToTopPx(Math.min(maxEnd, 11 * 60 + 15));
  const showOptimalBand = optimalBottom > optimalTop;

  const handleDragOverColumn = (e: React.DragEvent<HTMLDivElement>, day: DayId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = dragMetaRef.current?.type === 'existing' ? 'move' : 'copy';

    const colEl = e.currentTarget;
    const desiredStart = clientYToMinutes(colEl, e.clientY);

    const meta = activeDragItem ?? dragMetaRef.current;
    const desiredDuration =
      meta?.type === 'existing'
        ? meta.block.durationMinutes
        : meta?.type === 'template'
        ? meta.template.defaultDurationMinutes
        : 45;

    const existingBlocks = blocks.filter((b) => b.day === day);
    const resolved = resolveValidPlacement(
      settings.days[day],
      existingBlocks,
      desiredStart,
      desiredDuration,
      meta?.type === 'existing' ? meta.block.id : undefined
    );

    if (!resolved) {
      setDropGhost(null);
      return;
    }

    const domainId =
      meta?.type === 'existing'
        ? meta.block.domainId
        : meta?.type === 'template'
        ? meta.template.domainId
        : 'francais';
    const style = DOMAIN_STYLES[domainId];

    setDropGhost({
      day,
      startMinutes: resolved.startMinutes,
      durationMinutes: resolved.durationMinutes,
      title:
        meta?.type === 'existing'
          ? meta.block.title
          : meta?.type === 'template'
          ? meta.template.title
          : 'Nouvelle séance',
      bgHex: style.bgHex,
      borderHex: style.borderHex,
      accentHex: style.accentHex,
      textHex: style.textHex,
    });
  };

  const handleDropOnColumn = (e: React.DragEvent<HTMLDivElement>, day: DayId) => {
    e.preventDefault();
    setDropGhost(null);

    const colEl = e.currentTarget;
    const desiredStart = clientYToMinutes(colEl, e.clientY);

    let payload: {
      type: 'template' | 'existing';
      template?: LabelTemplate;
      blockId?: string;
    } | null = null;

    const raw = e.dataTransfer.getData('application/x-chronoclasse-label');
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = null;
      }
    }

    if (!payload && (activeDragItem || dragMetaRef.current)) {
      const source = activeDragItem ?? dragMetaRef.current;
      if (source?.type === 'template' && source.template) {
        payload = { type: 'template', template: source.template };
      } else if (source?.type === 'existing' && source.block) {
        payload = { type: 'existing', blockId: source.block.id };
      }
    }

    dragMetaRef.current = null;
    onDragAnyEnd();
    if (!payload) return;

    if (payload.type === 'template' && payload.template) {
      onPlaceNewBlock(payload.template, day, desiredStart);
    } else if (payload.type === 'existing' && payload.blockId) {
      onMoveBlock(payload.blockId, day, desiredStart);
    }
  };

  const handleBlockDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    blk: ScheduledBlock
  ) => {
    dragMetaRef.current = { type: 'existing', block: blk };
    onDragBlockStart(blk);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/x-chronoclasse-label',
      JSON.stringify({ type: 'existing', blockId: blk.id })
    );
    e.dataTransfer.setData('text/plain', blk.title);
  };

  const handleResizeStart = (
    e: React.PointerEvent<HTMLDivElement>,
    blk: ScheduledBlock
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const initialDuration = blk.durationMinutes;

    // Determine hard upper bound (recess, end of half-day, or next block)
    const dayCfg = settings.days[blk.day];
    const segments = getTeachingSegmentsForDay(dayCfg);
    const containingSeg = segments.find(
      (s) => blk.startMinutes >= s.startMinutes && blk.startMinutes < s.endMinutes
    );
    const segEnd = containingSeg ? containingSeg.endMinutes : blk.startMinutes + 180;

    const nextBlock = blocks
      .filter((b) => b.day === blk.day && b.id !== blk.id && b.startMinutes > blk.startMinutes)
      .sort((a, b) => a.startMinutes - b.startMinutes)[0];

    const maxEndMin = nextBlock ? Math.min(segEnd, nextBlock.startMinutes) : segEnd;
    const maxAllowedDuration = Math.max(10, maxEndMin - blk.startMinutes);

    setResizingState({ blockId: blk.id, previewDuration: initialDuration });

    const onMove = (moveEvt: PointerEvent) => {
      const deltaPx = moveEvt.clientY - startY;
      const deltaMin = snapMinutes(deltaPx / PX_PER_MINUTE, 5);
      const clamped = Math.max(10, Math.min(maxAllowedDuration, initialDuration + deltaMin));
      setResizingState({ blockId: blk.id, previewDuration: clamped });
    };

    const onUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const deltaPx = upEvt.clientY - startY;
      const deltaMin = snapMinutes(deltaPx / PX_PER_MINUTE, 5);
      const finalDuration = Math.max(
        10,
        Math.min(maxAllowedDuration, initialDuration + deltaMin)
      );
      setResizingState(null);
      if (finalDuration !== initialDuration) {
        onResizeBlock(blk.id, finalDuration);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Capture template drags initiated from sidebar
  const handleContainerDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    void e;
  };

  const statusMeta =
    report.overallStatus === 'conforme'
      ? {
          icon: CheckCircle2,
          text: 'Conforme aux prescriptions',
          cls: 'text-emerald-700',
        }
      : report.overallStatus === 'recommandation'
      ? {
          icon: AlertTriangle,
          text: 'Conforme avec recommandations',
          cls: 'text-amber-700',
        }
      : {
          icon: AlertTriangle,
          text: `${report.summaryCounts.non_conforme} point(s) à corriger`,
          cls: 'text-rose-700',
        };

  const StatusIcon = statusMeta.icon;

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4">
      {/* Contextual Workspace Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900 text-sm">
            {settings.classLevel || 'Classe'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-700 font-medium">
            {settings.schoolType === 'catholique'
              ? 'École privée catholique'
              : 'École publique'}
          </span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1 hover:text-blue-700 underline decoration-slate-300 underline-offset-2 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono-tabular">
              Présence {formatDuration(report.totalPresenceMinutes)} · Récréations{' '}
              {formatDuration(report.totalRecessMinutes)} · Enseignement{' '}
              {formatDuration(report.expectedTeachingMinutes)}
            </span>
          </button>
          <span aria-hidden="true">·</span>
          <span className={`inline-flex items-center gap-1.5 font-medium ${statusMeta.cls}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusMeta.text}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenModels}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Modèles par niveau</span>
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
            <span>Exemple conforme</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Vider</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1">
              <span className="text-xs text-rose-800 font-medium">Tout effacer ?</span>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                }}
                className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer px-1"
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="text-xs font-medium text-slate-600 hover:underline cursor-pointer px-1"
              >
                Annuler
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onVerifyCompliance}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Vérifier la conformité</span>
          </button>
        </div>
      </div>

      {/* Interactive Weekly Grid */}
      <div
        onDragEnter={handleContainerDragEnter}
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            {/* Column Headers */}
            <div
              className="grid border-b border-slate-200 bg-slate-50"
              style={{
                gridTemplateColumns: `72px repeat(${activeDays.length}, minmax(135px, 1fr))`,
              }}
            >
              <div className="px-2 py-3 text-xs font-semibold text-slate-500 text-center border-r border-slate-200">
                Heures
              </div>
              {activeDays.map((day) => {
                const cfg = settings.days[day];
                const dayScheduled = blocks
                  .filter((b) => b.day === day && b.domainId !== 'catechese')
                  .reduce((s, b) => s + b.durationMinutes, 0);
                const daySegments = getTeachingSegmentsForDay(cfg);
                const dayCapacity = daySegments.reduce(
                  (s, seg) => s + (seg.endMinutes - seg.startMinutes),
                  0
                );
                return (
                  <div
                    key={day}
                    className="px-3 py-2.5 border-r last:border-r-0 border-slate-200 flex items-baseline justify-between gap-2"
                  >
                    <span className="text-sm font-semibold text-slate-900">
                      {DAY_LABELS[day]}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono-tabular">
                      {formatDuration(dayScheduled)} / {formatDuration(dayCapacity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div
              className="grid relative"
              style={{
                gridTemplateColumns: `72px repeat(${activeDays.length}, minmax(135px, 1fr))`,
                height: `${gridHeightPx}px`,
              }}
            >
              {/* Left Time Axis */}
              <div className="relative border-r border-slate-200 bg-slate-50/40 select-none">
                {showOptimalBand && (
                  <div
                    style={{
                      top: `${optimalTop}px`,
                      height: `${optimalBottom - optimalTop}px`,
                    }}
                    title="Plage cognitive optimale du matin (8h45–11h15)"
                    className="absolute inset-x-0 bg-blue-50/50 border-y border-blue-100 flex items-center justify-center pointer-events-none"
                  >
                    <span className="text-[9px] font-medium text-blue-700/80 -rotate-90 whitespace-nowrap tracking-wide">
                      Plage cognitive
                    </span>
                  </div>
                )}

                {timeTicks.map((m) => {
                  const topPx = minutesToTopPx(m);
                  const isHour = m % 60 === 0;
                  return (
                    <div
                      key={m}
                      style={{ top: `${topPx}px` }}
                      className="absolute inset-x-0 -translate-y-1/2 pr-2 text-right pointer-events-none"
                    >
                      <span
                        className={`font-mono-tabular ${
                          isHour
                            ? 'text-[11px] font-semibold text-slate-700'
                            : 'text-[10px] text-slate-400'
                        }`}
                      >
                        {formatTime(m)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Day Columns */}
              {activeDays.map((day) => {
                const cfg = settings.days[day];
                const dayBlocks = blocks.filter((b) => b.day === day);
                const morningRecess = getHalfDayRecessRange(cfg.morning);
                const afternoonRecess = getHalfDayRecessRange(cfg.afternoon);

                return (
                  <div
                    key={day}
                    onDragOver={(e) => handleDragOverColumn(e, day)}
                    onDragLeave={() => setDropGhost(null)}
                    onDrop={(e) => handleDropOnColumn(e, day)}
                    className="relative border-r last:border-r-0 border-slate-200 bg-white"
                  >
                    {/* Horizontal time lines */}
                    {timeTicks.map((m) => (
                      <div
                        key={m}
                        style={{ top: `${minutesToTopPx(m)}px` }}
                        className={`absolute inset-x-0 border-t pointer-events-none ${
                          m % 60 === 0 ? 'border-slate-200/90' : 'border-slate-100'
                        }`}
                      />
                    ))}

                    {/* Non-active before morning start */}
                    {cfg.morning.enabled && cfg.morning.startMinutes > minStart && (
                      <div
                        style={{
                          top: 0,
                          height: `${minutesToTopPx(cfg.morning.startMinutes)}px`,
                        }}
                        className="absolute inset-x-0 bg-slate-50/90 border-b border-slate-200 pointer-events-none"
                      />
                    )}

                    {/* Midday Break */}
                    {cfg.morning.enabled &&
                      cfg.afternoon.enabled &&
                      cfg.afternoon.startMinutes > cfg.morning.endMinutes && (
                        <div
                          style={{
                            top: `${minutesToTopPx(cfg.morning.endMinutes)}px`,
                            height: `${
                              (cfg.afternoon.startMinutes - cfg.morning.endMinutes) *
                              PX_PER_MINUTE
                            }px`,
                          }}
                          className="absolute inset-x-0 bg-midday-hatch border-y border-slate-200 flex items-center justify-center pointer-events-none"
                        >
                          <span className="text-[11px] font-medium text-slate-500 bg-white/85 px-2.5 py-0.5 rounded border border-slate-200">
                            Pause méridienne · {formatTime(cfg.morning.endMinutes)}–
                            {formatTime(cfg.afternoon.startMinutes)}
                          </span>
                        </div>
                      )}

                    {/* Afternoon disabled (e.g. Wednesday) */}
                    {!cfg.afternoon.enabled && cfg.morning.enabled && (
                      <div
                        style={{
                          top: `${minutesToTopPx(cfg.morning.endMinutes)}px`,
                          height: `${(maxEnd - cfg.morning.endMinutes) * PX_PER_MINUTE}px`,
                        }}
                        className="absolute inset-x-0 bg-slate-50 border-t border-slate-200 flex items-center justify-center pointer-events-none"
                      >
                        <span className="text-xs text-slate-400 font-medium">
                          Après-midi libre
                        </span>
                      </div>
                    )}

                    {/* Morning Recess */}
                    {morningRecess && (
                      <div
                        style={{
                          top: `${minutesToTopPx(morningRecess.startMinutes)}px`,
                          height: `${
                            (morningRecess.endMinutes - morningRecess.startMinutes) *
                            PX_PER_MINUTE
                          }px`,
                        }}
                        className="absolute inset-x-1 bg-recess-hatch border border-slate-300/80 rounded flex items-center justify-center z-10 pointer-events-none"
                      >
                        <span className="text-[11px] font-semibold text-slate-600 font-mono-tabular">
                          Récréation · {formatTime(morningRecess.startMinutes)}–
                          {formatTime(morningRecess.endMinutes)}
                        </span>
                      </div>
                    )}

                    {/* Afternoon Recess */}
                    {afternoonRecess && (
                      <div
                        style={{
                          top: `${minutesToTopPx(afternoonRecess.startMinutes)}px`,
                          height: `${
                            (afternoonRecess.endMinutes - afternoonRecess.startMinutes) *
                            PX_PER_MINUTE
                          }px`,
                        }}
                        className="absolute inset-x-1 bg-recess-hatch border border-slate-300/80 rounded flex items-center justify-center z-10 pointer-events-none"
                      >
                        <span className="text-[11px] font-semibold text-slate-600 font-mono-tabular">
                          Récréation · {formatTime(afternoonRecess.startMinutes)}–
                          {formatTime(afternoonRecess.endMinutes)}
                        </span>
                      </div>
                    )}

                    {/* Drop Ghost Preview */}
                    {dropGhost && dropGhost.day === day && (
                      <div
                        style={{
                          top: `${minutesToTopPx(dropGhost.startMinutes)}px`,
                          height: `${Math.max(22, dropGhost.durationMinutes * PX_PER_MINUTE)}px`,
                          backgroundColor: dropGhost.bgHex,
                          borderColor: dropGhost.accentHex || dropGhost.borderHex,
                          color: dropGhost.textHex,
                        }}
                        className="absolute inset-x-1.5 border-2 border-dashed rounded-lg z-30 px-2 py-1 pointer-events-none opacity-90"
                      >
                        <div className="text-[11px] font-semibold font-mono-tabular">
                          {formatTime(dropGhost.startMinutes)}–
                          {formatTime(dropGhost.startMinutes + dropGhost.durationMinutes)} (
                          {dropGhost.durationMinutes} min)
                        </div>
                      </div>
                    )}

                    {/* Placed Colored Labels */}
                    {dayBlocks.map((blk) => {
                      const style = DOMAIN_STYLES[blk.domainId];
                      const activeDuration =
                        resizingState?.blockId === blk.id
                          ? resizingState.previewDuration
                          : blk.durationMinutes;
                      const topPx = minutesToTopPx(blk.startMinutes);
                      const heightPx = Math.max(20, activeDuration * PX_PER_MINUTE - 2);
                      const vocabIssue = evaluateBlockVocabulary(blk, settings.cycle);
                      const isCompact = heightPx < 36;

                      return (
                        <div
                          key={blk.id}
                          draggable={!resizingState}
                          onDragStart={(e) => handleBlockDragStart(e, blk)}
                          onDragEnd={() => {
                            dragMetaRef.current = null;
                            onDragAnyEnd();
                            setDropGhost(null);
                          }}
                          onClick={() => onSelectBlock(blk)}
                          style={{
                            top: `${topPx + 1}px`,
                            height: `${heightPx}px`,
                            backgroundColor: style.bgHex,
                            borderColor: vocabIssue ? '#F59E0B' : style.borderHex,
                            color: style.textHex,
                          }}
                          className="group absolute inset-x-1.5 border rounded-lg z-20 px-2 py-1 cursor-grab active:cursor-grabbing select-none overflow-hidden transition-shadow hover:shadow-sm"
                        >
                          {isCompact ? (
                            <div className="flex items-center justify-between gap-1.5 h-full">
                              <span className="text-[11px] font-semibold truncate">
                                <span className="font-mono-tabular mr-1.5 opacity-85">
                                  {formatTime(blk.startMinutes)}
                                </span>
                                {blk.title}
                              </span>
                              <span className="text-[10px] font-mono-tabular opacity-75 shrink-0">
                                {activeDuration}m
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col h-full justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-1 text-[10px] font-mono-tabular opacity-80">
                                  <span>
                                    {formatTime(blk.startMinutes)}–
                                    {formatTime(blk.startMinutes + activeDuration)}
                                  </span>
                                  <span>{activeDuration} min</span>
                                </div>
                                <div className="text-xs font-semibold leading-tight mt-0.5 line-clamp-2">
                                  {blk.title}
                                </div>
                                {blk.secondaryDomainId && heightPx > 66 && (
                                  <div className="text-[10px] opacity-80 mt-0.5 truncate">
                                    + {DOMAIN_STYLES[blk.secondaryDomainId].shortLabel}
                                  </div>
                                )}
                              </div>

                              {vocabIssue && heightPx > 46 && (
                                <div className="flex items-center gap-1 text-[10px] font-medium text-amber-800 truncate">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Terme à préciser</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bottom Resize Handle */}
                          <div
                            onPointerDown={(e) => handleResizeStart(e, blk)}
                            onClick={(e) => e.stopPropagation()}
                            title="Glisser pour ajuster la durée (par pas de 5 min)"
                            className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="w-8 h-0.5 rounded-full bg-current opacity-40" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Domain Volume Tracker below Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Calcul en temps réel des volumes horaires par domaine
          </h2>
          <div className="text-xs text-slate-500 font-mono-tabular">
            Total placé :{' '}
            <strong className="text-slate-900">
              {formatDuration(report.totalScheduledTeachingMinutes)}
            </strong>{' '}
            / {formatDuration(report.expectedTeachingMinutes)} disponibles
            {report.totalCatecheseMinutes > 0 && (
              <> · Catéchèse : {formatDuration(report.totalCatecheseMinutes)} (hors total)</>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {report.domainRows.map((row) => {
            const domStyle = DOMAIN_STYLES[row.group.domainIds[0]];
            const target =
              settings.cycle === 'cycle1'
                ? row.group.adjustedMinutes
                : row.proRataTargetMinutes;
            const pct = target > 0 ? Math.min(100, Math.round((row.scheduledMinutes / target) * 100)) : 0;

            return (
              <div
                key={row.group.id}
                className="border border-slate-200 rounded-lg p-3 bg-slate-50/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: domStyle.swatchHex }}
                    />
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {row.group.label}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono-tabular font-semibold shrink-0 ${
                      row.status === 'ok'
                        ? 'text-emerald-700'
                        : row.status === 'warning'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {formatDuration(row.scheduledMinutes)}
                  </span>
                </div>

                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        row.status === 'ok'
                          ? '#059669'
                          : row.status === 'warning'
                          ? '#D97706'
                          : '#DC2626',
                    }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-mono-tabular">
                  <span>
                    {settings.cycle === 'cycle1'
                      ? `Indicatif : ${formatDuration(row.group.minRecommendedMinutes || 0)}–${formatDuration(row.group.maxRecommendedMinutes || 0)}`
                      : `Cible 22/24 : ${formatDuration(target)}`}
                  </span>
                  {settings.cycle !== 'cycle1' && (
                    <span>Écart : {formatSignedDelta(row.deltaFromProRata)}</span>
                  )}
                </div>
              </div>
            );
          })}

          {settings.schoolType === 'catholique' && (
            <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: DOMAIN_STYLES.catechese.swatchHex }}
                  />
                  <span className="text-xs font-semibold text-purple-950 truncate">
                    Caractère propre (Catéchèse / Éveil à la foi)
                  </span>
                </div>
                <span className="text-xs font-mono-tabular font-semibold text-purple-900 shrink-0">
                  {formatDuration(report.totalCatecheseMinutes)}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-purple-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-150 bg-purple-600"
                  style={{
                    width: `${Math.min(100, Math.round((report.totalCatecheseMinutes / 60) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-purple-800 font-mono-tabular">
                <span>Cible établissement : 1h00</span>
                <span>Début ou fin de journée</span>
              </div>
            </div>
          )}
        </div>

        {blocks.length === 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Votre grille est vide. Glissez des étiquettes depuis la palette à gauche ou chargez un exemple conforme.
            </span>
            <button
              type="button"
              onClick={onLoadSample}
              className="text-blue-700 font-semibold hover:underline cursor-pointer shrink-0 ml-3"
            >
              Charger l’exemple conforme
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
