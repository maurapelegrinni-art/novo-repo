import { useState } from 'react';
import { Play, Copy, Calendar, Clock, Activity, MessageCircle, FileText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const MODALITIES = [
  { id: 'laser', label: 'Laserterapia', category: 'Eletrotermo' },
  { id: 'magneto', label: 'Magnetoterapia', category: 'Eletrotermo' },
  { id: 'ozonio', label: 'Ozonioterapia', category: 'Eletrotermo' },
  { id: 'acupuncture', label: 'Acupuntura', category: 'MTC' },
  { id: 'massage', label: 'Massoterapia', category: 'Cinesio' },
  { id: 'stretching', label: 'Alongamento', category: 'Cinesio' },
  { id: 'prom', label: 'PROM', category: 'Cinesio' },
  { id: 'treadmill', label: 'Esteira Aquática', category: 'Hidro' },
  { id: 'cavaletti', label: 'Cavaletti', category: 'Funcional' },
  { id: 'proprioception', label: 'Propriocepção', category: 'Neurológico' },
];

export default function Sessions() {
  const sessions = useAppStore((state) => state.sessions);
  const addSession = useAppStore((state) => state.addSession);
  
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    date: new Date().toISOString().split('T')[0],
    number: (sessions.length + 1).toString(),
    therapies: [] as any[],
    intensity: '',
    duration: '',
    region: '',
    evolution: '',
    tutorFeedback: ''
  });

  const toggleTherapy = (id: string) => {
    setCurrentSession(prev => {
      const exists = prev.therapies.find((t: any) => t.id === id);
      let newTherapies;
      if (exists) {
        newTherapies = prev.therapies.filter((t: any) => t.id !== id);
      } else {
        const mod = MODALITIES.find(m => m.id === id);
        newTherapies = [...prev.therapies, { id, name: mod ? mod.label : id, dosimetry: {} }];
      }
      return { ...prev, therapies: newTherapies };
    });
  };

  const handleSave = () => {
    addSession({
      id: Math.random().toString(36).substring(7),
      ...currentSession,
      therapies: currentSession.therapies.map((t: any) => ({
        id: t.id,
        name: t.name,
        dosimetry: t.dosimetry
      }))
    });
    setIsRecording(false);
    setCurrentSession({
      date: new Date().toISOString().split('T')[0],
      number: (sessions.length + 2).toString(),
      therapies: [],
      intensity: '',
      duration: '',
      region: '',
      evolution: '',
      tutorFeedback: ''
    });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessões</h1>
          <p className="text-gray-500 mt-2">Registro rápido de atendimento diário.</p>
        </div>
        {!isRecording && (
          <button 
            onClick={() => setIsRecording(true)}
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
                  value={currentSession.date}
                  onChange={(e) => setCurrentSession({...currentSession, date: e.target.value})}
                />
              </div>
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold">
                Sessão #{currentSession.number}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Modalidades */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Activity size={18} className="text-purple-500" />
                Modalidades Realizadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {MODALITIES.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => toggleTherapy(mod.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      currentSession.therapies.find((t: any) => t.id === mod.id)
                        ? 'bg-purple-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-purple-50'
                    }`}
                  >
                    {mod.label}
                  </button>
                ))}
                {/* Dosimetry inputs for each selected therapy */}
                {currentSession.therapies.map((therapy: any) => (
                  <div key={therapy.id} className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <label className="block text-xs font-medium text-gray-500 mb-1">{therapy.name} - Dosimetria</label>
                    <input
                      type="text"
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-sm"
                      placeholder="Ex: 5 J/cm²"
                      value={therapy.dosimetry.value || ''}
                      onChange={e => {
                        const newDos = e.target.value;
                        setCurrentSession(prev => ({
                          ...prev,
                          therapies: prev.therapies.map((t: any) =>
                            t.id === therapy.id ? { ...t, dosimetry: { value: newDos } } : t
                          )
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Expansão Rápida para detalhes se houver modalidade selecionada */}
            {currentSession.therapies.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl animate-fade-in">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Intensidade / Dose</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-sm"
                    placeholder="Ex: 4 J/cm²"
                    value={currentSession.intensity}
                    onChange={(e) => setCurrentSession({...currentSession, intensity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Duração</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <input 
                      type="text" 
                      className="w-full p-2 pl-8 bg-white border border-gray-200 rounded-lg outline-none text-sm"
                      placeholder="Ex: 15 min"
                      value={currentSession.duration}
                      onChange={(e) => setCurrentSession({...currentSession, duration: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Região Aplicada</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-sm"
                    placeholder="Ex: Lombar, Joelho D"
                    value={currentSession.region}
                    onChange={(e) => setCurrentSession({...currentSession, region: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Evolução */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Evolução Clínica do Dia
              </h3>
              <textarea
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                placeholder="Como o paciente respondeu ao tratamento hoje? Houve melhora na marcha? Demonstrou dor?"
                value={currentSession.evolution}
                onChange={(e) => setCurrentSession({...currentSession, evolution: e.target.value})}
              ></textarea>
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
                value={currentSession.tutorFeedback}
                onChange={(e) => setCurrentSession({...currentSession, tutorFeedback: e.target.value})}
              ></textarea>
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
                className="px-5 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Copy size={18} />
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

        {sessions.map(session => (
          <div key={session.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  #{session.number}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{session.date}</h3>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {session.modalities.map(m => {
                      const mod = MODALITIES.find(x => x.id === m);
                      return (
                        <span key={m} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {mod ? mod.label : m}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="font-medium block mb-1">Evolução:</span>
              {session.evolution || "Sem registro de evolução."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
