import {
  CycleId,
  DomainId,
  DomainStyle,
  LabelTemplate,
  RegulatoryTargetGroup,
  ScheduledBlock,
  SchoolSettings,
  VocabularyIssue,
} from '../types/timetable';

export const CYCLE_INFO: Record<
  CycleId,
  {
    id: CycleId;
    label: string;
    shortLabel: string;
    levels: string;
    description: string;
    referenceText: string;
  }
> = {
  cycle1: {
    id: 'cycle1',
    label: 'Cycle 1 — École maternelle',
    shortLabel: 'Cycle 1 (Maternelle)',
    levels: 'PS · MS · GS',
    description:
      "Pas d'horaires hebdomadaires fixes imposés, mais un équilibre recommandé entre les 5 domaines, 30 min d'activité physique quotidienne, ~30 min de récréation et un temps de repos.",
    referenceText: 'Programmes 2020-2024 · Recommandations SYNADEC',
  },
  cycle2: {
    id: 'cycle2',
    label: 'Cycle 2 — École élémentaire',
    shortLabel: 'Cycle 2 (CP–CE2)',
    levels: 'CP · CE1 · CE2',
    description:
      '24h00 hebdomadaires de référence ramenées à 22h00 effectives après déduction des récréations (coefficient 22/24, soit ~15 min par demi-journée).',
    referenceText: 'BOEN n°31 du 30 juillet 2020 · Programmes 2020-2024',
  },
  cycle3: {
    id: 'cycle3',
    label: 'Cycle 3 — École élémentaire',
    shortLabel: 'Cycle 3 (CM1–CM2)',
    levels: 'CM1 · CM2',
    description:
      '24h00 hebdomadaires de référence ramenées à 22h00 effectives après déduction des récréations (coefficient 22/24), avec séparation Sciences & Technologie et Histoire-Géographie.',
    referenceText: 'BOEN n°31 du 30 juillet 2020 · Programmes 2020-2024',
  },
};

export const DOMAIN_STYLES: Record<DomainId, DomainStyle> = {
  francais: {
    id: 'francais',
    officialLabel: 'Français',
    cycle1Label: 'Mobiliser le langage dans toutes ses dimensions',
    shortLabel: 'Français',
    bgHex: '#EFF6FF',
    borderHex: '#BFDBFE',
    textHex: '#1E3A8A',
    accentHex: '#2563EB',
    swatchHex: '#2563EB',
  },
  mathematiques: {
    id: 'mathematiques',
    officialLabel: 'Mathématiques',
    cycle1Label: 'Construire les premiers outils pour structurer sa pensée',
    shortLabel: 'Mathématiques',
    bgHex: '#FFFBEB',
    borderHex: '#FDE68A',
    textHex: '#78350F',
    accentHex: '#D97706',
    swatchHex: '#D97706',
  },
  langues: {
    id: 'langues',
    officialLabel: 'Langue vivante',
    shortLabel: 'Langue vivante',
    bgHex: '#ECFDF5',
    borderHex: '#A7F3D0',
    textHex: '#064E3B',
    accentHex: '#059669',
    swatchHex: '#059669',
  },
  eps: {
    id: 'eps',
    officialLabel: 'Éducation Physique et Sportive (EPS)',
    cycle1Label: "Agir, s'exprimer, comprendre à travers l'activité physique",
    shortLabel: 'EPS',
    bgHex: '#FFF1F2',
    borderHex: '#FECDD3',
    textHex: '#881337',
    accentHex: '#E11D48',
    swatchHex: '#E11D48',
  },
  artistique: {
    id: 'artistique',
    officialLabel: 'Enseignements artistiques',
    cycle1Label: "Agir, s'exprimer, comprendre à travers les activités artistiques",
    shortLabel: 'Arts',
    bgHex: '#F5F3FF',
    borderHex: '#DDD6FE',
    textHex: '#4C1D95',
    accentHex: '#7C3AED',
    swatchHex: '#7C3AED',
  },
  qlm: {
    id: 'qlm',
    officialLabel: 'Questionner le monde',
    cycle1Label: 'Explorer le monde',
    shortLabel: 'Questionner le monde',
    bgHex: '#ECFEFF',
    borderHex: '#A5F3FC',
    textHex: '#164E63',
    accentHex: '#0891B2',
    swatchHex: '#0891B2',
  },
  sciences: {
    id: 'sciences',
    officialLabel: 'Sciences et Technologie',
    shortLabel: 'Sciences & Tech.',
    bgHex: '#F0FDFA',
    borderHex: '#99F6E4',
    textHex: '#134E4A',
    accentHex: '#0D9488',
    swatchHex: '#0D9488',
  },
  histoire_geo: {
    id: 'histoire_geo',
    officialLabel: 'Histoire et Géographie',
    shortLabel: 'Histoire-Géo',
    bgHex: '#FFF7ED',
    borderHex: '#FED7AA',
    textHex: '#7C2D12',
    accentHex: '#EA580C',
    swatchHex: '#EA580C',
  },
  emc: {
    id: 'emc',
    officialLabel: 'Enseignement Moral et Civique (EMC)',
    shortLabel: 'EMC',
    bgHex: '#F0F9FF',
    borderHex: '#BAE6FD',
    textHex: '#0C4A6E',
    accentHex: '#0284C7',
    swatchHex: '#0284C7',
  },
  autres_c1: {
    id: 'autres_c1',
    officialLabel: 'Accueil, routines, autonomie et repos',
    cycle1Label: 'Autres temps (accueil, routines, autonomie, repos, projet)',
    shortLabel: 'Accueil & Repos',
    bgHex: '#F8FAFC',
    borderHex: '#CBD5E1',
    textHex: '#334155',
    accentHex: '#64748B',
    swatchHex: '#64748B',
  },
  catechese: {
    id: 'catechese',
    officialLabel: 'Caractère propre — Catéchèse ou éveil à la foi',
    shortLabel: 'Caractère propre',
    bgHex: '#FAF5FF',
    borderHex: '#E9D5FF',
    textHex: '#581C87',
    accentHex: '#9333EA',
    swatchHex: '#9333EA',
  },
};

export function getDomainLabelForCycle(domainId: DomainId, cycle: CycleId): string {
  const style = DOMAIN_STYLES[domainId];
  if (cycle === 'cycle1' && style.cycle1Label) {
    return style.cycle1Label;
  }
  return style.officialLabel;
}

export const REGULATORY_TARGETS: Record<CycleId, RegulatoryTargetGroup[]> = {
  cycle1: [
    {
      id: 'c1_langage',
      label: 'Mobiliser le langage dans toutes ses dimensions',
      domainIds: ['francais'],
      legalMinutes: 450,
      adjustedMinutes: 450,
      minRecommendedMinutes: 420,
      maxRecommendedMinutes: 480,
      note: '7h à 8h indicatives · Exposition quotidienne à l’oral et à l’écrit',
    },
    {
      id: 'c1_maths',
      label: 'Structurer sa pensée (Mathématiques)',
      domainIds: ['mathematiques'],
      legalMinutes: 270,
      adjustedMinutes: 270,
      minRecommendedMinutes: 240,
      maxRecommendedMinutes: 300,
      note: '4h à 5h indicatives',
    },
    {
      id: 'c1_eps',
      label: 'Activités physiques',
      domainIds: ['eps'],
      legalMinutes: 120,
      adjustedMinutes: 120,
      minRecommendedMinutes: 120,
      maxRecommendedMinutes: 180,
      note: '2h indicatives · 30 min d’activité physique quotidienne recommandées',
    },
    {
      id: 'c1_arts',
      label: 'Activités artistiques (Arts visuels et musique)',
      domainIds: ['artistique'],
      legalMinutes: 120,
      adjustedMinutes: 120,
      minRecommendedMinutes: 100,
      maxRecommendedMinutes: 150,
      note: '2h indicatives',
    },
    {
      id: 'c1_explorer',
      label: 'Explorer le monde',
      domainIds: ['qlm', 'sciences'],
      legalMinutes: 120,
      adjustedMinutes: 120,
      minRecommendedMinutes: 100,
      maxRecommendedMinutes: 150,
      note: '2h indicatives',
    },
    {
      id: 'c1_autres',
      label: 'Autres temps (accueil, routines, autonomie, repos, projet)',
      domainIds: ['autres_c1'],
      legalMinutes: 300,
      adjustedMinutes: 300,
      minRecommendedMinutes: 240,
      maxRecommendedMinutes: 360,
      note: '5h indicatives · Temps de repos selon les besoins des enfants',
    },
  ],
  cycle2: [
    {
      id: 'c2_francais',
      label: 'Français',
      domainIds: ['francais'],
      legalMinutes: 600,
      adjustedMinutes: 550,
      note: 'Inclut les rituels quotidiens de lecture et d’expression orale',
    },
    {
      id: 'c2_maths',
      label: 'Mathématiques',
      domainIds: ['mathematiques'],
      legalMinutes: 300,
      adjustedMinutes: 275,
      note: 'Inclut les rituels quotidiens de calcul mental (5 à 10 min)',
    },
    {
      id: 'c2_langues',
      label: 'Langues vivantes',
      domainIds: ['langues'],
      legalMinutes: 90,
      adjustedMinutes: 82,
    },
    {
      id: 'c2_eps',
      label: 'Éducation Physique et Sportive (EPS)',
      domainIds: ['eps'],
      legalMinutes: 180,
      adjustedMinutes: 165,
      note: 'Assurer des séances effectives en évitant les reports systématiques',
    },
    {
      id: 'c2_arts',
      label: 'Enseignements artistiques',
      domainIds: ['artistique'],
      legalMinutes: 120,
      adjustedMinutes: 110,
      note: 'Arts plastiques / visuels et éducation musicale',
    },
    {
      id: 'c2_qlm_emc',
      label: 'Questionner le monde + EMC',
      domainIds: ['qlm', 'emc'],
      legalMinutes: 150,
      adjustedMinutes: 138,
      note: 'Dont Enseignement Moral et Civique (~30 min légales / ~28 min effectives)',
    },
  ],
  cycle3: [
    {
      id: 'c3_francais',
      label: 'Français',
      domainIds: ['francais'],
      legalMinutes: 480,
      adjustedMinutes: 440,
      note: 'Inclut les rituels quotidiens de lecture et d’expression orale',
    },
    {
      id: 'c3_maths',
      label: 'Mathématiques',
      domainIds: ['mathematiques'],
      legalMinutes: 300,
      adjustedMinutes: 275,
      note: 'Inclut les rituels quotidiens de calcul mental (5 à 10 min)',
    },
    {
      id: 'c3_langues',
      label: 'Langues vivantes',
      domainIds: ['langues'],
      legalMinutes: 90,
      adjustedMinutes: 82,
    },
    {
      id: 'c3_eps',
      label: 'Éducation Physique et Sportive (EPS)',
      domainIds: ['eps'],
      legalMinutes: 180,
      adjustedMinutes: 165,
      note: 'Assurer des séances effectives en évitant les reports systématiques',
    },
    {
      id: 'c3_sciences',
      label: 'Sciences et Technologie',
      domainIds: ['sciences'],
      legalMinutes: 120,
      adjustedMinutes: 110,
    },
    {
      id: 'c3_arts',
      label: 'Enseignements artistiques',
      domainIds: ['artistique'],
      legalMinutes: 120,
      adjustedMinutes: 110,
      note: 'Arts plastiques et éducation musicale',
    },
    {
      id: 'c3_hg_emc',
      label: 'Histoire-Géographie + EMC',
      domainIds: ['histoire_geo', 'emc'],
      legalMinutes: 150,
      adjustedMinutes: 138,
      note: 'Dont Enseignement Moral et Civique (~30 min légales / ~28 min effectives)',
    },
  ],
};

export const PRESET_LABELS: LabelTemplate[] = [
  // Cycle 2 & 3 Français
  {
    id: 'fr_lecture_comp',
    domainId: 'francais',
    title: 'Français — Lecture et compréhension de l’écrit',
    defaultDurationMinutes: 60,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
    hint: 'Séance continue recommandée en matinée (1h)',
  },
  {
    id: 'fr_edl',
    domainId: 'francais',
    title: 'Français — Étude de la langue',
    defaultDurationMinutes: 45,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
    hint: 'Grammaire, orthographe, lexique',
  },
  {
    id: 'fr_ecriture',
    domainId: 'francais',
    title: 'Français — Rédaction et production d’écrits',
    defaultDurationMinutes: 45,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
  },
  {
    id: 'fr_rituel',
    domainId: 'francais',
    title: 'Français — Rituel de lecture et expression orale',
    defaultDurationMinutes: 15,
    nature: 'rituel',
    cycles: ['cycle2', 'cycle3'],
    hint: '10 à 15 min quotidiennes (comptabilisé en Français)',
  },
  {
    id: 'fr_lecture_plaisir',
    domainId: 'francais',
    title: 'Français — Lecture-plaisir (hors évaluation)',
    defaultDurationMinutes: 25,
    nature: 'lecture_plaisir',
    cycles: ['cycle2', 'cycle3'],
    hint: 'Temps hebdomadaire encouragé par le SYNADEC',
  },
  {
    id: 'fr_differenciation',
    domainId: 'francais',
    title: 'Français — Ateliers dirigés / Remédiation',
    defaultDurationMinutes: 20,
    nature: 'differenciation',
    cycles: ['cycle2', 'cycle3'],
    hint: 'Différenciation en petits groupes (15–20 min)',
  },

  // Cycle 1 Langage
  {
    id: 'c1_langage_oral',
    domainId: 'francais',
    title: 'Mobiliser le langage — Langage oral et comptines',
    defaultDurationMinutes: 30,
    nature: 'apprentissage',
    cycles: ['cycle1'],
  },
  {
    id: 'c1_langage_ecrit',
    domainId: 'francais',
    title: 'Mobiliser le langage — Découverte de l’écrit et albums',
    defaultDurationMinutes: 30,
    nature: 'apprentissage',
    cycles: ['cycle1'],
  },
  {
    id: 'c1_rituel_langage',
    domainId: 'francais',
    title: 'Mobiliser le langage — Rituels d’accueil (météo, appel)',
    defaultDurationMinutes: 15,
    nature: 'rituel',
    cycles: ['cycle1'],
  },

  // Mathématiques
  {
    id: 'math_seance',
    domainId: 'mathematiques',
    title: 'Mathématiques — Nombres, calculs et problèmes',
    defaultDurationMinutes: 60,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
    hint: 'Séance continue recommandée sur plage cognitive optimale',
  },
  {
    id: 'math_geom',
    domainId: 'mathematiques',
    title: 'Mathématiques — Espace, géométrie et grandeurs',
    defaultDurationMinutes: 45,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
  },
  {
    id: 'math_calcul_mental',
    domainId: 'mathematiques',
    title: 'Mathématiques — Calcul mental (rituel)',
    defaultDurationMinutes: 10,
    nature: 'rituel',
    cycles: ['cycle2', 'cycle3'],
    hint: '5 à 10 min quotidiennes (comptabilisé en Mathématiques)',
  },
  {
    id: 'math_atelier',
    domainId: 'mathematiques',
    title: 'Mathématiques — Ateliers et remédiation',
    defaultDurationMinutes: 20,
    nature: 'differenciation',
    cycles: ['cycle2', 'cycle3'],
  },
  {
    id: 'c1_maths',
    domainId: 'mathematiques',
    title: 'Structurer sa pensée — Nombres, formes et grandeurs',
    defaultDurationMinutes: 30,
    nature: 'apprentissage',
    cycles: ['cycle1'],
  },

  // Langue vivante
  {
    id: 'lv_seance',
    domainId: 'langues',
    title: 'Langue vivante — Compréhension et expression orale',
    defaultDurationMinutes: 30,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
  },

  // EPS
  {
    id: 'eps_seance',
    domainId: 'eps',
    title: 'Éducation Physique et Sportive (EPS)',
    defaultDurationMinutes: 60,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
    hint: 'Incontournable lié à la disponibilité du gymnase/salle',
  },
  {
    id: 'c1_eps',
    domainId: 'eps',
    title: "Agir et s'exprimer par l'activité physique (Motricité)",
    defaultDurationMinutes: 30,
    nature: 'apprentissage',
    cycles: ['cycle1'],
    hint: '30 min quotidiennes recommandées',
  },

  // Enseignements artistiques
  {
    id: 'art_visuel',
    domainId: 'artistique',
    title: 'Enseignements artistiques — Arts plastiques',
    defaultDurationMinutes: 45,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
  },
  {
    id: 'art_musique',
    domainId: 'artistique',
    title: 'Enseignements artistiques — Éducation musicale',
    defaultDurationMinutes: 30,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
  },
  {
    id: 'c1_arts',
    domainId: 'artistique',
    title: 'Activités artistiques — Arts visuels et musique',
    defaultDurationMinutes: 30,
    nature: 'apprentissage',
    cycles: ['cycle1'],
  },

  // QLM / Sciences / Hist-Géo / EMC
  {
    id: 'qlm_seance',
    domainId: 'qlm',
    title: 'Questionner le monde (temps, espace, vivant)',
    defaultDurationMinutes: 45,
    nature: 'apprentissage',
    cycles: ['cycle2'],
  },
  {
    id: 'c1_explorer',
    domainId: 'qlm',
    title: 'Explorer le monde (vivant, objets, espace, temps)',
    defaultDurationMinutes: 30,
    nature: 'apprentissage',
    cycles: ['cycle1'],
  },
  {
    id: 'sci_seance',
    domainId: 'sciences',
    title: 'Sciences et Technologie',
    defaultDurationMinutes: 55,
    nature: 'apprentissage',
    cycles: ['cycle3'],
  },
  {
    id: 'hg_seance',
    domainId: 'histoire_geo',
    title: 'Histoire et Géographie',
    defaultDurationMinutes: 55,
    nature: 'apprentissage',
    cycles: ['cycle3'],
  },
  {
    id: 'emc_seance',
    domainId: 'emc',
    title: 'Enseignement Moral et Civique (EMC)',
    defaultDurationMinutes: 30,
    nature: 'apprentissage',
    cycles: ['cycle2', 'cycle3'],
  },

  // Autres temps Cycle 1
  {
    id: 'c1_accueil',
    domainId: 'autres_c1',
    title: 'Accueil échelonné, routines et autonomie',
    defaultDurationMinutes: 30,
    nature: 'rituel',
    cycles: ['cycle1'],
  },
  {
    id: 'c1_repos',
    domainId: 'autres_c1',
    title: 'Temps de repos / Temps calme adapté',
    defaultDurationMinutes: 45,
    nature: 'differenciation',
    cycles: ['cycle1'],
  },

  // Caractère propre (école privée catholique uniquement)
  {
    id: 'catechese_1h',
    domainId: 'catechese',
    title: 'Caractère propre — Catéchèse ou éveil à la foi',
    defaultDurationMinutes: 60,
    nature: 'projet',
    cycles: ['cycle1', 'cycle2', 'cycle3'],
    schoolTypes: ['catholique'],
    hint: '1h00 hebdomadaire à positionner en début ou fin de journée',
  },
  {
    id: 'catechese_30m',
    domainId: 'catechese',
    title: 'Caractère propre — Éveil à la foi / Temps pastoral',
    defaultDurationMinutes: 30,
    nature: 'projet',
    cycles: ['cycle1', 'cycle2', 'cycle3'],
    schoolTypes: ['catholique'],
    hint: 'Créneau de 30 min en début ou fin de journée (2 × 30 min = 1h00)',
  },
];

interface VocabularyRule {
  pattern: RegExp;
  termLabel: string;
  requiredKeywords: string[];
  suggestionByDomain: Partial<Record<DomainId, string>>;
  reason: string;
}

const VOCABULARY_RULES: VocabularyRule[] = [
  {
    pattern: /\b(sport|gym|gymnastique|piscine|foot|athlé)\b/i,
    termLabel: 'Sport / Gym',
    requiredKeywords: ['eps', 'éducation physique', 'activité physique'],
    suggestionByDomain: {
      eps: 'Éducation Physique et Sportive (EPS)',
    },
    reason:
      "L'appellation réglementaire attendue au BOEN est « Éducation Physique et Sportive (EPS) » (ou « Activités physiques » en Cycle 1).",
  },
  {
    pattern: /\b(dessin|coloriage|bricolage|peinture|arts? visuels?|chant)\b/i,
    termLabel: 'Dessin / Coloriage / Chant',
    requiredKeywords: ['enseignements artistiques', 'activités artistiques', 'arts plastiques', 'éducation musicale'],
    suggestionByDomain: {
      artistique: 'Enseignements artistiques — Arts plastiques et éducation musicale',
    },
    reason:
      "Le terme doit relever de l'intitulé officiel « Enseignements artistiques » (Arts plastiques / Éducation musicale).",
  },
  {
    pattern: /\b(anglais|allemand|espagnol|italien|breton|occitan)\b/i,
    termLabel: 'Nom de langue seul',
    requiredKeywords: ['langue vivante', 'langues vivantes'],
    suggestionByDomain: {
      langues: 'Langue vivante — Anglais',
    },
    reason:
      "Précisez l'appellation réglementaire « Langue vivante » avant la langue enseignée (ex. « Langue vivante — Anglais »).",
  },
  {
    pattern: /\b(morale|civisme|instruction civique|éducation civique)\b/i,
    termLabel: 'Instruction/Morale',
    requiredKeywords: ['emc', 'moral et civique'],
    suggestionByDomain: {
      emc: 'Enseignement Moral et Civique (EMC)',
    },
    reason:
      "L'intitulé officiel en vigueur est « Enseignement Moral et Civique (EMC) ».",
  },
  {
    pattern: /\b(découverte du monde|éveil|sciences nat)\b/i,
    termLabel: 'Découverte du monde / Éveil',
    requiredKeywords: ['questionner le monde', 'explorer le monde', 'sciences et technologie'],
    suggestionByDomain: {
      qlm: 'Questionner le monde',
      sciences: 'Sciences et Technologie',
    },
    reason:
      "Utilisez « Questionner le monde » (Cycle 2), « Explorer le monde » (Cycle 1) ou « Sciences et Technologie » (Cycle 3).",
  },
  {
    pattern: /\b(caté|catéchisme|religion)\b/i,
    termLabel: 'Caté / Catéchisme',
    requiredKeywords: ['catéchèse', 'éveil à la foi', 'caractère propre'],
    suggestionByDomain: {
      catechese: 'Caractère propre — Catéchèse ou éveil à la foi',
    },
    reason:
      "Employez l'appellation retenue par le cadre officiel : « Caractère propre — Catéchèse ou éveil à la foi ».",
  },
  {
    pattern: /\b(atelier|autonomie|jeux|plan de travail)\b/i,
    termLabel: 'Atelier / Jeux sans domaine',
    requiredKeywords: [
      'français',
      'mathématiques',
      'langue',
      'eps',
      'artistique',
      'questionner',
      'sciences',
      'histoire',
      'géographie',
      'emc',
      'langage',
      'structurer',
      'explorer',
      'accueil',
    ],
    suggestionByDomain: {
      francais: 'Français — Ateliers dirigés / Remédiation',
      mathematiques: 'Mathématiques — Ateliers et remédiation',
      autres_c1: 'Accueil, routines et autonomie',
    },
    reason:
      'Chaque domaine doit être explicitement identifiable dans l’emploi du temps, même lors d’un travail en ateliers ou en autonomie.',
  },
];

export function evaluateBlockVocabulary(
  block: ScheduledBlock,
  cycle: CycleId
): VocabularyIssue | null {
  const title = block.title.trim();
  const normalized = title.toLowerCase();

  if (title.length < 3) {
    return {
      blockId: block.id,
      day: block.day,
      startMinutes: block.startMinutes,
      currentTitle: block.title,
      domainId: block.domainId,
      detectedTerm: 'Intitulé trop court',
      suggestedTitle: getDomainLabelForCycle(block.domainId, cycle),
      reason: 'Indiquez un intitulé complet mentionnant le domaine réglementaire.',
    };
  }

  // Check if user wrote an informal or outdated term without the official domain keyword
  for (const rule of VOCABULARY_RULES) {
    if (rule.pattern.test(normalized)) {
      const hasOfficialKeyword = rule.requiredKeywords.some((kw) => normalized.includes(kw));
      if (!hasOfficialKeyword) {
        return {
          blockId: block.id,
          day: block.day,
          startMinutes: block.startMinutes,
          currentTitle: block.title,
          domainId: block.domainId,
          detectedTerm: rule.termLabel,
          suggestedTitle:
            rule.suggestionByDomain[block.domainId] ||
            `${getDomainLabelForCycle(block.domainId, cycle)} — ${title}`,
          reason: rule.reason,
        };
      }
    }
  }

  // Also check if an unprefixed shorthand like "Maths", "Dictée", "Géo", "Poésie", "Grammaire" omits the domain name
  const shorthandPatterns: Array<{ regex: RegExp; domain: DomainId; label: string }> = [
    { regex: /\b(maths)\b/i, domain: 'mathematiques', label: 'Abréviation « Maths »' },
    { regex: /\b(géo)\b/i, domain: 'histoire_geo', label: 'Abréviation « Géo »' },
    { regex: /\b(hist-géo|histo)\b/i, domain: 'histoire_geo', label: 'Abréviation « Hist-Géo »' },
    { regex: /\b(qlm)\b/i, domain: 'qlm', label: 'Sigle « QLM » seul' },
  ];

  for (const sp of shorthandPatterns) {
    if (sp.regex.test(normalized)) {
      const official = getDomainLabelForCycle(block.domainId, cycle);
      if (!normalized.includes(official.toLowerCase())) {
        return {
          blockId: block.id,
          day: block.day,
          startMinutes: block.startMinutes,
          currentTitle: block.title,
          domainId: block.domainId,
          detectedTerm: sp.label,
          suggestedTitle: `${official} — ${title.replace(sp.regex, '').replace(/^[\s—:-]+/, '').trim() || 'Séance'}`,
          reason: `Remplacez les abréviations informelles par l'intitulé réglementaire complet (« ${official} »).`,
        };
      }
    }
  }

  return null;
}

export function createDefaultSettings(
  cycle: CycleId = 'cycle2',
  schoolType: 'publique' | 'catholique' = 'publique',
  hasChosenSchoolType = false
): SchoolSettings {
  const createDay = (enabled: boolean, morningOnly = false) => ({
    enabled,
    morning: {
      enabled: true,
      startMinutes: 8 * 60 + 30, // 08h30
      endMinutes: 11 * 60 + 45, // 11h45
      recessEnabled: true,
      recessStartMinutes: 10 * 60, // 10h00
      recessDurationMinutes: cycle === 'cycle1' ? 30 : 15,
    },
    afternoon: {
      enabled: !morningOnly,
      startMinutes: 13 * 60 + 30, // 13h30
      endMinutes: 16 * 60 + 15, // 16h15
      recessEnabled: true,
      recessStartMinutes: 15 * 60, // 15h00
      recessDurationMinutes: cycle === 'cycle1' ? 30 : 15,
    },
  });

  const levelMap: Record<CycleId, string> = {
    cycle1: 'PS / MS / GS',
    cycle2: 'CE1–CE2',
    cycle3: 'CM1–CM2',
  };

  const days = {
    lundi: createDay(true),
    mardi: createDay(true),
    mercredi: createDay(false, true),
    jeudi: createDay(true),
    vendredi: createDay(true),
  };

  if (schoolType === 'catholique') {
    // 1h00 de caractère propre positionnée en fin de journée le vendredi (16h15–17h15)
    days.vendredi.afternoon.endMinutes = 17 * 60 + 15;
  }

  return {
    schoolType,
    hasChosenSchoolType,
    schoolName:
      schoolType === 'catholique'
        ? 'École Privée Catholique Sainte-Marie'
        : 'École Publique Saint-Exupéry',
    teacherName: 'Claire Moreau',
    classLevel: levelMap[cycle],
    schoolYear: '2026–2027',
    cycle,
    weekType: '4days',
    days,
  };
}

let sampleCounter = 1;
const uid = (prefix: string) => `${prefix}_${sampleCounter++}`;

export function createCompliantSampleBlocks(cycle: CycleId): ScheduledBlock[] {
  sampleCounter = 1;

  if (cycle === 'cycle1') {
    const blocks: ScheduledBlock[] = [];
    const days = ['lundi', 'mardi', 'jeudi', 'vendredi'] as const;
    for (const day of days) {
      blocks.push(
        {
          id: uid('c1'),
          day,
          startMinutes: 8 * 60 + 30,
          durationMinutes: 30,
          domainId: 'autres_c1',
          title: 'Accueil échelonné, routines et autonomie',
          nature: 'rituel',
        },
        {
          id: uid('c1'),
          day,
          startMinutes: 9 * 60,
          durationMinutes: 30,
          domainId: 'francais',
          title: 'Mobiliser le langage — Langage oral et comptines',
          nature: 'apprentissage',
        },
        {
          id: uid('c1'),
          day,
          startMinutes: 9 * 60 + 30,
          durationMinutes: 30,
          domainId: 'eps',
          title: "Agir et s'exprimer par l'activité physique (Motricité)",
          nature: 'apprentissage',
        },
        // Recess 10h00 - 10h30
        {
          id: uid('c1'),
          day,
          startMinutes: 10 * 60 + 30,
          durationMinutes: 45,
          domainId: 'mathematiques',
          title: 'Structurer sa pensée — Nombres, formes et grandeurs',
          nature: 'apprentissage',
        },
        {
          id: uid('c1'),
          day,
          startMinutes: 11 * 60 + 15,
          durationMinutes: 30,
          domainId: 'francais',
          title: 'Mobiliser le langage — Découverte de l’écrit et albums',
          nature: 'lecture_plaisir',
        },
        // Afternoon 13h30 - 15h00, Recess 15h00 - 15h30, 15h30 - 16h15
        {
          id: uid('c1'),
          day,
          startMinutes: 13 * 60 + 30,
          durationMinutes: 45,
          domainId: 'autres_c1',
          title: 'Temps de repos / Temps calme adapté',
          nature: 'differenciation',
        },
        {
          id: uid('c1'),
          day,
          startMinutes: 14 * 60 + 15,
          durationMinutes: 45,
          domainId: day === 'lundi' || day === 'jeudi' ? 'artistique' : 'qlm',
          title:
            day === 'lundi' || day === 'jeudi'
              ? 'Activités artistiques — Arts visuels et musique'
              : 'Explorer le monde (vivant, objets, espace, temps)',
          nature: 'apprentissage',
        },
        {
          id: uid('c1'),
          day,
          startMinutes: 15 * 60 + 30,
          durationMinutes: 45,
          domainId: 'francais',
          title: 'Mobiliser le langage — Ateliers dirigés et langage oral',
          nature: 'differenciation',
        }
      );
    }
    return blocks;
  }

  if (cycle === 'cycle3') {
    return [
      // LUNDI (Morning 08:30-10:00, 10:15-11:45; Afternoon 13:30-15:00, 15:15-16:15)
      {
        id: uid('c3'),
        day: 'lundi',
        startMinutes: 8 * 60 + 30,
        durationMinutes: 10,
        domainId: 'mathematiques',
        title: 'Mathématiques — Calcul mental (rituel)',
        nature: 'rituel',
      },
      {
        id: uid('c3'),
        day: 'lundi',
        startMinutes: 8 * 60 + 40,
        durationMinutes: 15,
        domainId: 'francais',
        title: 'Français — Rituel de lecture et expression orale',
        nature: 'rituel',
      },
      {
        id: uid('c3'),
        day: 'lundi',
        startMinutes: 8 * 60 + 55,
        durationMinutes: 65,
        domainId: 'francais',
        title: 'Français — Lecture et compréhension de l’écrit',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'lundi',
        startMinutes: 10 * 60 + 15,
        durationMinutes: 60,
        domainId: 'mathematiques',
        title: 'Mathématiques — Nombres, calculs et problèmes',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'lundi',
        startMinutes: 11 * 60 + 15,
        durationMinutes: 30,
        domainId: 'francais',
        title: 'Français — Étude de la langue',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'lundi',
        startMinutes: 13 * 60 + 30,
        durationMinutes: 55,
        domainId: 'histoire_geo',
        title: 'Histoire et Géographie',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'lundi',
        startMinutes: 14 * 60 + 25,
        durationMinutes: 35,
        domainId: 'langues',
        title: 'Langue vivante — Compréhension et expression orale',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'lundi',
        startMinutes: 15 * 60 + 15,
        durationMinutes: 60,
        domainId: 'eps',
        title: 'Éducation Physique et Sportive (EPS)',
        nature: 'apprentissage',
      },

      // MARDI
      {
        id: uid('c3'),
        day: 'mardi',
        startMinutes: 8 * 60 + 30,
        durationMinutes: 10,
        domainId: 'mathematiques',
        title: 'Mathématiques — Calcul mental (rituel)',
        nature: 'rituel',
      },
      {
        id: uid('c3'),
        day: 'mardi',
        startMinutes: 8 * 60 + 40,
        durationMinutes: 15,
        domainId: 'francais',
        title: 'Français — Rituel de lecture et expression orale',
        nature: 'rituel',
      },
      {
        id: uid('c3'),
        day: 'mardi',
        startMinutes: 8 * 60 + 55,
        durationMinutes: 65,
        domainId: 'francais',
        title: 'Français — Rédaction et production d’écrits',
        secondaryDomainId: 'histoire_geo',
        title2: undefined,
        nature: 'projet',
        notes: 'Point d’intégration : écriture documentaire liée à l’Histoire',
      } as ScheduledBlock,
      {
        id: uid('c3'),
        day: 'mardi',
        startMinutes: 10 * 60 + 15,
        durationMinutes: 60,
        domainId: 'mathematiques',
        title: 'Mathématiques — Nombres, calculs et problèmes',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'mardi',
        startMinutes: 11 * 60 + 15,
        durationMinutes: 30,
        domainId: 'francais',
        title: 'Français — Étude de la langue',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'mardi',
        startMinutes: 13 * 60 + 30,
        durationMinutes: 55,
        domainId: 'sciences',
        title: 'Sciences et Technologie',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'mardi',
        startMinutes: 14 * 60 + 25,
        durationMinutes: 35,
        domainId: 'artistique',
        title: 'Enseignements artistiques — Éducation musicale',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'mardi',
        startMinutes: 15 * 60 + 15,
        durationMinutes: 30,
        domainId: 'emc',
        title: 'Enseignement Moral et Civique (EMC)',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'mardi',
        startMinutes: 15 * 60 + 45,
        durationMinutes: 30,
        domainId: 'francais',
        title: 'Français — Ateliers dirigés / Remédiation',
        nature: 'differenciation',
      },

      // JEUDI
      {
        id: uid('c3'),
        day: 'jeudi',
        startMinutes: 8 * 60 + 30,
        durationMinutes: 10,
        domainId: 'mathematiques',
        title: 'Mathématiques — Calcul mental (rituel)',
        nature: 'rituel',
      },
      {
        id: uid('c3'),
        day: 'jeudi',
        startMinutes: 8 * 60 + 40,
        durationMinutes: 15,
        domainId: 'francais',
        title: 'Français — Rituel de lecture et expression orale',
        nature: 'rituel',
      },
      {
        id: uid('c3'),
        day: 'jeudi',
        startMinutes: 8 * 60 + 55,
        durationMinutes: 65,
        domainId: 'francais',
        title: 'Français — Lecture et compréhension de l’écrit',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'jeudi',
        startMinutes: 10 * 60 + 15,
        durationMinutes: 60,
        domainId: 'mathematiques',
        title: 'Mathématiques — Espace, géométrie et grandeurs',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'jeudi',
        startMinutes: 11 * 60 + 15,
        durationMinutes: 30,
        domainId: 'francais',
        title: 'Français — Étude de la langue',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'jeudi',
        startMinutes: 13 * 60 + 30,
        durationMinutes: 55,
        domainId: 'histoire_geo',
        title: 'Histoire et Géographie',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'jeudi',
        startMinutes: 14 * 60 + 25,
        durationMinutes: 35,
        domainId: 'francais',
        title: 'Français — Lecture-plaisir (hors évaluation)',
        nature: 'lecture_plaisir',
      },
      {
        id: uid('c3'),
        day: 'jeudi',
        startMinutes: 15 * 60 + 15,
        durationMinutes: 60,
        domainId: 'eps',
        title: 'Éducation Physique et Sportive (EPS)',
        nature: 'apprentissage',
      },

      // VENDREDI
      {
        id: uid('c3'),
        day: 'vendredi',
        startMinutes: 8 * 60 + 30,
        durationMinutes: 10,
        domainId: 'mathematiques',
        title: 'Mathématiques — Calcul mental (rituel)',
        nature: 'rituel',
      },
      {
        id: uid('c3'),
        day: 'vendredi',
        startMinutes: 8 * 60 + 40,
        durationMinutes: 15,
        domainId: 'francais',
        title: 'Français — Rituel de lecture et expression orale',
        nature: 'rituel',
      },
      {
        id: uid('c3'),
        day: 'vendredi',
        startMinutes: 8 * 60 + 55,
        durationMinutes: 65,
        domainId: 'francais',
        title: 'Français — Étude de la langue et rédaction',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'vendredi',
        startMinutes: 10 * 60 + 15,
        durationMinutes: 55,
        domainId: 'mathematiques',
        title: 'Mathématiques — Nombres, calculs et problèmes',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'vendredi',
        startMinutes: 11 * 60 + 10,
        durationMinutes: 35,
        domainId: 'artistique',
        title: 'Enseignements artistiques — Arts plastiques',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'vendredi',
        startMinutes: 13 * 60 + 30,
        durationMinutes: 55,
        domainId: 'sciences',
        title: 'Sciences et Technologie',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'vendredi',
        startMinutes: 14 * 60 + 25,
        durationMinutes: 35,
        domainId: 'artistique',
        title: 'Enseignements artistiques — Arts plastiques',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'vendredi',
        startMinutes: 15 * 60 + 15,
        durationMinutes: 45,
        domainId: 'langues',
        title: 'Langue vivante — Compréhension et expression orale',
        nature: 'apprentissage',
      },
      {
        id: uid('c3'),
        day: 'vendredi',
        startMinutes: 16 * 60,
        durationMinutes: 15,
        domainId: 'eps',
        title: 'Éducation Physique et Sportive (EPS) — Jeux collectifs',
        nature: 'apprentissage',
      },
    ];
  }

  // CYCLE 2 (exact 1320 min = 22h00: Français 550, Maths 275, EPS 165, Arts 110, QLM+EMC 140, Langues 80)
  return [
    // LUNDI
    {
      id: uid('c2'),
      day: 'lundi',
      startMinutes: 8 * 60 + 30,
      durationMinutes: 10,
      domainId: 'mathematiques',
      title: 'Mathématiques — Calcul mental (rituel)',
      nature: 'rituel',
    },
    {
      id: uid('c2'),
      day: 'lundi',
      startMinutes: 8 * 60 + 40,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Rituel de lecture et expression orale',
      nature: 'rituel',
    },
    {
      id: uid('c2'),
      day: 'lundi',
      startMinutes: 8 * 60 + 55,
      durationMinutes: 65,
      domainId: 'francais',
      title: 'Français — Lecture et compréhension de l’écrit',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'lundi',
      startMinutes: 10 * 60 + 15,
      durationMinutes: 60,
      domainId: 'mathematiques',
      title: 'Mathématiques — Nombres, calculs et problèmes',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'lundi',
      startMinutes: 11 * 60 + 15,
      durationMinutes: 30,
      domainId: 'francais',
      title: 'Français — Étude de la langue',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'lundi',
      startMinutes: 13 * 60 + 30,
      durationMinutes: 45,
      domainId: 'francais',
      title: 'Français — Rédaction et production d’écrits',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'lundi',
      startMinutes: 14 * 60 + 15,
      durationMinutes: 45,
      domainId: 'qlm',
      title: 'Questionner le monde (temps, espace, vivant)',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'lundi',
      startMinutes: 15 * 60 + 15,
      durationMinutes: 60,
      domainId: 'eps',
      title: 'Éducation Physique et Sportive (EPS)',
      nature: 'apprentissage',
    },

    // MARDI
    {
      id: uid('c2'),
      day: 'mardi',
      startMinutes: 8 * 60 + 30,
      durationMinutes: 10,
      domainId: 'mathematiques',
      title: 'Mathématiques — Calcul mental (rituel)',
      nature: 'rituel',
    },
    {
      id: uid('c2'),
      day: 'mardi',
      startMinutes: 8 * 60 + 40,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Rituel de lecture et expression orale',
      nature: 'rituel',
    },
    {
      id: uid('c2'),
      day: 'mardi',
      startMinutes: 8 * 60 + 55,
      durationMinutes: 65,
      domainId: 'francais',
      title: 'Français — Lecture et compréhension de l’écrit',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'mardi',
      startMinutes: 10 * 60 + 15,
      durationMinutes: 60,
      domainId: 'mathematiques',
      title: 'Mathématiques — Nombres, calculs et problèmes',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'mardi',
      startMinutes: 11 * 60 + 15,
      durationMinutes: 30,
      domainId: 'francais',
      title: 'Français — Étude de la langue',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'mardi',
      startMinutes: 13 * 60 + 30,
      durationMinutes: 30,
      domainId: 'francais',
      title: 'Français — Ateliers dirigés / Remédiation',
      nature: 'differenciation',
    },
    {
      id: uid('c2'),
      day: 'mardi',
      startMinutes: 14 * 60,
      durationMinutes: 60,
      domainId: 'eps',
      title: 'Éducation Physique et Sportive (EPS)',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'mardi',
      startMinutes: 15 * 60 + 15,
      durationMinutes: 30,
      domainId: 'langues',
      title: 'Langue vivante — Compréhension et expression orale',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'mardi',
      startMinutes: 15 * 60 + 45,
      durationMinutes: 30,
      domainId: 'emc',
      title: 'Enseignement Moral et Civique (EMC)',
      nature: 'apprentissage',
    },

    // JEUDI
    {
      id: uid('c2'),
      day: 'jeudi',
      startMinutes: 8 * 60 + 30,
      durationMinutes: 10,
      domainId: 'mathematiques',
      title: 'Mathématiques — Calcul mental (rituel)',
      nature: 'rituel',
    },
    {
      id: uid('c2'),
      day: 'jeudi',
      startMinutes: 8 * 60 + 40,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Rituel de lecture et expression orale',
      nature: 'rituel',
    },
    {
      id: uid('c2'),
      day: 'jeudi',
      startMinutes: 8 * 60 + 55,
      durationMinutes: 65,
      domainId: 'francais',
      title: 'Français — Lecture et compréhension de l’écrit',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'jeudi',
      startMinutes: 10 * 60 + 15,
      durationMinutes: 60,
      domainId: 'mathematiques',
      title: 'Mathématiques — Espace, géométrie et grandeurs',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'jeudi',
      startMinutes: 11 * 60 + 15,
      durationMinutes: 30,
      domainId: 'francais',
      title: 'Français — Étude de la langue',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'jeudi',
      startMinutes: 13 * 60 + 30,
      durationMinutes: 30,
      domainId: 'francais',
      title: 'Français — Lecture-plaisir (hors évaluation)',
      nature: 'lecture_plaisir',
    },
    {
      id: uid('c2'),
      day: 'jeudi',
      startMinutes: 14 * 60,
      durationMinutes: 60,
      domainId: 'qlm',
      title: 'Questionner le monde — Lecture documentaire',
      secondaryDomainId: 'francais',
      nature: 'projet',
    },
    {
      id: uid('c2'),
      day: 'jeudi',
      startMinutes: 15 * 60 + 15,
      durationMinutes: 60,
      domainId: 'artistique',
      title: 'Enseignements artistiques — Arts plastiques',
      nature: 'apprentissage',
    },

    // VENDREDI
    {
      id: uid('c2'),
      day: 'vendredi',
      startMinutes: 8 * 60 + 30,
      durationMinutes: 10,
      domainId: 'mathematiques',
      title: 'Mathématiques — Calcul mental (rituel)',
      nature: 'rituel',
    },
    {
      id: uid('c2'),
      day: 'vendredi',
      startMinutes: 8 * 60 + 40,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Rituel de lecture et expression orale',
      nature: 'rituel',
    },
    {
      id: uid('c2'),
      day: 'vendredi',
      startMinutes: 8 * 60 + 55,
      durationMinutes: 65,
      domainId: 'francais',
      title: 'Français — Lecture et compréhension de l’écrit',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'vendredi',
      startMinutes: 10 * 60 + 15,
      durationMinutes: 55,
      domainId: 'mathematiques',
      title: 'Mathématiques — Nombres, calculs et problèmes',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'vendredi',
      startMinutes: 11 * 60 + 10,
      durationMinutes: 35,
      domainId: 'francais',
      title: 'Français — Étude de la langue',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'vendredi',
      startMinutes: 13 * 60 + 30,
      durationMinutes: 45,
      domainId: 'eps',
      title: 'Éducation Physique et Sportive (EPS)',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'vendredi',
      startMinutes: 14 * 60 + 15,
      durationMinutes: 45,
      domainId: 'artistique',
      title: 'Enseignements artistiques — Éducation musicale',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'vendredi',
      startMinutes: 15 * 60 + 15,
      durationMinutes: 50,
      domainId: 'langues',
      title: 'Langue vivante — Compréhension et expression orale',
      nature: 'apprentissage',
    },
    {
      id: uid('c2'),
      day: 'vendredi',
      startMinutes: 16 * 60 + 5,
      durationMinutes: 10,
      domainId: 'qlm',
      title: 'Questionner le monde — Bilan de la semaine',
      nature: 'rituel',
    },
  ];
}
