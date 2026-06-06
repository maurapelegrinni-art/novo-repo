import { useMemo, useState } from 'react';
import {
  User, Dog, Phone, Mail, FileText, Weight, Calendar, Search, Plus, Trash2,
  IdCard, MessageCircle, CheckCircle2, AlertTriangle, Cat,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SPECIES, SEX_OPTIONS, breedsForSpecies } from '../constants/registry';
import { searchPatients } from '../utils/search';

interface FormState {
  editingPatientId: string | null;
  tutorId: string | null;
  // tutor
  tutorName: string;
  cpf: string;
  phone: string;
  whatsapp: string;
  email: string;
  // patient
  patientName: string;
  species: string;
  breed: string;
  sex: string;
  birthDate: string;
  microchip: string;
  weight: string;
}

const blankForm = (): FormState => ({
  editingPatientId: null,
  tutorId: null,
  tutorName: '', cpf: '', phone: '', whatsapp: '', email: '',
  patientName: '', species: '', breed: '', sex: '', birthDate: '', microchip: '', weight: '',
});

const inputCls = 'w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all';

export default function Identification() {
  const tutors = useAppStore((s) => s.tutors);
  const patients = useAppStore((s) => s.patients);
  const payments = useAppStore((s) => s.payments);
  const packages = useAppStore((s) => s.packages);
  const currentPatientId = useAppStore((s) => s.currentPatientId);
  const setCurrentPatient = useAppStore((s) => s.setCurrentPatient);
  const upsertTutor = useAppStore((s) => s.upsertTutor);
  const addPatient = useAppStore((s) => s.addPatient);
  const updatePatient = useAppStore((s) => s.updatePatient);
  const removePatient = useAppStore((s) => s.removePatient);
  const findTutorByCpf = useAppStore((s) => s.findTutorByCpf);

  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(blankForm());

  const hits = useMemo(() => searchPatients(query, patients, tutors), [query, patients, tutors]);

  // Raças mais usadas (favoritos aprendidos).
  const favoriteBreeds = useMemo(() => {
    const counts = new Map<string, number>();
    patients.forEach((p) => p.breed && counts.set(p.breed, (counts.get(p.breed) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([b]) => b);
  }, [patients]);

  // Tutor já existente para o CPF digitado (dedupe).
  const existingTutor = form.cpf ? findTutorByCpf(form.cpf) : undefined;
  const isLinkingExisting = existingTutor && existingTutor.id !== form.tutorId;

  const loadPatient = (patientId: string) => {
    const p = patients.find((x) => x.id === patientId);
    if (!p) return;
    const t = tutors.find((x) => x.id === p.tutorId);
    setCurrentPatient(patientId);
    setForm({
      editingPatientId: p.id,
      tutorId: t?.id ?? null,
      tutorName: t?.name ?? '', cpf: t?.cpf ?? '', phone: t?.phone ?? '',
      whatsapp: t?.whatsapp ?? '', email: t?.email ?? '',
      patientName: p.name, species: p.species, breed: p.breed, sex: p.sex,
      birthDate: p.birthDate, microchip: p.microchip, weight: p.weight,
    });
  };

  const startNew = () => {
    setForm(blankForm());
    setCurrentPatient(null);
  };

  const handleSave = () => {
    if (!form.patientName.trim() || !form.tutorName.trim() || !form.cpf.trim()) return;
    const tutorId = upsertTutor({
      id: form.tutorId ?? undefined,
      name: form.tutorName, cpf: form.cpf, phone: form.phone,
      whatsapp: form.whatsapp, email: form.email,
    });
    const patientData = {
      tutorId,
      name: form.patientName, species: form.species, breed: form.breed, sex: form.sex,
      birthDate: form.birthDate, microchip: form.microchip, weight: form.weight,
    };
    if (form.editingPatientId) {
      updatePatient(form.editingPatientId, patientData);
      setForm({ ...form, tutorId });
    } else {
      const id = addPatient(patientData);
      loadPatient(id);
    }
  };

  const handleDelete = () => {
    if (form.editingPatientId) {
      removePatient(form.editingPatientId);
      startNew();
    }
  };

  // Painel do responsável (tutor do paciente em edição).
  const panelTutor = form.tutorId ? tutors.find((t) => t.id === form.tutorId) : undefined;
  const tutorPatients = panelTutor ? patients.filter((p) => p.tutorId === panelTutor.id) : [];
  const tutorPayments = panelTutor ? payments.filter((p) => p.tutorId === panelTutor.id) : [];
  const totalSpent = tutorPayments.reduce((sum, p) => sum + p.gross + p.displacement, 0);
  const tutorPatientIds = new Set(tutorPatients.map((p) => p.id));
  const tutorPackages = packages.filter((pk) => tutorPatientIds.has(pk.patientId));
  const activePkgs = tutorPackages.filter((p) => p.status === 'ativo').length;
  const donePkgs = tutorPackages.filter((p) => p.status === 'concluido').length;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Identificação</h1>
        <p className="text-gray-500 mt-2">Cadastro e localização de pacientes. O CPF do responsável é o identificador principal.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: busca + lista */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Buscar paciente, tutor, CPF, telefone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            onClick={startNew}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Novo Paciente
          </button>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {hits.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum paciente encontrado.</p>
            )}
            {hits.map(({ patient, tutor }) => (
              <button
                key={patient.id}
                onClick={() => loadPatient(patient.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  currentPatientId === patient.id
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {patient.species === 'Felino' ? <Cat size={16} className="text-gray-500" /> : <Dog size={16} className="text-gray-500" />}
                  <span className="font-medium text-gray-800">{patient.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Tutor: {tutor?.name || '—'}</p>
                <p className="text-[11px] text-gray-400">{patient.prontuario}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Coluna direita: formulário + painel */}
        <div className="lg:col-span-2 space-y-6">
          {isLinkingExisting && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-2 text-sm">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>
                Responsável já cadastrado: <strong>{existingTutor!.name}</strong>. Ao salvar, este paciente será
                vinculado ao cadastro existente (mesmo CPF).
              </span>
            </div>
          )}

          {/* Tutor */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><User size={24} /></div>
              <h2 className="text-xl font-semibold text-gray-800">Dados do Responsável</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input className={inputCls} placeholder="Ex: João da Silva"
                  value={form.tutorName} onChange={(e) => setForm({ ...form, tutorName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF (identificador)</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input className={`${inputCls} pl-10`} placeholder="000.000.000-00"
                      value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input className={`${inputCls} pl-10`} placeholder="(35) 99999-9999"
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input className={`${inputCls} pl-10`} placeholder="(35) 99999-9999"
                      value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input className={`${inputCls} pl-10`} placeholder="joao@email.com"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paciente */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Dog size={24} /></div>
                <h2 className="text-xl font-semibold text-gray-800">Dados do Paciente</h2>
              </div>
              {form.editingPatientId && (
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {patients.find((p) => p.id === form.editingPatientId)?.prontuario}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Paciente</label>
                <input className={inputCls} placeholder="Ex: Meg"
                  value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
                  <select className={inputCls} value={form.species}
                    onChange={(e) => setForm({ ...form, species: e.target.value, breed: '' })}>
                    <option value="">Selecione...</option>
                    {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
                  <input className={inputCls} list="breed-options" placeholder="Digite ou selecione..."
                    value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
                  <datalist id="breed-options">
                    {breedsForSpecies(form.species).map((b) => <option key={b} value={b} />)}
                  </datalist>
                  {favoriteBreeds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {favoriteBreeds.map((b) => (
                        <button key={b} type="button" onClick={() => setForm({ ...form, breed: b })}
                          className="text-[11px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100">
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select className={inputCls} value={form.sex}
                    onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                    <option value="">Selecione...</option>
                    {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input type="date" className={`${inputCls} pl-10`}
                      value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Microchip (opcional)</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input className={`${inputCls} pl-10`} placeholder="000000000000000"
                      value={form.microchip} onChange={(e) => setForm({ ...form, microchip: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input type="number" step="0.1" className={`${inputCls} pl-10`} placeholder="0.0"
                      value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 mt-2 border-t border-gray-100">
              {form.editingPatientId && (
                <button onClick={handleDelete}
                  className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors flex items-center gap-2">
                  <Trash2 size={18} /> Excluir
                </button>
              )}
              <button onClick={handleSave}
                disabled={!form.patientName.trim() || !form.tutorName.trim() || !form.cpf.trim()}
                className="px-5 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <CheckCircle2 size={18} /> {form.editingPatientId ? 'Salvar Alterações' : 'Cadastrar Paciente'}
              </button>
            </div>
          </div>

          {/* Painel do responsável */}
          {panelTutor && (
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><User size={20} /> Painel do Responsável</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Metric label="Total gasto" value={`R$ ${totalSpent.toFixed(2)}`} />
                <Metric label="Pacientes" value={String(tutorPatients.length)} />
                <Metric label="Pacotes ativos" value={String(activePkgs)} />
                <Metric label="Recibos emitidos" value={String(tutorPayments.length)} />
              </div>
              <p className="text-xs text-purple-200 mb-2">Pacotes concluídos: {donePkgs}</p>
              <div className="flex flex-wrap gap-2">
                {tutorPatients.map((p) => (
                  <button key={p.id} onClick={() => loadPatient(p.id)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      p.id === currentPatientId ? 'bg-white text-purple-800 font-semibold' : 'bg-white/10 hover:bg-white/20'
                    }`}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 p-3 rounded-xl border border-white/20">
      <span className="block text-purple-200 text-xs mb-1">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
