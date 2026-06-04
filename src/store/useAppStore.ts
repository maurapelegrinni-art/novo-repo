import { create } from 'zustand';

/**
 * Interfaces de dados globais da aplicação.
 * Mantêm compatibilidade futura com Firebase ao usar apenas tipos POJO.
 */
export interface PatientData {
  tutorName: string;
  tutorCpf: string;
  tutorPhone: string;
  tutorEmail: string;
  patientName: string;
  patientSpecies: string;
  patientBreed: string;
  patientAge: string;
  patientWeight: string;
}

export interface EvaluationData {
  history: string;
  painLevel: string;
  gait: string;
  posture: string;
  muscleMass: string;
  jointMobility: string;
  /**
   * Campo neurologia totalmente clicável – armazena classificações
   * baseadas na literatura veterinária (ex.: ataxia, paresia, etc.).
   */
  neuro: string;
  observations: string;
}

export interface Exam {
  id: string;
  date: string;
  type: string;
  description: string;
  findings: string;
  status: 'confirma' | 'complementa' | 'nao_altera' | '';
}

export interface PlanData {
  diagnosis: string;
  goals: string;
  sessionsRecommended: string;
  frequency: string;
  modalities: string;
  correlationNotes: string;
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

/**
 * Representa uma terapia aplicada em uma sessão.
 * Cada terapia pode ter dosimetria específica, que varia de acordo
 * com o tipo da terapia (ex.: Laser – potência, energia, etc.).
 */
export interface Therapy {
  id: string;
  name: string; // ex.: "Laser", "Ozônio", "Magneto"
  /**
   * Campos de dosimetria livres – a UI irá gerar inputs dinâmicos
   * baseados no nome da terapia. Ex.: { potência: "5W", energia: "20J" }.
   */
  dosimetry: Record<string, string>;
}

export interface Session {
  id: string;
  date: string;
  number: string; // número sequencial da sessão
  /**
   * Uma sessão pode conter várias terapias. Cada terapia tem sua
   * própria dosimetria. O registro de sessão contabiliza a sessão
   * única para fins de pacote, independentemente da quantidade de
   * terapias incluídas.
   */
  therapies: Therapy[];
  intensity: string;
  duration: string;
  region: string;
  evolution: string;
  tutorFeedback: string;
}

export interface FinancialData {
  /** Avaliação paga separadamente? */
  evalSeparate: boolean;
  evalValue: string;
  evalDate: string;
  evalMethod: string;
  evalTax: string;
  evalObs: string;

  packageSessions: string;
  packageTotal: string;
  packageMethod: string;
  packageDate: string;
  packageTax: string;
  packageObs: string;
}

interface AppStore {
  patient: PatientData;
  evaluation: EvaluationData;
  exams: Exam[];
  plan: PlanData;
  sessions: Session[];
  financial: FinancialData;

  // Setters globais
  setPatient: (data: Partial<PatientData>) => void;
  setEvaluation: (data: Partial<EvaluationData>) => void;
  addExam: (exam: Exam) => void;
  updateExam: (id: string, data: Partial<Exam>) => void;
  removeExam: (id: string) => void;
  setPlan: (data: Partial<PlanData>) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, data: Partial<Session>) => void;
  /**
   * Adiciona uma terapia a uma sessão existente.
   */
  addTherapyToSession: (sessionId: string, therapy: Therapy) => void;
  /**
   * Atualiza dosimetria de uma terapia específica.
   */
  updateTherapy: (sessionId: string, therapyId: string, data: Partial<Therapy>) => void;
  setFinancial: (data: Partial<FinancialData>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  patient: {
    tutorName: '', tutorCpf: '', tutorPhone: '', tutorEmail: '',
    patientName: '', patientSpecies: '', patientBreed: '', patientAge: '', patientWeight: ''
  },
  evaluation: {
    history: '', painLevel: '', gait: '', posture: '', muscleMass: '', jointMobility: '', neuro: '', observations: ''
  },
  exams: [],
  plan: {
    diagnosis: '', goals: '', sessionsRecommended: '', frequency: '', modalities: '',
    correlationNotes: '', painControl: '', inflammationReduction: '', gaitImprovement: '', romGain: '',
    strengthening: '', proprioception: '', functionalTraining: '', recurrencePrevention: '', tutorEducation: '',
    techPhysiology: '', techJustification: '', techFrequency: '', techReassessment: '', techLimitations: '', techObservations: ''
  },
  sessions: [],
  financial: {
    evalSeparate: false, evalValue: '', evalDate: '', evalMethod: 'PIX', evalTax: '0', evalObs: '',
    packageSessions: '', packageTotal: '', packageMethod: 'PIX', packageDate: '', packageTax: '0', packageObs: ''
  },

  setPatient: (data) => set((state) => ({ patient: { ...state.patient, ...data } })),
  setEvaluation: (data) => set((state) => ({ evaluation: { ...state.evaluation, ...data } })),
  addExam: (exam) => set((state) => ({ exams: [...state.exams, exam] })),
  updateExam: (id, data) => set((state) => ({
    exams: state.exams.map((e) => (e.id === id ? { ...e, ...data } : e))
  })),
  removeExam: (id) => set((state) => ({ exams: state.exams.filter((e) => e.id !== id) })),
  setPlan: (data) => set((state) => ({ plan: { ...state.plan, ...data } })),
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (id, data) => set((state) => ({
    sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...data } : s))
  })),
  addTherapyToSession: (sessionId, therapy) => set((state) => ({
    sessions: state.sessions.map((s) =>
      s.id === sessionId ? { ...s, therapies: [...s.therapies, therapy] } : s
    )
  })),
  updateTherapy: (sessionId, therapyId, data) => set((state) => ({
    sessions: state.sessions.map((s) => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        therapies: s.therapies.map((t) => (t.id === therapyId ? { ...t, ...data } : t))
      };
    })
  })),
  setFinancial: (data) => set((state) => ({ financial: { ...state.financial, ...data } }))
}));

export interface PatientData {
  tutorName: string;
  tutorCpf: string;
  tutorPhone: string;
  tutorEmail: string;
  patientName: string;
  patientSpecies: string;
  patientBreed: string;
  patientAge: string;
  patientWeight: string;
}

export interface EvaluationData {
  history: string;
  painLevel: string;
  gait: string;
  posture: string;
  muscleMass: string;
  jointMobility: string;
  neuro: string;
  observations: string;
}

export interface Exam {
  id: string;
  date: string;
  type: string;
  description: string;
  findings: string;
  status: 'confirma' | 'complementa' | 'nao_altera' | '';
}

export interface PlanData {
  diagnosis: string;
  goals: string;
  sessionsRecommended: string;
  frequency: string;
  modalities: string;
  
  correlationNotes: string;
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

export interface Session {
  id: string;
  date: string;
  number: string;
  modalities: string[];
  intensity: string;
  duration: string;
  region: string;
  evolution: string;
  tutorFeedback: string;
}

export interface FinancialData {
  evalSeparate: boolean;
  evalValue: string;
  evalDate: string;
  evalMethod: string;
  evalTax: string;
  evalObs: string;
  
  packageSessions: string;
  packageTotal: string;
  packageMethod: string;
  packageDate: string;
  packageTax: string;
  packageObs: string;
}

interface AppStore {
  patient: PatientData;
  evaluation: EvaluationData;
  exams: Exam[];
  plan: PlanData;
  sessions: Session[];
  financial: FinancialData;
  
  setPatient: (data: Partial<PatientData>) => void;
  setEvaluation: (data: Partial<EvaluationData>) => void;
  addExam: (exam: Exam) => void;
  updateExam: (id: string, data: Partial<Exam>) => void;
  removeExam: (id: string) => void;
  setPlan: (data: Partial<PlanData>) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, data: Partial<Session>) => void;
  setFinancial: (data: Partial<FinancialData>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  patient: {
    tutorName: '', tutorCpf: '', tutorPhone: '', tutorEmail: '',
    patientName: '', patientSpecies: '', patientBreed: '', patientAge: '', patientWeight: ''
  },
  evaluation: {
    history: '', painLevel: '', gait: '', posture: '', muscleMass: '', jointMobility: '', neuro: '', observations: ''
  },
  exams: [],
  plan: {
    diagnosis: '', goals: '', sessionsRecommended: '', frequency: '', modalities: '',
    correlationNotes: '', painControl: '', inflammationReduction: '', gaitImprovement: '', romGain: '',
    strengthening: '', proprioception: '', functionalTraining: '', recurrencePrevention: '', tutorEducation: '',
    techPhysiology: '', techJustification: '', techFrequency: '', techReassessment: '', techLimitations: '', techObservations: ''
  },
  sessions: [],
  financial: {
    evalSeparate: false, evalValue: '', evalDate: '', evalMethod: 'PIX', evalTax: '0', evalObs: '',
    packageSessions: '', packageTotal: '', packageMethod: 'PIX', packageDate: '', packageTax: '0', packageObs: ''
  },
  
  setPatient: (data) => set((state) => ({ patient: { ...state.patient, ...data } })),
  setEvaluation: (data) => set((state) => ({ evaluation: { ...state.evaluation, ...data } })),
  addExam: (exam) => set((state) => ({ exams: [...state.exams, exam] })),
  updateExam: (id, data) => set((state) => ({
    exams: state.exams.map(e => e.id === id ? { ...e, ...data } : e)
  })),
  removeExam: (id) => set((state) => ({
    exams: state.exams.filter(e => e.id !== id)
  })),
  setPlan: (data) => set((state) => ({ plan: { ...state.plan, ...data } })),
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (id, data) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, ...data } : s)
  })),
  setFinancial: (data) => set((state) => ({ financial: { ...state.financial, ...data } })),
}));
