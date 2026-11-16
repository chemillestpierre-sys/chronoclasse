import { ScheduledBlock, SchoolSettings, SchoolType, TimetableTemplateModel } from '../types/timetable';
import { createCompliantSampleBlocks, createDefaultSettings } from './regulations';

function withCatholiqueHour(
  settings: SchoolSettings,
  blocks: ScheduledBlock[],
  schoolType: SchoolType
): { settings: SchoolSettings; blocks: ScheduledBlock[] } {
  if (schoolType !== 'catholique') {
    return { settings, blocks };
  }

  // Positionner 1h00 de caractère propre en fin de journée le vendredi (16h15–17h15)
  // afin de permettre aux élèves non participants de partir plus tôt (règle SYNADEC §6).
  const nextSettings: SchoolSettings = {
    ...settings,
    schoolType: 'catholique',
    hasChosenSchoolType: true,
    days: {
      ...settings.days,
      vendredi: {
        ...settings.days.vendredi,
        afternoon: {
          ...settings.days.vendredi.afternoon,
          endMinutes: 17 * 60 + 15,
        },
      },
    },
  };

  const catecheseBlock: ScheduledBlock = {
    id: `cath_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    day: 'vendredi',
    startMinutes: 16 * 60 + 15,
    durationMinutes: 60,
    domainId: 'catechese',
    title: 'Caractère propre — Catéchèse ou éveil à la foi',
    nature: 'projet',
    notes: '1h00 en fin de journée (départ anticipé possible pour les élèves non participants)',
  };

  return {
    settings: nextSettings,
    blocks: [...blocks, catecheseBlock],
  };
}

function buildCycle1Settings(
  level: string,
  schoolType: SchoolType
): SchoolSettings {
  const base = createDefaultSettings('cycle1', schoolType, true);
  // Maternelle : 30 min récréation matin (10h00–10h30) et 15 min après-midi (15h00–15h15)
  (['lundi', 'mardi', 'jeudi', 'vendredi'] as const).forEach((d) => {
    base.days[d].morning.recessDurationMinutes = 30;
    base.days[d].afternoon.recessDurationMinutes = 15;
    base.days[d].afternoon.endMinutes = 16 * 60 + 15;
  });
  base.classLevel = level;
  return base;
}

function createPsMsBlocks(): ScheduledBlock[] {
  let i = 1;
  const id = () => `psms_${i++}`;
  const blocks: ScheduledBlock[] = [];
  const days = ['lundi', 'mardi', 'jeudi', 'vendredi'] as const;

  for (const day of days) {
    const isArtsDay = day === 'lundi' || day === 'jeudi';
    blocks.push(
      {
        id: id(),
        day,
        startMinutes: 8 * 60 + 30,
        durationMinutes: 30,
        domainId: 'autres_c1',
        title: 'Accueil échelonné, rituels d’appel et météo',
        nature: 'rituel',
      },
      {
        id: id(),
        day,
        startMinutes: 9 * 60,
        durationMinutes: 30,
        domainId: 'eps',
        title: "Agir et s'exprimer par l'activité physique (Motricité)",
        nature: 'apprentissage',
      },
      {
        id: id(),
        day,
        startMinutes: 9 * 60 + 30,
        durationMinutes: 30,
        domainId: 'francais',
        title: 'Mobiliser le langage — Langage oral et comptines',
        nature: 'apprentissage',
      },
      // Récréation 10h00–10h30
      {
        id: id(),
        day,
        startMinutes: 10 * 60 + 30,
        durationMinutes: 45,
        domainId: 'francais',
        title: 'Mobiliser le langage — Ateliers de langage et album',
        nature: 'differenciation',
      },
      {
        id: id(),
        day,
        startMinutes: 11 * 60 + 15,
        durationMinutes: 30,
        domainId: 'mathematiques',
        title: 'Structurer sa pensée — Nombres, formes et tri',
        nature: 'apprentissage',
      },
      // Après-midi 13h30–16h15 (récré 15h00–15h15)
      {
        id: id(),
        day,
        startMinutes: 13 * 60 + 30,
        durationMinutes: 40,
        domainId: 'autres_c1',
        title: 'Temps de repos / Sieste adaptée et lever échelonné',
        nature: 'differenciation',
      },
      {
        id: id(),
        day,
        startMinutes: 14 * 60 + 10,
        durationMinutes: 50,
        domainId: isArtsDay ? 'artistique' : 'qlm',
        title: isArtsDay
          ? 'Activités artistiques — Arts visuels et éveil musical'
          : 'Explorer le monde (vivant, matière, objets)',
        nature: 'apprentissage',
      },
      {
        id: id(),
        day,
        startMinutes: 15 * 60 + 15,
        durationMinutes: 30,
        domainId: 'mathematiques',
        title: 'Structurer sa pensée — Jeux logiques et grandeurs',
        nature: 'apprentissage',
      },
      {
        id: id(),
        day,
        startMinutes: 15 * 60 + 45,
        durationMinutes: 30,
        domainId: 'francais',
        title: 'Mobiliser le langage — Lecture offerte et bilan du jour',
        nature: 'lecture_plaisir',
      }
    );
  }
  return blocks;
}

function createGsBlocks(): ScheduledBlock[] {
  let i = 1;
  const id = () => `gs_${i++}`;
  const blocks: ScheduledBlock[] = [];
  const days = ['lundi', 'mardi', 'jeudi', 'vendredi'] as const;

  for (const day of days) {
    const isExplorerDay = day === 'lundi' || day === 'jeudi';
    blocks.push(
      {
        id: id(),
        day,
        startMinutes: 8 * 60 + 30,
        durationMinutes: 30,
        domainId: 'autres_c1',
        title: 'Accueil, rituels de date, appel et autonomie',
        nature: 'rituel',
      },
      {
        id: id(),
        day,
        startMinutes: 9 * 60,
        durationMinutes: 30,
        domainId: 'francais',
        title: 'Mobiliser le langage — Conscience phonologique et oral',
        nature: 'apprentissage',
      },
      {
        id: id(),
        day,
        startMinutes: 9 * 60 + 30,
        durationMinutes: 30,
        domainId: 'eps',
        title: "Agir et s'exprimer par l'activité physique (Motricité)",
        nature: 'apprentissage',
      },
      // Récréation 10h00–10h30
      {
        id: id(),
        day,
        startMinutes: 10 * 60 + 30,
        durationMinutes: 45,
        domainId: 'francais',
        title: 'Mobiliser le langage — Découverte de l’écrit et graphisme',
        nature: 'apprentissage',
      },
      {
        id: id(),
        day,
        startMinutes: 11 * 60 + 15,
        durationMinutes: 30,
        domainId: 'mathematiques',
        title: 'Structurer sa pensée — Construction du nombre',
        nature: 'apprentissage',
      },
      // Après-midi 13h30–16h15
      {
        id: id(),
        day,
        startMinutes: 13 * 60 + 30,
        durationMinutes: 30,
        domainId: 'autres_c1',
        title: 'Temps calme, repos et relaxation guidée',
        nature: 'differenciation',
      },
      {
        id: id(),
        day,
        startMinutes: 14 * 60,
        durationMinutes: 35,
        domainId: 'mathematiques',
        title: 'Structurer sa pensée — Formes, grandeurs et problèmes',
        nature: 'apprentissage',
      },
      {
        id: id(),
        day,
        startMinutes: 14 * 60 + 35,
        durationMinutes: 25,
        domainId: isExplorerDay ? 'qlm' : 'artistique',
        title: isExplorerDay
          ? 'Explorer le monde — Se repérer dans le temps et l’espace'
          : 'Activités artistiques — Éducation musicale et chant',
        nature: 'apprentissage',
      },
      // Récréation 15h00–15h15
      {
        id: id(),
        day,
        startMinutes: 15 * 60 + 15,
        durationMinutes: 30,
        domainId: isExplorerDay ? 'qlm' : 'artistique',
        title: isExplorerDay
          ? 'Explorer le monde — Le vivant et les objets'
          : 'Activités artistiques — Arts visuels',
        nature: 'apprentissage',
      },
      {
        id: id(),
        day,
        startMinutes: 15 * 60 + 45,
        durationMinutes: 30,
        domainId: 'francais',
        title: 'Mobiliser le langage — Compréhension d’albums et oral',
        nature: 'lecture_plaisir',
      }
    );
  }
  return blocks;
}

function createCpBlocks(): ScheduledBlock[] {
  let i = 1;
  const id = () => `cp_${i++}`;
  // Cycle 2 exact 1320m: Français 550m, Maths 275m, EPS 165m, Arts 110m, QLM+EMC 140m, Langues 80m
  return [
    // LUNDI
    {
      id: id(),
      day: 'lundi',
      startMinutes: 8 * 60 + 30,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Rituel de lecture et phonologie',
      nature: 'rituel',
    },
    {
      id: id(),
      day: 'lundi',
      startMinutes: 8 * 60 + 45,
      durationMinutes: 60,
      domainId: 'francais',
      title: 'Français — Décodage, lecture et encodage',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'lundi',
      startMinutes: 9 * 60 + 45,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Écriture et geste graphique',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'lundi',
      startMinutes: 10 * 60 + 15,
      durationMinutes: 10,
      domainId: 'mathematiques',
      title: 'Mathématiques — Calcul mental (rituel)',
      nature: 'rituel',
    },
    {
      id: id(),
      day: 'lundi',
      startMinutes: 10 * 60 + 25,
      durationMinutes: 55,
      domainId: 'mathematiques',
      title: 'Mathématiques — Nombres et calculs',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'lundi',
      startMinutes: 11 * 60 + 20,
      durationMinutes: 25,
      domainId: 'francais',
      title: 'Français — Compréhension de l’oral et lexique',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'lundi',
      startMinutes: 13 * 60 + 30,
      durationMinutes: 45,
      domainId: 'francais',
      title: 'Français — Relecture et fluence (ateliers)',
      nature: 'differenciation',
    },
    {
      id: id(),
      day: 'lundi',
      startMinutes: 14 * 60 + 15,
      durationMinutes: 45,
      domainId: 'qlm',
      title: 'Questionner le monde (temps, espace, vivant)',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'lundi',
      startMinutes: 15 * 60 + 15,
      durationMinutes: 60,
      domainId: 'eps',
      title: 'Éducation Physique et Sportive (EPS)',
      nature: 'apprentissage',
    },

    // MARDI
    {
      id: id(),
      day: 'mardi',
      startMinutes: 8 * 60 + 30,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Rituel de lecture et phonologie',
      nature: 'rituel',
    },
    {
      id: id(),
      day: 'mardi',
      startMinutes: 8 * 60 + 45,
      durationMinutes: 60,
      domainId: 'francais',
      title: 'Français — Décodage, lecture et encodage',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'mardi',
      startMinutes: 9 * 60 + 45,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Copie et écriture',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'mardi',
      startMinutes: 10 * 60 + 15,
      durationMinutes: 10,
      domainId: 'mathematiques',
      title: 'Mathématiques — Calcul mental (rituel)',
      nature: 'rituel',
    },
    {
      id: id(),
      day: 'mardi',
      startMinutes: 10 * 60 + 25,
      durationMinutes: 55,
      domainId: 'mathematiques',
      title: 'Mathématiques — Résolution de problèmes et calculs',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'mardi',
      startMinutes: 11 * 60 + 20,
      durationMinutes: 25,
      domainId: 'francais',
      title: 'Français — Production de phrases courtes',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'mardi',
      startMinutes: 13 * 60 + 30,
      durationMinutes: 30,
      domainId: 'francais',
      title: 'Français — Ateliers dirigés / Remédiation',
      nature: 'differenciation',
    },
    {
      id: id(),
      day: 'mardi',
      startMinutes: 14 * 60,
      durationMinutes: 60,
      domainId: 'eps',
      title: 'Éducation Physique et Sportive (EPS)',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'mardi',
      startMinutes: 15 * 60 + 15,
      durationMinutes: 30,
      domainId: 'langues',
      title: 'Langue vivante — Jeux oraux et comptines',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'mardi',
      startMinutes: 15 * 60 + 45,
      durationMinutes: 30,
      domainId: 'emc',
      title: 'Enseignement Moral et Civique (EMC)',
      nature: 'apprentissage',
    },

    // JEUDI
    {
      id: id(),
      day: 'jeudi',
      startMinutes: 8 * 60 + 30,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Rituel de lecture et phonologie',
      nature: 'rituel',
    },
    {
      id: id(),
      day: 'jeudi',
      startMinutes: 8 * 60 + 45,
      durationMinutes: 60,
      domainId: 'francais',
      title: 'Français — Lecture, compréhension et fluence',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'jeudi',
      startMinutes: 9 * 60 + 45,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Dictée de syllabes et mots',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'jeudi',
      startMinutes: 10 * 60 + 15,
      durationMinutes: 10,
      domainId: 'mathematiques',
      title: 'Mathématiques — Calcul mental (rituel)',
      nature: 'rituel',
    },
    {
      id: id(),
      day: 'jeudi',
      startMinutes: 10 * 60 + 25,
      durationMinutes: 55,
      domainId: 'mathematiques',
      title: 'Mathématiques — Espace et géométrie',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'jeudi',
      startMinutes: 11 * 60 + 20,
      durationMinutes: 25,
      domainId: 'francais',
      title: 'Français — Étude de la langue (premières notions)',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'jeudi',
      startMinutes: 13 * 60 + 30,
      durationMinutes: 30,
      domainId: 'francais',
      title: 'Français — Lecture-plaisir (hors évaluation)',
      nature: 'lecture_plaisir',
    },
    {
      id: id(),
      day: 'jeudi',
      startMinutes: 14 * 60,
      durationMinutes: 60,
      domainId: 'qlm',
      title: 'Questionner le monde — Découverte documentaire',
      secondaryDomainId: 'francais',
      nature: 'projet',
    },
    {
      id: id(),
      day: 'jeudi',
      startMinutes: 15 * 60 + 15,
      durationMinutes: 60,
      domainId: 'artistique',
      title: 'Enseignements artistiques — Arts plastiques',
      nature: 'apprentissage',
    },

    // VENDREDI
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 8 * 60 + 30,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Rituel de lecture et expression orale',
      nature: 'rituel',
    },
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 8 * 60 + 45,
      durationMinutes: 60,
      domainId: 'francais',
      title: 'Français — Lecture et compréhension de texte',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 9 * 60 + 45,
      durationMinutes: 15,
      domainId: 'francais',
      title: 'Français — Écriture et copie',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 10 * 60 + 15,
      durationMinutes: 10,
      domainId: 'mathematiques',
      title: 'Mathématiques — Calcul mental (rituel)',
      nature: 'rituel',
    },
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 10 * 60 + 25,
      durationMinutes: 55,
      domainId: 'mathematiques',
      title: 'Mathématiques — Nombres et grandeurs',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 11 * 60 + 20,
      durationMinutes: 25,
      domainId: 'francais',
      title: 'Français — Révision des sons et fluence',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 13 * 60 + 30,
      durationMinutes: 45,
      domainId: 'eps',
      title: 'Éducation Physique et Sportive (EPS)',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 14 * 60 + 15,
      durationMinutes: 50,
      domainId: 'artistique',
      title: 'Enseignements artistiques — Éducation musicale',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 15 * 60 + 15,
      durationMinutes: 50,
      domainId: 'langues',
      title: 'Langue vivante — Compréhension et expression orale',
      nature: 'apprentissage',
    },
    {
      id: id(),
      day: 'vendredi',
      startMinutes: 16 * 60 + 5,
      durationMinutes: 10,
      domainId: 'qlm',
      title: 'Questionner le monde — Bilan de la semaine',
      nature: 'rituel',
    },
  ];
}

export const TIMETABLE_MODELS: TimetableTemplateModel[] = [
  {
    id: 'ps_ms',
    title: 'Maternelle PS–MS',
    schoolCategory: 'École maternelle',
    cycle: 'cycle1',
    classLevel: 'PS–MS',
    summary:
      'Organisation adaptée aux tout-petits et moyens : accueil échelonné, motricité quotidienne (30 min), récréation de 30 min le matin et temps de sieste/repos l’après-midi.',
    highlights: [
      'Langage (7h00) · Mathématiques (4h00)',
      'Activités physiques (2h00, 30 min/jour)',
      'Arts (1h40) · Explorer le monde (1h40) · Accueil & Sieste (4h40)',
    ],
    buildSettings: (schoolType) => buildCycle1Settings('PS–MS', schoolType),
    buildBlocks: (schoolType) =>
      withCatholiqueHour(
        buildCycle1Settings('PS–MS', schoolType),
        createPsMsBlocks(),
        schoolType
      ).blocks,
  },
  {
    id: 'gs',
    title: 'Maternelle Grande Section (GS)',
    schoolCategory: 'École maternelle',
    cycle: 'cycle1',
    classLevel: 'GS',
    summary:
      'Équilibre entre conscience phonologique, préparation à l’écrit et aux mathématiques, motricité quotidienne, temps calme court et exploration du monde.',
    highlights: [
      'Langage oral, phonologie et écrit (7h00)',
      'Structurer sa pensée (4h20) · Motricité (2h00)',
      'Arts (1h50) · Explorer le monde (1h50) · Accueil & Temps calme (4h00)',
    ],
    buildSettings: (schoolType) => buildCycle1Settings('GS', schoolType),
    buildBlocks: (schoolType) =>
      withCatholiqueHour(
        buildCycle1Settings('GS', schoolType),
        createGsBlocks(),
        schoolType
      ).blocks,
  },
  {
    id: 'cp',
    title: 'Élémentaire CP',
    schoolCategory: 'École élémentaire',
    cycle: 'cycle2',
    classLevel: 'CP',
    summary:
      'Priorité au décodage, à l’encodage et au calcul mental sur les plages cognitives optimales du matin, avec ateliers de fluence et lecture-plaisir.',
    highlights: [
      'Français (9h10) · Mathématiques (4h35)',
      'EPS (2h45) · Questionner le monde + EMC (2h20)',
      'Enseignements artistiques (1h50) · Langue vivante (1h20)',
    ],
    buildSettings: (schoolType) => {
      const s = createDefaultSettings('cycle2', schoolType, true);
      s.classLevel = 'CP';
      return s;
    },
    buildBlocks: (schoolType) =>
      withCatholiqueHour(
        createDefaultSettings('cycle2', schoolType, true),
        createCpBlocks(),
        schoolType
      ).blocks,
  },
  {
    id: 'ce1_ce2',
    title: 'Élémentaire CE1–CE2',
    schoolCategory: 'École élémentaire',
    cycle: 'cycle2',
    classLevel: 'CE1–CE2',
    summary:
      'Répartition hebdomadaire stricte BOEN Cycle 2 (22h00 effectives) incluant étude de la langue, rédaction, rituels quotidiens et lecture documentaire transversale.',
    highlights: [
      'Français (9h10) · Mathématiques (4h35)',
      'EPS (2h45) · Questionner le monde + EMC (2h25)',
      'Enseignements artistiques (1h45) · Langue vivante (1h20)',
    ],
    buildSettings: (schoolType) => {
      const s = createDefaultSettings('cycle2', schoolType, true);
      s.classLevel = 'CE1–CE2';
      return s;
    },
    buildBlocks: (schoolType) =>
      withCatholiqueHour(
        createDefaultSettings('cycle2', schoolType, true),
        createCompliantSampleBlocks('cycle2'),
        schoolType
      ).blocks,
  },
  {
    id: 'cm1_cm2',
    title: 'Élémentaire CM1–CM2',
    schoolCategory: 'École élémentaire',
    cycle: 'cycle3',
    classLevel: 'CM1–CM2',
    summary:
      'Emploi du temps Cycle 3 consolidé avec séparation Sciences & Technologie et Histoire-Géographie + EMC, projets interdisciplinaires et remédiation.',
    highlights: [
      'Français (7h20) · Mathématiques (4h35)',
      'Sciences & Tech. (1h50) · Histoire-Géo + EMC (2h20)',
      'EPS (2h45) · Arts (1h50) · Langue vivante (1h20)',
    ],
    buildSettings: (schoolType) => {
      const s = createDefaultSettings('cycle3', schoolType, true);
      s.classLevel = 'CM1–CM2';
      return s;
    },
    buildBlocks: (schoolType) =>
      withCatholiqueHour(
        createDefaultSettings('cycle3', schoolType, true),
        createCompliantSampleBlocks('cycle3'),
        schoolType
      ).blocks,
  },
];
