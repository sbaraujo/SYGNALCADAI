import React, { useState, useRef, useEffect } from 'react';
import { Floor } from '../types/cad';
import { importArchitecturalPlan, ImportedPlanResult } from '../services/planImporter';
import { 
  Upload, X, CheckCircle2, AlertTriangle, 
  RotateCcw, Sparkles, Maximize2, Loader2,
  ZoomIn, ZoomOut, Move, Ruler, Check, RefreshCw
} from 'lucide-react';

interface UploadPlanModalProps {
  activeFloor: Floor;
  onUpdateFloor: (floor: Floor, shouldFitExtents?: boolean) => void;
  onClose: () => void;
}

interface CalibPoint {
  x: number; // natural image px
  y: number; // natural image px
  pctX: number; // percentage 0-100
  pctY: number; // percentage 0-100
}

export const UploadPlanModal: React.FC<UploadPlanModalProps> = ({
  activeFloor,
  onUpdateFloor,
  onClose
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importedResult, setImportedResult] = useState<ImportedPlanResult | null>(null);

  const [widthMeters, setWidthMeters] = useState<number>(activeFloor.widthMeters || 40);
  const [heightMeters, setHeightMeters] = useState<number>(activeFloor.heightMeters || 28);
  const [isDragging, setIsDragging] = useState(false);
  const [opacity, setOpacity] = useState<number>(activeFloor.floorPlanOpacity ?? 1.0);
  const [invertColors, setInvertColors] = useState<boolean>(activeFloor.floorPlanInvert ?? false);
  const [contrast, setContrast] = useState<number>(activeFloor.floorPlanContrast ?? 115);

  // Smart Zoom & Pan in preview
  const [previewZoom, setPreviewZoom] = useState<number>(1.0);
  const [previewPan, setPreviewPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanningPreview, setIsPanningPreview] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 2-Point Manual Scale Calibration
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibPoint1, setCalibPoint1] = useState<CalibPoint | null>(null);
  const [calibPoint2, setCalibPoint2] = useState<CalibPoint | null>(null);
  const [calibDistanceInput, setCalibDistanceInput] = useState<string>('10.00');
  const [calibrationSuccessMessage, setCalibrationSuccessMessage] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentPlanUrl = importedResult?.floorPlanUrl || activeFloor.floorPlanUrl;

  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setCalibrationSuccessMessage(null);
    setCalibPoint1(null);
    setCalibPoint2(null);
    setIsCalibrating(false);
    try {
      const result = await importArchitecturalPlan(file);
      setImportedResult(result);
      setWidthMeters(result.widthMeters);
      setHeightMeters(result.heightMeters);
      setPreviewZoom(1.0);
      setPreviewPan({ x: 0, y: 0 });
    } catch (err: any) {
      console.error('Erro ao importar planta:', err);
      setErrorMessage(
        err.message || 'Erro ao processar o arquivo da planta. Verifique o formato DXF, PDF, SVG ou Imagem.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Preview Pan Handling
  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    if (isCalibrating) return; // In calibration mode, click sets points
    if (e.button === 0 || e.button === 1) {
      setIsPanningPreview(true);
      setPanStart({ x: e.clientX - previewPan.x, y: e.clientY - previewPan.y });
    }
  };

  const handlePreviewMouseMove = (e: React.MouseEvent) => {
    if (isPanningPreview) {
      setPreviewPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handlePreviewMouseUp = () => {
    setIsPanningPreview(false);
  };

  // 2-Point Calibration Click on Image
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isCalibrating || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pctX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (clickY / rect.height) * 100));

    const naturalWidth = imgRef.current.naturalWidth || rect.width;
    const naturalHeight = imgRef.current.naturalHeight || rect.height;

    const naturalX = (pctX / 100) * naturalWidth;
    const naturalY = (pctY / 100) * naturalHeight;

    const newPoint: CalibPoint = {
      x: naturalX,
      y: naturalY,
      pctX,
      pctY
    };

    if (!calibPoint1) {
      setCalibPoint1(newPoint);
      setCalibrationSuccessMessage(null);
    } else if (!calibPoint2) {
      setCalibPoint2(newPoint);
      // Compute pixel distance in image natural coords
      const dx = naturalX - calibPoint1.x;
      const dy = naturalY - calibPoint1.y;
      const distPx = Math.hypot(dx, dy);

      // Estimate real distance based on current meters width
      const estPxPerM = naturalWidth / Math.max(1, widthMeters);
      const estDistM = distPx / Math.max(1, estPxPerM);
      setCalibDistanceInput(estDistM > 0.1 ? estDistM.toFixed(2) : '10.00');
    }
  };

  // Apply Recalibration using 2 Points
  const handleApplyCalibration = () => {
    if (!calibPoint1 || !calibPoint2 || !imgRef.current) return;

    const realDistMeters = parseFloat(calibDistanceInput);
    if (!realDistMeters || realDistMeters <= 0) {
      alert('Por favor, informe uma distância real válida maior que zero em metros.');
      return;
    }

    const dx = calibPoint2.x - calibPoint1.x;
    const dy = calibPoint2.y - calibPoint1.y;
    const distPx = Math.hypot(dx, dy);

    if (distPx <= 1) {
      alert('Os 2 pontos de referência estão muito próximos. Por favor, marque pontos mais distantes (ex: extremidades de uma parede).');
      return;
    }

    const pxPerMeter = distPx / realDistMeters;
    const naturalWidth = imgRef.current.naturalWidth || 1000;
    const naturalHeight = imgRef.current.naturalHeight || 700;

    const newWidthM = parseFloat((naturalWidth / pxPerMeter).toFixed(2));
    const newHeightM = parseFloat((naturalHeight / pxPerMeter).toFixed(2));

    setWidthMeters(newWidthM);
    setHeightMeters(newHeightM);

    setCalibrationSuccessMessage(
      `Escala calibrada com precisão! Nova dimensão calculada: ${newWidthM}m × ${newHeightM}m (${distPx.toFixed(0)}px = ${realDistMeters}m).`
    );
    setIsCalibrating(false);
  };

  // Reset Calibration Points
  const handleResetCalibration = () => {
    setCalibPoint1(null);
    setCalibPoint2(null);
    setCalibrationSuccessMessage(null);
  };

  // Zoom helpers
  const handleZoomIn = () => setPreviewZoom((z) => Math.min(4.0, z * 1.25));
  const handleZoomOut = () => setPreviewZoom((z) => Math.max(0.25, z * 0.8));
  const handleFitPreview = () => {
    setPreviewZoom(1.0);
    setPreviewPan({ x: 0, y: 0 });
  };
  const handleFillPreview = () => {
    setPreviewZoom(1.6);
    setPreviewPan({ x: 0, y: 0 });
  };

  const handleSaveAndCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importedResult && !activeFloor.floorPlanUrl) return;

    const floorUrl = importedResult ? importedResult.floorPlanUrl : activeFloor.floorPlanUrl;
    const planType = importedResult ? importedResult.floorPlanType : (activeFloor.floorPlanType || 'raster');

    onUpdateFloor(
      {
        ...activeFloor,
        floorPlanUrl: floorUrl,
        floorPlanType: planType,
        widthMeters: Number(widthMeters) || 40,
        heightMeters: Number(heightMeters) || 28,
        floorPlanOpacity: opacity,
        floorPlanOffsetX: 0,
        floorPlanOffsetY: 0,
        floorPlanZoom: 1.0,
        floorPlanPreserveAspect: true,
        floorPlanVisible: true,
        floorPlanLocked: false,
        floorPlanInvert: invertColors,
        floorPlanContrast: contrast,
        calibrated: true
      },
      true // shouldFitExtents = true (centraliza e expande com máxima legibilidade no CAD)
    );
    onClose();
  };

  const handleRestoreVector = () => {
    onUpdateFloor(
      {
        ...activeFloor,
        floorPlanUrl: undefined,
        floorPlanType: 'vector',
        widthMeters: 40,
        heightMeters: 28,
        calibrated: true
      },
      true
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center">
              <Upload className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Importação e Calibração de Planta de Fundo (DXF, PDF, SVG, PNG, JPG)
              </h3>
              <p className="text-xs text-slate-400">
                Pavimento: <strong className="text-sky-300">{activeFloor.name}</strong> • Alta resolução, opacidade regulável e calibração por 2 pontos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveAndCenter} className="space-y-4 py-4 overflow-y-auto flex-1 text-xs">
          {/* Supported format badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800">
                DXF (AutoCAD / Revit)
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                PDF (Pranchas Técnicas)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                SVG (Vetorial)
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                PNG / JPG / WEBP (Imagens Raster)
              </span>
            </div>
            {currentPlanUrl && (
              <span className="text-slate-400">
                Resolução Total: <strong className="text-emerald-400">Ultra-HD / Vetorial</strong>
              </span>
            )}
          </div>

          {/* Drag & Drop Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center relative ${
              isDragging
                ? 'border-sky-400 bg-sky-950/30'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
            }`}
          >
            <input
              type="file"
              accept=".dxf, .pdf, .svg, .png, .jpg, .jpeg, .webp, .bmp"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {isProcessing ? (
              <div className="py-3 flex flex-col items-center gap-2 text-sky-400">
                <Loader2 className="w-7 h-7 animate-spin" />
                <span className="font-semibold text-sm">
                  Processando e convertendo arquivo arquitetônico com máxima fidelidade...
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Calculando geometria vetorial, proporções métricas e renderização em alta resolução
                </span>
              </div>
            ) : (
              <div className="py-1.5 flex flex-col items-center gap-1.5">
                <Upload className="w-6 h-6 text-slate-400" />
                <div className="text-slate-200 font-semibold text-xs">
                  Clique ou arraste o arquivo da planta aqui para substituir ou carregar
                </div>
                <div className="text-slate-500 text-[10px]">
                  Compatível com <strong>.DXF, .PDF, .SVG, .PNG, .JPG</strong> (pranchas de até 4000px com fidelidade total de cotas e traços)
                </div>
              </div>
            )}
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl flex items-center gap-2.5 text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Interactive Preview, Smart Zoom, Opacity & Scale Calibration */}
          {currentPlanUrl && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              {/* Header with info & quick zoom toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">
                    {importedResult ? importedResult.fileName : 'Planta Atual do Pavimento'}
                  </span>
                  {importedResult && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-700 uppercase">
                      {importedResult.floorPlanType}
                    </span>
                  )}
                </div>

                {/* Smart Zoom Toolbar */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-sky-400 px-1.5 select-none">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-[1px] h-3 bg-slate-800 mx-1" />
                  <button
                    type="button"
                    onClick={handleFitPreview}
                    title="Ajustar ao Enquadramento (Fit)"
                    className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
                  >
                    Ajustar
                  </button>
                  <button
                    type="button"
                    onClick={handleFillPreview}
                    title="Preencher Janela"
                    className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
                  >
                    Preencher
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewZoom(1.0);
                      setPreviewPan({ x: 0, y: 0 });
                    }}
                    title="Resetar Zoom e Posição"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Calibration Guide Banner */}
              {isCalibrating && (
                <div className="p-2.5 bg-amber-950/60 border border-amber-500/70 rounded-lg flex items-center justify-between text-amber-200">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>
                      {!calibPoint1 ? (
                        <strong>Passo 1 de 2: Clique no 1º ponto de referência na imagem (ex: início de uma parede ou cota conhecida).</strong>
                      ) : !calibPoint2 ? (
                        <strong>Passo 2 de 2: Agora clique no 2º ponto de referência (extremidade da cota ou parede).</strong>
                      ) : (
                        <strong>Pontos definidos! Informe abaixo a distância real em metros para recalcular a escala.</strong>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCalibrating(false);
                      handleResetCalibration();
                    }}
                    className="px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {calibrationSuccessMessage && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/70 rounded-lg flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{calibrationSuccessMessage}</span>
                </div>
              )}

              {/* Interactive Viewport with CAD Grid background */}
              <div
                ref={previewContainerRef}
                onMouseDown={handlePreviewMouseDown}
                onMouseMove={handlePreviewMouseMove}
                onMouseUp={handlePreviewMouseUp}
                onMouseLeave={handlePreviewMouseUp}
                className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(56, 189, 248, 0.07) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(56, 189, 248, 0.07) 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px'
                }}
              >
                {/* Visual watermark indicating pan/zoom capability */}
                <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 backdrop-blur-xs font-mono">
                  <Move className="w-3 h-3 text-sky-400" /> Arraste para mover • Zoom: {Math.round(previewZoom * 100)}%
                </div>

                {/* Inner Content with Transform */}
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-75"
                  style={{
                    transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom})`,
                    transformOrigin: 'center center'
                  }}
                >
                  <div className="relative inline-block max-w-[90%] max-h-[90%]">
                    <img
                      ref={imgRef}
                      src={currentPlanUrl}
                      alt="Pré-visualização da Planta Arquitetônica"
                      onClick={handleImageClick}
                      className={`max-w-full max-h-full object-contain rounded transition-all duration-150 shadow-2xl ${
                        isCalibrating ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
                      }`}
                      style={{
                        opacity: opacity,
                        filter: `${invertColors ? 'invert(1) hue-rotate(180deg) ' : ''}contrast(${contrast}%)`,
                        imageRendering: 'auto'
                      }}
                      draggable={false}
                    />

                    {/* Calibration Markers & Connecting Line */}
                    {calibPoint1 && (
                      <div
                        className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-[9px] font-bold text-slate-950 pointer-events-none animate-bounce"
                        style={{ left: `${calibPoint1.pctX}%`, top: `${calibPoint1.pctY}%` }}
                      >
                        1
                      </div>
                    )}

                    {calibPoint2 && (
                      <div
                        className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-[9px] font-bold text-slate-950 pointer-events-none animate-bounce"
                        style={{ left: `${calibPoint2.pctX}%`, top: `${calibPoint2.pctY}%` }}
                      >
                        2
                      </div>
                    )}

                    {/* Connecting line between Point 1 and Point 2 */}
                    {calibPoint1 && calibPoint2 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        <line
                          x1={`${calibPoint1.pctX}%`}
                          y1={`${calibPoint1.pctY}%`}
                          x2={`${calibPoint2.pctX}%`}
                          y2={`${calibPoint2.pctY}%`}
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeDasharray="4,4"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Calibration Control Panel (When 2 points are selected) */}
              {calibPoint1 && calibPoint2 && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/60 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                      <Ruler className="w-4 h-4" /> Distância Real Conhecida entre os 2 Pontos:
                    </span>
                    <button
                      type="button"
                      onClick={handleResetCalibration}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Remarcar Pontos
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="2000"
                        value={calibDistanceInput}
                        onChange={(e) => setCalibDistanceInput(e.target.value)}
                        className="w-full bg-slate-900 border-2 border-amber-500 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm"
                        placeholder="Ex: 10.00"
                        autoFocus
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-mono font-bold">
                        metros
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCalibration}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950 transition"
                    >
                      <Check className="w-4 h-4" /> Aplicar Escala Recalibrada
                    </button>
                  </div>

                  {/* Common Distance Shortcut Pills */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">Cotas Frequentes:</span>
                    {['1.00', '2.50', '5.00', '10.00', '15.00', '20.00', '30.00'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCalibDistanceInput(val)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition"
                      >
                        {val}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action button to trigger 2-point calibration */}
              {!isCalibrating && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCalibrating(true);
                      setCalibPoint1(null);
                      setCalibPoint2(null);
                      setCalibrationSuccessMessage(null);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 hover:border-amber-500/50 transition"
                  >
                    <Ruler className="w-3.5 h-3.5 text-amber-400" />
                    Calibrar Escala Manualmente (Definir 2 Pontos de Referência)
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    *Garante proporção 1:1 métrica exata sobre o canvas
                  </span>
                </div>
              )}

              {/* Dimensions in Meters (Adjustable or Calibrated) */}
              <div className="grid grid-cols-2 gap-3 font-mono pt-1">
                <div>
                  <label className="text-slate-400 font-sans block mb-1 font-semibold">
                    Largura Real no Projeto (Metros):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="2000"
                    value={widthMeters}
                    onChange={(e) => setWidthMeters(parseFloat(e.target.value) || 40)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-sans block mb-1 font-semibold">
                    Comprimento Real no Projeto (Metros):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="2000"
                    value={heightMeters}
                    onChange={(e) => setHeightMeters(parseFloat(e.target.value) || 28)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>
              </div>

              {/* Opacity and Drawing Contrast Settings */}
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Seletor de Opacidade da Planta:
                  </label>
                  <span className="font-mono text-xs font-bold text-sky-400">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setOpacity(preset)}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded transition ${
                          Math.abs(opacity - preset) < 0.05
                            ? 'bg-sky-500 text-white font-bold shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {Math.round(preset * 100)}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Blueprint Contrast Controls */}
                <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={invertColors}
                      onChange={(e) => setInvertColors(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                    <span>Inverter Cores (Fundo Escuro / CAD Blueprint)</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px]">Contraste:</span>
                    <input
                      type="range"
                      min="90"
                      max="150"
                      step="5"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-20 accent-sky-500 cursor-pointer"
                    />
                    <span className="text-slate-400 text-[10px] font-mono">{contrast}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer controls */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            {activeFloor.floorPlanUrl ? (
              <button
                type="button"
                onClick={handleRestoreVector}
                className="px-3 py-2 text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1.5 transition rounded-lg hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar Planta Vetorial Padrão
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!importedResult && !activeFloor.floorPlanUrl}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs shadow-lg shadow-sky-950 flex items-center gap-1.5 transition"
              >
                <Maximize2 className="w-4 h-4" /> Importar, Escalar e Centralizar na Área CAD
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

