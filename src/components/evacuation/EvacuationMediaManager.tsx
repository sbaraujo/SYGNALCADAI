import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { EvacuationPlanImages } from '../../types/cad';
import { Upload, Compass, Video, Globe, RefreshCw, Trash2, Check, ExternalLink } from 'lucide-react';

interface EvacuationMediaManagerProps {
  images: EvacuationPlanImages;
  onUpdateImages: (updated: EvacuationPlanImages) => void;
  onClose?: () => void;
}

export const EvacuationMediaManager: React.FC<EvacuationMediaManagerProps> = ({
  images,
  onUpdateImages,
  onClose
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState(
    images.youtubeUrl || 'https://www.youtube.com/watch?v=emergency-evacuation-procedures'
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(images.qrCodeUrl || '');
  const [compassRotation, setCompassRotation] = useState(images.compassRotation || 0);
  const [aerialLabel, setAerialLabel] = useState(images.aerialPhotoLabel || 'Foto Aérea do Edifício (Google Maps)');

  const aerialInputRef = useRef<HTMLInputElement>(null);
  const compassInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Gera o QR Code a partir da URL do YouTube sempre que mudar
  useEffect(() => {
    if (youtubeUrl && !images.qrCodeUrl?.startsWith('data:image/jpeg')) {
      QRCode.toDataURL(youtubeUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url) => {
          setQrCodeDataUrl(url);
          onUpdateImages({
            ...images,
            youtubeUrl,
            qrCodeUrl: url
          });
        })
        .catch((err) => console.error('Erro ao gerar QR Code:', err));
    }
  }, [youtubeUrl]);

  const handleAerialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateImages({
        ...images,
        aerialPhotoUrl: dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCompassUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateImages({
        ...images,
        compassRoseUrl: dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setQrCodeDataUrl(dataUrl);
      onUpdateImages({
        ...images,
        qrCodeUrl: dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRotationChange = (val: number) => {
    setCompassRotation(val);
    onUpdateImages({
      ...images,
      compassRotation: val
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-slate-100 max-w-2xl w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-bold text-white">
            Campos de Imagem da Planta de Emergência
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded bg-slate-800"
          >
            ✕ Fechar
          </button>
        )}
      </div>

      <div className="mt-4 space-y-5 text-xs">
        {/* 1) SÍMBOLO DE PONTOS CARDEAIS */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              1) Símbolo de Pontos Cardeais (Orientação da Planta)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Ângulo: {compassRotation}°
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Define o alinhamento do Norte magnético/geográfico na prancha de emergência. Use a Rosa dos Ventos padrão ou carregue uma imagem JPEG personalizada.
          </p>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={compassRotation}
              onChange={(e) => handleRotationChange(parseInt(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <button
              type="button"
              onClick={() => handleRotationChange(0)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono"
            >
              0° (Norte ↑)
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="file"
              ref={compassInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCompassUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => compassInputRef.current?.click()}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              {images.compassRoseUrl ? 'Trocar Imagem JPEG de Rosa dos Ventos' : 'Carregar Imagem JPEG'}
            </button>
            {images.compassRoseUrl && (
              <button
                type="button"
                onClick={() => onUpdateImages({ ...images, compassRoseUrl: undefined })}
                className="py-1.5 px-2.5 bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg transition"
                title="Voltar para Rosa dos Ventos Vetorial ISO"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2) FOTO AÉREA (GOOGLE MAPS / GOOGLE EARTH) */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-400" />
              2) Foto Aérea (Google Maps / Google Earth)
            </span>
            {images.aerialPhotoUrl ? (
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Imagem Carregada
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Vista Padrão Ativa</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Foto satélite aérea da edificação para facilitar o reconhecimento visual rápido do entorno e ponto de encontro exterior.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aerialLabel}
              onChange={(e) => {
                setAerialLabel(e.target.value);
                onUpdateImages({ ...images, aerialPhotoLabel: e.target.value });
              }}
              placeholder="Legenda da foto aérea..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={aerialInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAerialUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => aerialInputRef.current?.click()}
              className="py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Carregar Foto Aérea (JPEG/PNG)
            </button>
            {images.aerialPhotoUrl && (
              <button
                type="button"
                onClick={() => onUpdateImages({ ...images, aerialPhotoUrl: undefined })}
                className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition text-[11px]"
              >
                Restaurar Padrão
              </button>
            )}
          </div>
        </div>

        {/* 3) QR CODE COM INSTRUÇÕES DE PROCEDIMENTOS (VÍDEO YOUTUBE) */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-red-500" />
              3) QR Code com Instruções de Procedimentos (Vídeo YouTube)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Gera automaticamente o QR Code para qualquer link de vídeo de treinamento de evacuação do YouTube, ou permite enviar um arquivo JPEG já gerado.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              title="Testar Link do YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="w-14 h-14 bg-white p-1 rounded-lg shrink-0 border border-slate-400 flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[8px] text-slate-400">QR</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <input
                type="file"
                ref={qrInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleQrUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => qrInputRef.current?.click()}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <Upload className="w-3 h-3 text-red-400" />
                Carregar Imagem JPEG do QR Code
              </button>
              <span className="text-[10px] text-slate-400">
                O QR Code será impresso no quadro de procedimentos da prancha.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
