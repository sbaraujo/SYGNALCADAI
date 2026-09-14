import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { 
  Project, Floor, SignSymbol, 
  EvacuationArrowItem, EvacuationArrowType, 
  EvacuationCorridorItem, EvacuationCorridorPoint,
  YouAreHereConfig, EvacuationPlanImages 
} from '../types/cad';
import { ISOArrow } from './evacuation/ISOArrows';
import { CompassRose } from './evacuation/CompassRose';
import { YouAreHereCallout } from './evacuation/YouAreHereCallout';
import { EvacuationCorridorCanvas } from './evacuation/EvacuationCorridorCanvas';
import { EvacuationMediaManager } from './evacuation/EvacuationMediaManager';
import { 
  Compass, MapPin, Printer, Download, Eye, 
  Layers, ShieldAlert, Users, PhoneCall, Flame, 
  Plus, RotateCw, Trash2, Sliders, Image as ImageIcon,
  Check, ArrowRight, Video, Globe, Upload, Move, Sparkles,
  FileImage, CheckCircle2, RotateCcw, X, Save
} from 'lucide-react';
import { CADSvgEntitiesRenderer } from './cad/CADSvgEntitiesRenderer';

interface EvacuationPlanViewProps {
  project: Project;
  symbolsCatalog: SignSymbol[];
  activeFloor?: Floor;
  onUpdateFloor?: (updatedFloor: Floor) => void;
  onUpdateProject?: (updatedProject: Project) => void;
  onSaveProject?: () => void;
  onExportBackup?: () => void;
}

export const EvacuationPlanView: React.FC<EvacuationPlanViewProps> = ({
  project,
  symbolsCatalog,
  activeFloor: initialActiveFloor,
  onUpdateFloor,
  onUpdateProject,
  onSaveProject,
  onExportBackup
}) => {
  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    initialActiveFloor?.id || project.floors[0]?.id || ''
  );
  const activeFloor = project.floors.find((f) => f.id === selectedFloorId) || initialActiveFloor || project.floors[0];

  // Tool / Interaction Mode
  const [activeMode, setActiveMode] = useState<'view' | 'place_yah' | 'draw_corridor' | 'place_arrow'>('view');
  const [selectedArrowType, setSelectedArrowType] = useState<EvacuationArrowType>('dashed_chevron');
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string | null>(null);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // You Are Here State
  const [youAreHere, setYouAreHere] = useState<YouAreHereConfig>(() => {
    return activeFloor?.evacuationConfig?.youAreHere || {
      x: 48,
      y: 44,
      label: 'VOCÊ ESTÁ AQUI',
      roomName: 'Quarto 22',
      pointerAngle: -45,
      leaderLength: 45
    };
  });

  // Corridors State
  const [corridors, setCorridors] = useState<EvacuationCorridorItem[]>(() => {
    if (activeFloor?.evacuationConfig?.corridors && activeFloor.evacuationConfig.corridors.length > 0) {
      return activeFloor.evacuationConfig.corridors;
    }
    // Corredor padrão ISO 23601 pré-configurado cobrindo a rota principal
    return [
      {
        id: 'corr-01',
        name: 'Percurso Principal de Evacuação',
        fillColor: '#86efac', // Cor padrão ISO 23601 verde sinal suave
        opacity: 0.65,
        strokeColor: '#16a34a',
        strokeWidth: 1.5,
        points: [
          { x: 38, y: 38 },
          { x: 64, y: 38 },
          { x: 64, y: 62 },
          { x: 52, y: 62 },
          { x: 52, y: 72 },
          { x: 38, y: 72 }
        ]
      }
    ];
  });

  // Arrows State
  const [arrows, setArrows] = useState<EvacuationArrowItem[]>(() => {
    if (activeFloor?.evacuationConfig?.arrows && activeFloor.evacuationConfig.arrows.length > 0) {
      return activeFloor.evacuationConfig.arrows;
    }
    // Setas padrão segundo ISO 23601 (incluindo Exit Way chevron e seta direcional)
    return [
      { id: 'arr-1', x: 44, y: 40, rotation: 0, type: 'dashed_chevron', size: 1.0 },
      { id: 'arr-2', x: 54, y: 40, rotation: 0, type: 'iso_arrow', size: 1.0 },
      { id: 'arr-3', x: 59, y: 46, rotation: 90, type: 'dashed_chevron', size: 1.0 },
      { id: 'arr-4', x: 59, y: 56, rotation: 90, type: 'iso_arrow', size: 1.0 },
      { id: 'arr-5', x: 48, y: 67, rotation: 180, type: 'running_man', size: 1.0 }
    ];
  });

  // Images State (Rosa dos Ventos, Foto Aérea Google Earth, QR Code YouTube)
  const [images, setImages] = useState<EvacuationPlanImages>(() => {
    return activeFloor?.evacuationConfig?.images || {
      compassRotation: 0,
      aerialPhotoLabel: 'Foto Aérea (Google Maps / Earth)',
      youtubeUrl: 'https://www.youtube.com/watch?v=emergency-evacuation-procedures'
    };
  });

  // YouTube QR Code Cache
  const [generatedQrCode, setGeneratedQrCode] = useState<string>('');
  useEffect(() => {
    const targetUrl = images.youtubeUrl || 'https://www.youtube.com/watch?v=emergency-evacuation-procedures';
    QRCode.toDataURL(targetUrl, {
      width: 256,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then((dataUrl) => setGeneratedQrCode(dataUrl))
      .catch((err) => console.error('Erro QR Code:', err));
  }, [images.youtubeUrl]);

  // Edição de desenho do polígono
  const [drawingCorridorPoints, setDrawingCorridorPoints] = useState<EvacuationCorridorPoint[]>([]);

  // Dados Cadastrais Editáveis do Projeto e da Prancha
  const [buildingName, setBuildingName] = useState(project.empreendimento || project.nome || 'Casa São Bento');
  const [buildingAddress, setBuildingAddress] = useState(
    project.endereco || 'Rua de Tomar, n.º 7\n3000-401 Coimbra'
  );
  const [planCode, setPlanCode] = useState(`PE ${activeFloor.level ?? 0}/01-16`);
  const [designerName, setDesignerName] = useState(project.responsavel_tecnico || 'Ariane Araújo');
  const [designerContact, setDesignerContact] = useState('WhatsApp: +351 964 560 996');
  const [companyWebsite, setCompanyWebsite] = useState('www.sygmasms.com');
  const [companyEmail, setCompanyEmail] = useState('geral@sygmasms.com');

  // Opacidade da planta de fundo no plano de emergência
  const [planOpacity, setPlanOpacity] = useState<number>(activeFloor.floorPlanOpacity ?? 0.85);

  const planBoardRef = useRef<HTMLDivElement>(null);
  const planContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza estado quando activeFloor muda
  useEffect(() => {
    if (activeFloor?.evacuationConfig) {
      if (activeFloor.evacuationConfig.youAreHere) {
        setYouAreHere(activeFloor.evacuationConfig.youAreHere);
      }
      if (activeFloor.evacuationConfig.corridors) {
        setCorridors(activeFloor.evacuationConfig.corridors);
      }
      if (activeFloor.evacuationConfig.arrows) {
        setArrows(activeFloor.evacuationConfig.arrows);
      }
      if (activeFloor.evacuationConfig.images) {
        setImages(activeFloor.evacuationConfig.images);
      }
    }
  }, [activeFloor.id]);

  // Salva no objeto Floor
  const persistChanges = (
    updatedYouAreHere = youAreHere,
    updatedCorridors = corridors,
    updatedArrows = arrows,
    updatedImages = images
  ) => {
    if (!onUpdateFloor) return;
    const updatedFloor: Floor = {
      ...activeFloor,
      evacuationConfig: {
        youAreHere: updatedYouAreHere,
        corridors: updatedCorridors,
        arrows: updatedArrows,
        images: updatedImages
      }
    };
    onUpdateFloor(updatedFloor);
  };

  // Clique no canvas da planta
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!planContainerRef.current) return;
    const rect = planContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeMode === 'place_yah') {
      const updatedYAH = {
        ...youAreHere,
        x: Math.round(xPct),
        y: Math.round(yPct)
      };
      setYouAreHere(updatedYAH);
      setActiveMode('view');
      persistChanges(updatedYAH);
    } else if (activeMode === 'place_arrow') {
      const newArrow: EvacuationArrowItem = {
        id: `arr-${Date.now()}`,
        x: Math.round(xPct),
        y: Math.round(yPct),
        rotation: 0,
        type: selectedArrowType,
        size: 1.0
      };
      const updated = [...arrows, newArrow];
      setArrows(updated);
      setSelectedArrowId(newArrow.id);
      setActiveMode('view');
      persistChanges(undefined, undefined, updated);
    } else if (activeMode === 'draw_corridor') {
      // Se clicou próximo ao 1º ponto com pelo menos 3 vértices já definidos, FECHA o polígono!
      if (drawingCorridorPoints.length >= 3) {
        const pt0 = drawingCorridorPoints[0];
        const dist = Math.hypot(xPct - pt0.x, yPct - pt0.y);
        if (dist <= 4.5) {
          handleFinishCorridor();
          return;
        }
      }
      const newPts = [...drawingCorridorPoints, { x: Math.round(xPct), y: Math.round(yPct) }];
      setDrawingCorridorPoints(newPts);
    }
  };

  // Double click no canvas para fechar polígono rapidamente
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activeMode === 'draw_corridor' && drawingCorridorPoints.length >= 3) {
      handleFinishCorridor();
    }
  };

  // Finalizar e fechar desenho do polígono de corredor
  const handleFinishCorridor = () => {
    if (drawingCorridorPoints.length < 3) {
      alert('São necessários pelo menos 3 pontos para criar um polígono de percurso.');
      return;
    }
    const newCorridor: EvacuationCorridorItem = {
      id: `corr-${Date.now()}`,
      name: `Percurso ${corridors.length + 1}`,
      points: drawingCorridorPoints,
      fillColor: '#86efac',
      opacity: 0.65,
      strokeColor: '#16a34a',
      strokeWidth: 1.5
    };
    const updated = [...corridors, newCorridor];
    setCorridors(updated);
    setSelectedCorridorId(newCorridor.id);
    setDrawingCorridorPoints([]);
    setActiveMode('view');
    persistChanges(undefined, updated);
  };

  // Desfazer último ponto inserido
  const handleUndoLastPoint = () => {
    setDrawingCorridorPoints((prev) => prev.slice(0, -1));
  };

  // Cancelar desenho de corredor
  const handleCancelCorridor = () => {
    setDrawingCorridorPoints([]);
    setActiveMode('view');
  };

  // Atalhos de teclado para desenho de corredor (Enter, Escape, Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMode !== 'draw_corridor') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (drawingCorridorPoints.length >= 3) {
          handleFinishCorridor();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelCorridor();
      } else if (e.key === 'Backspace' || (e.ctrlKey && e.key === 'z')) {
        e.preventDefault();
        handleUndoLastPoint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, drawingCorridorPoints]);

  // Rotação da seta selecionada
  const handleRotateSelectedArrow = (delta = 45) => {
    if (!selectedArrowId) return;
    const updated = arrows.map((a) => {
      if (a.id === selectedArrowId) {
        const nextRot = (a.rotation + delta) % 360;
        return { ...a, rotation: nextRot };
      }
      return a;
    });
    setArrows(updated);
    persistChanges(undefined, undefined, updated);
  };

  // Excluir seta selecionada
  const handleDeleteSelectedArrow = () => {
    if (!selectedArrowId) return;
    const updated = arrows.filter((a) => a.id !== selectedArrowId);
    setArrows(updated);
    setSelectedArrowId(null);
    persistChanges(undefined, undefined, updated);
  };

  // Excluir corredor selecionado
  const handleDeleteSelectedCorridor = () => {
    if (!selectedCorridorId) return;
    const updated = corridors.filter((c) => c.id !== selectedCorridorId);
    setCorridors(updated);
    setSelectedCorridorId(null);
    persistChanges(undefined, updated);
  };

  // Upload rápido de planta direto na prancha de emergência
  const handleQuickPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateFloor) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updatedFloor: Floor = {
        ...activeFloor,
        floorPlanUrl: dataUrl,
        floorPlanType: 'raster',
        floorPlanVisible: true
      };
      onUpdateFloor(updatedFloor);
    };
    reader.readAsDataURL(file);
  };

  // Impressão oficial A4/A3
  const handlePrint = () => {
    window.print();
  };

  // Download PDF Oficial com Captura Real da Planta, Fundo, Símbolos e Carimbo
  const handleDownloadPdf = async (paperFormat: 'a4' | 'a3' = 'a4') => {
    if (!planBoardRef.current) return;
    try {
      setIsExportingPdf(true);
      const prevActiveMode = activeMode;
      setActiveMode('view');

      await new Promise((r) => setTimeout(r, 120));

      const boardEl = planBoardRef.current;
      const canvas = await html2canvas(boardEl, {
        scale: paperFormat === 'a3' ? 2.8 : 2.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (_clonedDoc, clonedEl) => {
          clonedEl.style.transform = 'none';
          clonedEl.style.boxShadow = 'none';
          const svgs = clonedEl.querySelectorAll('svg');
          svgs.forEach((svg) => {
            svg.setAttribute('shape-rendering', 'geometricPrecision');
            svg.setAttribute('text-rendering', 'geometricPrecision');
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const isA3 = paperFormat === 'a3';
      const docWidthMm = isA3 ? 420 : 297;
      const docHeightMm = isA3 ? 297 : 210;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: paperFormat
      });

      doc.addImage(imgData, 'JPEG', 0, 0, docWidthMm, docHeightMm, undefined, 'FAST');
      doc.save(`${planCode.replace('/', '_')}_Planta_Emergencia_ISO23601_${paperFormat.toUpperCase()}.pdf`);
      setActiveMode(prevActiveMode);
    } catch (err: any) {
      console.error('Erro ao gerar PDF da Planta de Emergência:', err);
      alert('Erro ao gerar PDF da Planta de Emergência: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Exportar Imagem em Alta Resolução (PNG / JPG) com a planta de fundo
  const handleExportImage = async (format: 'png' | 'jpeg' = 'png') => {
    if (!planBoardRef.current) return;
    try {
      setIsExportingPdf(true);
      const prevActiveMode = activeMode;
      setActiveMode('view');
      await new Promise((r) => setTimeout(r, 120));

      const boardEl = planBoardRef.current;
      const canvas = await html2canvas(boardEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (_clonedDoc, clonedEl) => {
          clonedEl.style.transform = 'none';
          clonedEl.style.boxShadow = 'none';
          const svgs = clonedEl.querySelectorAll('svg');
          svgs.forEach((svg) => {
            svg.setAttribute('shape-rendering', 'geometricPrecision');
            svg.setAttribute('text-rendering', 'geometricPrecision');
          });
        }
      });

      const dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${planCode.replace('/', '_')}_Planta_Emergencia_HD.${format === 'png' ? 'png' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setActiveMode(prevActiveMode);
    } catch (err: any) {
      console.error('Erro ao exportar imagem:', err);
      alert('Erro ao exportar imagem da Planta de Emergência: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Lista de quartos/compartimentos pré-definidos para acesso rápido
  const quickRooms = [
    'Quarto 22', 'Quarto 21', 'Quarto 20', 'Quarto 19', 'Quarto 18',
    'Quarto 15', 'Quarto 14', 'Quarto 12', 'Quarto 11', 'Quarto 10',
    'Quarto 9', 'Quarto 8', 'Quarto 7', 'Quarto 6', 'Quarto 5',
    'Quarto 3', 'Quarto 2', 'Quarto 1', 'Zona Circulação',
    'Sala de Estar / Bar', 'Hall Principal', 'Recepção'
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans print:p-0 print:bg-white print:text-black">
      {/* ================= BARRA DE FERRAMENTAS SUPERIOR (Oculta na Impressão) ================= */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white">
              Planta de Emergência (ISO 23601 / NBR 16820)
            </h2>
          </div>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700">
            <Layers className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
            >
              {project.floors.map((fl) => (
                <option key={fl.id} value={fl.id}>
                  {fl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Compartimento / Sala:</span>
            <input
              type="text"
              value={youAreHere.roomName}
              onChange={(e) => {
                const updated = { ...youAreHere, roomName: e.target.value };
                setYouAreHere(updated);
                persistChanges(updated);
              }}
              placeholder="Ex: Quarto 22"
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-300 font-bold w-36"
            />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const updated = { ...youAreHere, roomName: e.target.value };
                  setYouAreHere(updated);
                  persistChanges(updated);
                }
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 text-[11px] text-slate-300"
              title="Escolher compartimento da lista rápida"
            >
              <option value="">Rápido...</option>
              {quickRooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modos de Inserção e Edição */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Posicionar Você Está Aqui */}
          <button
            type="button"
            onClick={() => setActiveMode(activeMode === 'place_yah' ? 'view' : 'place_yah')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
              activeMode === 'place_yah'
                ? 'bg-blue-600 text-white border-blue-400 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-blue-500/40'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {activeMode === 'place_yah' ? 'Clique na Planta para Marcar' : 'Posicionar "Você Está Aqui"'}
          </button>

          {/* Criar Corredor ISO 23601 */}
          <button
            type="button"
            onClick={() => {
              if (activeMode === 'draw_corridor') {
                handleFinishCorridor();
              } else {
                setActiveMode('draw_corridor');
                setDrawingCorridorPoints([]);
              }
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
              activeMode === 'draw_corridor'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-600/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {activeMode === 'draw_corridor'
              ? `Fechar Polígono (${drawingCorridorPoints.length} pts)`
              : 'Novo Polígono Corredor ISO 23601'}
          </button>

          {activeMode === 'draw_corridor' && (
            <button
              type="button"
              onClick={handleCancelCorridor}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
            >
              Cancelar
            </button>
          )}

          {/* Inserir Setas ISO 23601 */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold px-1">Seta:</span>
            <select
              value={selectedArrowType}
              onChange={(e) => setSelectedArrowType(e.target.value as EvacuationArrowType)}
              className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
            >
              <option value="dashed_chevron">Exit Way (Chevron Tracejado)</option>
              <option value="iso_arrow">Seta Verde ISO 23601</option>
              <option value="bold_arrow">Seta Larga em Bloco</option>
              <option value="running_man">Saída Final (Homem Correndo)</option>
              <option value="stairs_down">Escada Descendente</option>
              <option value="stairs_up">Escada Ascendente</option>
              <option value="turn_left">Curva Esquerda 90°</option>
              <option value="turn_right">Curva Direita 90°</option>
            </select>
            <button
              type="button"
              onClick={() => setActiveMode(activeMode === 'place_arrow' ? 'view' : 'place_arrow')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                activeMode === 'place_arrow'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
              }`}
            >
              {activeMode === 'place_arrow' ? 'Clique para Inserir' : 'Adicionar Seta'}
            </button>
          </div>

          {/* Gerenciador de Imagens (3 Campos JPEG) */}
          <button
            type="button"
            onClick={() => setShowMediaManager(!showMediaManager)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            3 Campos de Imagem JPEG
          </button>

          {/* Controles de Seta Selecionada */}
          {selectedArrowId && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
              <button
                type="button"
                onClick={() => handleRotateSelectedArrow(45)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                title="Girar Seta 45°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedArrow}
                className="p-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 rounded"
                title="Excluir Seta"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Ações de Salvamento e Exportação */}
          <div className="flex items-center gap-1.5 ml-2">
            {onSaveProject && (
              <button
                type="button"
                onClick={onSaveProject}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                title="Salvar Projeto no Navegador (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Projeto
              </button>
            )}

            {onExportBackup && (
              <button
                type="button"
                onClick={onExportBackup}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                title="Baixar Arquivo Completo do Projeto (.signaflux)"
              >
                <Download className="w-3.5 h-3.5" />
                Backup .signaflux
              </button>
            )}

            <div className="flex items-center bg-teal-800 rounded-lg p-0.5 shadow">
              <button
                type="button"
                onClick={() => handleDownloadPdf('a4')}
                disabled={isExportingPdf}
                className="px-2.5 py-1 text-white hover:bg-teal-700 rounded text-xs font-bold flex items-center gap-1 transition"
                title="Exportar PDF Oficial Formato A4 com Planta de Fundo Real"
              >
                <Download className="w-3.5 h-3.5" />
                PDF A4
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf('a3')}
                disabled={isExportingPdf}
                className="px-2 py-1 text-teal-200 hover:text-white hover:bg-teal-700 rounded text-xs font-bold transition"
                title="Exportar PDF Oficial Formato A3 com Planta de Fundo Real"
              >
                A3
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleExportImage('png')}
              disabled={isExportingPdf}
              className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition"
              title="Baixar imagem HD PNG com planta arquitetônica, corredores, setas e carimbo"
            >
              <FileImage className="w-3.5 h-3.5" />
              Imagem HD
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition"
              title="Imprimir Planta de Emergência"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Gestão dos 3 Campos de Imagem */}
      {showMediaManager && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <EvacuationMediaManager
            images={images}
            onUpdateImages={(up) => {
              setImages(up);
              persistChanges(undefined, undefined, undefined, up);
            }}
            onClose={() => setShowMediaManager(false)}
          />
        </div>
      )}

      {/* ================= PRANCHA OFICIAL "PLANTA DE EMERGÊNCIA" (IDÊNTICA ÀS IMAGENS DE REFERÊNCIA) ================= */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start bg-slate-900/60 print:p-0 print:m-0 print:bg-white">
        <div
          ref={planBoardRef}
          className="w-full max-w-[1240px] bg-white text-slate-900 rounded-xl shadow-2xl border-2 border-slate-300 p-4 sm:p-6 flex flex-col print:border-none print:shadow-none print:rounded-none print:p-2 print:max-w-none print:w-full"
          style={{ minHeight: '820px' }}
        >
          {/* 1. TOPO: FAIXA VERDE COM O NOME EXATO "PLANTA DE EMERGÊNCIA" */}
          <div className="w-full bg-[#0d7668] text-white py-2.5 px-4 rounded-t-lg shadow-sm flex items-center justify-center">
            <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase font-sans">
              PLANTA DE EMERGÊNCIA
            </h1>
          </div>

          {/* 2. SUB-CABEÇALHO: Pavimento e Compartimento em Destaque Verde Petróleo */}
          <div className="text-center my-3">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0d7668] uppercase tracking-wide">
              {activeFloor.name}
            </h2>
            <h3 className="text-base sm:text-lg font-bold text-[#0d7668]">
              {youAreHere.roomName}
            </h3>
          </div>

          {/* 3. QUADROS SUPERIORES LATERAIS (Instruções à Esquerda e Edifício/Morada à Direita) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            {/* Top-Left: INSTRUÇÕES DE SEGURANÇA EM CASO DE INCÊNDIO */}
            <div className="border border-slate-400 p-3 rounded-lg bg-white shadow-2xs">
              <h4 className="text-xs font-black text-slate-900 tracking-wide uppercase border-b border-slate-300 pb-1 mb-1.5">
                INSTRUÇÕES DE SEGURANÇA
              </h4>
              <p className="text-[11px] font-bold text-slate-800 uppercase mb-1">
                EM CASO DE INCÊNDIO
              </p>
              <ul className="text-[10px] sm:text-[10.5px] text-slate-800 space-y-0.5 leading-tight">
                <li>• Mantenha a calma</li>
                <li>• Dê o alarme</li>
                <li>• Dirija-se calmamente para a saída pelos percursos assinalados</li>
                <li>• Utilize as escadas: Não os elevadores</li>
                <li>• Dirija-se para o Ponto de Reunião</li>
                <li>• Siga as instruções do pessoal coordenador da evacuação</li>
              </ul>
            </div>

            {/* Top-Right: Edifício & Morada */}
            <div className="border border-slate-400 p-3 rounded-lg bg-white shadow-2xs flex flex-col justify-center">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-black text-slate-900">Edifício:</span>
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    className="text-xs font-extrabold text-slate-800 flex-1 border-b border-dashed border-slate-300 focus:border-emerald-600 outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-xs font-black text-slate-900 shrink-0">Morada:</span>
                  <textarea
                    rows={2}
                    value={buildingAddress}
                    onChange={(e) => setBuildingAddress(e.target.value)}
                    className="text-[11px] font-medium text-slate-700 flex-1 border-b border-dashed border-slate-300 focus:border-emerald-600 outline-none bg-transparent resize-none leading-tight"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. CORPO PRINCIPAL EM 3 COLUNAS: LEGENDA (ESQUERDA) | PLANTA CENTRAL | COLUNA LATERAL DE IMAGENS (DIREITA) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-2 flex-1">
            {/* ====== COLUNA ESQUERDA: LEGENDA COMPLETA ISO 23601 ====== */}
            <div className="lg:col-span-3 border border-slate-400 p-3 rounded-lg bg-white flex flex-col justify-between text-[10px]">
              <div>
                <h4 className="text-xs font-black text-slate-900 tracking-wide uppercase border-b border-slate-300 pb-1 mb-2.5">
                  LEGENDA
                </h4>

                <div className="space-y-2 text-slate-800">
                  {/* Você Está Aqui */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 30 30" className="w-6 h-6">
                        <path
                          d="M 15 28 C 7 18 3 11 15 2 C 27 11 23 18 15 28 Z"
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <circle cx="15" cy="13" r="3.5" fill="#ffffff" />
                      </svg>
                    </div>
                    <span className="font-bold text-[10px] uppercase">VOCÊ ESTÁ AQUI</span>
                  </div>

                  {/* Percurso de Evacuação */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#86efac] border border-[#16a34a] rounded flex items-center justify-center shrink-0">
                      <ISOArrow type="iso_arrow" width={22} height={12} color="#16a34a" />
                    </div>
                    <span className="font-bold text-[10px] uppercase">PERCURSO DE EVACUAÇÃO</span>
                  </div>

                  {/* Percurso Final de Evacuação */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      <ISOArrow type="running_man" width={28} height={16} />
                    </div>
                    <span className="font-bold text-[10px] uppercase">PERCURSO FINAL DE EVACUAÇÃO</span>
                  </div>

                  {/* Ponto de Reunião */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#16a34a] rounded p-0.5 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <rect width="100" height="100" fill="#16a34a" />
                        <g fill="#ffffff">
                          <polygon points="15,15 40,30 30,40" />
                          <polygon points="85,15 60,30 70,40" />
                          <polygon points="15,85 40,70 30,60" />
                          <polygon points="85,85 60,70 70,60" />
                          <circle cx="50" cy="50" r="10" />
                        </g>
                      </svg>
                    </div>
                    <span className="font-bold text-[10px] uppercase">PONTO DE REUNIÃO</span>
                  </div>

                  {/* Extintor de Incêndio */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#dc2626] rounded flex items-center justify-center text-white shrink-0 font-bold">
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-[10px] uppercase">EXTINTOR DE INCÊNDIO</span>
                  </div>

                  {/* Botão de Alarme */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#dc2626] rounded flex items-center justify-center shrink-0 p-1">
                      <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                    <span className="font-bold text-[10px] uppercase">BOTÃO DE ALARME</span>
                  </div>

                  {/* Boca de Incêndio */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#dc2626] rounded flex items-center justify-center shrink-0 p-1">
                      <div className="w-4 h-4 rounded-full border border-white border-dashed flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    </div>
                    <span className="font-bold text-[10px] uppercase">BOCA DE INCÊNDIO</span>
                  </div>

                  {/* Telefone de Emergência */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#dc2626] rounded flex items-center justify-center text-white shrink-0">
                      <PhoneCall className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-[10px] uppercase block">TELEFONE DE EMERGÊNCIA</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="bg-red-100 text-red-800 border border-red-300 font-mono text-[8px] font-bold px-1 rounded">
                          BOMBEIROS 112
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Corte Geral de Energia */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 border border-slate-400 rounded overflow-hidden flex flex-col shrink-0">
                      <div className="h-1/2 bg-blue-700" />
                      <div className="h-1/2 bg-red-600" />
                    </div>
                    <span className="font-bold text-[10px] uppercase">CORTE GERAL DE ENERGIA</span>
                  </div>

                  {/* Não Usar em Caso de Emergência */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      <div className="w-5 h-5 rounded-full border-2 border-blue-600 relative flex items-center justify-center">
                        <div className="w-4 h-0.5 bg-blue-600 transform rotate-45" />
                      </div>
                    </div>
                    <span className="font-bold text-[10px] uppercase">NÃO USAR EM CASO DE EMERGÊNCIA</span>
                  </div>
                </div>
              </div>

              {/* Escala Gráfica no Rodapé da Legenda */}
              <div className="pt-3 border-t border-slate-300 mt-3 text-center">
                <span className="text-[10px] font-bold text-slate-800 block">ESC.: 1/100</span>
                <div className="flex items-center justify-center gap-1 mt-1 text-[8px] font-mono text-slate-600">
                  <span>0</span>
                  <div className="w-20 h-1 bg-slate-800 flex">
                    <div className="w-1/2 bg-slate-400" />
                  </div>
                  <span>10m</span>
                </div>
              </div>
            </div>

            {/* ====== ÁREA CENTRAL: PLANTA ARQUITETÔNICA COM CORREDOR ISO, SETAS E VOCÊ ESTÁ AQUI ====== */}
            <div className="lg:col-span-6 flex flex-col">
              <div
                ref={planContainerRef}
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}
                className={`relative w-full aspect-[4/3] bg-white border-2 border-slate-400 rounded-lg overflow-hidden shadow-inner flex items-center justify-center ${
                  activeMode === 'place_yah' || activeMode === 'place_arrow' || activeMode === 'draw_corridor'
                    ? 'cursor-crosshair ring-2 ring-emerald-500'
                    : 'cursor-default'
                }`}
              >
                {/* 1. Planta de Fundo (Imagem Arquitetônica Inserida) */}
                {activeFloor.floorPlanUrl ? (
                  <div
                    className="absolute inset-0 w-full h-full p-2 flex items-center justify-center pointer-events-none transition-opacity"
                    style={{
                      opacity: planOpacity,
                      filter: activeFloor.floorPlanInvert ? 'invert(1)' : undefined
                    }}
                  >
                    <img
                      src={activeFloor.floorPlanUrl}
                      alt={`Planta do Pavimento ${activeFloor.name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs font-semibold">Nenhuma imagem de planta inserida.</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Carregue o arquivo de planta para visualizar as paredes e divisórias.
                    </p>
                  </div>
                )}

                {/* 2. Corredores de Evacuação (Polígonos Verdes com Cor Padrão ISO 23601) */}
                <EvacuationCorridorCanvas
                  corridors={corridors}
                  activeCorridorId={selectedCorridorId}
                  isDrawing={activeMode === 'draw_corridor'}
                  drawingPoints={drawingCorridorPoints}
                  onSelectCorridor={(id) => setSelectedCorridorId(id)}
                  onClosePolygon={handleFinishCorridor}
                  onUndoLastPoint={handleUndoLastPoint}
                  onCancelDrawing={handleCancelCorridor}
                />

                {/* 3. Entidades Vetoriais CAD e Símbolos de Emergência */}
                <svg
                  viewBox={`0 0 ${(activeFloor.widthMeters || 30) * 1000} ${(activeFloor.heightMeters || 20) * 1000}`}
                  className="absolute inset-0 w-full h-full pointer-events-none z-15"
                >
                  {/* Layout Arquitetônico Paramétrico quando não houver imagem de fundo raster */}
                  {!activeFloor.floorPlanUrl && (
                    <g className="evac-architectural-fallback opacity-40">
                      <rect
                        x="500"
                        y="500"
                        width={(activeFloor.widthMeters || 30) * 1000 - 1000}
                        height={(activeFloor.heightMeters || 20) * 1000 - 1000}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="250"
                      />
                      <line
                        x1="500"
                        y1={(activeFloor.heightMeters || 20) * 500}
                        x2={(activeFloor.widthMeters || 30) * 1000 - 500}
                        y2={(activeFloor.heightMeters || 20) * 500}
                        stroke="#334155"
                        strokeWidth="180"
                      />
                    </g>
                  )}

                  {/* Entidades Vetoriais CAD 2D (Paredes, Portas, Janelas, Linhas desenhadas pelo usuário) */}
                  <CADSvgEntitiesRenderer
                    entities={activeFloor.cadEntities || []}
                    theme="light"
                  />

                  {activeFloor.placedSymbols.map((ps) => {
                    const def = symbolsCatalog.find((s) => s.id === ps.symbol_id);
                    if (!def) return null;
                    const w = (ps.width || def.largura || 250) * 2;
                    const h = (ps.height || def.altura || 150) * 2;
                    return (
                      <g key={ps.id} transform={`translate(${ps.x}, ${ps.y}) rotate(${ps.rotation})`}>
                        <rect
                          x={-w / 2}
                          y={-h / 2}
                          width={w}
                          height={h}
                          fill={def.cor_fundo || '#dc2626'}
                          stroke="#ffffff"
                          strokeWidth="25"
                          rx="15"
                        />
                        <text
                          x="0"
                          y={h * 0.15}
                          textAnchor="middle"
                          fill={def.cor_simbolo || '#ffffff'}
                          fontSize={Math.min(w, h) * 0.4}
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {def.codigo_normativo || def.codigo_interno}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* 4. Vários Tipos de Setas Segundo a ISO 23601 */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  {arrows.map((arr) => {
                    const isSelected = selectedArrowId === arr.id;
                    return (
                      <div
                        key={arr.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArrowId(arr.id);
                        }}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer p-1 rounded transition ${
                          isSelected ? 'ring-2 ring-amber-400 bg-amber-400/20' : 'hover:scale-110'
                        }`}
                        style={{ left: `${arr.x}%`, top: `${arr.y}%` }}
                        title={`Seta ISO 23601 (${arr.rotation}°)`}
                      >
                        <ISOArrow
                          type={arr.type}
                          rotation={arr.rotation}
                          width={arr.type === 'running_man' ? 44 : 36}
                          height={arr.type === 'running_man' ? 22 : 18}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* 5. "VOCÊ ESTÁ AQUI" (Bandeira Azul com Haste Triangular e Gotícula) */}
                <YouAreHereCallout
                  x={youAreHere.x}
                  y={youAreHere.y}
                  label={youAreHere.label}
                  calloutOffsetX={-70}
                  calloutOffsetY={-60}
                  isSelected={activeMode === 'place_yah'}
                  onMouseDown={() => {
                    // Seleciona ou inicia reposicionamento
                  }}
                />
              </div>

              {/* Barra de Ajuste de Opacidade e Ações Rápidas da Planta */}
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-600 bg-slate-100 p-2 rounded-lg border border-slate-300 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Opacidade da Planta:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={planOpacity}
                    onChange={(e) => setPlanOpacity(parseFloat(e.target.value))}
                    className="w-24 accent-emerald-600 cursor-pointer h-1.5 bg-slate-300 rounded"
                  />
                  <span className="font-mono font-bold text-slate-800">{Math.round(planOpacity * 100)}%</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,.pdf,.dxf"
                    onChange={handleQuickPlanUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-slate-700 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3 text-emerald-600" />
                    {activeFloor.floorPlanUrl ? 'Substituir Planta' : 'Inserir Planta Arquitetônica'}
                  </button>

                  {selectedCorridorId && (
                    <button
                      type="button"
                      onClick={handleDeleteSelectedCorridor}
                      className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir Corredor
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ====== COLUNA DIREITA: OS 3 CAMPOS DE IMAGEM JPEG ====== */}
            <div className="lg:col-span-3 border border-slate-400 p-3 rounded-lg bg-white flex flex-col justify-between space-y-3">
              {/* 1) CAMPO DE IMAGEM JPEG: FOTO AÉREA (GOOGLE MAPS / GOOGLE EARTH) */}
              <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-slate-900 block mb-1">
                  Foto Aérea
                </span>
                <div className="w-full aspect-[4/3] bg-slate-200 rounded border border-slate-400 overflow-hidden relative flex items-center justify-center">
                  {images.aerialPhotoUrl ? (
                    <img
                      src={images.aerialPhotoUrl}
                      alt="Foto Aérea do Edifício"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Mockup de Foto Satélite Aérea de Alta Resolução realista */
                    <div className="w-full h-full bg-[#334155] relative flex items-center justify-center overflow-hidden">
                      {/* Textura simulando quarteirão e telhados */}
                      <svg viewBox="0 0 100 80" className="w-full h-full">
                        <rect width="100" height="80" fill="#2d3748" />
                        <rect x="15" y="15" width="45" height="35" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
                        <rect x="62" y="20" width="28" height="40" fill="#9a3412" stroke="#431407" strokeWidth="0.8" />
                        <path d="M 0 55 Q 50 58 100 55" stroke="#64748b" strokeWidth="6" fill="none" />
                        <circle cx="35" cy="30" r="4" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
                        <text x="50" y="72" fill="#ffffff" fontSize="5" textAnchor="middle" fontWeight="bold">
                          Rua de Tomar (Google Maps)
                        </text>
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 truncate max-w-full">
                  {images.aerialPhotoLabel || 'Localização no Google Earth'}
                </span>
              </div>

              {/* 2) CAMPO DE IMAGEM JPEG: SÍMBOLO DE PONTOS CARDEAIS (ROSA DOS VENTOS) */}
              <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-slate-900 block mb-1">
                  Planta Geral / Orientação
                </span>
                <div className="w-full flex items-center justify-center p-1">
                  <CompassRose
                    rotation={images.compassRotation}
                    customImageUrl={images.compassRoseUrl}
                    size={95}
                  />
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5 font-mono">
                  Norte: {images.compassRotation}°
                </span>
              </div>

              {/* 3) CAMPO DE IMAGEM JPEG: QR CODE COM INSTRUÇÕES DE PROCEDIMENTOS (YOUTUBE) */}
              <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-slate-900 block mb-1">
                  Instruções de Procedimentos
                </span>
                <div className="w-20 h-20 bg-white p-1 rounded border border-slate-400 flex items-center justify-center">
                  {images.qrCodeUrl || generatedQrCode ? (
                    <img
                      src={images.qrCodeUrl || generatedQrCode}
                      alt="QR Code Vídeo YouTube"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Video className="w-8 h-8 text-red-500" />
                  )}
                </div>
                <span className="text-[9px] text-slate-600 font-semibold mt-1">
                  Vídeo de Emergência (YouTube)
                </span>
                <span className="text-[8px] text-slate-400">
                  Aponte a câmera do telemóvel
                </span>
              </div>
            </div>
          </div>

          {/* 5. RODAPÉ OFICIAL: NORMA ISO 23601, CONTATOS DO DESIGNER E CÓDIGO DO PLANO */}
          <div className="mt-3 pt-3 border-t-2 border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-700 gap-2">
            {/* Esquerda: Norma ISO */}
            <div className="font-bold text-slate-800 shrink-0">
              ISO 23601:2009
            </div>

            {/* Centro: Designer, WhatsApp e E-mail */}
            <div className="text-center font-medium leading-tight">
              <div>
                Designer: <strong>{designerName}</strong> • Contacto: <strong>{designerContact}</strong>
              </div>
              <div className="text-[9px] text-slate-500">
                {companyWebsite} • {companyEmail}
              </div>
            </div>

            {/* Direita: Código da Prancha e Logotipo */}
            <div className="text-right shrink-0 flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-xs">
                {planCode}
              </span>
              <div className="bg-[#0d7668] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">
                SYGMA SMS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
