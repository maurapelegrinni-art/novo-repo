import { useState } from 'react';
import { FileUp, Plus, FileText, Calendar, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Exams() {
  const exams = useAppStore((state) => state.exams);
  const addExam = useAppStore((state) => state.addExam);
  const removeExam = useAppStore((state) => state.removeExam);

  const [newExam, setNewExam] = useState({ date: '', type: '', description: '', findings: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newExam.type) return;
    
    addExam({
      id: Math.random().toString(36).substring(7),
      date: newExam.date || new Date().toISOString().split('T')[0],
      type: newExam.type,
      description: newExam.description,
      findings: newExam.findings,
      status: ''
    });
    
    setNewExam({ date: '', type: '', description: '', findings: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exames</h1>
          <p className="text-gray-500 mt-2">Anexos e laudos complementares.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Novo Exame</span>
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 mb-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Adicionar Exame</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data do Exame</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="date"
                  className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  value={newExam.date}
                  onChange={(e) => setNewExam({...newExam, date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Exame</label>
              <select
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                value={newExam.type}
                onChange={(e) => setNewExam({...newExam, type: e.target.value})}
              >
                <option value="">Selecione...</option>
                <option value="Raio-X">Raio-X</option>
                <option value="Ultrassom">Ultrassom</option>
                <option value="Hemograma">Hemograma</option>
                <option value="Tomografia">Tomografia</option>
                <option value="Ressonância">Ressonância</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta</label>
            <input
              type="text"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: RX de Coluna Cervical"
              value={newExam.description}
              onChange={(e) => setNewExam({...newExam, description: e.target.value})}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Principais Achados (Laudo)</label>
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
              placeholder="Descreva os achados relevantes do laudo..."
              value={newExam.findings}
              onChange={(e) => setNewExam({...newExam, findings: e.target.value})}
            ></textarea>
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAdd}
              className="px-5 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <FileUp size={18} />
              Salvar Exame
            </button>
          </div>
        </div>
      )}

      {/* Lista de Exames */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {exams.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-gray-900 font-medium text-lg">Nenhum exame anexado</h3>
            <p className="text-gray-500 mt-1">Clique em "Novo Exame" para adicionar registros.</p>
          </div>
        )}

        {exams.map(exam => (
          <div key={exam.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{exam.type}</h3>
                  <p className="text-xs text-gray-500">{exam.date}</p>
                </div>
              </div>
              <button 
                onClick={() => removeExam(exam.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">{exam.description}</p>
            <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600 line-clamp-3">
              {exam.findings || "Sem achados descritos."}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
