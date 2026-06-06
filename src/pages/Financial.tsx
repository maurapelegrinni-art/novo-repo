import { useMemo, useState } from 'react';
import {
  Calculator, FileDown, MessageCircle, Mail, Settings, TrendingUp, Wallet,
  Plus, Trash2, CheckCircle2, MapPin, Tag,
} from 'lucide-react';
import { useAppStore, useCurrentPatient } from '../store/useAppStore';
import { generateReceiptPDF, type ReceiptInput } from '../utils/pdfGenerator';
import { PAYMENT_METHODS } from '../constants/clinical';

const num = (s: string) => parseFloat(s) || 0;
const brl = (v: number) => `R$ ${v.toFixed(2)}`;
const newId = () => Math.random().toString(36).substring(2, 9);

type EvalMode = 'separate' | 'included' | 'none';
type ServiceMode = 'single' | 'pkg5' | 'pkg10' | 'custom';

export default function Financial() {
  const patient = useCurrentPatient();
  const tutors = useAppStore((s) => s.tutors);
  const pricing = useAppStore((s) => s.pricing);
  const payments = useAppStore((s) => s.payments);
  const packages = useAppStore((s) => s.packages);
  const sessions = useAppStore((s) => s.sessions);
  const patients = useAppStore((s) => s.patients);
  const addPayment = useAppStore((s) => s.addPayment);
  const removePayment = useAppStore((s) => s.removePayment);
  const addPackage = useAppStore((s) => s.addPackage);

  const [showConfig, setShowConfig] = useState(false);
  const [order, setOrder] = useState({
    evalMode: 'included' as EvalMode,
    serviceMode: 'pkg10' as ServiceMode,
    customQty: '10',
    customUnit: '',
    cityId: pricing.cities[0]?.id ?? 'clinica',
    method: 'PIX',
  });

  const tutor = patient ? tutors.find((t) => t.id === patient.tutorId) : undefined;

  /* -------- cálculo do orçamento (tempo real) -------- */
  const calc = useMemo(() => {
    const single = num(pricing.singleSessionPrice);
    const unitFor = (m: ServiceMode) =>
      m === 'single' ? single
      : m === 'pkg5' ? num(pricing.package5Unit)
      : m === 'pkg10' ? num(pricing.package10Unit)
      : (num(order.customUnit) || single);
    const qtyFor = (m: ServiceMode) =>
      m === 'single' ? 1 : m === 'pkg5' ? 5 : m === 'pkg10' ? 10 : (parseInt(order.customQty) || 0);

    const unit = unitFor(order.serviceMode);
    const qty = qtyFor(order.serviceMode);
    const sessionsTotal = unit * qty;
    const avulsoTotal = single * qty;
    const discount = Math.max(0, avulsoTotal - sessionsTotal);

    const evalPrice = num(pricing.evaluationPrice);
    const evalIncluded = order.evalMode === 'included' ? evalPrice : 0;
    const evalSeparate = order.evalMode === 'separate' ? evalPrice : 0;

    const city = pricing.cities.find((c) => c.id === order.cityId);
    const displacement = num(city?.value ?? '0');

    const taxPct = num(pricing.taxes[order.method] ?? '0');
    const total = sessionsTotal + evalIncluded + evalSeparate + displacement; // pago pelo tutor
    const taxValue = total * (taxPct / 100);
    const net = total - taxValue;

    return { single, unit, qty, sessionsTotal, avulsoTotal, discount, evalPrice, evalIncluded, evalSeparate, displacement, taxPct, total, taxValue, net, cityName: city?.name ?? '' };
  }, [pricing, order]);

  /* -------- comparação avulso x pacotes -------- */
  const comparison = useMemo(() => {
    const single = num(pricing.singleSessionPrice);
    const mk = (label: string, unit: number, qty: number) => ({
      label, unit, qty, total: unit * qty, economia: Math.max(0, single * qty - unit * qty),
    });
    return [
      mk('Avulso (10x)', single, 10),
      mk('Pacote 5', num(pricing.package5Unit), 5),
      mk('Pacote 10', num(pricing.package10Unit), 10),
    ];
  }, [pricing]);

  const serviceLabel =
    order.serviceMode === 'single' ? 'Sessão avulsa'
    : order.serviceMode === 'pkg5' ? 'Pacote de 5 sessões'
    : order.serviceMode === 'pkg10' ? 'Pacote de 10 sessões'
    : `Pacote personalizado (${calc.qty}x)`;

  /* -------- histórico do paciente -------- */
  const patientPayments = payments.filter((p) => p.patientId === patient?.id);
  const patientPackages = packages.filter((p) => p.patientId === patient?.id);
  const activePkg = patientPackages.find((p) => p.status === 'ativo');
  const sessionsDone = sessions.filter((s) => s.patientId === patient?.id).length;
  const balance = activePkg ? Math.max(0, activePkg.sessionsContracted - sessionsDone) : 0;
  const received = patientPayments.reduce((sum, p) => sum + p.net, 0);

  /* -------- indicadores globais -------- */
  const indicators = useMemo(() => {
    const grossTotal = payments.reduce((s, p) => s + p.gross + p.displacement, 0);
    const taxTotal = payments.reduce((s, p) => s + (p.gross + p.displacement) * (p.taxPercent / 100), 0);
    const netTotal = payments.reduce((s, p) => s + p.net, 0);
    const payingPatients = new Set(payments.map((p) => p.patientId)).size;
    const avgPerPatient = payingPatients ? grossTotal / payingPatients : 0;
    const pendingSessions = packages
      .filter((pk) => pk.status === 'ativo')
      .reduce((s, pk) => s + Math.max(0, pk.sessionsContracted - sessions.filter((x) => x.patientId === pk.patientId).length), 0);
    const byCategory = new Map<string, number>();
    payments.forEach((p) => byCategory.set(p.category, (byCategory.get(p.category) || 0) + p.net));
    return { grossTotal, taxTotal, netTotal, avgPerPatient, pendingSessions, sessionsDone: sessions.length, byCategory: [...byCategory.entries()] };
  }, [payments, packages, sessions]);

  const receiptData = (): ReceiptInput => ({
    serviceDesc: serviceLabel,
    qty: calc.qty,
    unit: calc.unit,
    sessionsTotal: calc.sessionsTotal,
    evalIncluded: calc.evalIncluded,
    evalSeparate: calc.evalSeparate,
    displacement: calc.displacement,
    discount: calc.discount,
    method: order.method,
    taxPct: calc.taxPct,
    taxValue: calc.taxValue,
    total: calc.total,
    net: calc.net,
  });

  const registerPayment = () => {
    if (!patient || !tutor) return;
    const today = new Date().toISOString().split('T')[0];
    const gross = calc.sessionsTotal + calc.evalIncluded + calc.evalSeparate;
    addPayment({
      patientId: patient.id,
      tutorId: tutor.id,
      date: today,
      description: serviceLabel + (calc.evalSeparate ? ' + Avaliação' : ''),
      category: order.serviceMode === 'single' ? 'Sessão avulsa' : 'Pacote',
      method: order.method,
      gross,
      taxPercent: calc.taxPct,
      net: calc.net,
      discount: calc.discount,
      displacement: calc.displacement,
    });
    if (order.serviceMode !== 'single' && calc.qty > 0) {
      addPackage({
        patientId: patient.id,
        date: today,
        sessionsContracted: calc.qty,
        unitPrice: calc.unit,
        total: calc.sessionsTotal,
        status: 'ativo',
      });
    }
  };

  const handleWhatsApp = () => {
    if (!tutor) return;
    const phone = (tutor.whatsapp || tutor.phone).replace(/\D/g, '');
    const msg = `Olá, ${tutor.name || 'Tutor'}. Segue o orçamento referente ao atendimento de ${patient?.name || 'seu pet'}:\n\n${serviceLabel}: ${brl(calc.sessionsTotal)}${calc.evalIncluded ? `\nAvaliação inclusa: ${brl(calc.evalIncluded)}` : ''}${calc.evalSeparate ? `\nAvaliação: ${brl(calc.evalSeparate)}` : ''}${calc.displacement ? `\nDeslocamento (${calc.cityName}): ${brl(calc.displacement)}` : ''}\nTotal: ${brl(calc.total)} (${order.method})\n\nDra. Maura Dias Adriano.`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmail = () => {
    if (!tutor) return;
    const subject = `Orçamento - ${patient?.name || 'Paciente'}`;
    const body = `Olá, ${tutor.name || 'Tutor'}.\n\nSegue o orçamento referente ao atendimento de ${patient?.name || 'seu pet'}.\n\n${serviceLabel}: ${brl(calc.sessionsTotal)}\nTotal: ${brl(calc.total)} (${order.method})\n\nDra. Maura Dias Adriano.`;
    window.open(`mailto:${tutor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const radio = (checked: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-colors ${
      checked ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="mb-2 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 mt-2">Orçamento, cobrança, recebimentos e indicadores comerciais.</p>
        </div>
        <button onClick={() => setShowConfig(!showConfig)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 self-start">
          <Settings size={18} /> Configurar Preços
        </button>
      </header>

      {/* Config de preços */}
      {showConfig && <PricingConfigPanel />}

      {/* Indicadores globais */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-2xl shadow-md text-white">
        <div className="flex items-center gap-3 mb-5">
          <TrendingUp size={22} className="text-purple-300" />
          <h2 className="text-xl font-semibold">Indicadores (geral)</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Faturamento bruto" value={brl(indicators.grossTotal)} />
          <Kpi label="Taxas pagas" value={`- ${brl(indicators.taxTotal)}`} tone="red" />
          <Kpi label="Receita líquida" value={brl(indicators.netTotal)} tone="green" />
          <Kpi label="Ticket médio/paciente" value={brl(indicators.avgPerPatient)} />
          <Kpi label="Sessões realizadas" value={String(indicators.sessionsDone)} />
          <Kpi label="Sessões pendentes" value={String(indicators.pendingSessions)} />
          <Kpi label="Recibos emitidos" value={String(payments.length)} />
          <Kpi label="Pacientes" value={String(patients.length)} />
        </div>
        {indicators.byCategory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/15">
            <p className="text-xs text-purple-200 mb-2">Receita líquida por categoria</p>
            <div className="flex flex-wrap gap-2">
              {indicators.byCategory.map(([cat, val]) => (
                <span key={cat} className="text-xs bg-white/10 px-3 py-1 rounded-full">{cat}: {brl(val)}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {!patient ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
          Selecione um paciente na Identificação para montar um orçamento e registrar recebimentos.
        </div>
      ) : (
        <>
          {/* Orçamento */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><Calculator size={22} /></div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Orçamento — {patient.name}</h2>
                <p className="text-sm text-gray-500">Tutor: {tutor?.name || '—'}</p>
              </div>
            </div>

            {/* Avaliação */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Avaliação ({brl(calc.evalPrice)})</h3>
              <div className="flex flex-wrap gap-2">
                {([['separate', 'Cobrada separadamente'], ['included', 'Inclusa no pacote'], ['none', 'Não cobrar']] as [EvalMode, string][]).map(([v, l]) => (
                  <label key={v} className={radio(order.evalMode === v)}>
                    <input type="radio" className="hidden" checked={order.evalMode === v} onChange={() => setOrder({ ...order, evalMode: v })} />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* Serviço */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Serviço</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {([['single', `Sessão avulsa (${brl(num(pricing.singleSessionPrice))})`], ['pkg5', `Pacote 5 (${brl(num(pricing.package5Unit))}/sessão)`], ['pkg10', `Pacote 10 (${brl(num(pricing.package10Unit))}/sessão)`], ['custom', 'Personalizado']] as [ServiceMode, string][]).map(([v, l]) => (
                  <label key={v} className={radio(order.serviceMode === v)}>
                    <input type="radio" className="hidden" checked={order.serviceMode === v} onChange={() => setOrder({ ...order, serviceMode: v })} />
                    {l}
                  </label>
                ))}
              </div>
              {order.serviceMode === 'custom' && (
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                    <input type="number" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                      value={order.customQty} onChange={(e) => setOrder({ ...order, customQty: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Valor/sessão (R$)</label>
                    <input type="number" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={pricing.singleSessionPrice} value={order.customUnit} onChange={(e) => setOrder({ ...order, customUnit: e.target.value })} />
                  </div>
                </div>
              )}
              {calc.unit < calc.single && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <Tag size={13} /> Valor unitário ({brl(calc.unit)}) abaixo da sessão avulsa ({brl(calc.single)}) — desconto de pacote aplicado.
                </p>
              )}
            </div>

            {/* Deslocamento + pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><MapPin size={15} /> Deslocamento</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  value={order.cityId} onChange={(e) => setOrder({ ...order, cityId: e.target.value })}>
                  {pricing.cities.map((c) => <option key={c.id} value={c.id}>{c.name} — {brl(num(c.value))}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Forma de pagamento</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  value={order.method} onChange={(e) => setOrder({ ...order, method: e.target.value })}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m} ({num(pricing.taxes[m] ?? '0')}%)</option>)}
                </select>
              </div>
            </div>

            {/* Resumo do orçamento */}
            <div className="bg-purple-50 rounded-xl border border-purple-100 p-4 space-y-1.5 text-sm">
              <Row label={serviceLabel} value={brl(calc.sessionsTotal)} />
              {calc.discount > 0 && <Row label="Economia vs avulso" value={`- ${brl(calc.discount)}`} green />}
              {calc.evalIncluded > 0 && <Row label="Avaliação (inclusa)" value={brl(calc.evalIncluded)} />}
              {calc.evalSeparate > 0 && <Row label="Avaliação (separada)" value={brl(calc.evalSeparate)} />}
              {calc.displacement > 0 && <Row label={`Deslocamento (${calc.cityName})`} value={brl(calc.displacement)} />}
              <Row label={`Taxa ${order.method} (${calc.taxPct}%)`} value={`- ${brl(calc.taxValue)}`} red />
              <div className="border-t border-purple-200 my-1" />
              <Row label="Total pago pelo tutor" value={brl(calc.total)} bold />
              <Row label="Líquido recebido pela clínica" value={brl(calc.net)} bold green />
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={registerPayment}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 size={18} /> Registrar Recebimento
              </button>
              <button onClick={() => generateReceiptPDF(receiptData())}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2">
                <FileDown size={18} /> Gerar Recibo PDF
              </button>
              <button onClick={handleWhatsApp}
                className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2">
                <MessageCircle size={18} /> WhatsApp
              </button>
              <button onClick={handleEmail}
                className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2">
                <Mail size={18} /> E-mail
              </button>
            </div>
          </div>

          {/* Comparação de pacotes (apoio à decisão) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Comparação de Pacotes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparison.map((c) => (
                <div key={c.label} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-800">{c.label}</p>
                  <p className="text-sm text-gray-500">{c.qty}× {brl(c.unit)}</p>
                  <p className="text-2xl font-bold text-purple-700 my-1">{brl(c.total)}</p>
                  <p className="text-xs text-green-600">Economia p/ tutor: {brl(c.economia)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Quanto maior o pacote, maior a economia para o tutor e maior a previsibilidade de receita para a clínica.</p>
          </div>

          {/* Histórico financeiro do paciente */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={20} className="text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800">Histórico — {patient.name}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
              <Mini label="Recebido" value={brl(received)} />
              <Mini label="Pacote ativo" value={activePkg ? `${activePkg.sessionsContracted} sessões` : '—'} />
              <Mini label="Sessões feitas" value={String(sessionsDone)} />
              <Mini label="Saldo de sessões" value={String(balance)} />
            </div>
            {patientPayments.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum recebimento registrado.</p>
            ) : (
              <div className="space-y-2">
                {patientPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{p.description}</p>
                      <p className="text-xs text-gray-500">{p.date} · {p.method} · taxa {p.taxPercent}%</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{brl(p.gross + p.displacement)}</p>
                        <p className="text-xs text-green-600">líq. {brl(p.net)}</p>
                      </div>
                      <button onClick={() => removePayment(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PricingConfigPanel() {
  const pricing = useAppStore((s) => s.pricing);
  const setPricing = useAppStore((s) => s.setPricing);
  const [newCity, setNewCity] = useState({ name: '', value: '' });

  const field = (label: string, key: 'evaluationPrice' | 'singleSessionPrice' | 'package5Unit' | 'package10Unit') => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type="number" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
        value={pricing[key]} onChange={(e) => setPricing({ [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-gray-800">Configuração de Preços</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {field('Avaliação (R$)', 'evaluationPrice')}
        {field('Sessão avulsa (R$)', 'singleSessionPrice')}
        {field('Pacote 5 - valor/sessão', 'package5Unit')}
        {field('Pacote 10 - valor/sessão', 'package10Unit')}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Taxas por forma de pagamento (%)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.keys(pricing.taxes).map((m) => (
            <div key={m}>
              <label className="block text-xs text-gray-500 mb-1">{m}</label>
              <input type="number" step="0.01" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                value={pricing.taxes[m]} onChange={(e) => setPricing({ taxes: { ...pricing.taxes, [m]: e.target.value } })} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Cidades / Deslocamento (R$)</h3>
        <div className="space-y-2">
          {pricing.cities.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <input className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                value={c.name} onChange={(e) => setPricing({ cities: pricing.cities.map((x) => x.id === c.id ? { ...x, name: e.target.value } : x) })} />
              <input type="number" className="w-28 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                value={c.value} onChange={(e) => setPricing({ cities: pricing.cities.map((x) => x.id === c.id ? { ...x, value: e.target.value } : x) })} />
              {c.id !== 'clinica' && (
                <button onClick={() => setPricing({ cities: pricing.cities.filter((x) => x.id !== c.id) })}
                  className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input className="flex-1 p-2 bg-white border border-dashed border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Nova cidade" value={newCity.name} onChange={(e) => setNewCity({ ...newCity, name: e.target.value })} />
            <input type="number" className="w-28 p-2 bg-white border border-dashed border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="R$" value={newCity.value} onChange={(e) => setNewCity({ ...newCity, value: e.target.value })} />
            <button onClick={() => { if (newCity.name) { setPricing({ cities: [...pricing.cities, { id: newId(), name: newCity.name, value: newCity.value || '0' }] }); setNewCity({ name: '', value: '' }); } }}
              className="bg-purple-600 text-white p-2 rounded-lg"><Plus size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'green' }) {
  const color = tone === 'red' ? 'text-red-200' : tone === 'green' ? 'text-green-200' : 'text-white';
  return (
    <div className="bg-white/10 p-3 rounded-xl border border-white/20">
      <span className="block text-purple-200 text-xs mb-1">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}

function Row({ label, value, bold, green, red }: { label: string; value: string; bold?: boolean; green?: boolean; red?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={`${bold ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{label}</span>
      <span className={`${bold ? 'font-bold' : ''} ${green ? 'text-green-600' : red ? 'text-red-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 p-3 rounded-xl">
      <span className="block text-gray-500 text-xs mb-1">{label}</span>
      <span className="font-bold text-gray-800">{value}</span>
    </div>
  );
}
