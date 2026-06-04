import { useState } from 'react';
import { ClipboardList, Activity, Bone, Brain, ActivitySquare } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Evaluation() {
  const [activeTab, setActiveTab] = useState<'triage' | 'functional'>('triage');
  const evaluation = useAppStore((state) => state.evaluation);
  const setEvaluation = useAppStore((state) => state.setEvaluation);

  const painLevels = ['Sem dor', 'Leve (1-3)', 'Moderada (4-7)', 'Grave (8-10)'];
  const gaitOptions = ['Normal', 'Claudicação Grau 1', 'Grau 2', 'Grau 3', 'Grau 4', 'Não deambula'];
  const postureOptions = ['Normal', 'Cifose', 'Desvio lateral', 'Base alargada', 'Membro poupado'];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Avaliação</h1>
        <p className="text-gray-500 mt-2">Registro de histórico e exame físico do paciente.</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'triage' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('triage')}
        >
          <ClipboardList size={18} />
          Histórico e Triagem
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'functional' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('functional')}
        >
          <Activity size={18} />
          Avaliação Funcional
        </button>
      </div>

      {activeTab === 'triage' ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Queixa Principal e Histórico</label>
              <textarea
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none h-48"
                placeholder="Descreva o motivo da consulta, tempo de evolução, tratamentos prévios..."
                value={evaluation.history}
                onChange={(e) => setEvaluation({ history: e.target.value })}
              ></textarea>
            </div>
            {/* Outros campos de triagem podem ser adicionados aqui (ex: medicações em uso, cirurgias prévias) */}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Dor */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ActivitySquare className="text-red-500" size={20} />
              Avaliação de Dor
            </h3>
            <div className="flex flex-wrap gap-2">
              {painLevels.map(level => (
                <button
                  key={level}
                  onClick={() => setEvaluation({ painLevel: level })}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    evaluation.painLevel === level 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Marcha e Postura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Bone className="text-orange-500" size={20} />
                Marcha
              </h3>
              <div className="flex flex-wrap gap-2">
                {gaitOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setEvaluation({ gait: opt })}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      evaluation.gait === opt 
                        ? 'bg-orange-50 border-orange-200 text-orange-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Bone className="text-blue-500" size={20} />
                Postura
              </h3>
              <div className="flex flex-wrap gap-2">
                {postureOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setEvaluation({ posture: opt })}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      evaluation.posture === opt 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Neurologico / Outros */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Brain className="text-purple-500" size={20} />
              Neurológico / Observações Adicionais
            </h3>
            <textarea
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none h-32"
              placeholder="Reflexos, déficits proprioceptivos, atrofias musculares severas..."
              value={evaluation.neuro}
              onChange={(e) => setEvaluation({ neuro: e.target.value })}
            ></textarea>
          </div>
        </div>
      )}
    </div>
  );
}
