import { useRef, useState } from 'react';
import {
  FileUp, Plus, FileText, Calendar, Trash2, Paperclip, MessageCircle,
  Eye, Download, File, Image as ImageIcon, Film, FileSpreadsheet, Loader2,
} from 'lucide-react';
import { useAppStore, useCurrentPatient, type Exam } from '../store/useAppStore';
import {
  uploadFile, getFileURL, deleteFile, deleteFromStorage, syncPendingUploads,
  isAccepted, ACCEPT_ATTR, DEFAULT_MAX_FILE_MB, formatBytes, kindOf, type FileKind,
} from '../services/fileStorage';
import FilePreview from '../components/FilePreview';
import NoPatientNotice from '../components/NoPatientNotice';

const newId = () => Math.random().toString(36).substring(2, 9);

const kindIcon = (k: FileKind) => {
  if (k === 'image') return <ImageIcon size={18} className="text-blue-500" />;
  if (k === 'video') return <Film size={18} className="text-rose-500" />;
  if (k === 'sheet') return <FileSpreadsheet size={18} className="text-green-600" />;
  if (k === 'pdf') return <FileText size={18} className="text-red-500" />;
  return <File size={18} className="text-gray-500" />;
};

export default function Exams() {
  const patient = useCurrentPatient();
  const allExams = useAppStore((s) => s.exams);
  const addExam = useAppStore((s) => s.addExam);
  const removeExam = useAppStore((s) => s.removeExam);
  const updateExam = useAppStore((s) => s.updateExam);
  const addExamFile = useAppStore((s) => s.addExamFile);
  const removeExamFile = useAppStore((s) => s.removeExamFile);

  const [newExam, setNewExam] = useState({ date: '', type: '', description: '', findings: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [maxMB, setMaxMB] = useState(DEFAULT_MAX_FILE_MB);
  const [uploadingExamId, setUploadingExamId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ fileId: string; name: string; url?: string } | null>(null);
  // input oculto por exame: { examId -> ref }
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!patient) return <NoPatientNotice />;

  const exams = allExams.filter((e) => e.patientId === patient.id);

  const handleAdd = () => {
    if (!newExam.type) return;
    addExam({
      date: newExam.date || new Date().toISOString().split('T')[0],
      type: newExam.type,
      description: newExam.description,
      findings: newExam.findings,
      status: '',
    });
    setNewExam({ date: '', type: '', description: '', findings: '' });
    setIsAdding(false);
  };

  const handleFiles = async (examId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingExamId(examId);
    try {
      for (const file of Array.from(fileList)) {
        if (!isAccepted(file.name)) {
          alert(`Tipo de arquivo não suportado: ${file.name}`);
          continue;
        }
        if (file.size > maxMB * 1024 * 1024) {
          alert(`Arquivo acima do limite de ${maxMB} MB: ${file.name}`);
          continue;
        }
        const id = newId();
        await uploadFile(id, file);
        addExamFile(examId, {
          id,
          name: file.name,
          mime: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }
    } finally {
      setUploadingExamId(null);
      // envia ao Firebase Storage em segundo plano (quando houver conexão)
      syncPendingUploads().catch(() => {});
    }
  };

  const handleDownload = async (fileId: string, name: string, fallbackUrl?: string) => {
    const url = await getFileURL(fileId, fallbackUrl);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDeleteFile = async (exam: Exam, file: { id: string; storagePath?: string }) => {
    await deleteFile(file.id);
    if (file.storagePath) await deleteFromStorage(file.storagePath);
    removeExamFile(exam.id, file.id);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exames</h1>
          <p className="text-gray-500 mt-2">Dados e arquivos (PDF, imagens, vídeos, documentos) de {patient.name}.</p>
        </div>
        <button onClick={() => setIsAdding(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
          <Plus size={20} /> <span className="hidden sm:inline">Novo Exame</span>
        </button>
      </header>

      {/* Config de tamanho máximo */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Tamanho máximo por arquivo:</span>
        <input type="number" min={1} value={maxMB}
          onChange={(e) => setMaxMB(parseInt(e.target.value) || DEFAULT_MAX_FILE_MB)}
          className="w-20 p-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
        <span>MB</span>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 mb-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Adicionar Exame</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data do Exame</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input type="date" className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  value={newExam.date} onChange={(e) => setNewExam({ ...newExam, date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Exame</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                value={newExam.type} onChange={(e) => setNewExam({ ...newExam, type: e.target.value })}>
                <option value="">Selecione...</option>
                <option value="Raio-X">Raio-X</option>
                <option value="Ultrassom">Ultrassom</option>
                <option value="Hemograma">Hemograma</option>
                <option value="Tomografia">Tomografia</option>
                <option value="Ressonância">Ressonância</option>
                <option value="Vídeo de marcha">Vídeo de marcha</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta</label>
            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: RX de Coluna Cervical" value={newExam.description}
              onChange={(e) => setNewExam({ ...newExam, description: e.target.value })} />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Principais Achados (Laudo)</label>
            <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
              placeholder="Descreva os achados relevantes do laudo..." value={newExam.findings}
              onChange={(e) => setNewExam({ ...newExam, findings: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setIsAdding(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">Cancelar</button>
            <button onClick={handleAdd}
              className="px-5 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors flex items-center gap-2">
              <FileUp size={18} /> Salvar Exame
            </button>
          </div>
        </div>
      )}

      {/* Lista de exames */}
      <div className="space-y-6">
        {exams.length === 0 && !isAdding && (
          <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-gray-900 font-medium text-lg">Nenhum exame anexado</h3>
            <p className="text-gray-500 mt-1">Clique em "Novo Exame" para adicionar registros.</p>
          </div>
        )}

        {exams.map((exam) => (
          <div key={exam.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></div>
                <div>
                  <h3 className="font-semibold text-gray-800">{exam.type}</h3>
                  <p className="text-xs text-gray-500">{exam.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={exam.includeInReport}
                    onChange={(e) => updateExam(exam.id, { includeInReport: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded" />
                  Incluir no relatório
                </label>
                <button onClick={() => removeExam(exam.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {exam.description && <p className="text-sm font-medium text-gray-700 mb-2">{exam.description}</p>}
            <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600 mb-4">
              {exam.findings || 'Sem achados descritos.'}
            </div>

            {/* Arquivos anexados */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Paperclip size={16} /> Arquivos Anexados ({exam.files.length})
                </h4>
                <div className="flex gap-2">
                  <input
                    ref={(el) => { fileInputs.current[exam.id] = el; }}
                    type="file" multiple accept={ACCEPT_ATTR} className="hidden"
                    onChange={(e) => { handleFiles(exam.id, e.target.files); e.target.value = ''; }}
                  />
                  <button onClick={() => fileInputs.current[exam.id]?.click()}
                    disabled={uploadingExamId === exam.id}
                    className="text-sm bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-50">
                    {uploadingExamId === exam.id ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />}
                    Selecionar Arquivo
                  </button>
                  <button onClick={() => fileInputs.current[exam.id]?.click()}
                    disabled={uploadingExamId === exam.id}
                    className="text-sm bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-50">
                    <MessageCircle size={15} /> Importar do WhatsApp
                  </button>
                </div>
              </div>

              {exam.files.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum arquivo. Aceita: PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX, MP4.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {exam.files.map((f) => (
                    <div key={f.id} className="border border-gray-200 rounded-xl p-3 flex items-start gap-3">
                      <div className="mt-0.5">{kindIcon(kindOf(f.name))}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate" title={f.name}>{f.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {new Date(f.uploadedAt).toLocaleDateString('pt-BR')} · {formatBytes(f.size)} · {kindOf(f.name).toUpperCase()}
                        </p>
                        <div className="flex gap-3 mt-2">
                          <button onClick={() => setPreview({ fileId: f.id, name: f.name, url: f.url })}
                            className="text-xs text-purple-700 hover:underline flex items-center gap-1"><Eye size={13} /> Visualizar</button>
                          <button onClick={() => handleDownload(f.id, f.name, f.url)}
                            className="text-xs text-blue-700 hover:underline flex items-center gap-1"><Download size={13} /> Baixar</button>
                          <button onClick={() => handleDeleteFile(exam, f)}
                            className="text-xs text-red-600 hover:underline flex items-center gap-1"><Trash2 size={13} /> Excluir</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {preview && <FilePreview fileId={preview.fileId} name={preview.name} url={preview.url} onClose={() => setPreview(null)} />}
    </div>
  );
}
