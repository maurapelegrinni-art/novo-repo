import { useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { getFileURL, kindOf, type FileKind } from '../services/fileStorage';

interface Props {
  fileId: string;
  name: string;
  /** URL de download do Storage, usada quando o blob local não existe. */
  url?: string;
  onClose: () => void;
}

/** Modal de pré-visualização: PDF (iframe), imagem (ampliada) e vídeo (player). */
export default function FilePreview({ fileId, name, url: fallbackUrl, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const kind: FileKind = kindOf(name);

  useEffect(() => {
    let active = true;
    let created: string | undefined;
    getFileURL(fileId, fallbackUrl).then((u) => {
      if (u && u.startsWith('blob:')) created = u;
      if (active) setUrl(u ?? null);
    });
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [fileId, fallbackUrl]);

  const download = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 truncate">{name}</h3>
          <div className="flex items-center gap-2">
            <button onClick={download} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Baixar">
              <Download size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Fechar">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center min-h-[300px]">
          {!url ? (
            <div className="flex flex-col items-center text-gray-400 gap-2">
              <Loader2 className="animate-spin" size={28} />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : kind === 'pdf' ? (
            <iframe src={url} title={name} className="w-full h-[75vh]" />
          ) : kind === 'image' ? (
            <img src={url} alt={name} className="max-w-full max-h-[75vh] object-contain" />
          ) : kind === 'video' ? (
            <video src={url} controls className="max-w-full max-h-[75vh]" />
          ) : (
            <div className="text-center text-gray-500 p-8">
              <p className="mb-3">Pré-visualização não disponível para este tipo de arquivo.</p>
              <button onClick={download} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium">
                Baixar arquivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
