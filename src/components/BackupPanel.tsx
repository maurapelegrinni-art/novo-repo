import { useEffect, useState } from 'react';
import { DatabaseBackup, Download, History, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { createBackup, listBackups, restoreBackup, exportJson, type BackupMeta } from '../services/backup';
import { useAuth } from '../auth/AuthContext';

export default function BackupPanel() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const refresh = () => listBackups().then(setBackups).catch(() => {});
  useEffect(() => { refresh(); }, []);

  const doBackup = async () => {
    setBusy(true); setMsg(''); setError('');
    try {
      await createBackup(user?.name || 'Sistema');
      setMsg('Backup criado com sucesso.');
      await refresh();
    } catch {
      setError('Não foi possível criar o backup (verifique a conexão).');
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async (id: string) => {
    if (!confirm('Restaurar este backup substitui TODOS os dados atuais pela versão salva. Continuar?')) return;
    setBusy(true); setMsg(''); setError('');
    try {
      await restoreBackup(id);
      setMsg('Backup restaurado. Os dados foram substituídos.');
    } catch {
      setError('Falha ao restaurar o backup.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <DatabaseBackup size={20} /> Backup e Restauração
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Um backup automático é criado a cada 24h. Você também pode gerar um agora ou baixar uma cópia em JSON.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={doBackup} disabled={busy}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 className="animate-spin" size={18} /> : <DatabaseBackup size={18} />} Fazer backup agora
        </button>
        <button onClick={exportJson}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2">
          <Download size={18} /> Baixar JSON
        </button>
      </div>

      {msg && <div className="mb-3 bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-sm">{msg}</div>}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><History size={16} /> Backups recentes</h3>
      {backups.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum backup ainda.</p>
      ) : (
        <div className="space-y-2">
          {backups.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 border border-gray-100 rounded-xl p-3 text-sm">
              <div>
                <p className="font-medium text-gray-800">{new Date(b.createdAt).toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-500">
                  por {b.by} · {b.counts.pacientes} pacientes · {b.counts.sessoes} sessões · {b.counts.recebimentos} recebimentos
                </p>
              </div>
              <button onClick={() => doRestore(b.id)} disabled={busy}
                className="text-xs flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 disabled:opacity-50">
                <RotateCcw size={14} /> Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
