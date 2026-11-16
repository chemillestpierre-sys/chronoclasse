export type CycleId = 'cycle1' | 'cycle2' | 'cycle3';

export type SchoolType = 'publique' | 'catholique';

export type GradeLevelId = 'ps_ms' | 'gs' | 'cp' | 'ce1_ce2' | 'cm1_cm2';

export type DayId = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi';

export type DomainId =
  | 'francais'
  | 'mathematiques'
  | 'langues'
  | 'eps'
  | 'artistique'
  | 'qlm'
  | 'sciences'
  | 'histoire_geo'
  | 'emc'
  | 'autres_c1'
  | 'catechese';

export type PedagogicalNature =
  | 'apprentissage'
  | 'rituel'
  | 'differenciation'
  | 'lecture_plaisir'
  | 'projet';

export interface DomainStyle {
  id: DomainId;
  officialLabel: string;
  cycle1Label?: string;
  shortLabel: string;
  bgHex: string;
  borderHex: string;
  textHex: string;
  accentHex: string;
  swatchHex: string;
}

export interface LabelTemplate {
  id: string;
  domainId: DomainId;
  title: string;
  defaultDurationMinutes: number;
  nature: PedagogicalNature;
  cycles: CycleId[];
  schoolTypes?: SchoolType[];
  hint?: string;
}

export interface ScheduledBlock {
  id: string;
  day: DayId;
  startMinutes: number;
  durationMinutes: number;
  domainId: DomainId;
  secondaryDomainId?: DomainId;
  title: string;
  nature: PedagogicalNature;
  notes?: string;
}

export interface HalfDayConfig {
  enabled: boolean;
  startMinutes: number;
  endMinutes: number;
  recessEnabled: boolean;
  recessStartMinutes: number;
  recessDurationMinutes: number;
}

export interface DayScheduleConfig {
  enabled: boolean;
  morning: HalfDayConfig;
  afternoon: HalfDayConfig;
}

export interface SchoolSettings {
  schoolType: SchoolType;
  hasChosenSchoolType: boolean;
  schoolName: string;
  teacherName: string;
  classLevel: string;
  schoolYear: string;
  cycle: CycleId;
  weekType: '4days' | '4.5days';
  days: Record<DayId, DayScheduleConfig>;
}

export interface RegulatoryTargetGroup {
  id: string;
  label: string;
  domainIds: DomainId[];
  legalMinutes: number;
  adjustedMinutes: number; // 22/24 coefficient
  minRecommendedMinutes?: number; // for Cycle 1 ranges
  maxRecommendedMinutes?: number; // for Cycle 1 ranges
  note?: string;
}

export interface DomainAuditRow {
  group: RegulatoryTargetGroup;
  scheduledMinutes: number;
  proRataTargetMinutes: number;
  deltaFromAdjusted: number;
  deltaFromProRata: number;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

export type ComplianceSeverity = 'conforme' | 'recommandation' | 'non_conforme';

export interface VocabularyIssue {
  blockId: string;
  day: DayId;
  startMinutes: number;
  currentTitle: string;
  domainId: DomainId;
  detectedTerm: string;
  suggestedTitle: string;
  reason: string;
}

export interface ComplianceCheckItem {
  id: string;
  category: 'volumes' | 'vocabulaire' | 'rythme' | 'cadre';
  title: string;
  status: ComplianceSeverity;
  detail: string;
  actionHint?: string;
}

export interface ComplianceReport {
  overallStatus: ComplianceSeverity;
  totalPresenceMinutes: number;
  totalRecessMinutes: number;
  expectedTeachingMinutes: number;
  totalScheduledTeachingMinutes: number;
  totalCatecheseMinutes: number;
  halfDaysCount: number;
  domainRows: DomainAuditRow[];
  vocabularyIssues: VocabularyIssue[];
  checks: ComplianceCheckItem[];
  summaryCounts: {
    conforme: number;
    recommandation: number;
    non_conforme: number;
  };
}

export interface TimetableTemplateModel {
  id: GradeLevelId;
  title: string;
  schoolCategory: 'École maternelle' | 'École élémentaire';
  cycle: CycleId;
  classLevel: string;
  summary: string;
  highlights: string[];
  buildSettings: (schoolType: SchoolType) => SchoolSettings;
  buildBlocks: (schoolType: SchoolType) => ScheduledBlock[];
}
