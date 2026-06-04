import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAppStore } from '../store/useAppStore';

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
  lastAutoTable: {
    finalY: number;
  };
}

export const generateReceiptPDF = () => {
  const state = useAppStore.getState();
  const { patient, financial } = state;

  const doc = new jsPDF() as jsPDFWithAutoTable;
  
  // Cores Padrão Pelegrinni
  const primaryColor = [107, 33, 168]; // rgb(107, 33, 168) - purple-800
  const lightPurple = [243, 232, 255]; // rgb(243, 232, 255) - purple-100
  const textColor = [55, 65, 81]; // gray-700

  // Cabeçalho
  doc.setFillColor(lightPurple[0], lightPurple[1], lightPurple[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RECIBO DE ATENDIMENTO", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Dra. Maura Pelegrinni - Fisioterapia Veterinária", 105, 28, { align: "center" });

  // Dados do Cliente
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO PACIENTE E RESPONSÁVEL", 14, 55);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tutor: ${patient.tutorName || 'Não informado'}`, 14, 65);
  doc.text(`CPF/CNPJ: ${patient.tutorCpf || 'Não informado'}`, 14, 72);
  doc.text(`Paciente: ${patient.patientName || 'Não informado'} (${patient.patientSpecies || ''})`, 14, 79);
  doc.text(`Telefone: ${patient.tutorPhone || 'Não informado'}`, 120, 65);
  doc.text(`E-mail: ${patient.tutorEmail || 'Não informado'}`, 120, 72);

  // Serviços e Valores (Tabela)
  const tableData = [];
  
  let totalBruto = 0;
  let totalTaxas = 0;
  let totalLiquido = 0;

  if (financial.evalSeparate && financial.evalValue) {
    const val = parseFloat(financial.evalValue);
    const tax = parseFloat(financial.evalTax || '0');
    const valTax = val * (tax / 100);
    const valLiq = val - valTax;
    
    totalBruto += val;
    totalTaxas += valTax;
    totalLiquido += valLiq;

    tableData.push([
      `Avaliação Inicial (${financial.evalDate})`,
      financial.evalMethod,
      `R$ ${val.toFixed(2)}`,
      `${tax}%`,
      `R$ ${valLiq.toFixed(2)}`
    ]);
  }

  if (financial.packageTotal) {
    const val = parseFloat(financial.packageTotal);
    const tax = parseFloat(financial.packageTax || '0');
    const valTax = val * (tax / 100);
    const valLiq = val - valTax;
    
    totalBruto += val;
    totalTaxas += valTax;
    totalLiquido += valLiq;

    tableData.push([
      `Pacote: ${financial.packageSessions} Sessões (${financial.packageDate})`,
      financial.packageMethod,
      `R$ ${val.toFixed(2)}`,
      `${tax}%`,
      `R$ ${valLiq.toFixed(2)}`
    ]);
  }

  doc.autoTable({
    startY: 90,
    head: [['Descrição do Serviço', 'Forma Pagto.', 'Valor Bruto', 'Taxa', 'Valor Líquido']],
    body: tableData,
    foot: [['TOTAL GERAL', '', `R$ ${totalBruto.toFixed(2)}`, `R$ ${totalTaxas.toFixed(2)}`, `R$ ${totalLiquido.toFixed(2)}`]],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    footStyles: { fillColor: lightPurple, textColor: primaryColor, fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 5 }
  });

  // Assinatura
  const finalY = doc.lastAutoTable.finalY + 40;
  doc.line(65, finalY, 145, finalY);
  doc.setFont("helvetica", "bold");
  doc.text("Dra. Maura Pelegrinni", 105, finalY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Médica Veterinária Especializada", 105, finalY + 10, { align: "center" });

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Recibo gerado automaticamente pelo sistema Pelegrinni", 105, 280, { align: "center" });

  doc.save(`Recibo_${patient.patientName || 'Paciente'}_${new Date().getTime()}.pdf`);
};
