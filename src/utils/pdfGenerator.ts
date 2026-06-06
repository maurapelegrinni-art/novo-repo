import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppStore, type Patient, type Tutor } from '../store/useAppStore';
import { summarizeEvaluation, summarizeNeuro, examImpactLabel } from './summary';
import { getDosimetryFields } from '../constants/clinical';

/**
 * Geração de PDFs (recibo e relatórios) com jsPDF + jspdf-autotable v5.
 *
 * IMPORTANTE: na v5 do jspdf-autotable o método `doc.autoTable(...)` deixou de
 * existir; a API correta é a FUNCIONAL: `autoTable(doc, options)`. Após a
 * chamada, a posição final fica em `doc.lastAutoTable.finalY`.
 */

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

const COLORS = {
  primary: [107, 33, 168] as [number, number, number],
  light: [243, 232, 255] as [number, number, number],
  text: [55, 65, 81] as [number, number, number],
};

const VET_NAME = 'Dra. Maura Dias Adriano';
const VET_TITLE = 'Médica Veterinária - Fisioterapia e Reabilitação';

function currentContext(): { patient: Patient | null; tutor: Tutor | undefined } {
  const s = useAppStore.getState();
  const patient = s.patients.find((p) => p.id === s.currentPatientId) ?? null;
  const tutor = patient ? s.tutors.find((t) => t.id === patient.tutorId) : undefined;
  return { patient, tutor };
}

/** Normaliza um texto para uso em nome de arquivo (MAIÚSCULAS, sem acento/espaço). */
function slug(text: string | undefined, fallback = 'SEM_NOME'): string {
  const base = (text || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const clean = base.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return clean || fallback;
}

/** Data de hoje no formato DD-MM-AAAA para nome de arquivo. */
function dateForFile(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

const finalY = (doc: DocWithTable, fallback: number) => doc.lastAutoTable?.finalY ?? fallback;

function drawHeader(doc: jsPDF, title: string) {
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${VET_NAME} - Fisioterapia Veterinária`, 105, 28, { align: 'center' });
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
}

function drawPatientBlock(doc: jsPDF, startY: number): number {
  const { patient, tutor } = currentContext();
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTIFICAÇÃO', 14, startY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tutor: ${tutor?.name || '—'}`, 14, startY + 8);
  doc.text(`Paciente: ${patient?.name || '—'} (${patient?.species || '—'}, ${patient?.breed || '—'})`, 14, startY + 14);
  doc.text(`Prontuário: ${patient?.prontuario || '—'}`, 14, startY + 20);
  doc.text(`Telefone: ${tutor?.phone || '—'}`, 120, startY + 8);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 120, startY + 14);
  return startY + 28;
}

function drawSectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text(text, 14, y);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  return y + 6;
}

function drawSignature(doc: jsPDF, y: number) {
  doc.line(65, y, 145, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(VET_NAME, 105, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(VET_TITLE, 105, y + 10, { align: 'center' });
}

function drawFooter(doc: jsPDF) {
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Documento gerado automaticamente pelo sistema Pelegrinni.', 105, 290, { align: 'center' });
}

const brl = (v: number) => `R$ ${v.toFixed(2)}`;

/* --------------------------- RECIBO --------------------------- */

export interface ReceiptInput {
  serviceDesc: string;
  qty: number;
  unit: number;
  sessionsTotal: number;
  evalIncluded: number;
  evalSeparate: number;
  displacement: number;
  displacementLabel?: string;
  discount: number;
  method: string;
  taxPct: number;
  taxValue: number;
  total: number; // pago pelo tutor
  net: number; // líquido recebido pela clínica
  /** Nome de quem registrou o recebimento (usuário logado). */
  responsible?: string;
  /** Observação opcional (ex.: avaliação). */
  note?: string;
}

export const generateReceiptPDF = (data: ReceiptInput) => {
  const { patient, tutor } = currentContext();
  const doc = new jsPDF() as DocWithTable;

  drawHeader(doc, 'RECIBO DE ATENDIMENTO');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tutor: ${tutor?.name || '—'}`, 14, 52);
  doc.text(`CPF: ${tutor?.cpf || '—'}`, 14, 58);
  doc.text(`Paciente: ${patient?.name || '—'}`, 120, 52);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 120, 58);

  const rows: string[][] = [];
  if (data.evalSeparate > 0) rows.push(['Avaliação (cobrada separadamente)', '1', brl(data.evalSeparate), brl(data.evalSeparate)]);
  if (data.qty > 0) rows.push([data.serviceDesc, String(data.qty), brl(data.unit), brl(data.sessionsTotal)]);
  if (data.evalIncluded > 0) rows.push(['Avaliação (inclusa no pacote)', '1', brl(data.evalIncluded), brl(data.evalIncluded)]);
  if (data.displacement > 0) rows.push([data.displacementLabel || 'Deslocamento', '1', brl(data.displacement), brl(data.displacement)]);

  autoTable(doc, {
    startY: 68,
    head: [['Descrição', 'Qtd', 'Unitário', 'Total']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
  });

  let y = finalY(doc, 68) + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.note) { doc.text(`Obs.: ${data.note}`, 14, y); y += 6; }
  if (data.discount > 0) { doc.text(`Desconto concedido (pacote): ${brl(data.discount)}`, 14, y); y += 6; }
  doc.text(`Forma de pagamento: ${data.method}`, 14, y); y += 6;
  doc.text(`Taxa (${data.taxPct}%): ${brl(data.taxValue)}`, 14, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Valor pago pelo tutor: ${brl(data.total)}`, 14, y); y += 6;
  doc.text(`Valor líquido recebido: ${brl(data.net)}`, 14, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Recebido por: ${data.responsible || VET_NAME}`, 14, y); y += 12;

  drawSignature(doc, y + 6);
  drawFooter(doc);

  const file = `RECIBO_${slug(patient?.name, 'PACIENTE')}_${slug(tutor?.name, 'TUTOR')}_${dateForFile()}.pdf`;
  doc.save(file);
};

/* ----------------------- RELATÓRIO DE AVALIAÇÃO ----------------------- */

export const generateEvaluationReportPDF = () => {
  const s = useAppStore.getState();
  const { patient } = currentContext();
  const pid = patient?.id;
  const evaluation = pid ? s.evaluations[pid] : undefined;
  const plan = pid ? s.plans[pid] : undefined;
  const exams = s.exams.filter((e) => e.patientId === pid && e.includeInReport);

  const doc = new jsPDF() as DocWithTable;
  drawHeader(doc, 'RELATÓRIO DE AVALIAÇÃO');
  let y = drawPatientBlock(doc, 52);

  if (evaluation?.history) {
    y = drawSectionTitle(doc, 'Queixa principal e histórico', y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(evaluation.history, 182);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 4;
  }

  const evalRows = evaluation
    ? [...summarizeEvaluation(evaluation), ...summarizeNeuro(evaluation)].map((i) => [i.label, i.value])
    : [];
  if (evalRows.length) {
    y = drawSectionTitle(doc, 'Avaliação funcional e neurológica', y + 2);
    autoTable(doc, {
      startY: y,
      head: [['Parâmetro', 'Achado']],
      body: evalRows,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
    });
    y = finalY(doc, y) + 6;
  }

  if (exams.length) {
    y = drawSectionTitle(doc, 'Exames complementares', y);
    autoTable(doc, {
      startY: y,
      head: [['Exame', 'Data', 'Achados', 'Impacto', 'Anexos']],
      body: exams.map((e) => [e.type, e.date || '—', e.findings || '—', examImpactLabel(e.status), String(e.files.length)]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    });
    y = finalY(doc, y) + 6;
  }

  const planParts: string[] = [];
  if (plan?.diagnosis) planParts.push(`Diagnóstico funcional: ${plan.diagnosis}`);
  if (plan?.goals) planParts.push(`Objetivos: ${plan.goals}`);
  if (plan?.sessionsRecommended) planParts.push(`Sessões sugeridas: ${plan.sessionsRecommended}`);
  if (plan?.frequency) planParts.push(`Frequência: ${plan.frequency}`);
  if (plan?.modalities) planParts.push(`Modalidades: ${plan.modalities}`);
  if (plan?.correlationNotes) planParts.push(`Correlação clínica:\n${plan.correlationNotes}`);
  if (planParts.length) {
    if (y > 250) { doc.addPage(); y = 20; }
    y = drawSectionTitle(doc, 'Plano terapêutico', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const text = doc.splitTextToSize(planParts.join('\n\n'), 182);
    doc.text(text, 14, y);
  }

  drawFooter(doc);
  doc.save(`RELATORIO_AVALIACAO_${slug(patient?.name, 'PACIENTE')}_${dateForFile()}.pdf`);
};

/* ----------------------- RELATÓRIO DE EVOLUÇÃO ----------------------- */

export const generateEvolutionReportPDF = () => {
  const s = useAppStore.getState();
  const { patient } = currentContext();
  const pid = patient?.id;
  const sessions = s.sessions.filter((x) => x.patientId === pid);
  const activePkg = s.packages.find((p) => p.patientId === pid && p.status === 'ativo');

  const doc = new jsPDF() as DocWithTable;
  drawHeader(doc, 'RELATÓRIO DE EVOLUÇÃO');
  let y = drawPatientBlock(doc, 52);

  const contracted = activePkg?.sessionsContracted ?? 0;
  const done = sessions.length;
  const remaining = Math.max(0, contracted - done);

  y = drawSectionTitle(doc, 'Progresso do pacote', y + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Sessões realizadas: ${done}${contracted ? ` de ${contracted} contratadas` : ''}.`, 14, y);
  if (contracted) doc.text(`Sessões restantes: ${remaining}.`, 14, y + 6);
  y += contracted ? 14 : 8;

  if (sessions.length === 0) {
    doc.text('Nenhuma sessão registrada até o momento.', 14, y);
  } else {
    const rows = [...sessions]
      .sort((a, b) => a.number - b.number)
      .map((sess) => {
        const therapies = sess.therapies
          .map((t) => {
            const fields = getDosimetryFields(t.modalityId);
            const dose = Object.entries(t.dosimetry)
              .filter(([, v]) => v)
              .map(([k, v]) => `${fields.find((f) => f.key === k)?.label ?? k}: ${v}`)
              .join('; ');
            return dose ? `${t.name} (${dose})` : t.name;
          })
          .join('\n');
        return [`#${sess.number}`, sess.date, therapies || '—', sess.evolution || '—'];
      });

    y = drawSectionTitle(doc, 'Sessões realizadas', y);
    autoTable(doc, {
      startY: y,
      head: [['Nº', 'Data', 'Terapias / Dosimetria', 'Evolução']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, valign: 'top' },
      columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 24 }, 2: { cellWidth: 75 } },
    });
  }

  drawFooter(doc);
  doc.save(`RELATORIO_EVOLUCAO_${slug(patient?.name, 'PACIENTE')}_${dateForFile()}.pdf`);
};
