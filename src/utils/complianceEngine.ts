import {
  evaluateBlockVocabulary,
  REGULATORY_TARGETS,
} from '../data/regulations';
import {
  ComplianceCheckItem,
  ComplianceReport,
  ComplianceSeverity,
  DomainAuditRow,
  ScheduledBlock,
  SchoolSettings,
  VocabularyIssue,
} from '../types/timetable';
import {
  computeSchoolTimeTotals,
  formatDuration,
  formatSignedDelta,
  getActiveDays,
} from './timeUtils';

export function runComplianceAudit(
  settings: SchoolSettings,
  blocks: ScheduledBlock[]
): ComplianceReport {
  const { cycle } = settings;
  const activeDays = getActiveDays(settings);
  const {
    totalPresenceMinutes,
    totalRecessMinutes,
    totalEffectiveTeachingMinutes: expectedTeachingMinutes,
    halfDaysCount,
  } = computeSchoolTimeTotals(settings);

  const teachingBlocks = blocks.filter((b) => b.domainId !== 'catechese');
  const catecheseBlocks = blocks.filter((b) => b.domainId === 'catechese');

  const totalScheduledTeachingMinutes = teachingBlocks.reduce(
    (sum, b) => sum + b.durationMinutes,
    0
  );
  const totalCatecheseMinutes = catecheseBlocks.reduce(
    (sum, b) => sum + b.durationMinutes,
    0
  );

  // En école privée catholique, le temps de caractère propre peut s'ajouter aux 24h00 BOEN
  const boenPresenceMinutes =
    settings.schoolType === 'catholique'
      ? Math.max(0, totalPresenceMinutes - totalCatecheseMinutes)
      : totalPresenceMinutes;
  const boenExpectedTeachingMinutes =
    settings.schoolType === 'catholique'
      ? Math.max(0, expectedTeachingMinutes - totalCatecheseMinutes)
      : expectedTeachingMinutes;

  // 1. Domain breakdown
  const targets = REGULATORY_TARGETS[cycle];
  const standardTotal = 22 * 60; // 1320 min
  const ratio =
    cycle === 'cycle1' || boenExpectedTeachingMinutes <= 0
      ? 1
      : boenExpectedTeachingMinutes / standardTotal;

  const domainRows: DomainAuditRow[] = targets.map((group) => {
    const scheduledMinutes = teachingBlocks
      .filter((b) => group.domainIds.includes(b.domainId))
      .reduce((sum, b) => sum + b.durationMinutes, 0);

    const proRataTargetMinutes =
      cycle === 'cycle1'
        ? group.adjustedMinutes
        : Math.round(group.adjustedMinutes * ratio);

    const deltaFromAdjusted = scheduledMinutes - group.adjustedMinutes;
    const deltaFromProRata = scheduledMinutes - proRataTargetMinutes;

    let status: 'ok' | 'warning' | 'error' = 'ok';
    let message = 'Volume horaire conforme';

    if (cycle === 'cycle1') {
      const minRec = group.minRecommendedMinutes ?? group.adjustedMinutes - 30;
      const maxRec = group.maxRecommendedMinutes ?? group.adjustedMinutes + 30;
      if (scheduledMinutes === 0) {
        status = 'error';
        message = 'Domaine absent de l’emploi du temps';
      } else if (scheduledMinutes < minRec - 30 || scheduledMinutes > maxRec + 45) {
        status = 'warning';
        message = `Écart notable par rapport à la plage indicative (${formatDuration(minRec)}–${formatDuration(maxRec)})`;
      } else if (scheduledMinutes < minRec || scheduledMinutes > maxRec) {
        status = 'warning';
        message = `Légèrement hors plage indicative (${formatDuration(minRec)}–${formatDuration(maxRec)})`;
      } else {
        status = 'ok';
        message = 'Équilibre respecté';
      }
    } else {
      const absDelta = Math.abs(deltaFromProRata);
      if (scheduledMinutes === 0) {
        status = 'error';
        message = 'Domaine obligatoire non planifié';
      } else if (absDelta <= 10) {
        status = 'ok';
        message =
          absDelta === 0
            ? 'Conforme à la minute près'
            : `Conforme (écart d’arrondi ${formatSignedDelta(deltaFromProRata)})`;
      } else if (absDelta <= 25) {
        status = 'warning';
        message =
          deltaFromProRata > 0
            ? `Léger excédent (${formatSignedDelta(deltaFromProRata)})`
            : `Léger déficit (${formatSignedDelta(deltaFromProRata)})`;
      } else {
        status = 'error';
        message =
          deltaFromProRata > 0
            ? `Excédent important (${formatSignedDelta(deltaFromProRata)})`
            : `Déficit horaire (${formatSignedDelta(deltaFromProRata)})`;
      }
    }

    return {
      group,
      scheduledMinutes,
      proRataTargetMinutes,
      deltaFromAdjusted,
      deltaFromProRata,
      status,
      message,
    };
  });

  // 2. Vocabulary issues
  const vocabularyIssues: VocabularyIssue[] = [];
  for (const blk of blocks) {
    const issue = evaluateBlockVocabulary(blk, cycle);
    if (issue) vocabularyIssues.push(issue);
  }

  // 3. Detailed Checks
  const checks: ComplianceCheckItem[] = [];

  // 3A. Weekly hours & Recess check
  if (cycle !== 'cycle1') {
    const presenceDiff = boenPresenceMinutes - 24 * 60;
    if (Math.abs(presenceDiff) <= 15) {
      checks.push({
        id: 'weekly_presence',
        category: 'volumes',
        title: 'Volume de présence scolaire hebdomadaire (24h00)',
        status: 'conforme',
        detail:
          settings.schoolType === 'catholique' && totalCatecheseMinutes > 0
            ? `Présence totale : ${formatDuration(totalPresenceMinutes)} (${formatDuration(boenPresenceMinutes)} BOEN + ${formatDuration(totalCatecheseMinutes)} de caractère propre), dont ${formatDuration(totalRecessMinutes)} de récréations et ${formatDuration(boenExpectedTeachingMinutes)} d’enseignement BOEN.`
            : `Présence configurée : ${formatDuration(totalPresenceMinutes)} sur ${activeDays.length} jours (${halfDaysCount} demi-journées), dont ${formatDuration(totalRecessMinutes)} de récréations et ${formatDuration(boenExpectedTeachingMinutes)} d’enseignement effectif.`,
      });
    } else {
      checks.push({
        id: 'weekly_presence',
        category: 'volumes',
        title: 'Volume de présence scolaire hebdomadaire (24h00)',
        status: 'non_conforme',
        detail: `La durée de présence hors caractère propre est de ${formatDuration(boenPresenceMinutes)} au lieu des 24h00 réglementaires (écart de ${formatSignedDelta(presenceDiff)}).`,
        actionHint: 'Ajustez les horaires de début/fin des demi-journées dans « Horaires & Récréations ».',
      });
    }

    const avgRecessPerHalfDay = halfDaysCount > 0 ? totalRecessMinutes / halfDaysCount : 0;
    if (avgRecessPerHalfDay >= 12 && avgRecessPerHalfDay <= 20) {
      checks.push({
        id: 'recess_ratio',
        category: 'volumes',
        title: 'Temps de récréation (coefficient 22/24)',
        status: 'conforme',
        detail: `${formatDuration(totalRecessMinutes)} de récréations hebdomadaires (moyenne de ${Math.round(avgRecessPerHalfDay)} min par demi-journée, cohérent avec ~15 min).`,
      });
    } else {
      checks.push({
        id: 'recess_ratio',
        category: 'volumes',
        title: 'Temps de récréation (coefficient 22/24)',
        status: 'recommandation',
        detail: `Moyenne actuelle de ${Math.round(avgRecessPerHalfDay)} min par demi-journée (total ${formatDuration(totalRecessMinutes)}). Le cadre SYNADEC prévoit ~15 min par demi-journée en élémentaire (~2h00/semaine).`,
      });
    }

    const fillDelta = totalScheduledTeachingMinutes - boenExpectedTeachingMinutes;
    if (teachingBlocks.length === 0) {
      checks.push({
        id: 'weekly_fill',
        category: 'volumes',
        title: 'Couverture de l’emploi du temps',
        status: 'non_conforme',
        detail: 'Aucune séance d’enseignement n’a encore été placée sur la grille.',
      });
    } else if (Math.abs(fillDelta) <= 15) {
      checks.push({
        id: 'weekly_fill',
        category: 'volumes',
        title: 'Adéquation temps placé / temps effectif disponible',
        status: 'conforme',
        detail: `${formatDuration(totalScheduledTeachingMinutes)} planifiées pour ${formatDuration(boenExpectedTeachingMinutes)} disponibles.`,
      });
    } else {
      checks.push({
        id: 'weekly_fill',
        category: 'volumes',
        title: 'Adéquation temps placé / temps effectif disponible',
        status: fillDelta > 0 ? 'non_conforme' : 'recommandation',
        detail:
          fillDelta < 0
            ? `Il reste ${formatDuration(Math.abs(fillDelta))} de temps d’enseignement non attribué (${formatDuration(totalScheduledTeachingMinutes)} / ${formatDuration(boenExpectedTeachingMinutes)}).`
            : `Le volume planifié dépasse le temps disponible de ${formatDuration(fillDelta)}.`,
      });
    }
  } else {
    // Cycle 1 recess check (~30 min)
    const avgRecessPerHalfDay = halfDaysCount > 0 ? totalRecessMinutes / halfDaysCount : 0;
    checks.push({
      id: 'c1_recess',
      category: 'volumes',
      title: 'Temps de récréation en Cycle 1 (~30 min)',
      status: avgRecessPerHalfDay >= 20 && avgRecessPerHalfDay <= 40 ? 'conforme' : 'recommandation',
      detail: `Récréation moyenne de ${Math.round(avgRecessPerHalfDay)} min par demi-journée (recommandation Cycle 1 : environ 30 min).`,
    });
  }

  // Domain errors summary check
  const errorDomains = domainRows.filter((r) => r.status === 'error');
  const warnDomains = domainRows.filter((r) => r.status === 'warning');
  if (errorDomains.length === 0 && warnDomains.length === 0) {
    checks.push({
      id: 'domains_balance',
      category: 'volumes',
      title: 'Équilibre des volumes horaires par domaine',
      status: 'conforme',
      detail:
        cycle === 'cycle1'
          ? 'Tous les domaines d’apprentissage sont représentés dans les plages indicatives.'
          : 'Tous les domaines respectent les horaires hebdomadaires du BOEN n°31 (après coefficient 22/24).',
    });
  } else if (errorDomains.length > 0) {
    checks.push({
      id: 'domains_balance',
      category: 'volumes',
      title: 'Équilibre des volumes horaires par domaine',
      status: 'non_conforme',
      detail: `${errorDomains.length} domaine(s) présentent un écart important ou sont absents : ${errorDomains.map((d) => d.group.label).join(', ')}.`,
      actionHint: 'Ajustez la durée ou ajoutez des étiquettes pour ces domaines dans la grille.',
    });
  } else {
    checks.push({
      id: 'domains_balance',
      category: 'volumes',
      title: 'Équilibre des volumes horaires par domaine',
      status: 'recommandation',
      detail: `${warnDomains.length} domaine(s) présentent un léger écart (11 à 25 min) : ${warnDomains.map((d) => d.group.label).join(', ')}.`,
    });
  }

  // 3B. Vocabulary check
  if (vocabularyIssues.length === 0 && blocks.length > 0) {
    checks.push({
      id: 'vocabulary_official',
      category: 'vocabulaire',
      title: 'Vocabulaire et appellations réglementaires (BOEN)',
      status: 'conforme',
      detail: 'Toutes les étiquettes utilisent les dénominations réglementaires et rendent chaque domaine identifiable.',
    });
  } else if (vocabularyIssues.length > 0) {
    checks.push({
      id: 'vocabulary_official',
      category: 'vocabulaire',
      title: 'Vocabulaire et appellations réglementaires (BOEN)',
      status: 'non_conforme',
      detail: `${vocabularyIssues.length} intitulé(s) comportent des termes familiers ou incomplets au regard des programmes officiels.`,
      actionHint: 'Utilisez les corrections automatiques proposées ci-dessous pour normaliser les intitulés.',
    });
  }

  // 3C. Morning cognitive window (08h45 - 11h15) for Français & Mathématiques
  const fondamentalBlocks = teachingBlocks.filter(
    (b) => b.domainId === 'francais' || b.domainId === 'mathematiques'
  );
  const totalFondamentalMin = fondamentalBlocks.reduce((s, b) => s + b.durationMinutes, 0);
  const morningFondamentalMin = fondamentalBlocks
    .filter((b) => b.startMinutes < 12 * 60 + 30)
    .reduce((s, b) => s + b.durationMinutes, 0);
  const morningRatio =
    totalFondamentalMin > 0 ? Math.round((morningFondamentalMin / totalFondamentalMin) * 100) : 0;

  if (totalFondamentalMin === 0) {
    checks.push({
      id: 'cognitive_morning',
      category: 'rythme',
      title: 'Plages cognitives optimales du matin (8h45–11h15)',
      status: 'non_conforme',
      detail: 'Aucun temps de Français ou de Mathématiques n’est planifié.',
    });
  } else if (morningRatio >= 70) {
    checks.push({
      id: 'cognitive_morning',
      category: 'rythme',
      title: 'Plages cognitives optimales du matin (8h45–11h15)',
      status: 'conforme',
      detail: `${morningRatio}% des apprentissages fondamentaux (Français / Mathématiques) sont placés en matinée.`,
    });
  } else {
    checks.push({
      id: 'cognitive_morning',
      category: 'rythme',
      title: 'Plages cognitives optimales du matin (8h45–11h15)',
      status: 'recommandation',
      detail: `Seulement ${morningRatio}% des fondamentaux sont en matinée. Privilégiez les plages du matin (8h45–11h15) pour le Français et les Mathématiques.`,
    });
  }

  // 3D. Continuity of fundamental sessions (avoid fragmentation < 45m for core learning)
  if (cycle !== 'cycle1') {
    const coreFondamentalLearning = fondamentalBlocks.filter(
      (b) => b.nature === 'apprentissage'
    );
    const longSessions = coreFondamentalLearning.filter((b) => b.durationMinutes >= 45);
    const tinySessions = coreFondamentalLearning.filter((b) => b.durationMinutes < 25);

    if (coreFondamentalLearning.length > 0 && longSessions.length >= activeDays.length && tinySessions.length === 0) {
      checks.push({
        id: 'session_continuity',
        category: 'rythme',
        title: 'Continuité des temps d’apprentissage (éviter le morcellement)',
        status: 'conforme',
        detail: `${longSessions.length} séances continues d’au moins 45 min–1h00 ont été prévues pour les apprentissages fondamentaux.`,
      });
    } else if (coreFondamentalLearning.length > 0) {
      checks.push({
        id: 'session_continuity',
        category: 'rythme',
        title: 'Continuité des temps d’apprentissage (éviter le morcellement)',
        status: 'recommandation',
        detail:
          tinySessions.length > 0
            ? `${tinySessions.length} séance(s) d’apprentissage fondamental durent moins de 25 min. Privilégiez des plages continues d’1h (hors rituels).`
            : 'Ajoutez davantage de plages continues (45 à 60 min) pour les apprentissages fondamentaux.',
      });
    }
  }

  // 3E. Alternation cognitive vs motor/creative
  const motorCreativeDays = new Set(
    teachingBlocks
      .filter((b) => b.domainId === 'eps' || b.domainId === 'artistique')
      .map((b) => b.day)
  );
  const fullDays = activeDays.filter((d) => settings.days[d].afternoon.enabled);
  if (fullDays.length > 0) {
    const coveredCount = fullDays.filter((d) => motorCreativeDays.has(d)).length;
    checks.push({
      id: 'day_alternation',
      category: 'rythme',
      title: 'Alternance concentration / temps moteurs ou créatifs',
      status: coveredCount >= Math.max(1, fullDays.length - 1) ? 'conforme' : 'recommandation',
      detail: `${coveredCount} journée(s) complète(s) sur ${fullDays.length} intègrent de l’EPS ou des enseignements artistiques pour équilibrer la fatigue cognitive.`,
    });
  }

  // 3F. Rituals & Differentiation & Pleasure reading / Cycle 1 specifics
  if (cycle === 'cycle1') {
    const epsDays = activeDays.filter((day) => {
      const min = teachingBlocks
        .filter((b) => b.day === day && b.domainId === 'eps')
        .reduce((s, b) => s + b.durationMinutes, 0);
      return min >= 25;
    });
    checks.push({
      id: 'c1_daily_eps',
      category: 'rythme',
      title: '30 minutes d’activité physique quotidienne (Cycle 1)',
      status: epsDays.length === activeDays.length ? 'conforme' : 'recommandation',
      detail: `${epsDays.length} jour(s) sur ${activeDays.length} prévoient au moins 25–30 min d’activité physique.`,
    });

    const hasRest = teachingBlocks.some(
      (b) => b.domainId === 'autres_c1' && /repos|sieste|calme/i.test(b.title)
    );
    checks.push({
      id: 'c1_rest',
      category: 'rythme',
      title: 'Temps de repos pour les enfants qui en ont besoin',
      status: hasRest ? 'conforme' : 'recommandation',
      detail: hasRest
        ? 'Un temps de repos / temps calme adapté est intégré à l’emploi du temps.'
        : 'Pensez à faire apparaître un temps de repos ou de retour au calme en début d’après-midi.',
    });
  } else {
    const ritualDays = new Set(
      teachingBlocks.filter((b) => b.nature === 'rituel').map((b) => b.day)
    );
    checks.push({
      id: 'rituals_presence',
      category: 'rythme',
      title: 'Présence des rituels quotidiens (lecture, calcul mental, oral)',
      status: ritualDays.size >= activeDays.length ? 'conforme' : 'recommandation',
      detail:
        ritualDays.size >= activeDays.length
          ? `Des rituels sont intégrés chaque jour (${ritualDays.size}/${activeDays.length} jours) et comptabilisés dans Français/Mathématiques.`
          : `Rituels identifiés sur ${ritualDays.size}/${activeDays.length} jours. Prévoyez lecture quotidienne (10–15 min) et calcul mental (5–10 min).`,
    });

    const diffBlocks = teachingBlocks.filter(
      (b) =>
        b.nature === 'differenciation' ||
        /atelier|remédiation|petits? groupes?/i.test(b.title)
    );
    checks.push({
      id: 'differentiation_presence',
      category: 'rythme',
      title: 'Temps de différenciation / ateliers / remédiation',
      status: diffBlocks.length >= 1 ? 'conforme' : 'recommandation',
      detail:
        diffBlocks.length >= 1
          ? `${diffBlocks.length} créneau(x) dédié(s) aux ateliers ou à la remédiation.`
          : 'Prévoyez des temps courts d’ateliers ou de remédiation (15–20 min) en petits groupes.',
    });

    const pleasureBlocks = teachingBlocks.filter(
      (b) => b.nature === 'lecture_plaisir' || /lecture[-\s]plaisir/i.test(b.title)
    );
    checks.push({
      id: 'pleasure_reading',
      category: 'rythme',
      title: 'Temps hebdomadaire de lecture-plaisir (hors évaluation)',
      status: pleasureBlocks.length >= 1 ? 'conforme' : 'recommandation',
      detail:
        pleasureBlocks.length >= 1
          ? 'Un temps hebdomadaire dédié à la lecture-plaisir est bien programmé.'
          : 'Bonne pratique SYNADEC : intégrez un créneau hebdomadaire de lecture-plaisir hors évaluation.',
    });
  }

  // 3G. Caractère propre / Catéchèse placement check (SYNADEC Section 6)
  if (settings.schoolType === 'publique' && catecheseBlocks.length > 0) {
    checks.push({
      id: 'catechese_public_school',
      category: 'cadre',
      title: 'Statut d’école publique et créneau de caractère propre',
      status: 'non_conforme',
      detail:
        'Votre établissement est configuré en école publique mais un créneau de catéchèse / caractère propre est présent sur la grille.',
      actionHint:
        'Supprimez ce créneau ou modifiez le statut de l’école en « École privée catholique » dans Horaires & Récréations.',
    });
  } else if (settings.schoolType === 'catholique') {
    if (totalCatecheseMinutes === 0) {
      checks.push({
        id: 'caractere_propre_volume',
        category: 'cadre',
        title: 'Heure de caractère propre (école privée catholique)',
        status: 'recommandation',
        detail:
          'Aucune heure de caractère propre (catéchèse ou éveil à la foi) n’est encore placée. Vous pouvez positionner 1h00 en début ou fin de journée depuis la palette.',
      });
    } else {
      checks.push({
        id: 'caractere_propre_volume',
        category: 'cadre',
        title: 'Heure de caractère propre (école privée catholique)',
        status: totalCatecheseMinutes >= 45 && totalCatecheseMinutes <= 75 ? 'conforme' : 'recommandation',
        detail: `${formatDuration(totalCatecheseMinutes)} de caractère propre programmées (cible recommandée : 1h00 hebdomadaire).`,
      });

      const misplaced = catecheseBlocks.filter((blk) => {
        const dayCfg = settings.days[blk.day];
        if (!dayCfg.enabled) return true;
        const atMorningStart =
          dayCfg.morning.enabled && Math.abs(blk.startMinutes - dayCfg.morning.startMinutes) <= 2;
        const atAfternoonEnd =
          dayCfg.afternoon.enabled &&
          Math.abs(blk.startMinutes + blk.durationMinutes - dayCfg.afternoon.endMinutes) <= 2;
        const atMorningEndOnly =
          !dayCfg.afternoon.enabled &&
          dayCfg.morning.enabled &&
          Math.abs(blk.startMinutes + blk.durationMinutes - dayCfg.morning.endMinutes) <= 2;
        return !(atMorningStart || atAfternoonEnd || atMorningEndOnly);
      });

      checks.push({
        id: 'catechese_placement',
        category: 'cadre',
        title: 'Placement du temps de catéchèse ou d’éveil à la foi',
        status: misplaced.length === 0 ? 'conforme' : 'non_conforme',
        detail:
          misplaced.length === 0
            ? 'Placé en début ou fin de journée afin de permettre aux élèves qui n’y participent pas d’arriver plus tard ou de partir plus tôt.'
            : `${misplaced.length} créneau(x) de caractère propre ne sont pas placés en début ou fin de journée. Si ce maintien en milieu de journée est voulu, une organisation interne de surveillance doit être prévue.`,
        actionHint: 'Déplacez ce créneau au début de la matinée ou à la fin de l’après-midi.',
      });
    }
  }

  // 3H. Administrative metadata check (signed by direction & displayed)
  const missingMeta: string[] = [];
  if (!settings.schoolName.trim()) missingMeta.push('nom de l’école');
  if (!settings.classLevel.trim()) missingMeta.push('niveau / classe');
  if (!settings.teacherName.trim()) missingMeta.push('nom de l’enseignant(e)');

  checks.push({
    id: 'admin_metadata',
    category: 'cadre',
    title: 'Trace écrite pour affichage en classe et visa de la direction',
    status: missingMeta.length === 0 ? 'conforme' : 'recommandation',
    detail:
      missingMeta.length === 0
        ? `Informations complètes (${settings.schoolName} · ${settings.classLevel} · ${settings.teacherName}). Prêt pour affichage et signature de la direction.`
        : `Complétez le(s) champ(s) suivant(s) pour l’en-tête officiel : ${missingMeta.join(', ')}.`,
  });

  const summaryCounts = {
    conforme: checks.filter((c) => c.status === 'conforme').length,
    recommandation: checks.filter((c) => c.status === 'recommandation').length,
    non_conforme: checks.filter((c) => c.status === 'non_conforme').length,
  };

  let overallStatus: ComplianceSeverity = 'conforme';
  if (summaryCounts.non_conforme > 0) {
    overallStatus = 'non_conforme';
  } else if (summaryCounts.recommandation > 0) {
    overallStatus = 'recommandation';
  }

  return {
    overallStatus,
    totalPresenceMinutes,
    totalRecessMinutes,
    expectedTeachingMinutes: boenExpectedTeachingMinutes,
    totalScheduledTeachingMinutes,
    totalCatecheseMinutes,
    halfDaysCount,
    domainRows,
    vocabularyIssues,
    checks,
    summaryCounts,
  };
}
