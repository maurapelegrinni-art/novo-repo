import { useState } from 'react';
import { FileText, Download, AlertTriangle } from 'lucide-react';
import {
  useAppStore,
  useCurrentPatient,
  useCurrentEvaluation,
  useCurrentPlan,
  tutorOf,
} from '../store/useAppStore';
import { generateEvaluationReportPDF, generateEvolutionReportPDF } from '../utils/pdfGenerator';
import { summarizeEvaluation, summarizeNeuro, examImpactLabel } from '../utils/summary';
import { getDosimetryFields } from '../constants/clinical';
import NoPatientNotice from '../components/NoPatientNotice';

type ReportKind = 'avaliacao' | 'evolucao';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportKind | null>(null);
  const [error, setError] = useState('');

  const patient = useCurrentPatient();
  const evaluation = useCurrentEvaluation();
  const plan = useCurrentPlan();
  const allExams = useAppStore((s) => s.exams);
  const allSessions = useAppStore((s) => s.sessions);
  const packages = useAppStore((s) => s.packages);

  if (!patient) return <NoPatientNotice />;

  const tutor = tutorOf(patient);
  const exams = allExams.filter((e) => e.patientId === patient.id);
  const sessions = allSessions.filter((s) => s.patientId === patient.id);
  const activePkg = packages.find((p) => p.patientId === patient.id && p.status === 'ativo');

  const evalItems = [...summarizeEvaluation(evaluation), ...summarizeNeuro(evaluation)];
  const contracted = activePkg?.sessionsContracted ?? 0;
  const done = sessions.length;

  const handleDownload = () => {
    setError('');
    try {
      if (selectedReport === 'avaliacao') generateEvaluationReportPDF();
      if (selectedReport === 'evolucao') generateEvolutionReportPDF();
    } catch (e) {
      console.error('[relatorio] falha ao gerar PDF', e);
      setError('Não foi possível gerar o PDF. ' + (e instanceof Error ? e.message : 'Erro inesperado.'));
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios Clínicos</h1>
        <p className="text-gray-500 mt-2">Gere documentos em PDF a partir dos dados registrados.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setSelectedReport('avaliacao')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            selectedReport === 'avaliacao'
              ? 'border-purple-500 bg-purple-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-purple-100 p-3 rounded-full text-purple-700">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Relatório de Avaliação</h3>
          </div>
          <p className="text-gray-500 text-sm">Identificação, histórico, avaliação funcional e neurológica, exames com impacto e plano terapêutico.</p>
        </button>

        <button
          onClick={() => setSelectedReport('evolucao')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            selectedReport === 'evolucao'
              ? 'border-emerald-500 bg-emerald-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-700">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Relatório de Evolução</h3>
          </div>
          <p className="text-gray-500 text-sm">Sessões realizadas com terapias e dosimetria, progresso do pacote e evolução clínica.</p>
        </button>
      </div>

      {selectedReport && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">
              Pré-visualização: {selectedReport === 'avaliacao' ? 'Avaliação' : 'Evolução'}
            </h3>
            <button
              onClick={handleDownload}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2 text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          {/* Pré-visualização */}
          <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 max-w-2xl mx-auto text-sm text-gray-700 space-y-4">
            <div className="text-center border-b border-gray-200 pb-3">
              <p className="font-bold text-purple-800 text-base">
                {selectedReport === 'avaliacao' ? 'RELATÓRIO DE AVALIAÇÃO' : 'RELATÓRIO DE EVOLUÇÃO'}
              </p>
              <p className="text-xs text-gray-500">Dra. Maura Pelegrinni - Fisioterapia Veterinária</p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">Identificação</p>
              <p>Tutor: {tutor?.name || '—'}</p>
              <p>Paciente: {patient.name || '—'} ({patient.species || '—'}, {patient.breed || '—'})</p>
              <p>Prontuário: {patient.prontuario}</p>
            </div>

            {selectedReport === 'avaliacao' ? (
              <>
                {evaluation.history && (
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Histórico</p>
                    <p className="whitespace-pre-wrap">{evaluation.history}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Avaliação funcional e neurológica</p>
                  {evalItems.length === 0 ? (
                    <p className="text-gray-400 italic">Não preenchida.</p>
                  ) : (
                    <ul className="list-disc list-inside space-y-0.5">
                      {evalItems.map((i) => (
                        <li key={i.label}><span className="font-medium">{i.label}:</span> {i.value}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Exames</p>
                  {exams.length === 0 ? (
                    <p className="text-gray-400 italic">Nenhum exame anexado.</p>
                  ) : (
                    <ul className="list-disc list-inside space-y-0.5">
                      {exams.map((e) => (
                        <li key={e.id}>{e.type} ({e.date || 's/ data'}) — {examImpactLabel(e.status)}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {plan.diagnosis && (
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Plano terapêutico</p>
                    <p>{plan.diagnosis}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Progresso do pacote</p>
                  <p>Sessões realizadas: {done}{contracted ? ` de ${contracted}` : ''}.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Sessões</p>
                  {sessions.length === 0 ? (
                    <p className="text-gray-400 italic">Nenhuma sessão registrada.</p>
                  ) : (
                    <ul className="space-y-2">
                      {[...sessions].sort((a, b) => a.number - b.number).map((s) => (
                        <li key={s.id} className="border-l-2 border-purple-200 pl-3">
                          <span className="font-medium">#{s.number} — {s.date}</span>
                          <div className="text-xs text-gray-600">
                            {s.therapies.map((t) => {
                              const fields = getDosimetryFields(t.modalityId);
                              const dose = Object.entries(t.dosimetry)
                                .filter(([, v]) => v)
                                .map(([k, v]) => `${fields.find((f) => f.key === k)?.label ?? k}: ${v}`)
                                .join('; ');
                              return (
                                <div key={t.id}>{t.name}{dose ? ` (${dose})` : ''}</div>
                              );
                            })}
                          </div>
                          {s.evolution && <p className="text-xs text-gray-500 mt-0.5">{s.evolution}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
