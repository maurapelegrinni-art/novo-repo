import { Calculator, FileDown, MessageCircle, Mail } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generateReceiptPDF } from '../utils/pdfGenerator';

const PAYMENT_METHODS = [
  'PIX',
  'Dinheiro',
  'Débito',
  'Crédito à vista',
  'Crédito parcelado',
  'Outros'
];

export default function Financial() {
  const financial = useAppStore((state) => state.financial);
  const setFinancial = useAppStore((state) => state.setFinancial);
  const patient = useAppStore((state) => state.patient);
  const sessions = useAppStore((state) => state.sessions);

  const handleMethodChange = (type: 'eval' | 'package', method: string) => {
    let defaultTax = '0';
    if (method === 'Débito') defaultTax = '1.99';
    if (method === 'Crédito à vista') defaultTax = '4.99';
    if (method === 'Crédito parcelado') defaultTax = '5.99';

    if (type === 'eval') {
      setFinancial({ evalMethod: method, evalTax: defaultTax });
    } else {
      setFinancial({ packageMethod: method, packageTax: defaultTax });
    }
  };

  const calcNet = (bruto: string, taxa: string) => {
    const b = parseFloat(bruto) || 0;
    const t = parseFloat(taxa) || 0;
    const taxValue = b * (t / 100);
    return { taxValue, netValue: b - taxValue, grossValue: b };
  };

  const evalCalc = calcNet(financial.evalValue, financial.evalTax);
  const packageCalc = calcNet(financial.packageTotal, financial.packageTax);

  const totalBruto = evalCalc.grossValue + packageCalc.grossValue;
  const totalTaxas = evalCalc.taxValue + packageCalc.taxValue;
  const totalLiquido = evalCalc.netValue + packageCalc.netValue;

  const totalSessionsContracted = parseInt(financial.packageSessions) || 0;
  const totalSessionsDone = sessions.length;
  const remainingSessions = Math.max(0, totalSessionsContracted - totalSessionsDone);

  const handleWhatsApp = () => {
    const phone = patient.tutorPhone.replace(/\D/g, '');
    const msg = `Olá, ${patient.tutorName || 'Tutor'}. Segue o recibo referente ao atendimento/pacote da paciente ${patient.patientName || 'sua pet'}. Qualquer dúvida estou à disposição. Dra. Maura Pelegrinni.`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmail = () => {
    const subject = `Recibo de atendimento - ${patient.patientName || 'Paciente'}`;
    const body = `Olá, ${patient.tutorName || 'Tutor'}.\n\nSegue em anexo o recibo referente ao atendimento/pacote da paciente ${patient.patientName || 'sua pet'}.\n\nQualquer dúvida estou à disposição.\n\nDra. Maura Pelegrinni.`;
    window.open(`mailto:${patient.tutorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 mt-2">Gestão de pacotes, avaliação e recebimentos.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={generateReceiptPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <FileDown size={18} />
            <span className="hidden sm:inline">Gerar Recibo PDF</span>
          </button>
        </div>
      </header>

      {/* Ações de Envio */}
      <div className="flex gap-4">
        <button 
          onClick={handleWhatsApp}
          className="flex-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle size={20} />
          Enviar por WhatsApp
        </button>
        <button 
          onClick={handleEmail}
          className="flex-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Mail size={20} />
          Enviar por E-mail
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Avaliação Inicial */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Avaliação Inicial</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                checked={financial.evalSeparate}
                onChange={(e) => setFinancial({ evalSeparate: e.target.checked })}
              />
              <span className="text-sm font-medium text-gray-700">Cobrada Separadamente</span>
            </label>
          </div>

          {financial.evalSeparate ? (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Bruto (R$)</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                    value={financial.evalValue}
                    onChange={(e) => setFinancial({ evalValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data do pagamento</label>
                  <input
                    type="date"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                    value={financial.evalDate}
                    onChange={(e) => setFinancial({ evalDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                    value={financial.evalMethod}
                    onChange={(e) => handleMethodChange('eval', e.target.value)}
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxa (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={financial.evalMethod === 'PIX' || financial.evalMethod === 'Dinheiro'}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    value={financial.evalTax}
                    onChange={(e) => setFinancial({ evalTax: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex justify-between items-center text-sm">
                <span className="text-purple-800 font-medium">Valor Líquido:</span>
                <span className="font-bold text-purple-900">R$ {evalCalc.netValue.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Avaliação incluída no pacote ou cortesia.</p>
          )}
        </div>

        {/* Pacote de Sessões */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Pacote de Sessões</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Contratada</label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: 10"
                  value={financial.packageSessions}
                  onChange={(e) => setFinancial({ packageSessions: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor total do pacote (R$)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                  value={financial.packageTotal}
                  onChange={(e) => setFinancial({ packageTotal: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  value={financial.packageMethod}
                  onChange={(e) => handleMethodChange('package', e.target.value)}
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa (%)</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={financial.packageMethod === 'PIX' || financial.packageMethod === 'Dinheiro'}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  value={financial.packageTax}
                  onChange={(e) => setFinancial({ packageTax: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do pagamento</label>
                <input
                  type="date"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  value={financial.packageDate}
                  onChange={(e) => setFinancial({ packageDate: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex justify-between items-center text-sm">
              <span className="text-purple-800 font-medium">Valor Líquido:</span>
              <span className="font-bold text-purple-900">R$ {packageCalc.netValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="col-span-1 lg:col-span-2 bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-2xl shadow-md text-white">
          <div className="flex items-center gap-3 mb-6">
            <Calculator size={24} className="text-purple-300" />
            <h2 className="text-xl font-semibold">Resumo Automático</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/10 p-4 rounded-xl border border-white/20">
              <span className="block text-purple-200 text-sm mb-1">Total Bruto</span>
              <span className="text-2xl font-bold">R$ {totalBruto.toFixed(2)}</span>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/20">
              <span className="block text-red-200 text-sm mb-1">Total Taxas</span>
              <span className="text-2xl font-bold">-R$ {totalTaxas.toFixed(2)}</span>
            </div>
            <div className="bg-white/20 p-4 rounded-xl border border-white/30 shadow-inner">
              <span className="block text-green-200 text-sm mb-1">Total Líquido Recebido</span>
              <span className="text-2xl font-bold text-green-100">R$ {totalLiquido.toFixed(2)}</span>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <span className="text-purple-200 text-sm">Sessões Realizadas</span>
                <span className="font-bold">{totalSessionsDone} / {totalSessionsContracted}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-400 h-2 rounded-full" 
                  style={{ width: `${totalSessionsContracted > 0 ? Math.min(100, (totalSessionsDone / totalSessionsContracted) * 100) : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-purple-200 mt-2 text-right">{remainingSessions} restantes</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
