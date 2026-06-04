import { User, Dog, Phone, Mail, FileText, Weight, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Identification() {
  const patient = useAppStore((state) => state.patient);
  const setPatient = useAppStore((state) => state.setPatient);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Identificação</h1>
        <p className="text-gray-500 mt-2">Cadastre os dados do tutor e do paciente para iniciar o atendimento.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tutor Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
              <User size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Dados do Tutor</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Ex: João da Silva"
                value={patient.tutorName}
                onChange={(e) => setPatient({ tutorName: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="000.000.000-00"
                  value={patient.tutorCpf}
                  onChange={(e) => setPatient({ tutorCpf: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone/WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="tel"
                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="(11) 99999-9999"
                    value={patient.tutorPhone}
                    onChange={(e) => setPatient({ tutorPhone: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="email"
                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="joao@email.com"
                    value={patient.tutorEmail}
                    onChange={(e) => setPatient({ tutorEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <Dog size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Dados do Paciente</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Paciente</label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Ex: Rex"
                value={patient.patientName}
                onChange={(e) => setPatient({ patientName: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  value={patient.patientSpecies}
                  onChange={(e) => setPatient({ patientSpecies: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Canina">Canina</option>
                  <option value="Felina">Felina</option>
                  <option value="Silvestre">Silvestre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Golden Retriever"
                  value={patient.patientBreed}
                  onChange={(e) => setPatient({ patientBreed: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idade/Nascimento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ex: 5 anos"
                    value={patient.patientAge}
                    onChange={(e) => setPatient({ patientAge: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <div className="relative">
                  <Weight className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="0.0"
                    value={patient.patientWeight}
                    onChange={(e) => setPatient({ patientWeight: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
