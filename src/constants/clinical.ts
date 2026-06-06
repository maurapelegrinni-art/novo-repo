/**
 * Constantes clínicas compartilhadas pela aplicação.
 *
 * As escalas de avaliação são baseadas em referências da literatura de
 * fisioterapia e neurologia veterinária (escala de claudicação 0-5,
 * Escore de Condição Corporal WSAVA 1-9, Muscle Condition Score,
 * escala modificada de Frankel/Griffiths para disfunção medular).
 * Servem como apoio à decisão clínica, não substituindo o julgamento
 * da médica veterinária responsável.
 */

export interface Modality {
  id: string;
  label: string;
  category: string;
}

export interface DosimetryField {
  key: string;
  label: string;
  placeholder: string;
}

export const MODALITIES: Modality[] = [
  { id: 'laser', label: 'Laserterapia', category: 'Eletrotermofototerapia' },
  { id: 'magneto', label: 'Magnetoterapia', category: 'Eletrotermofototerapia' },
  { id: 'ozonio', label: 'Ozonioterapia', category: 'Eletrotermofototerapia' },
  { id: 'tens', label: 'TENS/FES', category: 'Eletrotermofototerapia' },
  { id: 'acupuncture', label: 'Acupuntura', category: 'MTC' },
  { id: 'massage', label: 'Massoterapia', category: 'Cinesioterapia' },
  { id: 'stretching', label: 'Alongamento', category: 'Cinesioterapia' },
  { id: 'prom', label: 'Mobilização (PROM/AROM)', category: 'Cinesioterapia' },
  { id: 'treadmill', label: 'Esteira Aquática', category: 'Hidroterapia' },
  { id: 'cavaletti', label: 'Cavaletti', category: 'Treino Funcional' },
  { id: 'proprioception', label: 'Propriocepção', category: 'Neurofuncional' },
];

/**
 * Campos de dosimetria específicos por modalidade. A UI gera inputs
 * dinâmicos com base no id da terapia. Modalidades sem template usam
 * o fallback genérico (DEFAULT_DOSIMETRY_FIELDS).
 */
export const DOSIMETRY_FIELDS: Record<string, DosimetryField[]> = {
  laser: [
    { key: 'potencia', label: 'Potência (mW)', placeholder: 'Ex: 500' },
    { key: 'dose', label: 'Dose (J/cm²)', placeholder: 'Ex: 4' },
    { key: 'tempo', label: 'Tempo (s)', placeholder: 'Ex: 60' },
    { key: 'pontos', label: 'Nº de pontos', placeholder: 'Ex: 6' },
  ],
  magneto: [
    { key: 'frequencia', label: 'Frequência (Hz)', placeholder: 'Ex: 50' },
    { key: 'intensidade', label: 'Intensidade (Gauss)', placeholder: 'Ex: 100' },
    { key: 'tempo', label: 'Tempo (min)', placeholder: 'Ex: 20' },
  ],
  ozonio: [
    { key: 'concentracao', label: 'Concentração (µg/mL)', placeholder: 'Ex: 20' },
    { key: 'via', label: 'Via de aplicação', placeholder: 'Ex: Retal / SC' },
    { key: 'volume', label: 'Volume (mL)', placeholder: 'Ex: 100' },
  ],
  tens: [
    { key: 'frequencia', label: 'Frequência (Hz)', placeholder: 'Ex: 80' },
    { key: 'intensidade', label: 'Intensidade (mA)', placeholder: 'Ex: 15' },
    { key: 'tempo', label: 'Tempo (min)', placeholder: 'Ex: 20' },
  ],
  acupuncture: [
    { key: 'pontos', label: 'Pontos utilizados', placeholder: 'Ex: BP6, E36' },
    { key: 'tempo', label: 'Tempo (min)', placeholder: 'Ex: 20' },
    { key: 'eletro', label: 'Eletroacupuntura (Hz)', placeholder: 'Ex: 2/100' },
  ],
  massage: [
    { key: 'tecnica', label: 'Técnica', placeholder: 'Ex: Effleurage' },
    { key: 'tempo', label: 'Tempo (min)', placeholder: 'Ex: 10' },
    { key: 'regiao', label: 'Região', placeholder: 'Ex: Lombar' },
  ],
  stretching: [
    { key: 'grupo', label: 'Grupo muscular', placeholder: 'Ex: Quadríceps' },
    { key: 'sustentacao', label: 'Sustentação (s)', placeholder: 'Ex: 20' },
    { key: 'repeticoes', label: 'Repetições', placeholder: 'Ex: 3' },
  ],
  prom: [
    { key: 'articulacao', label: 'Articulação', placeholder: 'Ex: Joelho D' },
    { key: 'repeticoes', label: 'Repetições', placeholder: 'Ex: 15' },
    { key: 'series', label: 'Séries', placeholder: 'Ex: 3' },
  ],
  treadmill: [
    { key: 'velocidade', label: 'Velocidade (km/h)', placeholder: 'Ex: 2' },
    { key: 'tempo', label: 'Tempo (min)', placeholder: 'Ex: 10' },
    { key: 'nivelAgua', label: 'Nível da água', placeholder: 'Ex: Altura do cotovelo' },
  ],
  cavaletti: [
    { key: 'altura', label: 'Altura (cm)', placeholder: 'Ex: 10' },
    { key: 'repeticoes', label: 'Repetições', placeholder: 'Ex: 10' },
    { key: 'series', label: 'Séries', placeholder: 'Ex: 3' },
  ],
  proprioception: [
    { key: 'exercicio', label: 'Exercício', placeholder: 'Ex: Prancha de equilíbrio' },
    { key: 'tempo', label: 'Tempo (min)', placeholder: 'Ex: 5' },
    { key: 'repeticoes', label: 'Repetições', placeholder: 'Ex: 10' },
  ],
};

export const DEFAULT_DOSIMETRY_FIELDS: DosimetryField[] = [
  { key: 'parametros', label: 'Parâmetros', placeholder: 'Descreva a dosimetria aplicada' },
  { key: 'tempo', label: 'Tempo (min)', placeholder: 'Ex: 15' },
  { key: 'regiao', label: 'Região', placeholder: 'Ex: Lombar' },
];

export const getDosimetryFields = (therapyId: string): DosimetryField[] =>
  DOSIMETRY_FIELDS[therapyId] ?? DEFAULT_DOSIMETRY_FIELDS;

/* ------------------------------------------------------------------ */
/* Escalas de avaliação funcional / neurológica                        */
/* ------------------------------------------------------------------ */

/** Escala analógica visual de dor adaptada (0-10). */
export const PAIN_SCALE = [
  'Sem dor (0)',
  'Dor leve (1-3)',
  'Dor moderada (4-6)',
  'Dor intensa (7-9)',
  'Dor máxima (10)',
];

/** Escala de claudicação 0-5 (graus de apoio do membro). */
export const LAMENESS_GRADES = [
  'Grau 0 – Sem claudicação',
  'Grau 1 – Leve / intermitente',
  'Grau 2 – Leve / contínua',
  'Grau 3 – Moderada (apoio reduzido)',
  'Grau 4 – Grave (apoio mínimo)',
  'Grau 5 – Sem apoio do membro',
];

export const GAIT_OPTIONS = [
  'Normal',
  'Claudicação',
  'Ataxia',
  'Marcha em círculos',
  'Arrastar de dígitos',
  'Não deambula',
];

export const POSTURE_OPTIONS = [
  'Normal',
  'Cifose',
  'Lordose',
  'Escoliose',
  'Cabeça baixa',
  'Base alargada',
  'Membro poupado',
  'Decúbito',
];

/** Escore de Condição Corporal (WSAVA, 1-9). */
export const BODY_CONDITION = [
  '1-2 (Caquético)',
  '3 (Magro)',
  '4 (Abaixo do ideal)',
  '5 (Ideal)',
  '6 (Acima do ideal)',
  '7 (Sobrepeso)',
  '8-9 (Obeso)',
];

/** Muscle Condition Score (perda de massa muscular). */
export const MUSCLE_MASS = [
  'Normal',
  'Perda leve',
  'Perda moderada',
  'Perda acentuada',
];

export const ROM_OPTIONS = [
  'Normal',
  'Redução leve',
  'Redução moderada',
  'Redução grave',
  'Anquilose',
  'Hipermobilidade',
  'Dor à mobilização',
  'Crepitação',
];

/* --- Avaliação neurológica (clicável) --- */

export const NEURO_MENTATION = ['Alerta', 'Apático/Deprimido', 'Estuporoso', 'Comatoso'];

export const NEURO_POSTURAL_REACTIONS = [
  'Normais',
  'Propriocepção consciente diminuída',
  'Propriocepção consciente ausente',
  'Salto (hopping) reduzido',
  'Posicionamento tátil ausente',
];

export const NEURO_REFLEXES = [
  'Normorreflexia',
  'Hiporreflexia',
  'Arreflexia',
  'Hiperreflexia',
  'Reflexo patelar alterado',
  'Reflexo flexor alterado',
  'Reflexo perineal ausente',
];

export const NEURO_ATAXIA = ['Proprioceptiva', 'Vestibular', 'Cerebelar'];

/** Escala modificada de Frankel/Griffiths (disfunção medular). */
export const NEURO_GRADE = [
  'Grau I – Dor sem déficit neurológico',
  'Grau II – Ataxia/paresia, deambula',
  'Grau III – Paresia não-deambulatória',
  'Grau IV – Plegia com nocicepção preservada',
  'Grau V – Plegia sem nocicepção',
];

export const NEURO_FINDINGS = [
  'Tetraparesia',
  'Paraparesia',
  'Hemiparesia',
  'Monoparesia',
  'Hipotonia',
  'Hipertonia/Espasticidade',
  'Atrofia neurogênica',
  'Dor à palpação espinhal',
  'Síndrome de Schiff-Sherrington',
  'Incontinência',
];

/** Classificação funcional resultante. */
export const FUNCTIONAL_CLASS = [
  'Independente funcional',
  'Independente com limitações',
  'Dependência parcial',
  'Dependência total',
];

export const PAYMENT_METHODS = [
  'PIX',
  'Dinheiro',
  'Débito',
  'Crédito à vista',
  'Crédito parcelado',
  'Outros',
];

/** Taxas padrão por forma de pagamento (em %). */
export const PAYMENT_TAXES: Record<string, string> = {
  PIX: '0',
  Dinheiro: '0',
  Débito: '1.99',
  'Crédito à vista': '4.99',
  'Crédito parcelado': '5.99',
  Outros: '0',
};
