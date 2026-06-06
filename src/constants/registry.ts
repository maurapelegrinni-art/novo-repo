/**
 * Listas inteligentes de cadastro e parâmetros comerciais padrão.
 * Centralizadas para padronizar nomenclaturas, acelerar o cadastro e
 * alimentar buscas/relatórios.
 */

export const SPECIES = ['Canino', 'Felino', 'Equino', 'Coelho', 'Silvestre', 'Outros'];

export const SEX_OPTIONS = ['Macho', 'Macho castrado', 'Fêmea', 'Fêmea castrada'];

export const DOG_BREEDS = [
  'Shih Tzu',
  'Lhasa Apso',
  'Poodle',
  'Yorkshire',
  'Maltês',
  'Spitz Alemão',
  'Bulldog Francês',
  'Bulldog Inglês',
  'Pug',
  'Golden Retriever',
  'Labrador',
  'Border Collie',
  'Pastor Alemão',
  'Rottweiler',
  'Pinscher',
  'Dachshund',
  'Beagle',
  'Cocker',
  'Chow Chow',
  'Akita',
  'Mestiço (SRD)',
  'Outras',
];

export const CAT_BREEDS = [
  'Persa',
  'Maine Coon',
  'Siamês',
  'Angorá',
  'Bengal',
  'Ragdoll',
  'Sphynx',
  'British Shorthair',
  'SRD',
  'Outras',
];

/** Raças sugeridas conforme a espécie. */
export function breedsForSpecies(species: string): string[] {
  if (species === 'Canino') return DOG_BREEDS;
  if (species === 'Felino') return CAT_BREEDS;
  return ['SRD', 'Outras'];
}

export const DIAGNOSES = [
  'Hérnia de disco',
  'Displasia coxofemoral',
  'Ruptura de LCCr',
  'Luxação patelar',
  'Osteoartrite',
  'Síndrome da cauda equina',
  'Paralisia',
  'Paresia',
  'Ataxia',
  'Pós-operatório ortopédico',
  'Pós-operatório neurológico',
  'Ferida complexa',
  'Outros',
];

/* ------------------------------------------------------------------ */
/* Parâmetros comerciais padrão (editáveis em Financeiro → Config)     */
/* ------------------------------------------------------------------ */

export interface CityFee {
  id: string;
  name: string;
  value: string; // R$
}

export interface PricingConfig {
  evaluationPrice: string;
  singleSessionPrice: string;
  package5Unit: string; // valor por sessão no pacote de 5
  package10Unit: string; // valor por sessão no pacote de 10
  cities: CityFee[];
  /** Taxa (%) por forma de pagamento. */
  taxes: Record<string, string>;
}

export const DEFAULT_PRICING: PricingConfig = {
  evaluationPrice: '380',
  singleSessionPrice: '200',
  package5Unit: '190',
  package10Unit: '180',
  cities: [
    { id: 'clinica', name: 'Clínica', value: '0' },
    { id: 'botelhos', name: 'Botelhos', value: '50' },
    { id: 'campestre', name: 'Campestre', value: '70' },
    { id: 'muzambinho', name: 'Muzambinho', value: '100' },
  ],
  taxes: {
    PIX: '0',
    Dinheiro: '0',
    Débito: '1.99',
    'Crédito à vista': '4.99',
    'Crédito parcelado': '5.99',
    Outros: '0',
  },
};

/** Categorias de serviço para análise de receita por modalidade. */
export const SERVICE_CATEGORIES = [
  'Avaliação',
  'Consulta',
  'Fisioterapia',
  'Acupuntura',
  'Laserterapia',
  'Ozonioterapia',
  'Pacote',
  'Sessão avulsa',
  'Outros',
];
