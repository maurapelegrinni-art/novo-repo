import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Users as UsersIcon, UserPlus, ShieldCheck, ShieldOff, Loader2, AlertTriangle, Crown, User } from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL, type AppUser, type Role } from '../auth/types';
import BackupPanel from '../components/BackupPanel';

const inputCls =
  'w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all';

export default function Users() {
  const { user, createUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'assistant' as Role });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, 'uid'>) })));
    });
    return unsub;
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-2 text-sm">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <span>Apenas o administrador pode gerenciar usuários.</span>
      </div>
    );
  }

  const handleCreate = async () => {
    setError(''); setOkMsg('');
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Preencha nome, e-mail e senha (mín. 6 caracteres).');
      return;
    }
    setBusy(true);
    try {
      await createUser(form.name.trim(), form.email, form.password, form.role);
      setOkMsg(`Usuário ${form.name.trim()} criado.`);
      setForm({ name: '', email: '', password: '', role: 'assistant' });
    } catch (e) {
      setError(translateError(e));
    } finally {
      setBusy(false);
    }
  };

  const setActive = (u: AppUser, active: boolean) => updateDoc(doc(db, 'users', u.uid), { active });
  const setRole = (u: AppUser, role: Role) => updateDoc(doc(db, 'users', u.uid), { role });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><UsersIcon size={28} /> Usuários</h1>
        <p className="text-gray-500 mt-2">Administre quem acessa o sistema. Os dados clínicos são compartilhados por toda a equipe.</p>
      </header>

      {/* Criar usuário */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><UserPlus size={20} /> Novo usuário</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className={inputCls} placeholder="Nome (ex: Fabiano)" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="email" className={inputCls} placeholder="E-mail" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" />
          <input type="password" className={inputCls} placeholder="Senha (mín. 6)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="assistant">Assistente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2 text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
          </div>
        )}
        {okMsg && <div className="mt-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-sm">{okMsg}</div>}

        <div className="flex justify-end mt-4">
          <button onClick={handleCreate} disabled={busy}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />} Criar usuário
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Equipe</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.uid} className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                  {u.role === 'admin' ? <Crown size={18} /> : <User size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{u.name} {u.uid === user.uid && <span className="text-xs text-purple-600">(você)</span>}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email} · {ROLE_LABEL[u.role]} {u.active === false && <span className="text-red-500">· inativo</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select className="text-sm p-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  value={u.role} disabled={u.uid === user.uid}
                  onChange={(e) => setRole(u, e.target.value as Role)}>
                  <option value="assistant">Assistente</option>
                  <option value="admin">Administrador</option>
                </select>
                {u.active === false ? (
                  <button onClick={() => setActive(u, true)} title="Reativar"
                    className="text-xs flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-1.5 rounded-lg hover:bg-green-100">
                    <ShieldCheck size={15} /> Ativar
                  </button>
                ) : (
                  <button onClick={() => setActive(u, false)} disabled={u.uid === user.uid} title="Desativar"
                    className="text-xs flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 px-2 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-40">
                    <ShieldOff size={15} /> Desativar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Desativar bloqueia o acesso imediatamente sem apagar o histórico. A exclusão definitiva da conta de login é feita no Console do Firebase.
        </p>
      </div>

      <BackupPanel />
    </div>
  );
}

function translateError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'auth/email-already-in-use') return 'Este e-mail já está cadastrado.';
  if (code === 'auth/weak-password') return 'A senha deve ter ao menos 6 caracteres.';
  if (code === 'auth/invalid-email') return 'E-mail inválido.';
  return 'Não foi possível criar o usuário.';
}
