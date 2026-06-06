import { create } from 'zustand';
import { DEFAULT_PRICING, type PricingConfig } from '../constants/registry';

/**
 * Modelo de dados multi-paciente.
 *
 * - O CPF do RESPONSÁVEL é o identificador comercial principal: um mesmo
 *   tutor pode ter vários pacientes, todos vinculados ao mesmo cadastro
 *   financeiro.
 * - Dados clínicos (avaliação, plano) são mapeados por patientId.
 * - Exames, sessões e pagamentos guardam patientId/tutorId.
 *
 * Todos os tipos são POJOs, prontos para sincronização futura com
 * Firebase. Os blobs de arquivos ficam no IndexedDB (ver fileStorage).
 */

const newId = () => Math.random().toString(36).substring(2, 9);

export interface Tutor {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  whatsapp: string;
  email: string;
}

export interface Patient {
  id: string;
  tutorId: string;
  prontuario: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  birthDate: string;
  microchip: string;
  weight: string;
  createdAt: string;
}

export interface EvaluationData {
  history: string;
  painScale: string;
  gait: string;
  lamenessGrade: string;
  posture: string;
  bodyCondition: string;
  muscleMass: string;
  jointMobility: string[];
  neuroMentation: string;
  neuroPostural: string[];
  neuroReflexes: string[];
  neuroAtaxia: string[];
  neuroGrade: string;
  neuroFindings: string[];
  neuroObs: string;
  functionalClass: string;
  observations: string;
}

/** Metadados de um arquivo anexado (conteúdo binário fica no IndexedDB + Storage). */
export interface ExamFile {
  id: string;
  name: string;
  mime: string;
  size: number;
  uploadedAt: string;
  /** Caminho no Firebase Storage (preenchido após o upload sincronizar). */
  storagePath?: string;
  /** URL de download do Storage (fallback quando o blob local não existe). */
  url?: string;
}

export interface Exam {
  id: string;
  patientId: string;
  date: string;
  type: string;
  description: string;
  findings: string;
  status: 'confirma' | 'complementa' | 'nao_altera' | '';
  includeInReport: boolean;
  files: ExamFile[];
}

export interface PlanData {
  diagnosis: string;
  goals: string;
  sessionsRecommended: string;
  frequency: string;
  modalities: string;
  correlationNotes: string;
  /** Exames selecionados para embasar o plano (correlação). */
  selectedExamIds: string[];
  painControl: string;
  inflammationReduction: string;
  gaitImprovement: string;
  romGain: string;
  strengthening: string;
  proprioception: string;
  functionalTraining: string;
  recurrencePrevention: string;
  tutorEducation: string;
  techPhysiology: string;
  techJustification: string;
  techFrequency: string;
  techReassessment: string;
  techLimitations: string;
  techObservations: string;
}

export interface Therapy {
  id: string;
  modalityId: string;
  name: string;
  dosimetry: Record<string, string>;
}

export interface Session {
  id: string;
  patientId: string;
  date: string;
  number: number;
  therapies: Therapy[];
  region: string;
  evolution: string;
  tutorFeedback: string;
}

/** Pacote contratado por um paciente (controle de saldo de sessões). */
export interface Package {
  id: string;
  patientId: string;
  date: string;
  sessionsContracted: number;
  unitPrice: number;
  total: number;
  status: 'ativo' | 'concluido';
}

/** Recebimento registrado (histórico financeiro). */
export interface Payment {
  id: string;
  patientId: string;
  tutorId: string;
  date: string;
  description: string;
  category: string;
  method: string;
  gross: number;
  taxPercent: number;
  net: number;
  discount: number;
  displacement: number;
}

/* ------------------------------------------------------------------ */

const EMPTY_EVALUATION: EvaluationData = {
  history: '', painScale: '', gait: '', lamenessGrade: '', posture: '',
  bodyCondition: '', muscleMass: '', jointMobility: [],
  neuroMentation: '', neuroPostural: [], neuroReflexes: [], neuroAtaxia: [],
  neuroGrade: '', neuroFindings: [], neuroObs: '', functionalClass: '', observations: '',
};

const EMPTY_PLAN: PlanData = {
  diagnosis: '', goals: '', sessionsRecommended: '', frequency: '', modalities: '',
  correlationNotes: '', selectedExamIds: [], painControl: '', inflammationReduction: '',
  gaitImprovement: '', romGain: '', strengthening: '', proprioception: '',
  functionalTraining: '', recurrencePrevention: '', tutorEducation: '',
  techPhysiology: '', techJustification: '', techFrequency: '', techReassessment: '',
  techLimitations: '', techObservations: '',
};

export { EMPTY_EVALUATION, EMPTY_PLAN };

interface AppStore {
  tutors: Tutor[];
  patients: Patient[];
  currentPatientId: string | null;
  evaluations: Record<string, EvaluationData>;
  plans: Record<string, PlanData>;
  exams: Exam[];
  sessions: Session[];
  packages: Package[];
  payments: Payment[];
  pricing: PricingConfig;

  // Seleção
  setCurrentPatient: (id: string | null) => void;

  // Tutores / pacientes
  findTutorByCpf: (cpf: string) => Tutor | undefined;
  upsertTutor: (tutor: Omit<Tutor, 'id'> & { id?: string }) => string;
  addPatient: (data: Omit<Patient, 'id' | 'prontuario' | 'createdAt'>) => string;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  removePatient: (id: string) => void;

  // Clínico (operam sobre o paciente atual)
  setEvaluation: (data: Partial<EvaluationData>) => void;
  setPlan: (data: Partial<PlanData>) => void;
  addExam: (data: Omit<Exam, 'id' | 'patientId' | 'files' | 'includeInReport'>) => void;
  updateExam: (id: string, data: Partial<Exam>) => void;
  removeExam: (id: string) => void;
  addExamFile: (examId: string, file: ExamFile) => void;
  removeExamFile: (examId: string, fileId: string) => void;
  addSession: (data: Omit<Session, 'id' | 'patientId' | 'number'>) => void;
  updateSession: (id: string, data: Partial<Session>) => void;
  removeSession: (id: string) => void;

  // Financeiro
  setPricing: (data: Partial<PricingConfig>) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  removePayment: (id: string) => void;
  addPackage: (pkg: Omit<Package, 'id'>) => void;
  updatePackage: (id: string, data: Partial<Package>) => void;
}

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export const useAppStore = create<AppStore>()(
    (set, get) => ({
      tutors: [],
      patients: [],
      currentPatientId: null,
      evaluations: {},
      plans: {},
      exams: [],
      sessions: [],
      packages: [],
      payments: [],
      pricing: DEFAULT_PRICING,

      setCurrentPatient: (id) => set({ currentPatientId: id }),

      findTutorByCpf: (cpf) => {
        const target = onlyDigits(cpf);
        if (!target) return undefined;
        return get().tutors.find((t) => onlyDigits(t.cpf) === target);
      },

      upsertTutor: (tutor) => {
        const existing = tutor.id
          ? get().tutors.find((t) => t.id === tutor.id)
          : get().findTutorByCpf(tutor.cpf);
        if (existing) {
          set((state) => ({
            tutors: state.tutors.map((t) => (t.id === existing.id ? { ...t, ...tutor, id: existing.id } : t)),
          }));
          return existing.id;
        }
        const id = newId();
        set((state) => ({ tutors: [...state.tutors, { ...tutor, id }] }));
        return id;
      },

      addPatient: (data) => {
        const id = newId();
        const year = new Date().getFullYear();
        const tutor = get().tutors.find((t) => t.id === data.tutorId);
        const cpf = tutor ? onlyDigits(tutor.cpf) : '00000000000';
        const seq = get().patients.filter((p) => p.tutorId === data.tutorId).length + 1;
        const prontuario = `${year}-${cpf || '00000000000'}-${String(seq).padStart(3, '0')}`;
        const patient: Patient = {
          ...data,
          id,
          prontuario,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ patients: [...state.patients, patient], currentPatientId: id }));
        return id;
      },

      updatePatient: (id, data) => set((state) => ({
        patients: state.patients.map((p) => (p.id === id ? { ...p, ...data } : p)),
      })),

      removePatient: (id) => set((state) => {
        const { [id]: _e, ...evaluations } = state.evaluations;
        const { [id]: _p, ...plans } = state.plans;
        return {
          patients: state.patients.filter((p) => p.id !== id),
          evaluations,
          plans,
          exams: state.exams.filter((e) => e.patientId !== id),
          sessions: state.sessions.filter((s) => s.patientId !== id),
          packages: state.packages.filter((pk) => pk.patientId !== id),
          payments: state.payments.filter((pm) => pm.patientId !== id),
          currentPatientId: state.currentPatientId === id ? null : state.currentPatientId,
        };
      }),

      setEvaluation: (data) => set((state) => {
        const pid = state.currentPatientId;
        if (!pid) return {};
        const current = state.evaluations[pid] ?? EMPTY_EVALUATION;
        return { evaluations: { ...state.evaluations, [pid]: { ...current, ...data } } };
      }),

      setPlan: (data) => set((state) => {
        const pid = state.currentPatientId;
        if (!pid) return {};
        const current = state.plans[pid] ?? EMPTY_PLAN;
        return { plans: { ...state.plans, [pid]: { ...current, ...data } } };
      }),

      addExam: (data) => set((state) => {
        const pid = state.currentPatientId;
        if (!pid) return {};
        const exam: Exam = { ...data, id: newId(), patientId: pid, includeInReport: true, files: [] };
        return { exams: [...state.exams, exam] };
      }),

      updateExam: (id, data) => set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? { ...e, ...data } : e)),
      })),

      removeExam: (id) => set((state) => ({ exams: state.exams.filter((e) => e.id !== id) })),

      addExamFile: (examId, file) => set((state) => ({
        exams: state.exams.map((e) => (e.id === examId ? { ...e, files: [...e.files, file] } : e)),
      })),

      removeExamFile: (examId, fileId) => set((state) => ({
        exams: state.exams.map((e) =>
          e.id === examId ? { ...e, files: e.files.filter((f) => f.id !== fileId) } : e
        ),
      })),

      addSession: (data) => set((state) => {
        const pid = state.currentPatientId;
        if (!pid) return {};
        const nextNumber = state.sessions
          .filter((s) => s.patientId === pid)
          .reduce((max, s) => Math.max(max, s.number), 0) + 1;
        const session: Session = { ...data, id: newId(), patientId: pid, number: nextNumber };
        return { sessions: [...state.sessions, session] };
      }),

      updateSession: (id, data) => set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...data } : s)),
      })),

      removeSession: (id) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),

      setPricing: (data) => set((state) => ({ pricing: { ...state.pricing, ...data } })),

      addPayment: (payment) => set((state) => ({ payments: [...state.payments, { ...payment, id: newId() }] })),

      removePayment: (id) => set((state) => ({ payments: state.payments.filter((p) => p.id !== id) })),

      addPackage: (pkg) => set((state) => ({ packages: [...state.packages, { ...pkg, id: newId() }] })),

      updatePackage: (id, data) => set((state) => ({
        packages: state.packages.map((p) => (p.id === id ? { ...p, ...data } : p)),
      })),
    })
);

/* ------------------------- Seletores utilitários ------------------------- */

export const useCurrentPatient = (): Patient | null =>
  useAppStore((s) => s.patients.find((p) => p.id === s.currentPatientId) ?? null);

export const useCurrentEvaluation = (): EvaluationData =>
  useAppStore((s) => (s.currentPatientId ? s.evaluations[s.currentPatientId] ?? EMPTY_EVALUATION : EMPTY_EVALUATION));

export const useCurrentPlan = (): PlanData =>
  useAppStore((s) => (s.currentPatientId ? s.plans[s.currentPatientId] ?? EMPTY_PLAN : EMPTY_PLAN));

export const tutorOf = (patient: Patient | null): Tutor | undefined => {
  if (!patient) return undefined;
  return useAppStore.getState().tutors.find((t) => t.id === patient.tutorId);
};
