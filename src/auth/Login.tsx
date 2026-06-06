import { useEffect, useState } from 'react';
import { LogIn, UserPlus, Loader2, Stethoscope, AlertTriangle } from 'lucide-react';
import { useAuth, bootstrapDone } from './AuthContext';

const inputCls =
  'w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all';

export default function Login() {
  const { login, bootstrapAdmin } = useAuth();
  const [mode, setMode] = useState<'login' | 'bootstrap'>('login');
  const [checking, setChecking] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    bootstrapDone().then((done) => {
      if (!done) setMode('bootstrap');
      setChecking(false);
    });
  }, []);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    if (mode === 'bootstrap' && !name.trim()) {
      setError('Informe o nome do administrador.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'bootstrap') {
        await bootstrapAdmin(name.trim(), email, password);
      } else {
        await login(email, password);
      }
    } catch (e) {
      setError(translateError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-purple-100 rounded-2xl text-purple-600 mb-3">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FisioVet — Pelegrinni</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'bootstrap' ? 'Primeiro acesso — criar administrador' : 'Acesso restrito à equipe'}
          </p>
        </div>

        {checking ? (
          <div className="flex justify-center py-8 text-gray-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : (
          <div className="space-y-4">
            {mode === 'bootstrap' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input className={inputCls} placeholder="Ex: Dra. Maura" value={name}
                  onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" className={inputCls} placeholder="email@clinica.com" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input type="password" className={inputCls} placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2 text-sm">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <button onClick={submit} disabled={busy}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="animate-spin" size={18} /> : mode === 'bootstrap' ? <UserPlus size={18} /> : <LogIn size={18} />}
              {mode === 'bootstrap' ? 'Criar administrador' : 'Entrar'}
            </button>

            {mode === 'login' && (
              <p className="text-xs text-gray-400 text-center">
                Novos usuários são criados pelo administrador, dentro do sistema.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function translateError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/weak-password':
      return 'A senha deve ter ao menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique sua internet.';
    default:
      return 'Não foi possível concluir. Verifique os dados e tente novamente.';
  }
}
