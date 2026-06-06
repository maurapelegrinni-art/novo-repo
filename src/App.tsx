import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, ShieldOff, AlertTriangle, LogOut } from 'lucide-react';
import Layout from './components/Layout';
import Identification from './pages/Identification';
import Evaluation from './pages/Evaluation';
import Exams from './pages/Exams';
import Plan from './pages/Plan';
import Sessions from './pages/Sessions';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Login from './auth/Login';
import { useAuth } from './auth/AuthContext';
import { firebaseConfigured } from './firebase/config';
import { startSync, stopSync } from './services/sync';
import { syncPendingUploads } from './services/fileStorage';
import { autoBackup } from './services/backup';

function App() {
  const { user, ready, blocked, logout } = useAuth();

  // Inicia a sincronização e tarefas de fundo quando há usuário autenticado.
  useEffect(() => {
    if (!user) return;
    startSync();
    autoBackup(user.name).catch(() => {});
    const trySync = () => syncPendingUploads().catch(() => {});
    trySync();
    window.addEventListener('online', trySync);
    return () => {
      window.removeEventListener('online', trySync);
      stopSync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  if (!firebaseConfigured) return <ConfigNotice />;
  if (!ready) return <FullScreenSpinner />;
  if (blocked) return <Blocked onLogout={logout} />;
  if (!user) return <Login />;

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/identificacao" replace />} />
          <Route path="/identificacao" element={<Identification />} />
          <Route path="/avaliacao" element={<Evaluation />} />
          <Route path="/exames" element={<Exams />} />
          <Route path="/plano" element={<Plan />} />
          <Route path="/sessoes" element={<Sessions />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route
            path="/usuarios"
            element={user.role === 'admin' ? <Users /> : <Navigate to="/identificacao" replace />}
          />
          <Route path="*" element={<Navigate to="/identificacao" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );
}

function Blocked({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
        <ShieldOff className="mx-auto text-red-400 mb-3" size={40} />
        <h1 className="text-xl font-bold text-gray-900">Acesso bloqueado</h1>
        <p className="text-gray-500 mt-2 mb-5">Sua conta está inativa ou sem perfil. Fale com o administrador.</p>
        <button onClick={onLogout} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2">
          <LogOut size={18} /> Sair
        </button>
      </div>
    </div>
  );
}

function ConfigNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-8 max-w-lg">
        <div className="flex items-center gap-2 text-amber-700 mb-3">
          <AlertTriangle size={22} />
          <h1 className="text-xl font-bold">Configuração do Firebase pendente</h1>
        </div>
        <p className="text-gray-600 text-sm mb-3">
          As credenciais ainda não foram preenchidas. Abra <code className="bg-gray-100 px-1 rounded">src/firebase/config.ts</code> e
          cole o objeto <code className="bg-gray-100 px-1 rounded">firebaseConfig</code> do seu projeto.
        </p>
        <p className="text-gray-500 text-xs">
          No Console do Firebase: habilite Authentication (E-mail/senha), crie o Firestore e o Storage e publique as regras
          (<code className="bg-gray-100 px-1 rounded">firestore.rules</code> / <code className="bg-gray-100 px-1 rounded">storage.rules</code>).
          Detalhes no <code className="bg-gray-100 px-1 rounded">README.md</code>.
        </p>
      </div>
    </div>
  );
}

export default App;
