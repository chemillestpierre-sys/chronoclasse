import { DayId, DayScheduleConfig, HalfDayConfig, ScheduledBlock, SchoolSettings } from '../types/timetable';

export const DAY_ORDER: DayId[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

export const DAY_LABELS: Record<DayId, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
};

export function formatTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}

export function formatTimeInput(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseTimeInput(value: string, fallbackMinutes: number): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return fallbackMinutes;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return fallbackMinutes;
  return h * 60 + m;
}

export function formatDuration(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m} min`;
  if (m === 0) return `${sign}${h}h00`;
  return `${sign}${h}h${String(m).padStart(2, '0')}`;
}

export function formatSignedDelta(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded === 0) return '0 min';
  const prefix = rounded > 0 ? '+' : '-';
  return `${prefix}${formatDuration(Math.abs(rounded))}`;
}

export function snapMinutes(minutes: number, step = 5): number {
  return Math.round(minutes / step) * step;
}

export function getActiveDays(settings: SchoolSettings): DayId[] {
  return DAY_ORDER.filter((dayId) => settings.days[dayId].enabled);
}

export interface TimeSegment {
  startMinutes: number;
  endMinutes: number;
}

export function getTeachingSegmentsForHalfDay(hd: HalfDayConfig): TimeSegment[] {
  if (!hd.enabled || hd.endMinutes <= hd.startMinutes) return [];
  if (!hd.recessEnabled || hd.recessDurationMinutes <= 0) {
    return [{ startMinutes: hd.startMinutes, endMinutes: hd.endMinutes }];
  }
  const recessStart = Math.max(hd.startMinutes, Math.min(hd.endMinutes, hd.recessStartMinutes));
  const recessEnd = Math.min(hd.endMinutes, recessStart + hd.recessDurationMinutes);
  const segments: TimeSegment[] = [];
  if (recessStart > hd.startMinutes) {
    segments.push({ startMinutes: hd.startMinutes, endMinutes: recessStart });
  }
  if (hd.endMinutes > recessEnd) {
    segments.push({ startMinutes: recessEnd, endMinutes: hd.endMinutes });
  }
  return segments;
}

export function getTeachingSegmentsForDay(dayCfg: DayScheduleConfig): TimeSegment[] {
  if (!dayCfg.enabled) return [];
  return [
    ...getTeachingSegmentsForHalfDay(dayCfg.morning),
    ...getTeachingSegmentsForHalfDay(dayCfg.afternoon),
  ];
}

export function getHalfDayRecessRange(hd: HalfDayConfig): TimeSegment | null {
  if (!hd.enabled || !hd.recessEnabled || hd.recessDurationMinutes <= 0) return null;
  const start = Math.max(hd.startMinutes, Math.min(hd.endMinutes, hd.recessStartMinutes));
  const end = Math.min(hd.endMinutes, start + hd.recessDurationMinutes);
  if (end <= start) return null;
  return { startMinutes: start, endMinutes: end };
}

export function getDayBounds(settings: SchoolSettings): { minStart: number; maxEnd: number } {
  const activeDays = getActiveDays(settings);
  if (activeDays.length === 0) return { minStart: 8 * 60 + 30, maxEnd: 16 * 60 + 30 };
  let minStart = 24 * 60;
  let maxEnd = 0;
  for (const day of activeDays) {
    const cfg = settings.days[day];
    if (cfg.morning.enabled) {
      minStart = Math.min(minStart, cfg.morning.startMinutes);
      maxEnd = Math.max(maxEnd, cfg.morning.endMinutes);
    }
    if (cfg.afternoon.enabled) {
      minStart = Math.min(minStart, cfg.afternoon.startMinutes);
      maxEnd = Math.max(maxEnd, cfg.afternoon.endMinutes);
    }
  }
  if (minStart >= maxEnd) return { minStart: 8 * 60 + 30, maxEnd: 16 * 60 + 30 };
  return {
    minStart: Math.floor(minStart / 30) * 30,
    maxEnd: Math.ceil(maxEnd / 30) * 30,
  };
}

export function computeSchoolTimeTotals(settings: SchoolSettings): {
  totalPresenceMinutes: number;
  totalRecessMinutes: number;
  totalEffectiveTeachingMinutes: number;
  halfDaysCount: number;
} {
  let totalPresenceMinutes = 0;
  let totalRecessMinutes = 0;
  let halfDaysCount = 0;

  for (const dayId of getActiveDays(settings)) {
    const dayCfg = settings.days[dayId];
    for (const hd of [dayCfg.morning, dayCfg.afternoon]) {
      if (!hd.enabled || hd.endMinutes <= hd.startMinutes) continue;
      halfDaysCount += 1;
      totalPresenceMinutes += hd.endMinutes - hd.startMinutes;
      const recess = getHalfDayRecessRange(hd);
      if (recess) {
        totalRecessMinutes += recess.endMinutes - recess.startMinutes;
      }
    }
  }

  return {
    totalPresenceMinutes,
    totalRecessMinutes,
    totalEffectiveTeachingMinutes: Math.max(0, totalPresenceMinutes - totalRecessMinutes),
    halfDaysCount,
  };
}

/**
 * Given a desired drop time and duration on a specific day, finds the best valid
 * non-overlapping placement inside an active teaching segment (avoiding recesses, midday break, and existing blocks).
 */
export function resolveValidPlacement(
  dayCfg: DayScheduleConfig,
  existingBlocks: ScheduledBlock[],
  desiredStart: number,
  desiredDuration: number,
  ignoreBlockId?: string
): { startMinutes: number; durationMinutes: number } | null {
  const segments = getTeachingSegmentsForDay(dayCfg);
  if (segments.length === 0) return null;

  const dayBlocks = existingBlocks
    .filter((b) => b.id !== ignoreBlockId)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // Build free intervals by subtracting existing blocks from teaching segments
  const freeIntervals: TimeSegment[] = [];
  for (const seg of segments) {
    let cursor = seg.startMinutes;
    for (const blk of dayBlocks) {
      const blkStart = blk.startMinutes;
      const blkEnd = blk.startMinutes + blk.durationMinutes;
      if (blkEnd <= cursor || blkStart >= seg.endMinutes) continue;
      if (blkStart > cursor) {
        freeIntervals.push({ startMinutes: cursor, endMinutes: Math.min(blkStart, seg.endMinutes) });
      }
      cursor = Math.max(cursor, blkEnd);
    }
    if (cursor < seg.endMinutes) {
      freeIntervals.push({ startMinutes: cursor, endMinutes: seg.endMinutes });
    }
  }

  const validIntervals = freeIntervals.filter((iv) => iv.endMinutes - iv.startMinutes >= 10);
  if (validIntervals.length === 0) return null;

  // Prefer the interval containing desiredStart, otherwise the closest interval
  let targetInterval = validIntervals.find(
    (iv) => desiredStart >= iv.startMinutes && desiredStart < iv.endMinutes
  );

  if (!targetInterval) {
    targetInterval = validIntervals.reduce((best, curr) => {
      const bestDist = Math.min(
        Math.abs(desiredStart - best.startMinutes),
        Math.abs(desiredStart - best.endMinutes)
      );
      const currDist = Math.min(
        Math.abs(desiredStart - curr.startMinutes),
        Math.abs(desiredStart - curr.endMinutes)
      );
      return currDist < bestDist ? curr : best;
    });
  }

  const avail = targetInterval.endMinutes - targetInterval.startMinutes;
  const duration = Math.min(desiredDuration, avail);
  const snappedDuration = Math.max(10, snapMinutes(duration, 5));
  const finalDuration = Math.min(snappedDuration, avail);

  let start = snapMinutes(desiredStart, 5);
  start = Math.max(targetInterval.startMinutes, Math.min(targetInterval.endMinutes - finalDuration, start));

  return {
    startMinutes: start,
    durationMinutes: finalDuration,
  };
}
