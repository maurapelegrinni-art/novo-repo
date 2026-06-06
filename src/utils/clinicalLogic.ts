import type { EvaluationData, Exam, PlanData } from '../store/useAppStore';

/**
 * Lógica clínica de apoio à decisão. São heurísticas baseadas nas escalas
 * já usadas na avaliação (EVA de dor, claudicação 0-5, MCS, Frankel
 * modificado). NÃO substituem o julgamento da médica veterinária — apenas
 * organizam os achados e sugerem um ponto de partida editável.
 */

const has = (s: string | undefined, ...needles: string[]) =>
  !!s && needles.some((n) => s.toLowerCase().includes(n.toLowerCase()));

/* --------------------------- Autonomia funcional --------------------------- */

export interface AutonomyResult {
  score: number; // 0-100
  level: string;
  suggestedClass: string;
  color: 'green' | 'amber' | 'orange' | 'red';
  factors: string[];
}

/** Calcula um índice de autonomia funcional (0-100) a partir da avaliação. */
export function computeFunctionalAutonomy(ev: EvaluationData): AutonomyResult {
  let score = 100;
  const factors: string[] = [];
  const sub = (n: number, why: string) => { if (n > 0) { score -= n; factors.push(why); } };

  // Dor (EVA)
  if (has(ev.painScale, 'máxima')) sub(35, 'Dor máxima');
  else if (has(ev.painScale, 'intensa')) sub(25, 'Dor intensa');
  else if (has(ev.painScale, 'moderada')) sub(15, 'Dor moderada');
  else if (has(ev.painScale, 'leve')) sub(5, 'Dor leve');

  // Claudicação 0-5
  if (has(ev.lamenessGrade, 'grau 5')) sub(30, 'Sem apoio do membro');
  else if (has(ev.lamenessGrade, 'grau 4')) sub(22, 'Claudicação grave');
  else if (has(ev.lamenessGrade, 'grau 3')) sub(15, 'Claudicação moderada');
  else if (has(ev.lamenessGrade, 'grau 2')) sub(10, 'Claudicação contínua leve');
  else if (has(ev.lamenessGrade, 'grau 1')) sub(6, 'Claudicação intermitente');

  // Marcha
  if (has(ev.gait, 'não deambula')) sub(30, 'Não deambula');
  else if (has(ev.gait, 'ataxia')) sub(15, 'Ataxia de marcha');
  else if (has(ev.gait, 'arrastar')) sub(12, 'Arrastar de dígitos');
  else if (has(ev.gait, 'círculos')) sub(12, 'Marcha em círculos');
  else if (has(ev.gait, 'claudicação')) sub(8, 'Marcha claudicante');

  // Massa muscular (MCS)
  if (has(ev.muscleMass, 'acentuada')) sub(20, 'Perda muscular acentuada');
  else if (has(ev.muscleMass, 'moderada')) sub(12, 'Perda muscular moderada');
  else if (has(ev.muscleMass, 'leve')) sub(5, 'Perda muscular leve');

  // Grau neurológico (Frankel modificado)
  if (has(ev.neuroGrade, 'grau v')) sub(45, 'Plegia sem nocicepção');
  else if (has(ev.neuroGrade, 'grau iv')) sub(35, 'Plegia com nocicepção');
  else if (has(ev.neuroGrade, 'grau iii')) sub(25, 'Paresia não-deambulatória');
  else if (has(ev.neuroGrade, 'grau ii')) sub(15, 'Ataxia/paresia deambulatória');
  else if (has(ev.neuroGrade, 'grau i')) sub(5, 'Dor sem déficit');

  // Reações posturais ausentes/diminuídas
  const posturalLoss = ev.neuroPostural.filter((p) => has(p, 'diminuída', 'ausente', 'reduzido', 'ausente')).length;
  sub(Math.min(15, posturalLoss * 5), posturalLoss ? 'Déficit de reações posturais' : '');

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: string, suggestedClass: string, color: AutonomyResult['color'];
  if (score >= 80) { level = 'Alta autonomia'; suggestedClass = 'Independente funcional'; color = 'green'; }
  else if (score >= 60) { level = 'Autonomia moderada'; suggestedClass = 'Independente com limitações'; color = 'amber'; }
  else if (score >= 35) { level = 'Autonomia reduzida'; suggestedClass = 'Dependência parcial'; color = 'orange'; }
  else { level = 'Dependência funcional'; suggestedClass = 'Dependência total'; color = 'red'; }

  return { score, level, suggestedClass, color, factors: factors.filter(Boolean) };
}

/* --------------------------- Classificação neuro --------------------------- */

export interface NeuroResult {
  hasData: boolean;
  severity: string;
  distribution: string;
  localization: string;
  summary: string;
}

/** Resume e classifica os achados neurológicos. */
export function classifyNeuro(ev: EvaluationData): NeuroResult {
  const findings = ev.neuroFindings ?? [];
  const reflexes = ev.neuroReflexes ?? [];
  const ataxia = ev.neuroAtaxia ?? [];
  const hasData =
    !!ev.neuroGrade || !!ev.neuroMentation || findings.length > 0 ||
    reflexes.length > 0 || ataxia.length > 0 || ev.neuroPostural.length > 0;

  if (!hasData) {
    return { hasData: false, severity: '—', distribution: '—', localization: '—', summary: 'Sem alterações neurológicas registradas.' };
  }

  const severity = ev.neuroGrade || 'Grau não definido';

  // Distribuição (qual e quantos membros)
  let distribution = 'Indefinida';
  if (findings.some((f) => has(f, 'tetra'))) distribution = 'Tetraparesia (4 membros)';
  else if (findings.some((f) => has(f, 'para'))) distribution = 'Paraparesia (membros pélvicos)';
  else if (findings.some((f) => has(f, 'hemi'))) distribution = 'Hemiparesia (membros de um lado)';
  else if (findings.some((f) => has(f, 'mono'))) distribution = 'Monoparesia (um membro)';

  // Localização provável (NMS x NMI / vestibular / cerebelar)
  let localization = 'A definir clinicamente';
  const nmi = reflexes.some((r) => has(r, 'hiporreflexia', 'arreflexia', 'flexor alterado', 'perineal'));
  const nms = reflexes.some((r) => has(r, 'hiperreflexia'));
  if (ataxia.some((a) => has(a, 'vestibular'))) localization = 'Síndrome vestibular';
  else if (ataxia.some((a) => has(a, 'cerebelar'))) localization = 'Síndrome cerebelar';
  else if (nmi && distribution.includes('Para')) localization = 'NMI — segmento L4–S3';
  else if (nms && distribution.includes('Para')) localization = 'NMS — segmento T3–L3';
  else if (nmi && distribution.includes('Tetra')) localization = 'NMI — segmento C6–T2';
  else if (nms && distribution.includes('Tetra')) localization = 'NMS — segmento C1–C5';
  else if (nmi) localization = 'Neurônio motor inferior (NMI)';
  else if (nms) localization = 'Neurônio motor superior (NMS)';

  const parts = [distribution !== 'Indefinida' ? distribution : '', localization !== 'A definir clinicamente' ? localization : '', severity]
    .filter(Boolean);
  const summary = parts.join(' · ');

  return { hasData: true, severity, distribution, localization, summary };
}

/* ----------------------- Sugestão de plano terapêutico ---------------------- */

/**
 * Gera uma sugestão de plano (campos editáveis) a partir da avaliação e dos
 * exames. Preenche objetivos, modalidades, frequência e metas por eixo.
 */
export function suggestPlan(ev: EvaluationData, exams: Exam[]): Partial<PlanData> {
  const autonomy = computeFunctionalAutonomy(ev);
  const neuro = classifyNeuro(ev);
  const modalities = new Set<string>();
  const goals: string[] = [];
  const out: Partial<PlanData> = {};

  // Dor / inflamação
  if (has(ev.painScale, 'leve', 'moderada', 'intensa', 'máxima')) {
    out.painControl = 'Analgesia: laserterapia, eletroterapia (TENS) e mobilização suave dentro do limiar de dor.';
    out.inflammationReduction = 'Controle de processo inflamatório com laser/magnetoterapia e crioterapia quando indicado.';
    modalities.add('Laserterapia').add('TENS/FES');
    goals.push('Reduzir a dor e o processo inflamatório');
  }

  // Marcha / apoio
  if (has(ev.lamenessGrade, 'grau') || has(ev.gait, 'claudicação', 'ataxia', 'arrastar')) {
    out.gaitImprovement = 'Reeducação da marcha e do apoio: cavaletti, esteira aquática e treino de transferência de peso.';
    modalities.add('Esteira Aquática').add('Cavaletti');
    goals.push('Melhorar o padrão de marcha e o apoio do membro');
  }

  // ADM
  if (ev.jointMobility.some((m) => has(m, 'redução', 'anquilose', 'dor', 'crepitação'))) {
    out.romGain = 'Ganho de amplitude articular: mobilização passiva (PROM), alongamentos e termoterapia prévia.';
    modalities.add('Mobilização (PROM/AROM)').add('Alongamento');
    goals.push('Recuperar a amplitude de movimento articular');
  }

  // Força / massa
  if (has(ev.muscleMass, 'leve', 'moderada', 'acentuada')) {
    out.strengthening = 'Fortalecimento progressivo: exercícios ativos assistidos, esteira e treino funcional resistido.';
    modalities.add('Esteira Aquática').add('Cavaletti');
    goals.push('Recuperar massa e força muscular');
  }

  // Propriocepção / neuro
  if (neuro.hasData || ev.neuroPostural.length > 0) {
    out.proprioception = 'Treino proprioceptivo e neurofuncional: pranchas de equilíbrio, bola, estímulos sensoriais e facilitação neuromuscular.';
    out.functionalTraining = 'Treino funcional orientado às atividades de vida diária (levantar, deitar, subir degrau, virar).';
    modalities.add('Propriocepção').add('Mobilização (PROM/AROM)');
    if (has(ev.neuroGrade, 'grau iii', 'grau iv', 'grau v')) modalities.add('Acupuntura');
    goals.push('Estimular propriocepção e reorganização neuromuscular');
  }

  // Educação e prevenção (sempre)
  out.recurrencePrevention = 'Prevenção de recidiva: controle de peso, adequação do ambiente (pisos antiderrapantes, rampas) e manutenção da atividade.';
  out.tutorEducation = 'Orientações ao tutor: exercícios domiciliares, sinais de alerta, manejo da dor e adesão ao plano.';

  // Frequência e número de sessões conforme gravidade
  if (autonomy.score >= 80) { out.frequency = '1x na semana'; out.sessionsRecommended = '5 sessões'; }
  else if (autonomy.score >= 60) { out.frequency = '2x na semana'; out.sessionsRecommended = '10 sessões'; }
  else { out.frequency = '3x na semana'; out.sessionsRecommended = '10 sessões'; }

  out.goals = goals.length ? goals.map((g, i) => `${i + 1}. ${g}`).join('\n') : 'Definir metas a partir da avaliação.';
  out.modalities = [...modalities].join(', ');

  // Diagnóstico funcional de partida
  const dxBits = [
    neuro.hasData ? `Quadro neurofuncional (${neuro.summary})` : '',
    `Autonomia funcional: ${autonomy.level} (${autonomy.score}/100)`,
    exams.length ? `${exams.length} exame(s) complementar(es) correlacionado(s)` : '',
  ].filter(Boolean);
  out.diagnosis = dxBits.join('. ') + '.';

  return out;
}
