import { useEffect, useMemo, useState } from 'react';
import { BlockEditorModal } from './components/BlockEditorModal';
import { ComplianceReportView } from './components/ComplianceReportView';
import { DomainPalette } from './components/DomainPalette';
import { ExportModal } from './components/ExportModal';
import { AppView, HeaderBar } from './components/HeaderBar';
import { ModelsGalleryView } from './components/ModelsGalleryView';
import { OfficialFrameworkView } from './components/OfficialFrameworkView';
import { ScheduleSettingsView } from './components/ScheduleSettingsView';
import { SchoolSetupWelcome } from './components/SchoolSetupWelcome';
import { ActiveDragItem, TimetableGrid } from './components/TimetableGrid';
import { TIMETABLE_MODELS } from './data/models';
import {
  createCompliantSampleBlocks,
  createDefaultSettings,
  getDomainLabelForCycle,
} from './data/regulations';
import {
  CycleId,
  DayId,
  GradeLevelId,
  LabelTemplate,
  ScheduledBlock,
  SchoolSettings,
  SchoolType,
} from './types/timetable';
import { runComplianceAudit } from './utils/complianceEngine';
import { getActiveDays, resolveValidPlacement } from './utils/timeUtils';

const STORAGE_KEY_SETTINGS = 'chronoclasse_settings_v2';
const STORAGE_KEY_BLOCKS = 'chronoclasse_blocks_v2';

function loadInitialSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return JSON.parse(raw) as SchoolSettings;
    }
  } catch {
    // ignore storage errors
  }
  return createDefaultSettings('cycle2', 'publique', false);
}

function loadInitialBlocks(): ScheduledBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BLOCKS);
    if (raw) {
      return JSON.parse(raw) as ScheduledBlock[];
    }
  } catch {
    // ignore storage errors
  }
  return createCompliantSampleBlocks('cycle2');
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('atelier');
  const [settings, setSettings] = useState<SchoolSettings>(loadInitialSettings);
  const [blocks, setBlocks] = useState<ScheduledBlock[]>(loadInitialBlocks);
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem>(null);
  const [editingModal, setEditingModal] = useState<{
    mode: 'edit' | 'create';
    block: ScheduledBlock;
  } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(blocks));
    } catch {
      // ignore
    }
  }, [blocks]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const report = useMemo(
    () => runComplianceAudit(settings, blocks),
    [settings, blocks]
  );

  const handleCompleteOnboarding = (
    schoolType: SchoolType,
    modelId: GradeLevelId,
    startMode: 'model' | 'blank'
  ) => {
    const model =
      TIMETABLE_MODELS.find((m) => m.id === modelId) ?? TIMETABLE_MODELS[3];
    const nextSettings = model.buildSettings(schoolType);
    nextSettings.hasChosenSchoolType = true;

    setSettings(nextSettings);
    setBlocks(startMode === 'model' ? model.buildBlocks(schoolType) : []);
    setActiveView('atelier');
    showToast(
      schoolType === 'catholique'
        ? `École privée catholique configurée (${model.title}).`
        : `École publique configurée (${model.title}).`
    );
  };

  const handleApplyModel = (modelId: GradeLevelId, overrideSchoolType?: SchoolType) => {
    const model = TIMETABLE_MODELS.find((m) => m.id === modelId);
    if (!model) return;
    const typeToUse = overrideSchoolType ?? settings.schoolType;
    const nextSettings = model.buildSettings(typeToUse);
    nextSettings.hasChosenSchoolType = true;
    // Preserve custom school/teacher names if already edited away from defaults
    if (
      settings.teacherName &&
      settings.teacherName !== 'Claire Moreau'
    ) {
      nextSettings.teacherName = settings.teacherName;
    }
    setSettings(nextSettings);
    setBlocks(model.buildBlocks(typeToUse));
    setActiveView('atelier');
    showToast(`Modèle « ${model.title} » chargé dans l’atelier.`);
  };

  const handleChangeCycle = (nextCycle: CycleId) => {
    if (nextCycle === settings.cycle) return;
    const targetModelId: GradeLevelId =
      nextCycle === 'cycle1' ? 'ps_ms' : nextCycle === 'cycle3' ? 'cm1_cm2' : 'ce1_ce2';
    handleApplyModel(targetModelId);
  };

  const handleChangeSchoolType = (nextType: SchoolType) => {
    if (nextType === settings.schoolType) return;

    if (nextType === 'catholique') {
      // Ajouter 1h00 en fin de journée le vendredi (16h15–17h15) si non déjà présent, et placer l'heure de caractère propre
      const hasCatechese = blocks.some((b) => b.domainId === 'catechese');
      const fridayEnd = settings.days.vendredi.afternoon.endMinutes;
      const shouldExtendFriday =
        settings.days.vendredi.enabled &&
        settings.days.vendredi.afternoon.enabled &&
        fridayEnd <= 16 * 60 + 15 &&
        !hasCatechese;

      setSettings((prev) => ({
        ...prev,
        schoolType: 'catholique',
        hasChosenSchoolType: true,
        schoolName:
          prev.schoolName === 'École Publique Saint-Exupéry'
            ? 'École Privée Catholique Sainte-Marie'
            : prev.schoolName,
        days: shouldExtendFriday
          ? {
              ...prev.days,
              vendredi: {
                ...prev.days.vendredi,
                afternoon: {
                  ...prev.days.vendredi.afternoon,
                  endMinutes: fridayEnd + 60,
                },
              },
            }
          : prev.days,
      }));

      if (!hasCatechese && shouldExtendFriday) {
        const catBlock: ScheduledBlock = {
          id: `cath_${Date.now()}`,
          day: 'vendredi',
          startMinutes: fridayEnd,
          durationMinutes: 60,
          domainId: 'catechese',
          title: 'Caractère propre — Catéchèse ou éveil à la foi',
          nature: 'projet',
          notes: '1h00 en fin de journée (départ anticipé possible pour les élèves non participants)',
        };
        setBlocks((prev) => [...prev, catBlock]);
      }
      showToast('Statut « École privée catholique » activé (1h00 de caractère propre disponible).');
    } else {
      // Retour à École publique : retirer les créneaux de caractère propre et rétablir vendredi si étendu
      const hadAutoFridayCat = blocks.some(
        (b) =>
          b.domainId === 'catechese' &&
          b.day === 'vendredi' &&
          b.startMinutes + b.durationMinutes === settings.days.vendredi.afternoon.endMinutes
      );
      setSettings((prev) => ({
        ...prev,
        schoolType: 'publique',
        hasChosenSchoolType: true,
        schoolName:
          prev.schoolName === 'École Privée Catholique Sainte-Marie'
            ? 'École Publique Saint-Exupéry'
            : prev.schoolName,
        days: hadAutoFridayCat
          ? {
              ...prev.days,
              vendredi: {
                ...prev.days.vendredi,
                afternoon: {
                  ...prev.days.vendredi.afternoon,
                  endMinutes: Math.max(
                    15 * 60 + 30,
                    prev.days.vendredi.afternoon.endMinutes - 60
                  ),
                },
              },
            }
          : prev.days,
      }));
      setBlocks((prev) => prev.filter((b) => b.domainId !== 'catechese'));
      showToast('Statut « École publique » activé.');
    }
  };

  const handlePlaceNewBlock = (
    template: LabelTemplate,
    day: DayId,
    desiredStartMinutes: number
  ) => {
    const dayCfg = settings.days[day];
    const dayBlocks = blocks.filter((b) => b.day === day);
    const resolved = resolveValidPlacement(
      dayCfg,
      dayBlocks,
      desiredStartMinutes,
      template.defaultDurationMinutes
    );

    if (!resolved) {
      showToast('Aucun créneau disponible sur cette journée.');
      return;
    }

    const newBlock: ScheduledBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      day,
      startMinutes: resolved.startMinutes,
      durationMinutes: resolved.durationMinutes,
      domainId: template.domainId,
      title: template.title,
      nature: template.nature,
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleQuickAddTemplate = (template: LabelTemplate) => {
    const activeDays = getActiveDays(settings);
    for (const day of activeDays) {
      const dayCfg = settings.days[day];
      const dayBlocks = blocks.filter((b) => b.day === day);
      const preferredStart =
        template.domainId === 'catechese'
          ? dayCfg.afternoon.enabled
            ? Math.max(dayCfg.afternoon.startMinutes, dayCfg.afternoon.endMinutes - template.defaultDurationMinutes)
            : dayCfg.morning.startMinutes
          : template.domainId === 'francais' || template.domainId === 'mathematiques'
          ? dayCfg.morning.startMinutes
          : dayCfg.afternoon.enabled
          ? dayCfg.afternoon.startMinutes
          : dayCfg.morning.startMinutes;

      const resolved = resolveValidPlacement(
        dayCfg,
        dayBlocks,
        preferredStart,
        template.defaultDurationMinutes
      );
      if (resolved) {
        const newBlock: ScheduledBlock = {
          id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          day,
          startMinutes: resolved.startMinutes,
          durationMinutes: resolved.durationMinutes,
          domainId: template.domainId,
          title: template.title,
          nature: template.nature,
        };
        setBlocks((prev) => [...prev, newBlock]);
        return;
      }
    }
    showToast('La grille est complète : libérez un créneau ou ajustez une durée.');
  };

  const handleMoveBlock = (
    blockId: string,
    targetDay: DayId,
    desiredStartMinutes: number
  ) => {
    const existing = blocks.find((b) => b.id === blockId);
    if (!existing) return;
    const dayBlocks = blocks.filter((b) => b.day === targetDay);
    const resolved = resolveValidPlacement(
      settings.days[targetDay],
      dayBlocks,
      desiredStartMinutes,
      existing.durationMinutes,
      blockId
    );
    if (!resolved) {
      showToast('Impossible de placer cette séance sur ce créneau.');
      return;
    }
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              day: targetDay,
              startMinutes: resolved.startMinutes,
              durationMinutes: resolved.durationMinutes,
            }
          : b
      )
    );
  };

  const handleResizeBlock = (blockId: string, newDurationMinutes: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, durationMinutes: newDurationMinutes } : b
      )
    );
  };

  const handleOpenCustomLabel = () => {
    const firstDay = getActiveDays(settings)[0] || 'lundi';
    const dayCfg = settings.days[firstDay];
    const resolved = resolveValidPlacement(
      dayCfg,
      blocks.filter((b) => b.day === firstDay),
      dayCfg.morning.startMinutes,
      45
    );
    setEditingModal({
      mode: 'create',
      block: {
        id: `blk_${Date.now()}`,
        day: firstDay,
        startMinutes: resolved ? resolved.startMinutes : dayCfg.morning.startMinutes,
        durationMinutes: resolved ? resolved.durationMinutes : 45,
        domainId: 'francais',
        title: getDomainLabelForCycle('francais', settings.cycle),
        nature: 'apprentissage',
      },
    });
  };

  const handleSaveModalBlock = (saved: ScheduledBlock) => {
    if (editingModal?.mode === 'create') {
      const resolved = resolveValidPlacement(
        settings.days[saved.day],
        blocks.filter((b) => b.day === saved.day),
        saved.startMinutes,
        saved.durationMinutes
      );
      const finalBlock = resolved
        ? {
            ...saved,
            startMinutes: resolved.startMinutes,
            durationMinutes: resolved.durationMinutes,
          }
        : saved;
      setBlocks((prev) => [...prev, finalBlock]);
    } else {
      setBlocks((prev) => prev.map((b) => (b.id === saved.id ? saved : b)));
    }
    setEditingModal(null);
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setEditingModal(null);
  };

  const handleDuplicateBlock = (blk: ScheduledBlock) => {
    const activeDays = getActiveDays(settings);
    for (const day of activeDays) {
      const resolved = resolveValidPlacement(
        settings.days[day],
        blocks.filter((b) => b.day === day),
        blk.startMinutes,
        blk.durationMinutes
      );
      if (resolved) {
        const copy: ScheduledBlock = {
          ...blk,
          id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          day,
          startMinutes: resolved.startMinutes,
          durationMinutes: resolved.durationMinutes,
        };
        setBlocks((prev) => [...prev, copy]);
        setEditingModal(null);
        showToast('Étiquette dupliquée sur un créneau libre.');
        return;
      }
    }
    showToast('Aucun créneau libre pour dupliquer cette étiquette.');
  };

  const handleFixVocabulary = (blockId: string, suggestedTitle: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, title: suggestedTitle } : b))
    );
  };

  const handleFixAllVocabulary = () => {
    const issueMap = new Map(
      report.vocabularyIssues.map((i) => [i.blockId, i.suggestedTitle])
    );
    setBlocks((prev) =>
      prev.map((b) =>
        issueMap.has(b.id) ? { ...b, title: issueMap.get(b.id)! } : b
      )
    );
    showToast('Tous les intitulés ont été alignés sur le vocabulaire officiel.');
  };

  if (!settings.hasChosenSchoolType) {
    return (
      <SchoolSetupWelcome
        initialSchoolType={settings.schoolType}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <HeaderBar
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenExport={() => setShowExportModal(true)}
      />

      <main className="flex-1 px-4 sm:px-6 py-5 max-w-[1440px] w-full mx-auto">
        {activeView === 'atelier' && (
          <div className="flex flex-col lg:flex-row items-start gap-5">
            <DomainPalette
              cycle={settings.cycle}
              schoolType={settings.schoolType}
              onChangeCycle={handleChangeCycle}
              onChangeSchoolType={handleChangeSchoolType}
              onQuickAddTemplate={handleQuickAddTemplate}
              onOpenCustomLabel={handleOpenCustomLabel}
              onDragTemplateStart={(template) =>
                setActiveDragItem({ type: 'template', template })
              }
              onDragEnd={() => setActiveDragItem(null)}
            />
            <TimetableGrid
              settings={settings}
              blocks={blocks}
              report={report}
              activeDragItem={activeDragItem}
              onDragBlockStart={(block) =>
                setActiveDragItem({ type: 'existing', block })
              }
              onDragAnyEnd={() => setActiveDragItem(null)}
              onPlaceNewBlock={handlePlaceNewBlock}
              onMoveBlock={handleMoveBlock}
              onResizeBlock={handleResizeBlock}
              onSelectBlock={(block) => setEditingModal({ mode: 'edit', block })}
              onVerifyCompliance={() => setActiveView('conformite')}
              onOpenModels={() => setActiveView('modeles')}
              onLoadSample={() => {
                const match =
                  TIMETABLE_MODELS.find((m) => m.cycle === settings.cycle) ??
                  TIMETABLE_MODELS[3];
                handleApplyModel(match.id);
              }}
              onClearAll={() => {
                setBlocks([]);
                showToast('Grille vidée.');
              }}
              onOpenSettings={() => setActiveView('horaires')}
            />
          </div>
        )}

        {activeView === 'modeles' && (
          <ModelsGalleryView
            schoolType={settings.schoolType}
            onChangeSchoolType={handleChangeSchoolType}
            onApplyModel={(modelId) => handleApplyModel(modelId)}
            onGoToAtelier={() => setActiveView('atelier')}
          />
        )}

        {activeView === 'horaires' && (
          <ScheduleSettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onChangeCycle={handleChangeCycle}
            onChangeSchoolType={handleChangeSchoolType}
            onGoToAtelier={() => setActiveView('atelier')}
          />
        )}

        {activeView === 'conformite' && (
          <ComplianceReportView
            settings={settings}
            report={report}
            onFixVocabulary={handleFixVocabulary}
            onFixAllVocabulary={handleFixAllVocabulary}
            onGoToAtelier={() => setActiveView('atelier')}
            onOpenExport={() => setShowExportModal(true)}
          />
        )}

        {activeView === 'cadre' && (
          <OfficialFrameworkView
            activeCycle={settings.cycle}
            onSelectCycle={(c) => {
              handleChangeCycle(c);
              setActiveView('atelier');
            }}
            onGoToAtelier={() => setActiveView('atelier')}
          />
        )}
      </main>

      {editingModal && (
        <BlockEditorModal
          mode={editingModal.mode}
          initialBlock={editingModal.block}
          settings={settings}
          onSave={handleSaveModalBlock}
          onDelete={editingModal.mode === 'edit' ? handleDeleteBlock : undefined}
          onDuplicate={editingModal.mode === 'edit' ? handleDuplicateBlock : undefined}
          onClose={() => setEditingModal(null)}
        />
      )}

      {showExportModal && (
        <ExportModal
          settings={settings}
          blocks={blocks}
          report={report}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
