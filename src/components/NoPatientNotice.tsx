import { UserSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Aviso exibido quando nenhum paciente está selecionado. */
export default function NoPatientNotice() {
  const navigate = useNavigate();
  return (
    <div className="py-16 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
      <UserSearch className="mx-auto text-gray-300 mb-3" size={48} />
      <h3 className="text-gray-900 font-medium text-lg">Nenhum paciente selecionado</h3>
      <p className="text-gray-500 mt-1 mb-4">Selecione ou cadastre um paciente para continuar.</p>
      <button
        onClick={() => navigate('/identificacao')}
        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
      >
        Ir para Identificação
      </button>
    </div>
  );
}
