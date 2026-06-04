import { useState } from 'react';
import { Target, CheckCircle2, ClipboardCheck, Sparkles, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Plan() {
  const [activeTab, setActiveTab] = useState<'base' | 'correlation'>('base');
  const [showLiterature, setShowLiterature] = useState(false);
  const [promptText, setPromptText] = useState('');

  const patient = useAppStore((state) => state.patient);
  const evaluation = useAppStore((state) => state.evaluation);
  const exams = useAppStore((state) => state.exams);
  const updateExam = useAppStore((state) => state.updateExam);
  
  const plan = useAppStore((state) => state.plan);
  const setPlan = useAppStore((state) => state.setPlan);

  const generatePrompt = () => {
    const prompt = `Atue como um especialista em fisioterapia veterinária.
Crie um plano terapêutico veterinário baseado em evidências, correlacionando avaliação funcional, exames complementares e objetivos clínicos. Indique condutas possíveis, frequência de sessões, critérios de evolução, sinais de alerta e justificativa técnica. Não substituir julgamento clínico da médica veterinária responsável.

*DADOS DO PACIENTE*
Paciente: ${patient.patientName} (${patient.patientSpecies}, ${patient.patientBreed}, ${patient.patientAge})
Diagnóstico Clínico (informado): ${plan.diagnosis}

*ACHADOS DA AVALIAÇÃO FUNCIONAL*
Dor: ${evaluation.painLevel}
Marcha: ${evaluation.gait}
Postura: ${evaluation.posture}
Neurológico/Obs: ${evaluation.neuro}

*EXAMES COMPLEMENTARES*
${exams.map(e => `- ${e.type} (${e.date}): ${e.findings} [Impacto: ${e.status}]`).join('\n')}

*OBJETIVOS DO TRATAMENTO*
${plan.correlationNotes || 'Não preenchido'}
`;
    setPromptText(prompt);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Plano Terapêutico</h1>
        <p className="text-gray-500 mt-2">Defina os objetivos, diagnóstico e protocolo de tratamento.</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'base' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('base')}
        >
          <ClipboardCheck size={18} />
          Plano Direto
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'correlation' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('correlation')}
        >
          <BookOpen size={18} />
          Correlação e Evidências
        </button>
      </div>

      {activeTab === 'base' ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
              <Target size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Diretrizes do Tratamento</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico Cinesiológico Funcional</label>
              <textarea
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                placeholder="Descreva o diagnóstico principal e secundário..."
                value={plan.diagnosis}
                onChange={(e) => setPlan({ diagnosis: e.target.value })}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metas e Objetivos a Curto/Longo Prazo</label>
              <textarea
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                placeholder="1. Alívio da dor\n2. Ganho de massa muscular..."
                value={plan.goals}
                onChange={(e) => setPlan({ goals: e.target.value })}
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sugestão de Pacote (Nº de Sessões)</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: 10 sessões"
                  value={plan.sessionsRecommended}
                  onChange={(e) => setPlan({ sessionsRecommended: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequência Sugerida</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  value={plan.frequency}
                  onChange={(e) => setPlan({ frequency: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="1x na semana">1x na semana</option>
                  <option value="2x na semana">2x na semana</option>
                  <option value="3x na semana">3x na semana</option>
                  <option value="Quinzenal">Quinzenal</option>
                  <option value="Mensal">Mensal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidades Sugeridas</label>
              <textarea
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                placeholder="Ex: Magnetoterapia, Laser, Acupuntura, Cinesioterapia..."
                value={plan.modalities}
                onChange={(e) => setPlan({ modalities: e.target.value })}
              ></textarea>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          
          {/* Resumo Avaliação Funcional */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo da Avaliação Funcional</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg"><span className="block text-gray-500 text-xs mb-1">Dor</span><span className="font-medium">{evaluation.painLevel || 'N/A'}</span></div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="block text-gray-500 text-xs mb-1">Marcha</span><span className="font-medium">{evaluation.gait || 'N/A'}</span></div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="block text-gray-500 text-xs mb-1">Postura</span><span className="font-medium">{evaluation.posture || 'N/A'}</span></div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="block text-gray-500 text-xs mb-1">Neuro/Obs</span><span className="font-medium line-clamp-2">{evaluation.neuro || 'N/A'}</span></div>
            </div>
          </div>

          {/* Exames Anexados */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Exames Anexados</h3>
            {exams.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum exame anexado.</p>
            ) : (
              <div className="space-y-4">
                {exams.map(exam => (
                  <div key={exam.id} className="p-4 border border-gray-200 rounded-xl">
                    <p className="font-medium text-gray-800">{exam.type} - {exam.date}</p>
                    <p className="text-sm text-gray-600 mt-1 mb-3">{exam.findings}</p>
                    <select 
                      className="w-full md:w-auto p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                      value={exam.status}
                      onChange={(e) => updateExam(exam.id, { status: e.target.value as any })}
                    >
                      <option value="">Análise do Exame...</option>
                      <option value="confirma">Confirma a conduta clínica</option>
                      <option value="complementa">Complementa a conduta clínica</option>
                      <option value="nao_altera">Não altera a conduta clínica</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Correlação Clínica */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Correlação Clínica</h3>
            <textarea
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-32"
              placeholder="Com base nos achados da avaliação funcional e nos exames apresentados, os principais objetivos terapêuticos são..."
              value={plan.correlationNotes}
              onChange={(e) => setPlan({ correlationNotes: e.target.value })}
            ></textarea>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[
                { key: 'painControl', label: 'Controle de Dor' },
                { key: 'inflammationReduction', label: 'Redução de Inflamação' },
                { key: 'gaitImprovement', label: 'Melhora de Apoio' },
                { key: 'romGain', label: 'Ganho de Amplitude de Movimento' },
                { key: 'strengthening', label: 'Fortalecimento' },
                { key: 'proprioception', label: 'Propriocepção' },
                { key: 'functionalTraining', label: 'Treino Funcional' },
                { key: 'recurrencePrevention', label: 'Prevenção de Recidiva' },
                { key: 'tutorEducation', label: 'Educação do Tutor' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    value={(plan as any)[field.key]}
                    onChange={(e) => setPlan({ [field.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ações Inteligentes */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={generatePrompt}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={20} />
              Gerar Sugestão com IA
            </button>
            <button 
              onClick={() => setShowLiterature(!showLiterature)}
              className="flex-1 bg-white border-2 border-purple-600 text-purple-700 hover:bg-purple-50 p-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <BookOpen size={20} />
              Validar com Literatura
            </button>
          </div>

          {/* Área de Prompt */}
          {promptText && (
            <div className="bg-slate-900 p-6 rounded-2xl shadow-inner animate-fade-in relative">
              <button 
                onClick={() => navigator.clipboard.writeText(promptText)}
                className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Copiar Prompt
              </button>
              <p className="text-slate-400 text-sm mb-3">Copie o texto abaixo e cole no ChatGPT, Claude ou outra IA externa:</p>
              <textarea 
                readOnly
                className="w-full bg-slate-800 text-slate-300 p-4 rounded-xl text-sm font-mono h-64 outline-none resize-none"
                value={promptText}
              />
            </div>
          )}

          {/* Justificativa Técnica */}
          {showLiterature && (
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 animate-fade-in space-y-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-purple-600" size={20} />
                Justificativa Técnica / Literatura
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'techPhysiology', label: 'Base Fisiopatológica' },
                  { key: 'techJustification', label: 'Justificativa da Técnica' },
                  { key: 'techFrequency', label: 'Frequência Sugerida' },
                  { key: 'techReassessment', label: 'Critérios de Reavaliação' },
                  { key: 'techLimitations', label: 'Limitações do Caso' },
                  { key: 'techObservations', label: 'Observações Veterinárias' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-purple-900 mb-1">{field.label}</label>
                    <textarea
                      className="w-full p-3 bg-white border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20 text-sm"
                      value={(plan as any)[field.key]}
                      onChange={(e) => setPlan({ [field.key]: e.target.value })}
                    ></textarea>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-white rounded-xl border border-purple-100 text-sm text-purple-800 italic">
                "O plano terapêutico foi elaborado a partir da avaliação funcional, exames disponíveis e julgamento clínico da médica veterinária responsável. A literatura científica é utilizada como apoio técnico, não substituindo a avaliação individual do paciente."
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
