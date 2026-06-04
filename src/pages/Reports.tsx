import { useState } from 'react';
import { FileText, Download, Share2, Printer } from 'lucide-react';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<'avaliacao' | 'evolucao' | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Relatórios Clínicos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => setSelectedReport('avaliacao')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            selectedReport === 'avaliacao' 
              ? 'border-purple-500 bg-purple-50 shadow-sm' 
              : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-purple-100 p-3 rounded-full text-purple-700">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Relatório da Avaliação Inicial</h3>
          </div>
          <p className="text-gray-500 text-sm">Gera um documento completo contendo identificação, motivo da consulta, interpretação de exames, diagnóstico funcional e plano terapêutico sugerido.</p>
        </button>

        <button 
          onClick={() => setSelectedReport('evolucao')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            selectedReport === 'evolucao' 
              ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
              : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-700">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Relatório de Evolução</h3>
          </div>
          <p className="text-gray-500 text-sm">Gera um resumo do pacote: sessões realizadas vs restantes, procedimentos aplicados, evolução funcional e recomendação de alta ou continuidade.</p>
        </button>
      </div>

      {selectedReport && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">
              Pré-visualização: {selectedReport === 'avaliacao' ? 'Avaliação Inicial' : 'Evolução Clínica'}
            </h3>
            <div className="flex gap-2">
              <button className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
                <Printer className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="Compartilhar">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Baixar PDF
              </button>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-xl p-8 bg-gray-50 aspect-[1/1.4] max-w-2xl mx-auto flex items-center justify-center text-gray-400">
            [ O layout do PDF renderizado aparecerá aqui ]
          </div>
        </div>
      )}
    </div>
  );
}
