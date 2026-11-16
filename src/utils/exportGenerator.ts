import { jsPDF } from 'jspdf';
import { CYCLE_INFO, DOMAIN_STYLES } from '../data/regulations';
import { ComplianceReport, DayId, SchoolSettings, ScheduledBlock } from '../types/timetable';
import {
  DAY_LABELS,
  formatDuration,
  formatTime,
  getActiveDays,
  getDayBounds,
  getHalfDayRecessRange,
} from './timeUtils';

export interface ExportOptions {
  includeSummaryTable: boolean;
  includeSignatureBlock: boolean;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 4) {
      last = last.slice(0, -1);
    }
    if (words.join(' ').length > lines.join(' ').length) {
      lines[maxLines - 1] = last.trimEnd() + '…';
    }
  }
  return lines;
}

export function renderTimetableToCanvas(
  settings: SchoolSettings,
  blocks: ScheduledBlock[],
  report: ComplianceReport,
  options: ExportOptions
): HTMLCanvasElement {
  // High-resolution A4 landscape canvas (2480 x 1754 px ~ 210 DPI)
  const W = 2480;
  const H = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // White paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  const margin = 64;
  const contentW = W - margin * 2;

  // --- HEADER ---
  const headerH = 128;
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 40px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('EMPLOI DU TEMPS HEBDOMADAIRE', margin, margin + 42);

  ctx.fillStyle = '#475569';
  ctx.font = '500 24px "DM Sans", system-ui, sans-serif';
  const cycleMeta = CYCLE_INFO[settings.cycle];
  const schoolStatusLabel =
    settings.schoolType === 'catholique' ? 'École privée catholique' : 'École publique';
  const subParts = [
    settings.schoolName || 'Établissement scolaire',
    schoolStatusLabel,
    `Classe : ${settings.classLevel || '—'} (${cycleMeta.shortLabel})`,
    `Enseignant(e) : ${settings.teacherName || '—'}`,
    `Année ${settings.schoolYear || '2026–2027'}`,
  ];
  ctx.fillText(subParts.join('  ·  '), margin, margin + 84);

  // Right header summary metrics
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  const rightTop =
    settings.schoolType === 'catholique' && report.totalCatecheseMinutes > 0
      ? `Présence ${formatDuration(report.totalPresenceMinutes)} · Enseignement ${formatDuration(report.expectedTeachingMinutes)} · Caractère propre ${formatDuration(report.totalCatecheseMinutes)}`
      : `Présence ${formatDuration(report.totalPresenceMinutes)} · Enseignement ${formatDuration(report.expectedTeachingMinutes)}`;
  ctx.fillText(rightTop, W - margin, margin + 40);
  ctx.fillStyle = '#475569';
  ctx.font = '500 20px "DM Sans", system-ui, sans-serif';
  ctx.fillText(
    `Récréations : ${formatDuration(report.totalRecessMinutes)} · Référentiel ${cycleMeta.referenceText}`,
    W - margin,
    margin + 80
  );
  ctx.textAlign = 'left';

  // Header divider line
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, margin + headerH - 12);
  ctx.lineTo(W - margin, margin + headerH - 12);
  ctx.stroke();

  // --- LAYOUT VERTICAL BUDGET ---
  const gridTop = margin + headerH + 8;
  const footerReserve = options.includeSummaryTable || options.includeSignatureBlock ? 286 : 40;
  const gridH = H - gridTop - footerReserve - margin;

  const activeDays = getActiveDays(settings);
  const { minStart, maxEnd } = getDayBounds(settings);
  const totalMinutesSpan = Math.max(60, maxEnd - minStart);

  const timeColW = 112;
  const dayColHeaderH = 54;
  const gridBodyTop = gridTop + dayColHeaderH;
  const gridBodyH = gridH - dayColHeaderH;
  const dayColW = (contentW - timeColW) / Math.max(1, activeDays.length);

  const yFromMin = (m: number) => gridBodyTop + ((m - minStart) / totalMinutesSpan) * gridBodyH;

  // Outer border of grid
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, margin, gridTop, contentW, gridH, 10);
  ctx.stroke();

  // Day column headers background
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(margin + 1, gridTop + 1, contentW - 2, dayColHeaderH - 1);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin, gridBodyTop);
  ctx.lineTo(W - margin, gridBodyTop);
  ctx.stroke();

  // Time column header
  ctx.fillStyle = '#475569';
  ctx.font = '600 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Horaires', margin + 16, gridTop + 34);

  // Day titles
  activeDays.forEach((dayId: DayId, idx: number) => {
    const x = margin + timeColW + idx * dayColW;
    ctx.strokeStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(x, gridTop);
    ctx.lineTo(x, gridTop + gridH);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(DAY_LABELS[dayId], x + dayColW / 2, gridTop + 35);
    ctx.textAlign = 'left';
  });

  // Hour horizontal gridlines
  const firstHour = Math.ceil(minStart / 60) * 60;
  for (let m = firstHour; m <= maxEnd; m += 30) {
    const y = yFromMin(m);
    const isHour = m % 60 === 0;
    ctx.strokeStyle = isHour ? '#CBD5E1' : '#F1F5F9';
    ctx.lineWidth = isHour ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(margin + timeColW, y);
    ctx.lineTo(W - margin, y);
    ctx.stroke();

    if (isHour) {
      ctx.fillStyle = '#475569';
      ctx.font = '600 18px "JetBrains Mono", monospace';
      ctx.fillText(formatTime(m), margin + 16, y + 6);
    }
  }

  // Draw day inactive / midday / recess zones & blocks
  activeDays.forEach((dayId, idx) => {
    const colX = margin + timeColW + idx * dayColW;
    const cfg = settings.days[dayId];

    // Midday break
    if (cfg.morning.enabled && cfg.afternoon.enabled && cfg.afternoon.startMinutes > cfg.morning.endMinutes) {
      const y1 = yFromMin(cfg.morning.endMinutes);
      const y2 = yFromMin(cfg.afternoon.startMinutes);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(colX + 2, y1, dayColW - 4, y2 - y1);
      ctx.fillStyle = '#64748B';
      ctx.font = '500 18px "DM Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Pause méridienne (${formatTime(cfg.morning.endMinutes)}–${formatTime(cfg.afternoon.startMinutes)})`,
        colX + dayColW / 2,
        (y1 + y2) / 2 + 6
      );
      ctx.textAlign = 'left';
    } else if (!cfg.afternoon.enabled && cfg.morning.enabled) {
      const y1 = yFromMin(cfg.morning.endMinutes);
      const y2 = gridBodyTop + gridBodyH;
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(colX + 2, y1, dayColW - 4, y2 - y1);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 18px "DM Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Après-midi non scolarisé', colX + dayColW / 2, (y1 + y2) / 2);
      ctx.textAlign = 'left';
    }

    // Recess bars
    for (const hd of [cfg.morning, cfg.afternoon]) {
      const rec = getHalfDayRecessRange(hd);
      if (!rec) continue;
      const y1 = yFromMin(rec.startMinutes);
      const y2 = yFromMin(rec.endMinutes);
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(colX + 4, y1, dayColW - 8, y2 - y1);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.strokeRect(colX + 4, y1, dayColW - 8, y2 - y1);

      ctx.fillStyle = '#475569';
      ctx.font = '600 16px "DM Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Récréation (${formatTime(rec.startMinutes)}–${formatTime(rec.endMinutes)})`,
        colX + dayColW / 2,
        (y1 + y2) / 2 + 5
      );
      ctx.textAlign = 'left';
    }

    // Scheduled Blocks
    const dayBlocks = blocks
      .filter((b) => b.day === dayId)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    for (const blk of dayBlocks) {
      const style = DOMAIN_STYLES[blk.domainId];
      const bx = colX + 6;
      const bw = dayColW - 12;
      const by = yFromMin(blk.startMinutes) + 1.5;
      const bh = Math.max(18, yFromMin(blk.startMinutes + blk.durationMinutes) - by - 1.5);

      ctx.fillStyle = style.bgHex;
      drawRoundedRect(ctx, bx, by, bw, bh, 6);
      ctx.fill();

      ctx.strokeStyle = style.borderHex;
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, bx, by, bw, bh, 6);
      ctx.stroke();

      const timeRange = `${formatTime(blk.startMinutes)}–${formatTime(blk.startMinutes + blk.durationMinutes)}`;
      ctx.fillStyle = style.textHex;

      if (bh < 38) {
        // Compact single-line block (10-15 min ritual)
        ctx.font = '600 14px "DM Sans", system-ui, sans-serif';
        const line = `${timeRange} · ${blk.title}`;
        const truncated = wrapTextLines(ctx, line, bw - 16, 1)[0] || line;
        ctx.fillText(truncated, bx + 8, by + bh / 2 + 5);
      } else {
        ctx.font = '600 14px "JetBrains Mono", monospace';
        ctx.fillText(`${timeRange} (${blk.durationMinutes} min)`, bx + 10, by + 20);

        ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
        const maxLines = bh > 80 ? 3 : 2;
        const lines = wrapTextLines(ctx, blk.title, bw - 20, maxLines);
        lines.forEach((ln, li) => {
          ctx.fillText(ln, bx + 10, by + 40 + li * 19);
        });

        if (blk.secondaryDomainId && bh > 72) {
          const secStyle = DOMAIN_STYLES[blk.secondaryDomainId];
          ctx.font = '500 13px "DM Sans", system-ui, sans-serif';
          ctx.fillText(
            `+ ${secStyle.shortLabel}`,
            bx + 10,
            by + bh - 10
          );
        }
      }
    }
  });

  // --- FOOTER: SUMMARY TABLE + DIRECTION SIGNATURE ---
  const footerTop = gridTop + gridH + 24;

  if (options.includeSummaryTable) {
    const tableW = options.includeSignatureBlock ? contentW * 0.68 : contentW;
    const rows = report.domainRows;
    const rowH = 29;
    const tableH = 36 + rows.length * rowH;

    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, margin, footerTop, tableW, Math.min(256, tableH), 8);
    ctx.stroke();

    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(margin + 1, footerTop + 1, tableW - 2, 34);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Récapitulatif hebdomadaire par domaine réglementaire', margin + 14, footerTop + 23);

    ctx.textAlign = 'right';
    ctx.fillText('Placé', margin + tableW - 190, footerTop + 23);
    ctx.fillText('Cible (22/24)', margin + tableW - 20, footerTop + 23);
    ctx.textAlign = 'left';

    rows.forEach((row, idx) => {
      const ry = footerTop + 36 + idx * rowH;
      if (ry + rowH > H - margin + 10) return;

      const domStyle = DOMAIN_STYLES[row.group.domainIds[0]];
      ctx.fillStyle = domStyle.swatchHex;
      ctx.fillRect(margin + 14, ry + 8, 12, 12);

      ctx.fillStyle = '#0F172A';
      ctx.font = '500 15px "DM Sans", system-ui, sans-serif';
      ctx.fillText(row.group.label, margin + 36, ry + 19);

      ctx.font = '600 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(formatDuration(row.scheduledMinutes), margin + tableW - 190, ry + 19);
      ctx.fillStyle = '#475569';
      ctx.fillText(
        settings.cycle === 'cycle1'
          ? `${formatDuration(row.group.minRecommendedMinutes || 0)}–${formatDuration(row.group.maxRecommendedMinutes || 0)}`
          : formatDuration(row.proRataTargetMinutes),
        margin + tableW - 20,
        ry + 19
      );
      ctx.textAlign = 'left';

      if (idx < rows.length - 1) {
        ctx.strokeStyle = '#F1F5F9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin + 10, ry + rowH);
        ctx.lineTo(margin + tableW - 10, ry + rowH);
        ctx.stroke();
      }
    });
  }

  if (options.includeSignatureBlock) {
    const sigX = options.includeSummaryTable ? margin + contentW * 0.68 + 24 : margin;
    const sigW = options.includeSummaryTable ? contentW * 0.32 - 24 : contentW;
    const sigH = 240;

    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, sigX, footerTop, sigW, sigH, 8);
    ctx.stroke();

    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(sigX + 1, footerTop + 1, sigW - 2, 34);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Affichage en classe & Visa de la direction', sigX + 14, footerTop + 23);

    ctx.fillStyle = '#475569';
    ctx.font = '500 15px "DM Sans", system-ui, sans-serif';
    ctx.fillText(`Enseignant(e) : ${settings.teacherName || '________________'}`, sigX + 16, footerTop + 66);
    ctx.fillText('Date de validation : ____ / ____ / 20____', sigX + 16, footerTop + 100);
    ctx.fillText('Signature de l’enseignant(e) :', sigX + 16, footerTop + 140);
    ctx.fillText('Visa et cachet de la direction :', sigX + 16, footerTop + 198);
  }

  return canvas;
}

export function getTimetablePreviewDataUrl(
  settings: SchoolSettings,
  blocks: ScheduledBlock[],
  report: ComplianceReport,
  options: ExportOptions
): string {
  const canvas = renderTimetableToCanvas(settings, blocks, report, options);
  return canvas.toDataURL('image/png');
}

export function exportTimetableAsPng(
  settings: SchoolSettings,
  blocks: ScheduledBlock[],
  report: ComplianceReport,
  options: ExportOptions
): void {
  const canvas = renderTimetableToCanvas(settings, blocks, report, options);
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const slug = (settings.classLevel || settings.cycle)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  link.download = `emploi-du-temps-${slug}.png`;
  link.href = url;
  link.click();
}

export function exportTimetableAsPdf(
  settings: SchoolSettings,
  blocks: ScheduledBlock[],
  report: ComplianceReport,
  options: ExportOptions
): void {
  const canvas = renderTimetableToCanvas(settings, blocks, report, options);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
  const slug = (settings.classLevel || settings.cycle)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  pdf.save(`emploi-du-temps-${slug}.pdf`);
}
