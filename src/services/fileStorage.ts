/**
 * Camada de armazenamento de arquivos (blobs).
 *
 * Implementação atual: IndexedDB local — os blobs persistem entre
 * sessões sem estourar a cota do localStorage. Os METADADOS dos arquivos
 * ficam no store (Zustand), enquanto o conteúdo binário fica aqui,
 * indexado pelo id do arquivo.
 *
 * Pronto para Firebase: esta interface (uploadFile/getFileBlob/
 * getFileURL/deleteFile) mapeia diretamente para o Firebase Storage,
 * usando o caminho:
 *   pacientes/{patientId}/exames/{examId}/arquivos/{fileId}
 * Basta trocar a implementação por uploadBytes/getDownloadURL/
 * deleteObject mantendo as mesmas assinaturas.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';
import { useAppStore } from '../store/useAppStore';

const DB_NAME = 'pelegrinni-files';
const STORE_NAME = 'files';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/**
 * Caminho lógico do arquivo (equivalente ao path no Firebase Storage).
 * Mantido para facilitar a futura migração.
 */
export function storagePath(patientId: string, examId: string, fileId: string): string {
  return `pacientes/${patientId}/exames/${examId}/arquivos/${fileId}`;
}

export async function uploadFile(fileId: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, fileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFileBlob(fileId: string): Promise<Blob | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(fileId);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Cria uma object URL temporária para preview/download a partir do blob local.
 * Se o blob não existir localmente (ex.: arquivo enviado em outro dispositivo),
 * retorna a URL de download do Storage, quando disponível.
 */
export async function getFileURL(fileId: string, fallbackUrl?: string): Promise<string | undefined> {
  const blob = await getFileBlob(fileId);
  if (blob) return URL.createObjectURL(blob);
  return fallbackUrl;
}

export async function deleteFile(fileId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(fileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---- Utilidades de tipo/tamanho de arquivo ---- */

export const ACCEPTED_EXTENSIONS = [
  'pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'mp4', 'mov',
];

export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',');

/** Tamanho máximo padrão por arquivo (configurável). */
export const DEFAULT_MAX_FILE_MB = 25;

export function extOf(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function isAccepted(name: string): boolean {
  return ACCEPTED_EXTENSIONS.includes(extOf(name));
}

export type FileKind = 'pdf' | 'image' | 'video' | 'doc' | 'sheet' | 'other';

export function kindOf(name: string): FileKind {
  const ext = extOf(name);
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image';
  if (['mp4', 'mov'].includes(ext)) return 'video';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx'].includes(ext)) return 'sheet';
  return 'other';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ---- Firebase Storage (sincronização dos arquivos) ---- */

/** Envia um blob ao Storage e devolve a URL de download. */
export async function uploadToStorage(path: string, blob: Blob, mime?: string): Promise<string> {
  const r = ref(storage, path);
  await uploadBytes(r, blob, mime ? { contentType: mime } : undefined);
  return getDownloadURL(r);
}

export async function deleteFromStorage(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // arquivo pode nunca ter chegado ao Storage (ficou só local) — ignora
  }
}

let syncing = false;

/**
 * Varre os exames do store em busca de arquivos que ainda não foram enviados
 * ao Storage (sem `url`), lê o blob do IndexedDB e faz o upload. Ao concluir,
 * grava `storagePath`/`url` no metadado (o que dispara o espelhamento p/ o
 * Firestore). Seguro para chamar várias vezes; uploads que falharem (offline)
 * permanecem pendentes para a próxima tentativa.
 */
export async function syncPendingUploads(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    const { exams, updateExam } = useAppStore.getState();
    for (const exam of exams) {
      let changed = false;
      const files = await Promise.all(
        exam.files.map(async (f) => {
          if (f.url) return f; // já sincronizado
          const blob = await getFileBlob(f.id);
          if (!blob) return f; // sem blob local (nada a enviar deste dispositivo)
          try {
            const path = storagePath(exam.patientId, exam.id, f.id);
            const url = await uploadToStorage(path, blob, f.mime);
            changed = true;
            return { ...f, storagePath: path, url };
          } catch {
            return f; // offline / sem permissão — tenta depois
          }
        })
      );
      if (changed) updateExam(exam.id, { files });
    }
  } finally {
    syncing = false;
  }
}
