import type { EvaluationData, Exam, PlanData } from '../store/useAppStore';

export interface SummaryItem {
  label: string;
  value: string;
}

const join = (arr: string[]) => (arr.length ? arr.join(', ') : '');

/**
 * Resumo estruturado da avaliação funcional, usado no Plano (correlação)
 * e nos relatórios em PDF. Itens vazios são omitidos.
 */
export function summarizeEvaluation(ev: EvaluationData): SummaryItem[] {
  const items: SummaryItem[] = [
    { label: 'Dor', value: ev.painScale },
    { label: 'Marcha', value: ev.gait },
    { label: 'Claudicação', value: ev.lamenessGrade },
    { label: 'Postura', value: ev.posture },
    { label: 'Condição corporal', value: ev.bodyCondition },
    { label: 'Massa muscular', value: ev.muscleMass },
    { label: 'ADM', value: join(ev.jointMobility) },
    { label: 'Classificação funcional', value: ev.functionalClass },
  ];
  return items.filter((i) => i.value);
}

/** Resumo estruturado da avaliação neurológica. */
export function summarizeNeuro(ev: EvaluationData): SummaryItem[] {
  const items: SummaryItem[] = [
    { label: 'Estado mental', value: ev.neuroMentation },
    { label: 'Reações posturais', value: join(ev.neuroPostural) },
    { label: 'Reflexos', value: join(ev.neuroReflexes) },
    { label: 'Ataxia', value: join(ev.neuroAtaxia) },
    { label: 'Grau de disfunção', value: ev.neuroGrade },
    { label: 'Achados adicionais', value: join(ev.neuroFindings) },
  ];
  return items.filter((i) => i.value);
}

const EXAM_IMPACT_LABEL: Record<Exam['status'], string> = {
  confirma: 'confirma a conduta clínica',
  complementa: 'complementa a conduta clínica',
  nao_altera: 'não altera a conduta clínica',
  '': 'sem análise definida',
};

export function examImpactLabel(status: Exam['status']): string {
  return EXAM_IMPACT_LABEL[status];
}

/**
 * Gera um texto de correlação Avaliação → Exames → Plano, agregando
 * os achados disponíveis. Serve como rascunho editável pela veterinária.
 */
export function buildCorrelation(ev: EvaluationData, exams: Exam[], plan: PlanData): string {
  const lines: string[] = [];

  const funcItems = summarizeEvaluation(ev);
  const neuroItems = summarizeNeuro(ev);

  lines.push('CORRELAÇÃO CLÍNICA — AVALIAÇÃO → EXAMES → PLANO');
  lines.push('');

  if (funcItems.length || neuroItems.length) {
    lines.push('1) Achados da avaliação:');
    funcItems.forEach((i) => lines.push(`   • ${i.label}: ${i.value}`));
    neuroItems.forEach((i) => lines.push(`   • ${i.label}: ${i.value}`));
  } else {
    lines.push('1) Achados da avaliação: não preenchidos.');
  }
  lines.push('');

  if (exams.length) {
    lines.push('2) Exames complementares:');
    exams.forEach((e) =>
      lines.push(`   • ${e.type} (${e.date || 's/ data'}): ${e.findings || 'sem achados'} — ${examImpactLabel(e.status)}.`)
    );
  } else {
    lines.push('2) Exames complementares: nenhum anexado.');
  }
  lines.push('');

  lines.push('3) Síntese para o plano terapêutico:');
  if (plan.diagnosis) lines.push(`   • Diagnóstico funcional: ${plan.diagnosis}`);
  if (ev.functionalClass) lines.push(`   • Estado funcional atual: ${ev.functionalClass}.`);
  if (ev.painScale) lines.push(`   • Controle de dor indicado (nível atual: ${ev.painScale}).`);
  if (ev.lamenessGrade) lines.push(`   • Reabilitação da marcha (${ev.lamenessGrade}).`);
  if (ev.neuroGrade) lines.push(`   • Conduta neurofuncional (${ev.neuroGrade}).`);
  if (ev.muscleMass && ev.muscleMass !== 'Normal') lines.push(`   • Recuperação de massa muscular (${ev.muscleMass}).`);
  lines.push('');
  lines.push('Conduta sujeita ao julgamento clínico da médica veterinária responsável.');

  return lines.join('\n');
}
