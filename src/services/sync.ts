import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  useAppStore,
  type Tutor,
  type Patient,
  type Exam,
  type Session,
  type Package,
  type Payment,
  type EvaluationData,
  type PlanData,
} from '../store/useAppStore';
import { DEFAULT_PRICING } from '../constants/registry';

/**
 * Camada de sincronização Firestore <-> Zustand.
 *
 * Estratégia offline-first:
 *  - O Firestore (config com persistentLocalCache) guarda os dados localmente
 *    em IndexedDB; leituras servem do cache e escritas ficam enfileiradas
 *    quando offline, sincronizando sozinhas ao reconectar.
 *  - onSnapshot hidrata o store a partir do Firestore (tempo real, multiusuário).
 *  - Uma assinatura no store espelha qualquer mudança local de volta para o
 *    Firestore (write-through), com cache de diff para evitar gravações em eco.
 *
 * currentPatientId NÃO é sincronizado (é seleção local de cada dispositivo).
 */

type Json = string;
const cache: Record<string, Map<string, Json>> = {};
const json = (v: unknown) => JSON.stringify(v);

let applyingRemote = false;
let started = false;
let unsubs: Unsubscribe[] = [];
let unsubStore: (() => void) | null = null;

/** Coleções do tipo lista (array de itens com `id`). */
interface ArrayColl<T extends { id: string }> {
  name: string;
  select: () => T[];
  set: (items: T[]) => void;
}

const ARRAY_COLLECTIONS: ArrayColl<{ id: string }>[] = [
  { name: 'tutors', select: () => useAppStore.getState().tutors, set: (i) => useAppStore.setState({ tutors: i as Tutor[] }) },
  { name: 'patients', select: () => useAppStore.getState().patients, set: (i) => useAppStore.setState({ patients: i as Patient[] }) },
  { name: 'exams', select: () => useAppStore.getState().exams, set: (i) => useAppStore.setState({ exams: i as Exam[] }) },
  { name: 'sessions', select: () => useAppStore.getState().sessions, set: (i) => useAppStore.setState({ sessions: i as Session[] }) },
  { name: 'packages', select: () => useAppStore.getState().packages, set: (i) => useAppStore.setState({ packages: i as Package[] }) },
  { name: 'payments', select: () => useAppStore.getState().payments, set: (i) => useAppStore.setState({ payments: i as Payment[] }) },
];

/** Coleções do tipo mapa (Record<patientId, dados>). */
interface RecordColl<T> {
  name: string;
  select: () => Record<string, T>;
  set: (rec: Record<string, T>) => void;
}

const RECORD_COLLECTIONS: RecordColl<unknown>[] = [
  { name: 'evaluations', select: () => useAppStore.getState().evaluations, set: (r) => useAppStore.setState({ evaluations: r as Record<string, EvaluationData> }) },
  { name: 'plans', select: () => useAppStore.getState().plans, set: (r) => useAppStore.setState({ plans: r as Record<string, PlanData> }) },
];

function withRemote(fn: () => void) {
  applyingRemote = true;
  try {
    fn();
  } finally {
    applyingRemote = false;
  }
}

export function startSync() {
  if (started) return;
  started = true;
  ARRAY_COLLECTIONS.forEach((c) => (cache[c.name] = new Map()));
  RECORD_COLLECTIONS.forEach((c) => (cache[c.name] = new Map()));
  cache.__meta = new Map();

  // ---- Hidratação (listeners de leitura) ----
  ARRAY_COLLECTIONS.forEach((c) => {
    const unsub = onSnapshot(collection(db, c.name), (snap) => {
      const items: { id: string }[] = [];
      const map = cache[c.name];
      map.clear();
      snap.forEach((d) => {
        const data = d.data() as { id: string };
        items.push(data);
        map.set(d.id, json(data));
      });
      withRemote(() => c.set(items));
    });
    unsubs.push(unsub);
  });

  RECORD_COLLECTIONS.forEach((c) => {
    const unsub = onSnapshot(collection(db, c.name), (snap) => {
      const rec: Record<string, unknown> = {};
      const map = cache[c.name];
      map.clear();
      snap.forEach((d) => {
        const data = d.data();
        rec[d.id] = data;
        map.set(d.id, json(data));
      });
      withRemote(() => c.set(rec));
    });
    unsubs.push(unsub);
  });

  // pricing (documento único meta/pricing)
  unsubs.push(
    onSnapshot(doc(db, 'meta', 'pricing'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        cache.__meta.set('pricing', json(data));
        withRemote(() => useAppStore.setState({ pricing: data as typeof DEFAULT_PRICING }));
      } else {
        // Primeira execução: semeia o documento com os preços padrão atuais.
        const current = useAppStore.getState().pricing ?? DEFAULT_PRICING;
        cache.__meta.set('pricing', json(current));
        setDoc(doc(db, 'meta', 'pricing'), current).catch((e) => console.warn('[sync] seed pricing', e));
      }
    })
  );

  // ---- Espelhamento (write-through das mudanças locais) ----
  unsubStore = useAppStore.subscribe((state, prev) => {
    if (applyingRemote) return;
    mirrorArrays(state, prev);
    mirrorRecords(state, prev);
    mirrorPricing(state, prev);
  });
}

function mirrorArrays(state: ReturnType<typeof useAppStore.getState>, prev: typeof state) {
  ARRAY_COLLECTIONS.forEach((c) => {
    const items = c.select() ?? [];
    // evita trabalho quando a referência da coleção não mudou
    if ((state as never)[c.name as never] === (prev as never)[c.name as never]) return;
    const map = cache[c.name];
    const seen = new Set<string>();
    items.forEach((item) => {
      seen.add(item.id);
      const j = json(item);
      if (map.get(item.id) !== j) {
        map.set(item.id, j);
        setDoc(doc(db, c.name, item.id), item as Record<string, unknown>).catch((e) =>
          console.warn(`[sync] write ${c.name}/${item.id}`, e)
        );
      }
    });
    [...map.keys()].forEach((id) => {
      if (!seen.has(id)) {
        map.delete(id);
        deleteDoc(doc(db, c.name, id)).catch((e) => console.warn(`[sync] delete ${c.name}/${id}`, e));
      }
    });
  });
}

function mirrorRecords(state: ReturnType<typeof useAppStore.getState>, prev: typeof state) {
  RECORD_COLLECTIONS.forEach((c) => {
    if ((state as never)[c.name as never] === (prev as never)[c.name as never]) return;
    const rec = c.select() ?? {};
    const map = cache[c.name];
    const seen = new Set<string>();
    Object.entries(rec).forEach(([id, val]) => {
      seen.add(id);
      const j = json(val);
      if (map.get(id) !== j) {
        map.set(id, j);
        setDoc(doc(db, c.name, id), val as Record<string, unknown>).catch((e) =>
          console.warn(`[sync] write ${c.name}/${id}`, e)
        );
      }
    });
    [...map.keys()].forEach((id) => {
      if (!seen.has(id)) {
        map.delete(id);
        deleteDoc(doc(db, c.name, id)).catch((e) => console.warn(`[sync] delete ${c.name}/${id}`, e));
      }
    });
  });
}

function mirrorPricing(state: ReturnType<typeof useAppStore.getState>, prev: typeof state) {
  if (state.pricing === prev.pricing) return;
  const j = json(state.pricing);
  if (cache.__meta.get('pricing') !== j) {
    cache.__meta.set('pricing', j);
    setDoc(doc(db, 'meta', 'pricing'), state.pricing).catch((e) => console.warn('[sync] write pricing', e));
  }
}

export function stopSync() {
  unsubs.forEach((u) => u());
  unsubs = [];
  unsubStore?.();
  unsubStore = null;
  started = false;
  Object.keys(cache).forEach((k) => delete cache[k]);
  // limpa os dados locais para o próximo usuário/sessão
  withRemote(() =>
    useAppStore.setState({
      tutors: [], patients: [], exams: [], sessions: [], packages: [], payments: [],
      evaluations: {}, plans: {}, currentPatientId: null, pricing: DEFAULT_PRICING,
    })
  );
}
