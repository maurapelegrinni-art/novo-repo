import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  getAuth,
} from 'firebase/auth';
import { deleteApp } from 'firebase/app';
import { doc, getDoc, onSnapshot, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db, secondaryApp } from '../firebase/config';
import type { AppUser, Role } from './types';

interface AuthContextValue {
  user: AppUser | null;
  /** Auth resolveu o estado inicial (evita piscar a tela de login). */
  ready: boolean;
  /** Há sessão Firebase, mas sem perfil válido/ativo (acesso negado). */
  blocked: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrapAdmin: (name: string, email: string, password: string) => Promise<void>;
  createUser: (name: string, email: string, password: string, role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      unsubProfile?.();
      unsubProfile = undefined;

      if (!fbUser) {
        setUser(null);
        setBlocked(false);
        setReady(true);
        return;
      }

      // Acompanha o perfil em tempo real (mudança de papel / desativação).
      unsubProfile = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => {
          const data = snap.data() as Omit<AppUser, 'uid'> | undefined;
          if (!data || data.active === false) {
            setUser(null);
            setBlocked(true);
          } else {
            setUser({ uid: fbUser.uid, ...data });
            setBlocked(false);
          }
          setReady(true);
        },
        () => {
          setUser(null);
          setBlocked(true);
          setReady(true);
        }
      );
    });

    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  /** Primeiro acesso: cria a conta do administrador e marca o bootstrap. */
  const bootstrapAdmin = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name });
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', cred.user.uid), {
      email: email.trim(),
      name,
      role: 'admin' as Role,
      active: true,
      createdAt: new Date().toISOString(),
    });
    batch.set(doc(db, 'meta', 'bootstrap'), { initializedAt: serverTimestamp() });
    await batch.commit();
  };

  /**
   * Admin cria um novo usuário usando uma instância secundária do Firebase,
   * para não perder a própria sessão. Em seguida grava o perfil (users/{uid})
   * a partir da sessão do admin (autorizado pelas regras).
   */
  const createUser = async (name: string, email: string, password: string, role: Role) => {
    const second = secondaryApp();
    const secondAuth = getAuth(second);
    try {
      const cred = await createUserWithEmailAndPassword(secondAuth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: email.trim(),
        name,
        role,
        active: true,
        createdAt: new Date().toISOString(),
      });
      await signOut(secondAuth);
    } finally {
      await deleteApp(second);
    }
  };

  return (
    <AuthContext.Provider value={{ user, ready, blocked, login, logout, bootstrapAdmin, createUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

/** Checa, fora de sessão, se o sistema já tem um administrador configurado. */
export async function bootstrapDone(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'meta', 'bootstrap'));
    return snap.exists();
  } catch {
    // Sem permissão de leitura anônima → assume que já existe (mostra login).
    return true;
  }
}
