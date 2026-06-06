import { useState } from 'react';
import { ClipboardList, Activity, Bone, Brain, ActivitySquare, HeartPulse, Stethoscope, Gauge, MapPin } from 'lucide-react';
import { useAppStore, useCurrentPatient, useCurrentEvaluation } from '../store/useAppStore';
import NoPatientNotice from '../components/NoPatientNotice';
import { computeFunctionalAutonomy, classifyNeuro } from '../utils/clinicalLogic';
import {
  PAIN_SCALE,
  GAIT_OPTIONS,
  LAMENESS_GRADES,
  POSTURE_OPTIONS,
  BODY_CONDITION,
  MUSCLE_MASS,
  ROM_OPTIONS,
  NEURO_MENTATION,
  NEURO_POSTURAL_REACTIONS,
  NEURO_REFLEXES,
  NEURO_ATAXIA,
  NEURO_GRADE,
  NEURO_FINDINGS,
  FUNCTIONAL_CLASS,
} from '../constants/clinical';

type Tone = 'red' | 'orange' | 'blue' | 'purple' | 'green' | 'amber';

const toneClasses: Record<Tone, { on: string; off: string }> = {
  red: { on: 'bg-red-50 border-red-300 text-red-700', off: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' },
  orange: { on: 'bg-orange-50 border-orange-300 text-orange-700', off: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' },
  blue: { on: 'bg-blue-50 border-blue-300 text-blue-700', off: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' },
  purple: { on: 'bg-purple-600 border-purple-600 text-white', off: 'bg-white border-gray-200 text-gray-600 hover:bg-purple-50' },
  green: { on: 'bg-green-50 border-green-300 text-green-700', off: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' },
  amber: { on: 'bg-amber-50 border-amber-300 text-amber-700', off: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' },
};

/** Grupo de seleção única (clicável). */
function SingleSelect({ options, value, onChange, tone = 'purple' }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  tone?: Tone;
}) {
  const c = toneClasses[tone];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            // clique novamente desmarca
            onClick={() => onChange(selected ? '' : opt)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${selected ? c.on : c.off}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** Grupo de seleção múltipla (clicável). */
function MultiSelect({ options, values, onChange, tone = 'purple' }: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  tone?: Tone;
}) {
  const c = toneClasses[tone];
  const toggle = (opt: string) => {
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${selected ? c.on : c.off}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );
}

export default function Evaluation() {
  const [activeTab, setActiveTab] = useState<'triage' | 'functional' | 'neuro'>('triage');
  const patient = useCurrentPatient();
  const evaluation = useCurrentEvaluation();
  const setEvaluation = useAppStore((state) => state.setEvaluation);

  if (!patient) return <NoPatientNotice />;

  const autonomy = computeFunctionalAutonomy(evaluation);
  const neuro = classifyNeuro(evaluation);

  const tabBtn = (id: typeof activeTab, label: string, icon: React.ReactNode) => (
    <button
      className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
        activeTab === id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
      onClick={() => setActiveTab(id)}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Avaliação</h1>
        <p className="text-gray-500 mt-2">Histórico, exame físico funcional e neurológico — totalmente clicável.</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabBtn('triage', 'Histórico', <ClipboardList size={18} />)}
        {tabBtn('functional', 'Avaliação Funcional', <Activity size={18} />)}
        {tabBtn('neuro', 'Avaliação Neurológica', <Brain size={18} />)}
      </div>

      {activeTab === 'triage' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <label className="block text-sm font-medium text-gray-700 mb-2">Queixa Principal e Histórico</label>
          <textarea
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none h-48"
            placeholder="Descreva o motivo da consulta, tempo de evolução, tratamentos prévios, medicações em uso, cirurgias..."
            value={evaluation.history}
            onChange={(e) => setEvaluation({ history: e.target.value })}
          />
        </div>
      )}

      {activeTab === 'functional' && (
        <div className="space-y-6 animate-fade-in">
          <Card title="Avaliação de Dor (EVA 0-10)" icon={<ActivitySquare className="text-red-500" size={20} />}>
            <SingleSelect tone="red" options={PAIN_SCALE} value={evaluation.painScale} onChange={(v) => setEvaluation({ painScale: v })} />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Marcha" icon={<Bone className="text-orange-500" size={20} />}>
              <SingleSelect tone="orange" options={GAIT_OPTIONS} value={evaluation.gait} onChange={(v) => setEvaluation({ gait: v })} />
            </Card>
            <Card title="Postura" icon={<Bone className="text-blue-500" size={20} />}>
              <SingleSelect tone="blue" options={POSTURE_OPTIONS} value={evaluation.posture} onChange={(v) => setEvaluation({ posture: v })} />
            </Card>
          </div>

          <Card title="Grau de Claudicação (0-5)" icon={<Activity className="text-orange-500" size={20} />}>
            <SingleSelect tone="orange" options={LAMENESS_GRADES} value={evaluation.lamenessGrade} onChange={(v) => setEvaluation({ lamenessGrade: v })} />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Escore de Condição Corporal (1-9)" icon={<HeartPulse className="text-green-500" size={20} />}>
              <SingleSelect tone="green" options={BODY_CONDITION} value={evaluation.bodyCondition} onChange={(v) => setEvaluation({ bodyCondition: v })} />
            </Card>
            <Card title="Massa Muscular (MCS)" icon={<HeartPulse className="text-amber-500" size={20} />}>
              <SingleSelect tone="amber" options={MUSCLE_MASS} value={evaluation.muscleMass} onChange={(v) => setEvaluation({ muscleMass: v })} />
            </Card>
          </div>

          <Card title="Amplitude de Movimento (ADM)" icon={<Stethoscope className="text-blue-500" size={20} />}>
            <p className="text-xs text-gray-500 mb-3">Selecione todos os achados aplicáveis.</p>
            <MultiSelect tone="blue" options={ROM_OPTIONS} values={evaluation.jointMobility} onChange={(v) => setEvaluation({ jointMobility: v })} />
          </Card>

          <Card title="Classificação Funcional" icon={<Activity className="text-purple-500" size={20} />}>
            <SingleSelect tone="purple" options={FUNCTIONAL_CLASS} value={evaluation.functionalClass} onChange={(v) => setEvaluation({ functionalClass: v })} />
            <button
              type="button"
              onClick={() => setEvaluation({ functionalClass: autonomy.suggestedClass })}
              className="mt-3 text-xs text-purple-700 hover:underline"
            >
              Sugerido pelo cálculo: {autonomy.suggestedClass} — aplicar
            </button>
          </Card>

          <AutonomyCard autonomy={autonomy} />

          <Card title="Observações Gerais" icon={<ClipboardList className="text-gray-500" size={20} />}>
            <textarea
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
              placeholder="Observações adicionais do exame físico funcional..."
              value={evaluation.observations}
              onChange={(e) => setEvaluation({ observations: e.target.value })}
            />
          </Card>
        </div>
      )}

      {activeTab === 'neuro' && (
        <div className="space-y-6 animate-fade-in">
          <Card title="Estado Mental" icon={<Brain className="text-purple-500" size={20} />}>
            <SingleSelect tone="purple" options={NEURO_MENTATION} value={evaluation.neuroMentation} onChange={(v) => setEvaluation({ neuroMentation: v })} />
          </Card>

          <Card title="Reações Posturais / Propriocepção" icon={<Brain className="text-purple-500" size={20} />}>
            <MultiSelect tone="purple" options={NEURO_POSTURAL_REACTIONS} values={evaluation.neuroPostural} onChange={(v) => setEvaluation({ neuroPostural: v })} />
          </Card>

          <Card title="Reflexos Espinhais" icon={<Brain className="text-purple-500" size={20} />}>
            <MultiSelect tone="purple" options={NEURO_REFLEXES} values={evaluation.neuroReflexes} onChange={(v) => setEvaluation({ neuroReflexes: v })} />
          </Card>

          <Card title="Ataxia" icon={<Brain className="text-purple-500" size={20} />}>
            <MultiSelect tone="purple" options={NEURO_ATAXIA} values={evaluation.neuroAtaxia} onChange={(v) => setEvaluation({ neuroAtaxia: v })} />
          </Card>

          <Card title="Grau de Disfunção Neurológica (Frankel modificado)" icon={<Brain className="text-purple-500" size={20} />}>
            <SingleSelect tone="purple" options={NEURO_GRADE} value={evaluation.neuroGrade} onChange={(v) => setEvaluation({ neuroGrade: v })} />
          </Card>

          <Card title="Achados Adicionais" icon={<Brain className="text-purple-500" size={20} />}>
            <MultiSelect tone="purple" options={NEURO_FINDINGS} values={evaluation.neuroFindings} onChange={(v) => setEvaluation({ neuroFindings: v })} />
          </Card>

          <NeuroClassificationCard neuro={neuro} />

          <Card title="Observações Neurológicas" icon={<ClipboardList className="text-gray-500" size={20} />}>
            <textarea
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
              placeholder="Localização neuroanatômica, observações complementares..."
              value={evaluation.neuroObs}
              onChange={(e) => setEvaluation({ neuroObs: e.target.value })}
            />
          </Card>
        </div>
      )}
    </div>
  );
}

const AUTONOMY_BAR: Record<string, string> = {
  green: 'bg-green-500', amber: 'bg-amber-500', orange: 'bg-orange-500', red: 'bg-red-500',
};
const AUTONOMY_TEXT: Record<string, string> = {
  green: 'text-green-700', amber: 'text-amber-700', orange: 'text-orange-700', red: 'text-red-700',
};

function AutonomyCard({ autonomy }: { autonomy: ReturnType<typeof computeFunctionalAutonomy> }) {
  return (
    <Card title="Autonomia Funcional (calculada)" icon={<Gauge className="text-purple-500" size={20} />}>
      <div className="flex items-center gap-4 mb-3">
        <div className="text-3xl font-bold text-gray-900">{autonomy.score}<span className="text-base text-gray-400">/100</span></div>
        <div>
          <p className={`font-semibold ${AUTONOMY_TEXT[autonomy.color]}`}>{autonomy.level}</p>
          <p className="text-xs text-gray-500">Classe sugerida: {autonomy.suggestedClass}</p>
        </div>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${AUTONOMY_BAR[autonomy.color]}`} style={{ width: `${autonomy.score}%` }} />
      </div>
      {autonomy.factors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {autonomy.factors.map((f) => (
            <span key={f} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{f}</span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-gray-400 mt-3">Índice de apoio à decisão; não substitui o julgamento clínico.</p>
    </Card>
  );
}

function NeuroClassificationCard({ neuro }: { neuro: ReturnType<typeof classifyNeuro> }) {
  return (
    <Card title="Classificação Neurológica (calculada)" icon={<MapPin className="text-purple-500" size={20} />}>
      {!neuro.hasData ? (
        <p className="text-sm text-gray-500">{neuro.summary}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="block text-gray-500 text-xs mb-1">Distribuição</span>
            <span className="font-medium">{neuro.distribution}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="block text-gray-500 text-xs mb-1">Localização provável</span>
            <span className="font-medium">{neuro.localization}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="block text-gray-500 text-xs mb-1">Gravidade</span>
            <span className="font-medium">{neuro.severity}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
