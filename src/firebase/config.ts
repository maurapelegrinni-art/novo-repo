import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

/**
 * Configuração do Firebase.
 *
 * >>> COLE AQUI as credenciais reais do seu projeto <<<
 * Console Firebase → Configurações do projeto → Seus apps → Configuração do SDK.
 *
 * Para o app funcionar você também precisa, no Console:
 *  - Authentication → habilitar provedor "E-mail/senha".
 *  - Firestore Database → criar banco (modo produção) e publicar as regras (firestore.rules).
 *  - Storage → criar bucket e publicar as regras (storage.rules).
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBfznbfvs_nOrzrj2mI4AOsMhOKjmswqMQ',
  authDomain: 'pelegrinnivet.firebaseapp.com',
  projectId: 'pelegrinnivet',
  storageBucket: 'pelegrinnivet.firebasestorage.app',
  messagingSenderId: '734237156936',
  appId: '1:734237156936:web:bcdf20c96449fca6bf9a7d',
  measurementId: 'G-85JRCTK5R6',
};

/** True quando as credenciais ainda não foram preenchidas. */
export const firebaseConfigured = !Object.values(firebaseConfig).some((v) => v.includes('COLE_AQUI'));

export const app = initializeApp(firebaseConfig);

/**
 * Firestore com cache local persistente (IndexedDB). Isso dá funcionamento
 * offline: leituras servem do cache e escritas ficam enfileiradas até haver
 * conexão. persistentMultipleTabManager sincroniza entre abas abertas.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const auth = getAuth(app);
export const storage = getStorage(app);

/**
 * Cria uma instância secundária e isolada do app. Usada para que o
 * Administrador possa criar a conta de um novo usuário (createUserWithEmail…)
 * SEM trocar a própria sessão logada (a criação de usuário no SDK web loga
 * automaticamente o usuário recém-criado na instância em que foi chamada).
 */
export function secondaryApp(): FirebaseApp {
  return initializeApp(firebaseConfig, `secondary-${Date.now()}`);
}
