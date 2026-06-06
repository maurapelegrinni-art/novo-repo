import { useState } from 'react';
import { Play, Save, Calendar, Activity, MessageCircle, FileText, Trash2, MapPin } from 'lucide-react';
import { useAppStore, useCurrentPatient, type Therapy } from '../store/useAppStore';
import { MODALITIES, getDosimetryFields } from '../constants/clinical';
import NoPatientNotice from '../components/NoPatientNotice';

const newId = () => Math.random().toString(36).substring(2, 9);

interface DraftSession {
  date: string;
  therapies: Therapy[];
  region: string;
  evolution: string;
  tutorFeedback: string;
}

const emptyDraft = (): DraftSession => ({
  date: new Date().toISOString().split('T')[0],
  therapies: [],
  region: '',
  evolution: '',
  tutorFeedback: '',
});

export default function Sessions() {
  const patient = useCurrentPatient();
  const allSessions = useAppStore((state) => state.sessions);
  const addSession = useAppStore((state) => state.addSession);
  const removeSession = useAppStore((state) => state.removeSession);

  const [isRecording, setIsRecording] = useState(false);
  const [draft, setDraft] = useState<DraftSession>(emptyDraft());

  const sessions = allSessions.filter((s) => s.patientId === patient?.id);

  // Numeração robusta: próximo número = maior número existente + 1 (por paciente).
  const nextNumber = sessions.reduce((max, s) => Math.max(max, s.number), 0) + 1;

  if (!patient) return <NoPatientNotice />;

  const startSession = () => {
    setDraft(emptyDraft());
    setIsRecording(true);
  };

  const isSelected = (modalityId: string) => draft.therapies.some((t) => t.modalityId === modalityId);

  const toggleTherapy = (modalityId: string) => {
    setDraft((prev) => {
      if (prev.therapies.some((t) => t.modalityId === modalityId)) {
        return { ...prev, therapies: prev.therapies.filter((t) => t.modalityId !== modalityId) };
      }
      const mod = MODALITIES.find((m) => m.id === modalityId);
      const therapy: Therapy = {
        id: newId(),
        modalityId,
        name: mod ? mod.label : modalityId,
        dosimetry: {},
      };
      return { ...prev, therapies: [...prev.therapies, therapy] };
    });
  };

  const setDosimetry = (therapyId: string, key: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      therapies: prev.therapies.map((t) =>
        t.id === therapyId ? { ...t, dosimetry: { ...t.dosimetry, [key]: value } } : t
      ),
    }));
  };

  const handleSave = () => {
    if (draft.therapies.length === 0) return;
    addSession({
      date: draft.date,
      therapies: draft.therapies,
      region: draft.region,
      evolution: draft.evolution,
      tutorFeedback: draft.tutorFeedback,
    });
    setIsRecording(false);
    setDraft(emptyDraft());
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessões</h1>
          <p className="text-gray-500 mt-2">Registro de atendimento com múltiplas terapias e dosimetria individual.</p>
        </div>
        {!isRecording && (
          <button
            onClick={startSession}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Play size={20} />
            <span className="hidden sm:inline">Iniciar Sessão</span>
          </button>
        )}
      </header>

      {isRecording && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100 mb-6 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-500"></div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Sessão em Andamento</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Calendar size={16} />
                <input
                  type="date"
                  className="outline-none bg-transparent"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </div>
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold">
                Sessão #{nextNumber}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Seleção de terapias */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Activity size={18} className="text-purple-500" />
                Terapias Realizadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {MODALITIES.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => toggleTherapy(mod.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isSelected(mod.id)
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-purple-50'
                    }`}
                  >
                    {mod.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dosimetria individual por terapia */}
            {draft.therapies.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" />
                  Dosimetria por Terapia
                </h3>
                {draft.therapies.map((therapy) => {
                  const fields = getDosimetryFields(therapy.modalityId);
                  return (
                    <div key={therapy.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="font-semibold text-gray-800 mb-3">{therapy.name}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {fields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                            <input
                              type="text"
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500"
                              placeholder={field.placeholder}
                              value={therapy.dosimetry[field.key] || ''}
                              onChange={(e) => setDosimetry(therapy.id, field.key, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Região aplicada (geral) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                Região Tratada (geral)
              </label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: Coluna lombar, joelho direito"
                value={draft.region}
                onChange={(e) => setDraft({ ...draft, region: e.target.value })}
              />
            </div>

            {/* Evolução */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Evolução Clínica do Dia
              </h3>
              <textarea
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                placeholder="Como o paciente respondeu ao tratamento hoje? Houve melhora na marcha? Demonstrou dor?"
                value={draft.evolution}
                onChange={(e) => setDraft({ ...draft, evolution: e.target.value })}
              />
            </div>

            {/* Feedback do Tutor */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MessageCircle size={18} className="text-green-500" />
                Feedback do Tutor (Em Casa)
              </h3>
              <textarea
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-16"
                placeholder="Relato de melhora, cansaço pós-sessão, etc."
                value={draft.tutorFeedback}
                onChange={(e) => setDraft({ ...draft, tutorFeedback: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsRecording(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={draft.therapies.length === 0}
                className="px-5 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                Finalizar e Salvar Sessão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Sessões */}
      <div className="space-y-4">
        {sessions.length === 0 && !isRecording && (
          <div className="py-12 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
            <Activity className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-gray-900 font-medium text-lg">Nenhuma sessão registrada</h3>
            <p className="text-gray-500 mt-1">Clique em "Iniciar Sessão" para começar.</p>
          </div>
        )}

        {[...sessions]
          .sort((a, b) => b.number - a.number)
          .map((session) => (
            <div key={session.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    #{session.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{session.date}</h3>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {session.therapies.map((t) => (
                        <span key={t.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeSession(session.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Remover sessão"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Dosimetria registrada por terapia */}
              {session.therapies.some((t) => Object.values(t.dosimetry).some(Boolean)) && (
                <div className="mb-3 space-y-2">
                  {session.therapies.map((t) => {
                    const entries = Object.entries(t.dosimetry).filter(([, v]) => v);
                    if (entries.length === 0) return null;
                    const fields = getDosimetryFields(t.modalityId);
                    const labelFor = (k: string) => fields.find((f) => f.key === k)?.label ?? k;
                    return (
                      <p key={t.id} className="text-xs text-gray-600">
                        <span className="font-medium text-gray-700">{t.name}:</span>{' '}
                        {entries.map(([k, v]) => `${labelFor(k)}: ${v}`).join(' · ')}
                      </p>
                    );
                  })}
                </div>
              )}

              {session.region && (
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin size={12} /> {session.region}
                </p>
              )}

              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-medium block mb-1">Evolução:</span>
                {session.evolution || 'Sem registro de evolução.'}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
