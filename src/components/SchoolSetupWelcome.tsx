import React, { useState } from 'react';
import { ArrowRight, BookOpen, Building2, Check } from 'lucide-react';
import { TIMETABLE_MODELS } from '../data/models';
import { GradeLevelId, SchoolType } from '../types/timetable';

interface SchoolSetupWelcomeProps {
  initialSchoolType: SchoolType;
  onComplete: (
    schoolType: SchoolType,
    modelId: GradeLevelId,
    startMode: 'model' | 'blank'
  ) => void;
}

export const SchoolSetupWelcome: React.FC<SchoolSetupWelcomeProps> = ({
  initialSchoolType,
  onComplete,
}) => {
  const [schoolType, setSchoolType] = useState<SchoolType>(initialSchoolType);
  const [selectedModelId, setSelectedModelId] = useState<GradeLevelId>('ce1_ce2');
  const [startMode, setStartMode] = useState<'model' | 'blank'>('model');

  const maternelleModels = TIMETABLE_MODELS.filter(
    (m) => m.schoolCategory === 'École maternelle'
  );
  const elementaireModels = TIMETABLE_MODELS.filter(
    (m) => m.schoolCategory === 'École élémentaire'
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <div className="text-sm font-bold tracking-tight text-blue-700">
            ChronoClasse
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-balance">
            Préparez un emploi du temps conforme aux prescriptions officielles
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Choisissez d’abord le statut de votre établissement (école maternelle ou élémentaire), puis sélectionnez un modèle de départ ou une grille vierge.
          </p>
        </div>

        {/* Step 1: Public vs Catholic Private School */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h2>1. Statut de l’établissement</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSchoolType('publique')}
              className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                schoolType === 'publique'
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">
                  École publique
                </span>
                {schoolType === 'publique' && (
                  <Check className="w-4 h-4 text-blue-700 shrink-0" />
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Enseignement laïc strictement conforme aux 24h00 hebdomadaires du BOEN n°31 (22h00 effectives après déduction des récréations).
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSchoolType('catholique')}
              className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                schoolType === 'catholique'
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">
                  École privée catholique
                </span>
                {schoolType === 'catholique' && (
                  <Check className="w-4 h-4 text-blue-700 shrink-0" />
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Horaires officiels du BOEN + possibilité de positionner <strong>1h00 de caractère propre</strong> (catéchèse ou éveil à la foi) en début ou fin de journée.
              </p>
            </button>
          </div>
        </section>

        {/* Step 2: Grade Level & Starting Template */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <h2>2. Niveau scolaire (Maternelle ou Élémentaire)</h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setStartMode('model')}
                className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                  startMode === 'model'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Partir d’un modèle complet
              </button>
              <button
                type="button"
                onClick={() => setStartMode('blank')}
                className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                  startMode === 'blank'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Grille vierge
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">
                École maternelle (Cycle 1)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {maternelleModels.map((model) => {
                  const selected = selectedModelId === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setSelectedModelId(model.id)}
                      className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                        selected
                          ? 'border-blue-600 bg-blue-50/40'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {model.title}
                        </span>
                        {selected && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {model.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">
                École élémentaire (Cycles 2 et 3)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {elementaireModels.map((model) => {
                  const selected = selectedModelId === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setSelectedModelId(model.id)}
                      className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                        selected
                          ? 'border-blue-600 bg-blue-50/40'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {model.title}
                        </span>
                        {selected && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {model.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              {schoolType === 'catholique'
                ? 'Option École privée catholique : 1h00 de caractère propre (catéchèse / éveil à la foi) disponible et positionnable.'
                : 'Option École publique : grille alignée sur les 24h00 officielles.'}
            </span>
            <button
              type="button"
              onClick={() => onComplete(schoolType, selectedModelId, startMode)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer shrink-0"
            >
              <span>Ouvrir l’atelier d’emploi du temps</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
