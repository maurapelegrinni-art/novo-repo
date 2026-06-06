import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAppStore } from '../store/useAppStore';
import { DEFAULT_PRICING } from '../constants/registry';

/**
 * Backup dos dados. Duas formas, conforme escolhido:
 *  - Snapshot versionado na coleção `backups` do Firestore (restaurável no app).
 *  - Export de um arquivo .json para download (cópia fora do sistema).
 *
 * O backup automático roda no máximo 1x/dia por dispositivo (controle local).
 */

export interface BackupData {
  tutors: unknown[];
  patients: unknown[];
  exams: unknown[];
  sessions: unknown[];
  packages: unknown[];
  payments: unknown[];
  evaluations: Record<string, unknown>;
  plans: Record<string, unknown>;
  pricing: unknown;
}

export interface BackupMeta {
  id: string;
  createdAt: string;
  by: string;
  counts: Record<string, number>;
}

const LAST_KEY = 'pelegrinni:lastBackup';

function snapshotData(): BackupData {
  const s = useAppStore.getState();
  return {
    tutors: s.tutors,
    patients: s.patients,
    exams: s.exams,
    sessions: s.sessions,
    packages: s.packages,
    payments: s.payments,
    evaluations: s.evaluations,
    plans: s.plans,
    pricing: s.pricing,
  };
}

function counts(data: BackupData): Record<string, number> {
  return {
    tutores: data.tutors.length,
    pacientes: data.patients.length,
    exames: data.exams.length,
    sessoes: data.sessions.length,
    pacotes: data.packages.length,
    recebimentos: data.payments.length,
  };
}

/** Cria um snapshot na coleção `backups` do Firestore. */
export async function createBackup(by: string): Promise<string> {
  const data = snapshotData();
  const id = new Date().toISOString().replace(/[:.]/g, '-');
  await setDoc(doc(db, 'backups', id), {
    createdAt: new Date().toISOString(),
    by,
    counts: counts(data),
    data,
  });
  localStorage.setItem(LAST_KEY, Date.now().toString());
  return id;
}

/** Roda um backup automático se o último (neste dispositivo) tiver +24h. */
export async function autoBackup(by: string): Promise<void> {
  const last = Number(localStorage.getItem(LAST_KEY) || 0);
  const DAY = 24 * 60 * 60 * 1000;
  if (Date.now() - last < DAY) return;
  // só faz sentido se houver algum dado
  const data = snapshotData();
  if (data.patients.length === 0 && data.tutors.length === 0) return;
  try {
    await createBackup(by);
  } catch (e) {
    console.warn('[backup] auto', e);
  }
}

/** Lista os backups mais recentes (sem o payload pesado). */
export async function listBackups(max = 20): Promise<BackupMeta[]> {
  const q = query(collection(db, 'backups'), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const v = d.data() as { createdAt: string; by: string; counts: Record<string, number> };
    return { id: d.id, createdAt: v.createdAt, by: v.by, counts: v.counts };
  });
}

/** Restaura um backup: substitui os dados atuais e propaga via sync. */
export async function restoreBackup(id: string): Promise<void> {
  const found = await getDoc(doc(db, 'backups', id));
  if (!found.exists()) throw new Error('Backup não encontrado.');
  const { data } = found.data() as { data: BackupData };
  useAppStore.setState({
    tutors: data.tutors as never,
    patients: data.patients as never,
    exams: data.exams as never,
    sessions: data.sessions as never,
    packages: data.packages as never,
    payments: data.payments as never,
    evaluations: data.evaluations as never,
    plans: data.plans as never,
    pricing: (data.pricing as never) ?? DEFAULT_PRICING,
  });
}

/** Gera e baixa um arquivo .json com todos os dados. */
export function exportJson(): void {
  const data = snapshotData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-fisiovet-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
