import React, { useState, useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Project, Floor, PlacedSymbol, SignSymbol, CADEntity } from '../types/cad';
import { importArchitecturalPlan } from '../services/planImporter';
import { getSignGraphic, normalizeSignCode, getCategoryStandardColors } from '../utils/signImageCache';
import { CADDrawingRibbon } from './cad/CADDrawingRibbon';
import { CADCommandLine } from './cad/CADCommandLine';
import { renderCADEntities } from '../utils/cadEntityRenderer';
import { 
  Maximize2, ZoomIn, ZoomOut, RotateCw, Copy, Trash2, 
  Ruler, Move, Crosshair, ArrowUpRight, Upload, CheckCircle2,
  AlertCircle, Sparkles, X, ChevronRight, Sliders, Eye, EyeOff,
  Lock, Unlock, Contrast, Sun, RefreshCw, SlidersHorizontal,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ShieldCheck, Check
} from 'lucide-react';

export type CADTool = 
  | 'select' 
  | 'pan' 
  | 'move_plan'
  | 'insert_symbol' 
  | 'calibrate' 
  | 'measure' 
  | 'route' 
  | 'text'
  // Desenho CAD 2D Profissional:
  | 'draw_line'
  | 'draw_polyline'
  | 'draw_rect'
  | 'draw_circle'
  | 'draw_arc'
  | 'draw_ellipse'
  | 'draw_polygon'
  | 'draw_point'
  | 'draw_hatch'
  // Modificação / Edição CAD:
  | 'modify_move'
  | 'modify_copy'
  | 'modify_rotate'
  | 'modify_scale'
  | 'modify_mirror'
  | 'modify_offset'
  // Cotas & Anotações:
  | 'dimension_linear'
  | 'dimension_aligned'
  | 'dimension_radial'
  | 'leader'
  | 'measure_area';

interface CADCanvasProps {
  project: Project;
  activeFloor: Floor;
  symbolsCatalog: SignSymbol[];
  activeTool: CADTool;
  setActiveTool: (tool: CADTool) => void;
  selectedSymbolIdToInsert: string | null;
  selectedSupplierForInsert?: string | null;
  selectedPriceForInsert?: number | null;
  selectedPlacedSymbolId: string | null;
  onSelectPlacedSymbol: (id: string | null) => void;
  onUpdatePlacedSymbol: (symbol: PlacedSymbol) => void;
  onAddPlacedSymbol: (symbol: PlacedSymbol) => void;
  onDeletePlacedSymbol: (id: string) => void;
  onUpdateFloor: (floor: Floor, shouldFitExtents?: boolean) => void;
  onTriggerAutosave: () => void;
  isNightGlowMode: boolean;
  isCadBadgeMode: boolean;
  onOpenProperties: () => void;
  recenterTrigger?: number;
  onToggleOrtho?: () => void;
  onToggleGridSnap?: () => void;
  onOpenUploadPlanModal?: () => void;
  onOpenLibraryModal?: () => void;
  onOpenLayersModal?: () => void;
}

export const CADCanvas: React.FC<CADCanvasProps> = ({
  project,
  activeFloor,
  symbolsCatalog,
  activeTool,
  setActiveTool,
  selectedSymbolIdToInsert,
  selectedSupplierForInsert,
  selectedPriceForInsert,
  selectedPlacedSymbolId,
  onSelectPlacedSymbol,
  onUpdatePlacedSymbol,
  onAddPlacedSymbol,
  onDeletePlacedSymbol,
  onUpdateFloor,
  onTriggerAutosave,
  isNightGlowMode,
  isCadBadgeMode,
  onOpenProperties,
  recenterTrigger
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Konva Stage & Layers References
  const stageRef = useRef<Konva.Stage | null>(null);
  const planLayerRef = useRef<Konva.Layer | null>(null);
  const gridLayerRef = useRef<Konva.Layer | null>(null);
  const cadEntitiesLayerRef = useRef<Konva.Layer | null>(null);
  const symbolsLayerRef = useRef<Konva.Layer | null>(null);
  const annotationsLayerRef = useRef<Konva.Layer | null>(null);
  const overlayLayerRef = useRef<Konva.Layer | null>(null);
  const planImageNodeRef = useRef<Konva.Image | null>(null);

  // Viewport State (1 unit = 1 millimeter)
  const [zoom, setZoom] = useState<number>(0.022);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 40 });
  const [cursorWorldPos, setCursorWorldPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // CAD 2D Drafting & Modification States
  const [selectedCADEntityId, setSelectedCADEntityId] = useState<string | null>(null);
  const [cadDrawPoints, setCadDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [cadActiveLayerId, setCadActiveLayerId] = useState<string>(project.layers[0]?.id || 'L-CAD');
  const [cadActiveColor, setCadActiveColor] = useState<string>('#38bdf8');
  const [cadActiveStrokeWidth, setCadActiveStrokeWidth] = useState<number>(250);
  const [osnapEnabled, setOsnapEnabled] = useState<boolean>(true);
  const [orthoMode, setOrthoMode] = useState<boolean>(project.settings.orthoMode || false);
  const [gridSnap, setGridSnap] = useState<boolean>(project.settings.gridSnap || false);
  const [snapIndicator, setSnapIndicator] = useState<{ x: number; y: number; type: 'end' | 'mid' | 'center' } | null>(null);
  const [modifyBasePoint, setModifyBasePoint] = useState<{ x: number; y: number } | null>(null);
  const [cadHistory, setCadHistory] = useState<CADEntity[][]>([]);
  const [cadRedoHistory, setCadRedoHistory] = useState<CADEntity[][]>([]);
  const [promptMessage, setPromptMessage] = useState<string>('Pronto para comandos CAD.');

  // Real-time Plan Opacity (0.05 a 1.0)
  const [realtimeOpacity, setRealtimeOpacity] = useState<number>(
    activeFloor.floorPlanOpacity !== undefined ? activeFloor.floorPlanOpacity : 1.0
  );

  // Calibration / Escalonamento 2-Points State
  const [calibPointA, setCalibPointA] = useState<{ x: number; y: number } | null>(null);
  const [calibPointB, setCalibPointB] = useState<{ x: number; y: number } | null>(null);
  const [showCalibModal, setShowCalibModal] = useState(false);
  const [calibDistanceInput, setCalibDistanceInput] = useState('5.00');

  // Measure Tool State
  const [measurePointA, setMeasurePointA] = useState<{ x: number; y: number } | null>(null);
  const [measurePointB, setMeasurePointB] = useState<{ x: number; y: number } | null>(null);

  // UI Panels State
  const [showPlanControls, setShowPlanControls] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; symbolId: string } | null>(null);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Linear Array Modal
  const [showArrayModal, setShowArrayModal] = useState(false);
  const [arrayCount, setArrayCount] = useState(5);
  const [arrayDistanceMeters, setArrayDistanceMeters] = useState(15.0);
  const [arrayDirection, setArrayDirection] = useState<'X' | 'Y'>('X');

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const selectedSymbol = activeFloor.placedSymbols.find((s) => s.id === selectedPlacedSymbolId);

  // Sincroniza opacidade quando mudar externamente
  useEffect(() => {
    if (activeFloor.floorPlanOpacity !== undefined) {
      setRealtimeOpacity(activeFloor.floorPlanOpacity);
      if (planLayerRef.current) {
        planLayerRef.current.opacity(activeFloor.floorPlanOpacity);
        planLayerRef.current.batchDraw();
      }
    }
  }, [activeFloor.floorPlanOpacity]);

  // Coordinate conversion: Screen (px) -> World (mm)
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!stageRef.current) return { x: 0, y: 0 };
    const stage = stageRef.current;
    const currentScale = stage.scaleX();
    const pos = stage.position();

    let worldX = (screenX - pos.x) / currentScale;
    let worldY = (screenY - pos.y) / currentScale;

    if (project.settings.gridSnap) {
      const snapSize = project.settings.gridSizeMm || 500;
      worldX = Math.round(worldX / snapSize) * snapSize;
      worldY = Math.round(worldY / snapSize) * snapSize;
    }

    return { x: Math.round(worldX), y: Math.round(worldY) };
  }, [project.settings.gridSnap, project.settings.gridSizeMm]);

  // Coordinate conversion: World (mm) -> Screen (px)
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    if (!stageRef.current) return { x: 0, y: 0 };
    const stage = stageRef.current;
    const currentScale = stage.scaleX();
    const pos = stage.position();
    return {
      x: worldX * currentScale + pos.x,
      y: worldY * currentScale + pos.y
    };
  }, []);

  /**
   * FIT TO WORKSPACE 100%:
   * Ajusta dinamicamente o viewport do canvas para centralizar a imagem da planta
   * e ocupar 100% da área de trabalho mantendo resolução máxima.
   */
  const handleFitExtents = useCallback((fitMode: 'contain' | 'fill' = 'contain') => {
    if (!containerRef.current || !stageRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const scale = activeFloor.floorPlanZoom || 1.0;
    const planWidthMm = (activeFloor.widthMeters || 40) * 1000 * scale;
    const planHeightMm = (activeFloor.heightMeters || 28) * 1000 * scale;
    const offsetX = activeFloor.floorPlanOffsetX || 0;
    const offsetY = activeFloor.floorPlanOffsetY || 0;

    // Em modo contain, preenche 100% sem cortes com margem mínima de 16px para não colar nas bordas
    const padding = fitMode === 'fill' ? 0 : 20;
    const availW = Math.max(100, clientWidth - padding * 2);
    const availH = Math.max(100, clientHeight - padding * 2);

    const zoomX = availW / planWidthMm;
    const zoomY = availH / planHeightMm;
    const newZoom = fitMode === 'fill' ? Math.max(zoomX, zoomY) : Math.min(zoomX, zoomY);

    const planCenterWorldX = offsetX + planWidthMm / 2;
    const planCenterWorldY = offsetY + planHeightMm / 2;

    const newPanX = clientWidth / 2 - planCenterWorldX * newZoom;
    const newPanY = clientHeight / 2 - planCenterWorldY * newZoom;

    setZoom(newZoom);
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });

    const stage = stageRef.current;
    stage.scale({ x: newZoom, y: newZoom });
    stage.position({ x: Math.round(newPanX), y: Math.round(newPanY) });
    stage.batchDraw();
  }, [activeFloor]);

  // Trigger fit extents on initial mount, floor change or recenterTrigger
  useEffect(() => {
    handleFitExtents();
  }, [activeFloor.id, recenterTrigger, handleFitExtents]);

  // Controle de Opacidade em Tempo Real sobre a Camada da Planta
  const handleRealtimeOpacityChange = (newVal: number) => {
    const clamped = Math.max(0.05, Math.min(1.0, newVal));
    setRealtimeOpacity(clamped);
    if (planLayerRef.current) {
      planLayerRef.current.opacity(clamped);
      planLayerRef.current.batchDraw();
    }
  };

  const handleCommitOpacity = (newVal: number) => {
    const clamped = Math.max(0.05, Math.min(1.0, newVal));
    handleRealtimeOpacityChange(clamped);
    onUpdateFloor({
      ...activeFloor,
      floorPlanOpacity: clamped
    });
  };

  // Direct Image/Plan Upload Handler
  const handleProcessImageFile = async (file: File) => {
    try {
      showToast(`Processando planta "${file.name}" em alta resolução...`);
      const result = await importArchitecturalPlan(file);
      onUpdateFloor({
        ...activeFloor,
        floorPlanUrl: result.floorPlanUrl,
        floorPlanType: result.floorPlanType,
        widthMeters: result.widthMeters || activeFloor.widthMeters,
        heightMeters: result.heightMeters || activeFloor.heightMeters,
        floorPlanOpacity: 1.0,
        floorPlanContrast: 115,
        floorPlanOffsetX: 0,
        floorPlanOffsetY: 0,
        floorPlanZoom: 1.0,
        floorPlanPreserveAspect: true,
        floorPlanVisible: true,
        floorPlanLocked: false,
        calibrated: true
      }, true);
      showToast(`Planta "${file.name}" carregada! Centralizando 100% da área.`);
      setTimeout(() => handleFitExtents('contain'), 150);
      onTriggerAutosave();
    } catch (err: any) {
      alert(`Erro ao importar planta: ${err.message || err}`);
    }
  };

  const handleNativeFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessImageFile(e.target.files[0]);
    }
  };

  // Nudge Floor Plan
  const handleNudgePlan = (dxMm: number, dyMm: number) => {
    onUpdateFloor({
      ...activeFloor,
      floorPlanOffsetX: (activeFloor.floorPlanOffsetX || 0) + dxMm,
      floorPlanOffsetY: (activeFloor.floorPlanOffsetY || 0) + dyMm
    });
  };

  const handleResetPlanOffset = () => {
    onUpdateFloor({
      ...activeFloor,
      floorPlanOffsetX: 0,
      floorPlanOffsetY: 0,
      floorPlanZoom: 1.0
    });
    setTimeout(() => handleFitExtents('contain'), 50);
  };

  const handleTogglePlanInvert = () => {
    onUpdateFloor({
      ...activeFloor,
      floorPlanInvert: !activeFloor.floorPlanInvert
    });
  };

  const handleTogglePlanLock = () => {
    onUpdateFloor({
      ...activeFloor,
      floorPlanLocked: !activeFloor.floorPlanLocked
    });
    if (!activeFloor.floorPlanLocked && activeTool === 'move_plan') {
      setActiveTool('select');
    }
  };

  const handleTogglePlanVisibility = () => {
    const nextVis = activeFloor.floorPlanVisible === false;
    onUpdateFloor({
      ...activeFloor,
      floorPlanVisible: nextVis
    });
    if (planLayerRef.current) {
      planLayerRef.current.visible(nextVis);
      planLayerRef.current.batchDraw();
    }
  };

  const handleRemovePlan = () => {
    onUpdateFloor({
      ...activeFloor,
      floorPlanUrl: undefined,
      floorPlanType: undefined,
      calibrated: false
    });
    showToast('Planta removida. Pavimento limpo para nova importação.');
  };

  // =========================================================================
  // INITIALIZE KONVA STAGE & LAYERS
  // =========================================================================
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Criar Konva Stage com suporte a pixelRatio máximo para telas Retina/HiDPI
    const stage = new Konva.Stage({
      container,
      width,
      height,
      pixelRatio: Math.max(1, window.devicePixelRatio || 1)
    });
    stageRef.current = stage;

    // 2. CAMADA 1: Imagem da Planta de Fundo (com cache para não ser redesenhada em movimentações de sinal)
    const planLayer = new Konva.Layer({ id: 'plan-layer', listening: false });
    planLayerRef.current = planLayer;
    stage.add(planLayer);

    // 3. CAMADA 2: Grid CAD & Eixos
    const gridLayer = new Konva.Layer({ id: 'grid-layer', listening: false });
    gridLayerRef.current = gridLayer;
    stage.add(gridLayer);

    // 4. CAMADA 3: Entidades Vetoriais de Desenho CAD 2D (Linha, Polilinha, Retângulo, etc.)
    const cadEntitiesLayer = new Konva.Layer({ id: 'cad-entities-layer' });
    cadEntitiesLayerRef.current = cadEntitiesLayer;
    stage.add(cadEntitiesLayer);

    // 5. CAMADA 4: Sinais e Equipamentos de Combate a Incêndio (Interativos)
    const symbolsLayer = new Konva.Layer({ id: 'symbols-layer' });
    symbolsLayerRef.current = symbolsLayer;
    stage.add(symbolsLayer);

    // 6. CAMADA 5: Anotações, Medições e Calibração 2-Pontos
    const annotationsLayer = new Konva.Layer({ id: 'annotations-layer' });
    annotationsLayerRef.current = annotationsLayer;
    stage.add(annotationsLayer);

    // 7. CAMADA 6: Overlays, Bounding Box de Seleção, Cursor & Guias
    const overlayLayer = new Konva.Layer({ id: 'overlay-layer', listening: false });
    overlayLayerRef.current = overlayLayer;
    stage.add(overlayLayer);

    // ResizeObserver para manter o canvas ocupando 100% da área do container dinamicamente
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          stage.width(newW);
          stage.height(newH);
          stage.batchDraw();
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      stage.destroy();
      stageRef.current = null;
    };
  }, []);

  // =========================================================================
  // CAD ENTITY HELPERS (COMMIT, UNDO, REDO, DELETE)
  // =========================================================================
  const commitCADEntities = useCallback((newEntities: CADEntity[]) => {
    setCadHistory((prev) => [...prev, activeFloor.cadEntities || []]);
    setCadRedoHistory([]);
    onUpdateFloor({
      ...activeFloor,
      cadEntities: newEntities
    });
    onTriggerAutosave();
  }, [activeFloor, onUpdateFloor, onTriggerAutosave]);

  const handleUndoCAD = useCallback(() => {
    if (cadHistory.length === 0) return;
    const prev = cadHistory[cadHistory.length - 1];
    setCadRedoHistory((r) => [...r, activeFloor.cadEntities || []]);
    setCadHistory((h) => h.slice(0, -1));
    onUpdateFloor({
      ...activeFloor,
      cadEntities: prev
    });
    onTriggerAutosave();
    showToast('Desfazer executado.');
  }, [cadHistory, activeFloor, onUpdateFloor, onTriggerAutosave]);

  const handleRedoCAD = useCallback(() => {
    if (cadRedoHistory.length === 0) return;
    const next = cadRedoHistory[cadRedoHistory.length - 1];
    setCadHistory((h) => [...h, activeFloor.cadEntities || []]);
    setCadRedoHistory((r) => r.slice(0, -1));
    onUpdateFloor({
      ...activeFloor,
      cadEntities: next
    });
    onTriggerAutosave();
    showToast('Refazer executado.');
  }, [cadRedoHistory, activeFloor, onUpdateFloor, onTriggerAutosave]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedCADEntityId) {
      const remaining = (activeFloor.cadEntities || []).filter((e) => e.id !== selectedCADEntityId);
      commitCADEntities(remaining);
      setSelectedCADEntityId(null);
      showToast('Entidade CAD excluída.');
    } else if (selectedPlacedSymbolId) {
      onDeletePlacedSymbol(selectedPlacedSymbolId);
      onSelectPlacedSymbol(null);
      onTriggerAutosave();
      showToast('Símbolo excluído.');
    }
  }, [selectedCADEntityId, selectedPlacedSymbolId, activeFloor.cadEntities, commitCADEntities, onDeletePlacedSymbol, onSelectPlacedSymbol, onTriggerAutosave]);

  // Renderiza Entidades CAD na camada dedicada
  useEffect(() => {
    if (!cadEntitiesLayerRef.current) return;
    renderCADEntities({
      layer: cadEntitiesLayerRef.current,
      entities: activeFloor.cadEntities || [],
      selectedEntityId: selectedCADEntityId,
      onSelectEntity: (id) => {
        setSelectedCADEntityId(id);
        onSelectPlacedSymbol(null);
      },
      activeTool
    });
  }, [activeFloor.cadEntities, selectedCADEntityId, activeTool, onSelectPlacedSymbol]);

  // =========================================================================
  // RENDER PLAN LAYER (COM CACHE ULTRA-RÁPIDO)
  // =========================================================================
  useEffect(() => {
    const planLayer = planLayerRef.current;
    if (!planLayer) return;

    planLayer.destroyChildren();

    const isVisible = activeFloor.floorPlanVisible !== false;
    planLayer.visible(isVisible);
    planLayer.opacity(realtimeOpacity);

    if (!isVisible) {
      planLayer.batchDraw();
      return;
    }

    const planWidthMm = (activeFloor.widthMeters || 40) * 1000;
    const planHeightMm = (activeFloor.heightMeters || 28) * 1000;
    const offsetX = activeFloor.floorPlanOffsetX || 0;
    const offsetY = activeFloor.floorPlanOffsetY || 0;
    const planZoom = activeFloor.floorPlanZoom || 1.0;

    const planGroup = new Konva.Group({
      x: offsetX,
      y: offsetY,
      scaleX: planZoom,
      scaleY: planZoom
    });

    if (activeFloor.floorPlanUrl) {
      // Carrega imagem da planta real importada
      const img = new Image();
      // Não definir crossOrigin em data URLs (evita taints de CORS no Chrome/Firefox)
      if (activeFloor.floorPlanUrl.startsWith('http://') || activeFloor.floorPlanUrl.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        const nw = img.naturalWidth || 4000;
        const nh = img.naturalHeight || 2800;
        const naturalAspect = nw / nh;

        let renderWidthMm = planWidthMm;
        let renderHeightMm = planHeightMm;

        // Preserva aspect ratio natural se houver divergência
        if (naturalAspect > 0 && Math.abs(renderWidthMm / renderHeightMm - naturalAspect) > 0.06) {
          renderHeightMm = renderWidthMm / naturalAspect;
        }

        const konvaImg = new Konva.Image({
          image: img,
          x: 0,
          y: 0,
          width: renderWidthMm,
          height: renderHeightMm,
          stroke: activeTool === 'move_plan' ? '#a855f7' : '#38bdf8',
          strokeWidth: activeTool === 'move_plan' ? 120 : 0,
          dash: [200, 100]
        });

        // Aplica filtro de inversão se solicitado para plantas com fundo escuro CAD
        if (activeFloor.floorPlanInvert) {
          konvaImg.filters([Konva.Filters.Invert]);
        }

        planImageNodeRef.current = konvaImg;
        planGroup.add(konvaImg);

        // Tag indicativa de escala e dimensões da planta
        const labelText = new Konva.Text({
          x: renderWidthMm / 2,
          y: -420,
          text: `PLANTA ARQUITETÔNICA (${(renderWidthMm / 1000).toFixed(2)}m × ${(renderHeightMm / 1000).toFixed(2)}m) • OPACIDADE ${Math.round(realtimeOpacity * 100)}%`,
          fontSize: 380,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          fill: activeTool === 'move_plan' ? '#c084fc' : '#38bdf8',
          align: 'center'
        });
        labelText.offsetX(labelText.width() / 2);
        planGroup.add(labelText);

        planLayer.add(planGroup);
        planLayer.batchDraw();
        stageRef.current?.batchDraw();
      };
      img.onerror = (err) => {
        console.error('Falha ao carregar imagem da planta baixa:', err);
      };
      img.src = activeFloor.floorPlanUrl;
    } else {
      // Inicia do zero: nenhuma planta de exemplo ou pilares no fundo
      planImageNodeRef.current = null;
      planLayer.batchDraw();
      stageRef.current?.batchDraw();
    }
  }, [
    activeFloor.floorPlanUrl,
    activeFloor.widthMeters,
    activeFloor.heightMeters,
    activeFloor.floorPlanOffsetX,
    activeFloor.floorPlanOffsetY,
    activeFloor.floorPlanZoom,
    activeFloor.floorPlanInvert,
    activeFloor.floorPlanVisible,
    activeTool
  ]);

  // =========================================================================
  // RENDER GRID LAYER
  // =========================================================================
  useEffect(() => {
    const gridLayer = gridLayerRef.current;
    if (!gridLayer) return;

    gridLayer.destroyChildren();

    const planWidthMm = (activeFloor.widthMeters || 40) * 1000;
    const planHeightMm = (activeFloor.heightMeters || 28) * 1000;

    // Grid secundário (1m = 1000mm)
    const gridSize = project.settings.gridSizeMm || 1000;
    for (let x = 0; x <= planWidthMm; x += gridSize * 2) {
      gridLayer.add(new Konva.Line({
        points: [x, 0, x, planHeightMm],
        stroke: '#1e293b',
        strokeWidth: 15,
        opacity: 0.4
      }));
    }
    for (let y = 0; y <= planHeightMm; y += gridSize * 2) {
      gridLayer.add(new Konva.Line({
        points: [0, y, planWidthMm, y],
        stroke: '#1e293b',
        strokeWidth: 15,
        opacity: 0.4
      }));
    }

    // Eixos X e Y
    gridLayer.add(new Konva.Line({
      points: [0, 0, planWidthMm, 0],
      stroke: '#38bdf8',
      strokeWidth: 30,
      opacity: 0.6
    }));
    gridLayer.add(new Konva.Line({
      points: [0, 0, 0, planHeightMm],
      stroke: '#38bdf8',
      strokeWidth: 30,
      opacity: 0.6
    }));

    gridLayer.batchDraw();
  }, [activeFloor.widthMeters, activeFloor.heightMeters, project.settings.gridSizeMm]);

  // =========================================================================
  // RENDER SYMBOLS LAYER (CRISP HIGH RESOLUTION GRAPHICS & ZERO-LAG DRAGGING)
  // =========================================================================
  useEffect(() => {
    const symbolsLayer = symbolsLayerRef.current;
    if (!symbolsLayer) return;

    symbolsLayer.destroyChildren();

    activeFloor.placedSymbols.forEach((sym) => {
      const def = symbolsCatalog.find((s) => s.id === sym.symbol_id);
      if (!def) return;

      const isSelected = sym.id === selectedPlacedSymbolId;
      const w = sym.width * sym.scale;
      const h = sym.height * sym.scale;

      const symGroup = new Konva.Group({
        id: sym.id,
        x: sym.x,
        y: sym.y,
        rotation: sym.rotation || 0,
        draggable: activeTool === 'select'
      });

      // Imagem gráfica oficial vetorizada de alta nitidez
      const graphic = getSignGraphic(def, isCadBadgeMode, isNightGlowMode, () => {
        symbolsLayer.batchDraw();
      });

      const iconImg = new Konva.Image({
        image: graphic,
        x: -w / 2,
        y: -h / 2,
        width: w,
        height: h,
        shadowColor: isNightGlowMode ? '#84cc16' : '#000000',
        shadowBlur: isNightGlowMode ? 25 : 12,
        shadowOpacity: isNightGlowMode ? 0.9 : 0.45,
        shadowOffset: { x: 0, y: isNightGlowMode ? 0 : 6 }
      });
      symGroup.add(iconImg);

      // Bounding box e alça de rotação quando selecionado
      if (isSelected) {
        const selRect = new Konva.Rect({
          x: -w / 2 - 80,
          y: -h / 2 - 80,
          width: w + 160,
          height: h + 160,
          stroke: '#38bdf8',
          strokeWidth: 40,
          dash: [120, 80]
        });
        symGroup.add(selRect);

        // Haste de rotação
        const rotLine = new Konva.Line({
          points: [0, -h / 2 - 80, 0, -h / 2 - 450],
          stroke: '#38bdf8',
          strokeWidth: 35
        });
        symGroup.add(rotLine);

        // Ponto de rotação superior
        const rotHandle = new Konva.Circle({
          x: 0,
          y: -h / 2 - 450,
          radius: 140,
          fill: '#38bdf8',
          stroke: '#ffffff',
          strokeWidth: 35
        });
        symGroup.add(rotHandle);

        // Rótulo com código normativo e coordenadas milimétricas
        const tagText = new Konva.Text({
          x: 0,
          y: h / 2 + 380,
          text: `${def.codigo_normativo} | X:${(sym.x / 1000).toFixed(2)}m Y:${(sym.y / 1000).toFixed(2)}m`,
          fontSize: 280,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          fill: '#38bdf8',
          align: 'center'
        });
        tagText.offsetX(tagText.width() / 2);
        symGroup.add(tagText);
      }

      // Eventos de clique e seleção
      symGroup.on('mousedown tap', (e) => {
        e.cancelBubble = true;
        if (activeTool === 'select') {
          onSelectPlacedSymbol(sym.id);
        }
      });

      // Arraste do sinal com atualização de coordenadas sem repintar a planta de fundo
      symGroup.on('dragmove', () => {
        // Apenas a camada de símbolos é atualizada pelo Konva
      });

      symGroup.on('dragend', () => {
        let finalX = symGroup.x();
        let finalY = symGroup.y();

        if (project.settings.gridSnap) {
          const snap = project.settings.gridSizeMm || 500;
          finalX = Math.round(finalX / snap) * snap;
          finalY = Math.round(finalY / snap) * snap;
          symGroup.position({ x: finalX, y: finalY });
          symbolsLayer.batchDraw();
        }

        onUpdatePlacedSymbol({
          ...sym,
          x: Math.round(finalX),
          y: Math.round(finalY)
        });
        onTriggerAutosave();
      });

      // Context menu
      symGroup.on('contextmenu', (e) => {
        e.evt.preventDefault();
        e.cancelBubble = true;
        setContextMenu({
          x: e.evt.clientX,
          y: e.evt.clientY,
          symbolId: sym.id
        });
      });

      symbolsLayer.add(symGroup);
    });

    symbolsLayer.batchDraw();
  }, [
    activeFloor.placedSymbols,
    selectedPlacedSymbolId,
    symbolsCatalog,
    activeTool,
    isNightGlowMode,
    isCadBadgeMode,
    project.settings.gridSnap,
    project.settings.gridSizeMm,
    onSelectPlacedSymbol,
    onUpdatePlacedSymbol,
    onTriggerAutosave
  ]);

  // =========================================================================
  // RENDER ANNOTATIONS LAYER (CALIBRAÇÃO 2 PONTOS, MEDIÇÃO, PREVIEWS CAD & OSNAP)
  // =========================================================================
  useEffect(() => {
    const annotationsLayer = annotationsLayerRef.current;
    if (!annotationsLayer) return;

    annotationsLayer.destroyChildren();

    // 1. Ferramenta Medir
    if (activeTool === 'measure' && measurePointA && measurePointB) {
      const distM = (Math.hypot(measurePointB.x - measurePointA.x, measurePointB.y - measurePointA.y) / 1000).toFixed(2);
      
      annotationsLayer.add(new Konva.Line({
        points: [measurePointA.x, measurePointA.y, measurePointB.x, measurePointB.y],
        stroke: '#eab308',
        strokeWidth: 60,
        dash: [180, 90]
      }));
      annotationsLayer.add(new Konva.Circle({
        x: measurePointA.x,
        y: measurePointA.y,
        radius: 160,
        fill: '#eab308'
      }));
      annotationsLayer.add(new Konva.Circle({
        x: measurePointB.x,
        y: measurePointB.y,
        radius: 160,
        fill: '#eab308'
      }));

      const midX = (measurePointA.x + measurePointB.x) / 2;
      const midY = (measurePointA.y + measurePointB.y) / 2;

      const tagBg = new Konva.Rect({
        x: midX - 900,
        y: midY - 300,
        width: 1800,
        height: 600,
        cornerRadius: 150,
        fill: '#0f172a',
        stroke: '#eab308',
        strokeWidth: 35
      });
      annotationsLayer.add(tagBg);

      const tagText = new Konva.Text({
        x: midX,
        y: midY - 80,
        text: `${distM} m`,
        fontSize: 360,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        fill: '#facc15',
        align: 'center'
      });
      tagText.offsetX(tagText.width() / 2);
      annotationsLayer.add(tagText);
    }

    // 2. Ferramenta de Calibração / Escalonar 2 Pontos
    if (activeTool === 'calibrate') {
      if (calibPointA) {
        annotationsLayer.add(new Konva.Circle({
          x: calibPointA.x,
          y: calibPointA.y,
          radius: 350,
          stroke: '#38bdf8',
          strokeWidth: 50
        }));
        annotationsLayer.add(new Konva.Circle({
          x: calibPointA.x,
          y: calibPointA.y,
          radius: 120,
          fill: '#38bdf8'
        }));
      }

      if (calibPointA && !calibPointB) {
        annotationsLayer.add(new Konva.Line({
          points: [calibPointA.x, calibPointA.y, cursorWorldPos.x, cursorWorldPos.y],
          stroke: '#38bdf8',
          strokeWidth: 60,
          dash: [200, 100]
        }));
      }

      if (calibPointB) {
        annotationsLayer.add(new Konva.Circle({
          x: calibPointB.x,
          y: calibPointB.y,
          radius: 350,
          stroke: '#22c55e',
          strokeWidth: 50
        }));
        annotationsLayer.add(new Konva.Circle({
          x: calibPointB.x,
          y: calibPointB.y,
          radius: 120,
          fill: '#22c55e'
        }));
      }

      if (calibPointA && calibPointB) {
        annotationsLayer.add(new Konva.Line({
          points: [calibPointA.x, calibPointA.y, calibPointB.x, calibPointB.y],
          stroke: '#22c55e',
          strokeWidth: 80,
          dash: [240, 120]
        }));
      }
    }

    // 3. PREVIEWS ELÁSTICOS CAD (RUBBER-BANDING)
    if (cadDrawPoints.length > 0) {
      const pLast = cadDrawPoints[cadDrawPoints.length - 1];
      const pFirst = cadDrawPoints[0];

      // Linha (Line)
      if (activeTool === 'draw_line') {
        const distM = (Math.hypot(cursorWorldPos.x - pLast.x, cursorWorldPos.y - pLast.y) / 1000).toFixed(2);
        const angleDeg = Math.round((Math.atan2(cursorWorldPos.y - pLast.y, cursorWorldPos.x - pLast.x) * 180) / Math.PI);
        annotationsLayer.add(new Konva.Line({
          points: [pLast.x, pLast.y, cursorWorldPos.x, cursorWorldPos.y],
          stroke: '#38bdf8',
          strokeWidth: cadActiveStrokeWidth,
          dash: [150, 75]
        }));
        // Tag com dimensão e ângulo
        const midX = (pLast.x + cursorWorldPos.x) / 2;
        const midY = (pLast.y + cursorWorldPos.y) / 2;
        annotationsLayer.add(new Konva.Text({
          x: midX + 100,
          y: midY - 300,
          text: `L: ${distM} m < ${angleDeg}°`,
          fontSize: 260,
          fontFamily: 'monospace',
          fill: '#38bdf8'
        }));
      }

      // Polilinha (Polyline)
      if (activeTool === 'draw_polyline') {
        const flat = cadDrawPoints.flatMap((p) => [p.x, p.y]);
        flat.push(cursorWorldPos.x, cursorWorldPos.y);
        annotationsLayer.add(new Konva.Line({
          points: flat,
          stroke: '#38bdf8',
          strokeWidth: cadActiveStrokeWidth,
          dash: [150, 75]
        }));
        // Anel de fechamento se estiver próximo do primeiro ponto
        if (cadDrawPoints.length >= 2) {
          const distToStart = Math.hypot(cursorWorldPos.x - pFirst.x, cursorWorldPos.y - pFirst.y);
          if (distToStart < 600) {
            annotationsLayer.add(new Konva.Circle({
              x: pFirst.x,
              y: pFirst.y,
              radius: 400,
              stroke: '#22c55e',
              strokeWidth: 80
            }));
          }
        }
      }

      // Retângulo (Rect)
      if (activeTool === 'draw_rect') {
        const minX = Math.min(pFirst.x, cursorWorldPos.x);
        const minY = Math.min(pFirst.y, cursorWorldPos.y);
        const w = Math.abs(cursorWorldPos.x - pFirst.x);
        const h = Math.abs(cursorWorldPos.y - pFirst.y);
        annotationsLayer.add(new Konva.Rect({
          x: minX,
          y: minY,
          width: w,
          height: h,
          stroke: '#38bdf8',
          strokeWidth: cadActiveStrokeWidth,
          dash: [150, 75],
          fill: 'rgba(56, 189, 248, 0.1)'
        }));
        annotationsLayer.add(new Konva.Text({
          x: minX + 50,
          y: minY - 300,
          text: `${(w / 1000).toFixed(2)}m × ${(h / 1000).toFixed(2)}m`,
          fontSize: 260,
          fontFamily: 'monospace',
          fill: '#38bdf8'
        }));
      }

      // Círculo (Circle)
      if (activeTool === 'draw_circle') {
        const radius = Math.hypot(cursorWorldPos.x - pFirst.x, cursorWorldPos.y - pFirst.y);
        annotationsLayer.add(new Konva.Circle({
          x: pFirst.x,
          y: pFirst.y,
          radius,
          stroke: '#38bdf8',
          strokeWidth: cadActiveStrokeWidth,
          dash: [150, 75],
          fill: 'rgba(56, 189, 248, 0.08)'
        }));
        annotationsLayer.add(new Konva.Line({
          points: [pFirst.x, pFirst.y, cursorWorldPos.x, cursorWorldPos.y],
          stroke: '#38bdf8',
          strokeWidth: 40,
          dash: [100, 50]
        }));
        annotationsLayer.add(new Konva.Text({
          x: cursorWorldPos.x + 80,
          y: cursorWorldPos.y - 250,
          text: `R: ${(radius / 1000).toFixed(2)} m`,
          fontSize: 260,
          fontFamily: 'monospace',
          fill: '#38bdf8'
        }));
      }

      // Hachura (Hatch)
      if (activeTool === 'draw_hatch') {
        const flat = cadDrawPoints.flatMap((p) => [p.x, p.y]);
        flat.push(cursorWorldPos.x, cursorWorldPos.y);
        annotationsLayer.add(new Konva.Line({
          points: flat,
          stroke: '#38bdf8',
          strokeWidth: cadActiveStrokeWidth,
          dash: [150, 75],
          fill: 'rgba(56, 189, 248, 0.25)'
        }));
      }

      // Cotas Lineares e Alinhadas (Dimensions)
      if ((activeTool === 'dimension_linear' || activeTool === 'dimension_aligned') && cadDrawPoints.length === 1) {
        annotationsLayer.add(new Konva.Line({
          points: [pFirst.x, pFirst.y, cursorWorldPos.x, cursorWorldPos.y],
          stroke: '#38bdf8',
          strokeWidth: 60,
          dash: [120, 60]
        }));
      }
    }

    // 4. INDICADOR VISUAL DO OSNAP (SNAP GLYPH)
    if (snapIndicator) {
      if (snapIndicator.type === 'end') {
        // Quadrado verde (AutoCAD Endpoint)
        annotationsLayer.add(new Konva.Rect({
          x: snapIndicator.x - 160,
          y: snapIndicator.y - 160,
          width: 320,
          height: 320,
          stroke: '#22c55e',
          strokeWidth: 60
        }));
        annotationsLayer.add(new Konva.Text({
          x: snapIndicator.x + 200,
          y: snapIndicator.y - 100,
          text: 'Extremidade',
          fontSize: 220,
          fontFamily: 'monospace',
          fill: '#22c55e'
        }));
      } else if (snapIndicator.type === 'mid') {
        // Triângulo verde (AutoCAD Midpoint)
        annotationsLayer.add(new Konva.Line({
          points: [
            snapIndicator.x, snapIndicator.y - 180,
            snapIndicator.x + 180, snapIndicator.y + 140,
            snapIndicator.x - 180, snapIndicator.y + 140
          ],
          closed: true,
          stroke: '#22c55e',
          strokeWidth: 60
        }));
        annotationsLayer.add(new Konva.Text({
          x: snapIndicator.x + 200,
          y: snapIndicator.y - 100,
          text: 'Ponto Médio',
          fontSize: 220,
          fontFamily: 'monospace',
          fill: '#22c55e'
        }));
      } else if (snapIndicator.type === 'center') {
        // Círculo com cruz (AutoCAD Center)
        annotationsLayer.add(new Konva.Circle({
          x: snapIndicator.x,
          y: snapIndicator.y,
          radius: 180,
          stroke: '#22c55e',
          strokeWidth: 60
        }));
        annotationsLayer.add(new Konva.Text({
          x: snapIndicator.x + 200,
          y: snapIndicator.y - 100,
          text: 'Centro',
          fontSize: 220,
          fontFamily: 'monospace',
          fill: '#22c55e'
        }));
      }
    }

    // 5. VETOR DE MODIFICAÇÃO (MOVER / COPIAR)
    if (modifyBasePoint) {
      annotationsLayer.add(new Konva.Line({
        points: [modifyBasePoint.x, modifyBasePoint.y, cursorWorldPos.x, cursorWorldPos.y],
        stroke: '#a855f7',
        strokeWidth: 80,
        dash: [160, 80]
      }));
      const distM = (Math.hypot(cursorWorldPos.x - modifyBasePoint.x, cursorWorldPos.y - modifyBasePoint.y) / 1000).toFixed(2);
      annotationsLayer.add(new Konva.Text({
        x: (modifyBasePoint.x + cursorWorldPos.x) / 2 + 100,
        y: (modifyBasePoint.y + cursorWorldPos.y) / 2 - 200,
        text: `Δ: ${distM} m`,
        fontSize: 260,
        fontFamily: 'monospace',
        fill: '#c084fc'
      }));
    }

    annotationsLayer.batchDraw();
  }, [
    activeTool,
    measurePointA,
    measurePointB,
    calibPointA,
    calibPointB,
    cursorWorldPos,
    cadDrawPoints,
    cadActiveStrokeWidth,
    snapIndicator,
    modifyBasePoint
  ]);

  // =========================================================================
  // STAGE POINTER / ZOOM / PAN EVENTS
  // =========================================================================
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Zoom via Scroll Wheel
    const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale
      };

      const factor = e.evt.deltaY < 0 ? 1.15 : 0.85;
      const newScale = Math.min(0.35, Math.max(0.002, oldScale * factor));

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      setZoom(newScale);
      setPan({ x: Math.round(newPos.x), y: Math.round(newPos.y) });
      stage.batchDraw();
    };

    // Mouse Move (Rastreia coordenadas reais do mundo CAD em mm, com Ortho e OSNAP)
    const onMouseMove = () => {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      let world = screenToWorld(pointer.x, pointer.y);

      // Aplica Ortho Mode (F8)
      if (orthoMode && cadDrawPoints.length > 0) {
        const lastPt = cadDrawPoints[cadDrawPoints.length - 1];
        const dx = Math.abs(world.x - lastPt.x);
        const dy = Math.abs(world.y - lastPt.y);
        if (dx > dy) {
          world = { x: world.x, y: lastPt.y };
        } else {
          world = { x: lastPt.x, y: world.y };
        }
      }

      // Detecção de OSNAP (F3)
      let snapped: { x: number; y: number; type: 'end' | 'mid' | 'center' } | null = null;
      if (osnapEnabled) {
        const currentScale = stage.scaleX();
        const snapDistMm = 24 / currentScale;

        // Verifica entidades CAD
        const entities = activeFloor.cadEntities || [];
        for (const ent of entities) {
          for (const pt of ent.points) {
            if (Math.hypot(world.x - pt.x, world.y - pt.y) < snapDistMm) {
              snapped = { x: pt.x, y: pt.y, type: 'end' };
              break;
            }
          }
          if (snapped) break;

          for (let i = 0; i < ent.points.length - 1; i++) {
            const mid = {
              x: Math.round((ent.points[i].x + ent.points[i + 1].x) / 2),
              y: Math.round((ent.points[i].y + ent.points[i + 1].y) / 2)
            };
            if (Math.hypot(world.x - mid.x, world.y - mid.y) < snapDistMm) {
              snapped = { x: mid.x, y: mid.y, type: 'mid' };
              break;
            }
          }
          if (snapped) break;

          if (ent.type === 'circle' || ent.type === 'arc') {
            const center = ent.points[0];
            if (center && Math.hypot(world.x - center.x, world.y - center.y) < snapDistMm) {
              snapped = { x: center.x, y: center.y, type: 'center' };
              break;
            }
          }
        }

        // Verifica símbolos colocados
        if (!snapped) {
          for (const s of activeFloor.placedSymbols) {
            if (Math.hypot(world.x - s.x, world.y - s.y) < snapDistMm) {
              snapped = { x: s.x, y: s.y, type: 'center' };
              break;
            }
          }
        }
      }

      if (snapped) {
        world = { x: snapped.x, y: snapped.y };
        setSnapIndicator(snapped);
      } else {
        setSnapIndicator(null);
      }

      setCursorWorldPos(world);
    };

    // Mouse Down
    const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (contextMenu) setContextMenu(null);

      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      let worldPos = screenToWorld(pointer.x, pointer.y);

      // Aplica snap indicator se ativo
      if (snapIndicator) {
        worldPos = { x: snapIndicator.x, y: snapIndicator.y };
      }

      // Pan com botão do meio ou ferramenta pan
      if (e.evt.button === 1 || activeTool === 'pan' || e.evt.shiftKey || e.evt.altKey) {
        stage.startDrag();
        return;
      }

      if (e.evt.button === 0) {
        // ==========================================
        // 1. FERRAMENTAS DE DESENHO CAD
        // ==========================================
        if (activeTool === 'draw_line') {
          if (cadDrawPoints.length === 0) {
            setCadDrawPoints([worldPos]);
            setPromptMessage('Linha: Especifique o próximo ponto (Enter para finalizar, Esc para cancelar):');
          } else {
            const p0 = cadDrawPoints[cadDrawPoints.length - 1];
            const newEntity: CADEntity = {
              id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              floor_id: activeFloor.id,
              type: 'line',
              points: [p0, worldPos],
              strokeWidth: cadActiveStrokeWidth,
              color: cadActiveColor,
              layer: cadActiveLayerId,
              createdAt: new Date().toISOString()
            };
            commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            setCadDrawPoints([worldPos]); // Continua cadeia AutoCAD
            setPromptMessage('Linha criada. Especifique o próximo ponto ou pressione Enter para concluir.');
          }
          return;
        }

        if (activeTool === 'draw_polyline') {
          if (cadDrawPoints.length >= 2) {
            const p0 = cadDrawPoints[0];
            const distToFirst = Math.hypot(worldPos.x - p0.x, worldPos.y - p0.y);
            if (distToFirst < 600) {
              const newEntity: CADEntity = {
                id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                floor_id: activeFloor.id,
                type: 'polyline',
                points: [...cadDrawPoints, p0],
                isClosed: true,
                strokeWidth: cadActiveStrokeWidth,
                color: cadActiveColor,
                layer: cadActiveLayerId,
                createdAt: new Date().toISOString()
              };
              commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
              setCadDrawPoints([]);
              setPromptMessage('Polilinha fechada com sucesso.');
              return;
            }
          }
          setCadDrawPoints((prev) => [...prev, worldPos]);
          setPromptMessage(`Vértice ${cadDrawPoints.length + 1} adicionado. Pressione Enter para concluir.`);
          return;
        }

        if (activeTool === 'draw_rect') {
          if (cadDrawPoints.length === 0) {
            setCadDrawPoints([worldPos]);
            setPromptMessage('Retângulo: Especifique o canto oposto:');
          } else {
            const p0 = cadDrawPoints[0];
            const newEntity: CADEntity = {
              id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              floor_id: activeFloor.id,
              type: 'rect',
              points: [p0, worldPos],
              strokeWidth: cadActiveStrokeWidth,
              color: cadActiveColor,
              layer: cadActiveLayerId,
              createdAt: new Date().toISOString()
            };
            commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            setCadDrawPoints([]);
            setPromptMessage('Retângulo criado.');
          }
          return;
        }

        if (activeTool === 'draw_circle') {
          if (cadDrawPoints.length === 0) {
            setCadDrawPoints([worldPos]);
            setPromptMessage('Círculo: Especifique o raio através de um segundo ponto:');
          } else {
            const center = cadDrawPoints[0];
            const radius = Math.hypot(worldPos.x - center.x, worldPos.y - center.y);
            const newEntity: CADEntity = {
              id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              floor_id: activeFloor.id,
              type: 'circle',
              points: [center, worldPos],
              radius,
              strokeWidth: cadActiveStrokeWidth,
              color: cadActiveColor,
              layer: cadActiveLayerId,
              createdAt: new Date().toISOString()
            };
            commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            setCadDrawPoints([]);
            setPromptMessage(`Círculo com Raio ${(radius / 1000).toFixed(2)}m criado.`);
          }
          return;
        }

        if (activeTool === 'draw_arc') {
          if (cadDrawPoints.length === 0) {
            setCadDrawPoints([worldPos]);
            setPromptMessage('Arco: Especifique o ponto de início da curva:');
          } else if (cadDrawPoints.length === 1) {
            setCadDrawPoints((prev) => [...prev, worldPos]);
            setPromptMessage('Arco: Especifique o ponto final da curva:');
          } else {
            const center = cadDrawPoints[0];
            const startPt = cadDrawPoints[1];
            const radius = Math.hypot(startPt.x - center.x, startPt.y - center.y);
            const startAngle = (Math.atan2(startPt.y - center.y, startPt.x - center.x) * 180) / Math.PI;
            const endAngle = (Math.atan2(worldPos.y - center.y, worldPos.x - center.x) * 180) / Math.PI;
            const newEntity: CADEntity = {
              id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              floor_id: activeFloor.id,
              type: 'arc',
              points: [center, startPt, worldPos],
              radius,
              startAngle,
              endAngle,
              strokeWidth: cadActiveStrokeWidth,
              color: cadActiveColor,
              layer: cadActiveLayerId,
              createdAt: new Date().toISOString()
            };
            commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            setCadDrawPoints([]);
            setPromptMessage('Arco criado com sucesso.');
          }
          return;
        }

        if (activeTool === 'draw_ellipse') {
          if (cadDrawPoints.length === 0) {
            setCadDrawPoints([worldPos]);
            setPromptMessage('Elipse: Especifique a extremidade do primeiro raio:');
          } else if (cadDrawPoints.length === 1) {
            setCadDrawPoints((prev) => [...prev, worldPos]);
            setPromptMessage('Elipse: Especifique o segundo raio:');
          } else {
            const center = cadDrawPoints[0];
            const pt1 = cadDrawPoints[1];
            const radiusX = Math.hypot(pt1.x - center.x, pt1.y - center.y);
            const radiusY = Math.hypot(worldPos.x - center.x, worldPos.y - center.y);
            const newEntity: CADEntity = {
              id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              floor_id: activeFloor.id,
              type: 'ellipse',
              points: [center, pt1, worldPos],
              radiusX,
              radiusY,
              strokeWidth: cadActiveStrokeWidth,
              color: cadActiveColor,
              layer: cadActiveLayerId,
              createdAt: new Date().toISOString()
            };
            commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            setCadDrawPoints([]);
            setPromptMessage('Elipse criada com sucesso.');
          }
          return;
        }

        if (activeTool === 'draw_polygon') {
          if (cadDrawPoints.length === 0) {
            setCadDrawPoints([worldPos]);
            setPromptMessage('Polígono: Especifique o raio circunscrito:');
          } else {
            const center = cadDrawPoints[0];
            const radius = Math.hypot(worldPos.x - center.x, worldPos.y - center.y);
            const newEntity: CADEntity = {
              id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              floor_id: activeFloor.id,
              type: 'polygon',
              points: [center, worldPos],
              radius,
              sides: 6,
              strokeWidth: cadActiveStrokeWidth,
              color: cadActiveColor,
              layer: cadActiveLayerId,
              createdAt: new Date().toISOString()
            };
            commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            setCadDrawPoints([]);
            setPromptMessage('Polígono regular criado com sucesso.');
          }
          return;
        }

        if (activeTool === 'draw_point') {
          const newEntity: CADEntity = {
            id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            floor_id: activeFloor.id,
            type: 'point',
            points: [worldPos],
            strokeWidth: cadActiveStrokeWidth,
            color: cadActiveColor,
            layer: cadActiveLayerId,
            createdAt: new Date().toISOString()
          };
          commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
          setPromptMessage('Ponto CAD inserido.');
          return;
        }

        if (activeTool === 'text') {
          const note = window.prompt('Digite a anotação técnica CAD:', 'TEXTO TÉCNICO');
          if (note && note.trim()) {
            const newEntity: CADEntity = {
              id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              floor_id: activeFloor.id,
              type: 'text',
              points: [worldPos],
              text: note.trim(),
              fontSize: 350,
              strokeWidth: 100,
              color: cadActiveColor,
              layer: cadActiveLayerId,
              createdAt: new Date().toISOString()
            };
            commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            setPromptMessage(`Texto "${note}" inserido.`);
          }
          return;
        }

        if (activeTool === 'draw_hatch') {
          if (cadDrawPoints.length >= 2) {
            const p0 = cadDrawPoints[0];
            const distToFirst = Math.hypot(worldPos.x - p0.x, worldPos.y - p0.y);
            if (distToFirst < 600) {
              const newEntity: CADEntity = {
                id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                floor_id: activeFloor.id,
                type: 'hatch',
                points: [...cadDrawPoints, p0],
                fill: cadActiveColor,
                fillOpacity: 0.35,
                strokeWidth: cadActiveStrokeWidth,
                color: cadActiveColor,
                layer: cadActiveLayerId,
                createdAt: new Date().toISOString()
              };
              commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
              setCadDrawPoints([]);
              setPromptMessage('Hachura / Preenchimento inserido com sucesso.');
              return;
            }
          }
          setCadDrawPoints((prev) => [...prev, worldPos]);
          setPromptMessage(`Hachura: Vértice ${cadDrawPoints.length + 1}. Pressione Enter para fechar.`);
          return;
        }

        if (activeTool === 'dimension_linear' || activeTool === 'dimension_aligned') {
          if (cadDrawPoints.length === 0) {
            setCadDrawPoints([worldPos]);
            setPromptMessage('Cota: Especifique a primeira extremidade:');
          } else if (cadDrawPoints.length === 1) {
            setCadDrawPoints((prev) => [...prev, worldPos]);
            setPromptMessage('Cota: Especifique o deslocamento da linha de cota:');
          } else {
            const p0 = cadDrawPoints[0];
            const p1 = cadDrawPoints[1];
            const distM = (Math.hypot(p1.x - p0.x, p1.y - p0.y) / 1000).toFixed(2);
            const newEntity: CADEntity = {
              id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              floor_id: activeFloor.id,
              type: activeTool,
              points: [p0, p1, worldPos],
              strokeWidth: cadActiveStrokeWidth,
              color: cadActiveColor,
              layer: cadActiveLayerId,
              dimensionText: `${distM} m`,
              createdAt: new Date().toISOString()
            };
            commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            setCadDrawPoints([]);
            setPromptMessage(`Cota de ${distM} m inserida.`);
          }
          return;
        }

        if (activeTool === 'dimension_radial') {
          if (cadDrawPoints.length === 0) {
            setCadDrawPoints([worldPos]);
            setPromptMessage('Cota Radial: Especifique o centro:');
          } else {
            const center = cadDrawPoints[0];
            const radM = (Math.hypot(worldPos.x - center.x, worldPos.y - center.y) / 1000).toFixed(2);
            const newEntity: CADEntity = {
              id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              floor_id: activeFloor.id,
              type: 'dimension_radial',
              points: [center, worldPos],
              strokeWidth: cadActiveStrokeWidth,
              color: cadActiveColor,
              layer: cadActiveLayerId,
              dimensionText: `R = ${radM} m`,
              createdAt: new Date().toISOString()
            };
            commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            setCadDrawPoints([]);
            setPromptMessage(`Cota Radial R = ${radM} m inserida.`);
          }
          return;
        }

        if (activeTool === 'leader') {
          if (cadDrawPoints.length === 0) {
            setCadDrawPoints([worldPos]);
            setPromptMessage('Líder: Especifique o ponto da seta:');
          } else if (cadDrawPoints.length === 1) {
            setCadDrawPoints((prev) => [...prev, worldPos]);
            setPromptMessage('Líder: Especifique a linha horizontal de pouso:');
          } else {
            const p0 = cadDrawPoints[0];
            const p1 = cadDrawPoints[1];
            const note = window.prompt('Texto da Anotação do Líder:', 'Alarme de Incêndio');
            if (note) {
              const newEntity: CADEntity = {
                id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                floor_id: activeFloor.id,
                type: 'leader',
                points: [p0, p1, worldPos],
                strokeWidth: cadActiveStrokeWidth,
                color: cadActiveColor,
                layer: cadActiveLayerId,
                text: note,
                createdAt: new Date().toISOString()
              };
              commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
            }
            setCadDrawPoints([]);
            setPromptMessage('Líder inserido.');
          }
          return;
        }

        // ==========================================
        // 2. FERRAMENTAS DE MODIFICAÇÃO CAD
        // ==========================================
        if (activeTool === 'modify_move') {
          if (!modifyBasePoint) {
            setModifyBasePoint(worldPos);
            setPromptMessage('Mover: Especifique o segundo ponto de deslocamento:');
          } else {
            const dx = worldPos.x - modifyBasePoint.x;
            const dy = worldPos.y - modifyBasePoint.y;
            if (selectedCADEntityId) {
              const updated = (activeFloor.cadEntities || []).map((e) => {
                if (e.id !== selectedCADEntityId) return e;
                return {
                  ...e,
                  points: e.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }))
                };
              });
              commitCADEntities(updated);
              showToast('Entidade movida com sucesso.');
            } else if (selectedPlacedSymbolId) {
              const sym = activeFloor.placedSymbols.find((s) => s.id === selectedPlacedSymbolId);
              if (sym) {
                onUpdatePlacedSymbol({ ...sym, x: sym.x + dx, y: sym.y + dy });
                onTriggerAutosave();
                showToast('Símbolo movido.');
              }
            }
            setModifyBasePoint(null);
            setPromptMessage('Mover concluído.');
          }
          return;
        }

        if (activeTool === 'modify_copy') {
          if (!modifyBasePoint) {
            setModifyBasePoint(worldPos);
            setPromptMessage('Copiar: Especifique o ponto de destino:');
          } else {
            const dx = worldPos.x - modifyBasePoint.x;
            const dy = worldPos.y - modifyBasePoint.y;
            if (selectedCADEntityId) {
              const entity = (activeFloor.cadEntities || []).find((e) => e.id === selectedCADEntityId);
              if (entity) {
                const copy: CADEntity = {
                  ...entity,
                  id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  points: entity.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
                  createdAt: new Date().toISOString()
                };
                commitCADEntities([...(activeFloor.cadEntities || []), copy]);
                showToast('Entidade duplicada.');
              }
            } else if (selectedPlacedSymbolId) {
              const sym = activeFloor.placedSymbols.find((s) => s.id === selectedPlacedSymbolId);
              if (sym) {
                const copy: PlacedSymbol = {
                  ...sym,
                  id: `OBJ-${Date.now().toString().slice(-6)}`,
                  x: sym.x + dx,
                  y: sym.y + dy
                };
                onAddPlacedSymbol(copy);
                onTriggerAutosave();
                showToast('Símbolo duplicado.');
              }
            }
            setModifyBasePoint(null);
            setPromptMessage('Copiar concluído.');
          }
          return;
        }

        // Ferramenta Inserir Símbolo
        if (activeTool === 'insert_symbol' && selectedSymbolIdToInsert) {
          const symbolDef = symbolsCatalog.find((s) => s.id === selectedSymbolIdToInsert);
          if (symbolDef) {
            const newPlaced: PlacedSymbol = {
              id: `OBJ-${Date.now().toString().slice(-6)}`,
              symbol_id: symbolDef.id,
              project_id: project.id,
              floor_id: activeFloor.id,
              x: worldPos.x,
              y: worldPos.y,
              scale: 1,
              width: symbolDef.largura,
              height: symbolDef.altura,
              rotation: 0,
              layer: symbolDef.categoria === 'ORIENTACAO_SALVAMENTO' ? 'L-SAI' :
                     symbolDef.categoria === 'EQUIPAMENTOS' ? 'L-EXT' :
                     symbolDef.categoria === 'ALERTA' ? 'L-ALE' :
                     symbolDef.categoria === 'PROIBICAO' ? 'L-PRO' : 'L-SIN',
              quantity: 1,
              supplier_id: selectedSupplierForInsert || symbolDef.fornecedor_id || 'FORN-001',
              manufacturer_id: symbolDef.fabricante_id || 'FAB-001',
              product_id: symbolDef.produto_id || 'PROD-250150-20-SYG',
              unit_price: selectedPriceForInsert !== null && selectedPriceForInsert !== undefined
                ? selectedPriceForInsert
                : symbolDef.preco_padrao,
              notes: `Locado via CAD Konva em ${new Date().toLocaleDateString('pt-BR')}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            onAddPlacedSymbol(newPlaced);
            onSelectPlacedSymbol(newPlaced.id);
            onTriggerAutosave();
            showToast(`Placa ${symbolDef.codigo_normativo} (${symbolDef.nome}) inserida!`);
          }
          return;
        }

        // Ferramenta Calibrar
        if (activeTool === 'calibrate') {
          if (!calibPointA) {
            setCalibPointA(worldPos);
            showToast('Ponto Inicial (A) fixado! Clique no Ponto Final (B) da cota de referência.');
          } else if (!calibPointB) {
            setCalibPointB(worldPos);
            const measuredDistM = Math.hypot(worldPos.x - calibPointA.x, worldPos.y - calibPointA.y) / 1000;
            setCalibDistanceInput(measuredDistM > 0 ? measuredDistM.toFixed(2) : '5.00');
            setShowCalibModal(true);
          }
          return;
        }

        // Ferramenta Medir
        if (activeTool === 'measure') {
          if (!measurePointA) {
            setMeasurePointA(worldPos);
            setMeasurePointB(worldPos);
          } else {
            setMeasurePointB(worldPos);
          }
          return;
        }

        // Clique no vazio desmarca
        if (activeTool === 'select' && e.target === stage) {
          onSelectPlacedSymbol(null);
          setSelectedCADEntityId(null);
          setModifyBasePoint(null);
        }
      }
    };

    stage.on('wheel', onWheel);
    stage.on('mousemove', onMouseMove);
    stage.on('mousedown', onMouseDown);

    return () => {
      stage.off('wheel', onWheel);
      stage.off('mousemove', onMouseMove);
      stage.off('mousedown', onMouseDown);
    };
  }, [
    activeTool,
    selectedSymbolIdToInsert,
    symbolsCatalog,
    project.id,
    activeFloor.id,
    activeFloor.placedSymbols,
    activeFloor.cadEntities,
    calibPointA,
    calibPointB,
    measurePointA,
    contextMenu,
    screenToWorld,
    onAddPlacedSymbol,
    onSelectPlacedSymbol,
    onTriggerAutosave,
    selectedSupplierForInsert,
    selectedPriceForInsert,
    cadDrawPoints,
    cadActiveStrokeWidth,
    cadActiveColor,
    cadActiveLayerId,
    orthoMode,
    osnapEnabled,
    snapIndicator,
    modifyBasePoint,
    selectedCADEntityId,
    selectedPlacedSymbolId,
    commitCADEntities,
    onUpdatePlacedSymbol
  ]);

  // Aplica Calibração de Escala (2 Pontos -> Dimensão Real)
  const handleApplyCalibration = () => {
    if (!calibPointA || !calibPointB) return;
    const realDistM = parseFloat(calibDistanceInput);
    if (isNaN(realDistM) || realDistM <= 0) {
      alert('Informe uma distância real válida em metros (ex: 5.00)');
      return;
    }

    const currentDistMm = Math.hypot(calibPointB.x - calibPointA.x, calibPointB.y - calibPointA.y);
    if (currentDistMm <= 0) return;

    const scaleFactor = (realDistM * 1000) / currentDistMm;
    const newWidthM = Number(((activeFloor.widthMeters || 40) * scaleFactor).toFixed(2));
    const newHeightM = Number(((activeFloor.heightMeters || 28) * scaleFactor).toFixed(2));

    onUpdateFloor({
      ...activeFloor,
      widthMeters: newWidthM,
      heightMeters: newHeightM,
      calibrated: true,
      realDistanceMeters: realDistM
    }, true);

    setShowCalibModal(false);
    setCalibPointA(null);
    setCalibPointB(null);
    setActiveTool('select');
    showToast(`Escala calibrada com sucesso! Dimensões atualizadas: ${newWidthM}m × ${newHeightM}m.`);
    setTimeout(() => handleFitExtents('contain'), 150);
  };

  // Clone Symbol
  const handleDuplicateSymbol = () => {
    if (!selectedSymbol) return;
    const cloned: PlacedSymbol = {
      ...selectedSymbol,
      id: `OBJ-${Date.now().toString().slice(-6)}`,
      x: selectedSymbol.x + 800,
      y: selectedSymbol.y + 800,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onAddPlacedSymbol(cloned);
    onSelectPlacedSymbol(cloned.id);
    onTriggerAutosave();
    showToast('Símbolo duplicado com sucesso!');
  };

  // Rotate Symbol 90°
  const handleRotateSymbol = () => {
    if (!selectedSymbol) return;
    const nextRot = ((selectedSymbol.rotation || 0) + 90) % 360;
    onUpdatePlacedSymbol({ ...selectedSymbol, rotation: nextRot });
    onTriggerAutosave();
  };

  // Atalhos de Teclado Globais (AutoCAD Pro Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando em campos de texto
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Enter: Finaliza polilinha ou hachura
      if (e.key === 'Enter') {
        if (activeTool === 'draw_polyline' && cadDrawPoints.length >= 2) {
          e.preventDefault();
          const newEntity: CADEntity = {
            id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            floor_id: activeFloor.id,
            type: 'polyline',
            points: [...cadDrawPoints],
            isClosed: false,
            strokeWidth: cadActiveStrokeWidth,
            color: cadActiveColor,
            layer: cadActiveLayerId,
            createdAt: new Date().toISOString()
          };
          commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
          setCadDrawPoints([]);
          setPromptMessage('Polilinha finalizada.');
        } else if (activeTool === 'draw_hatch' && cadDrawPoints.length >= 3) {
          e.preventDefault();
          const p0 = cadDrawPoints[0];
          const newEntity: CADEntity = {
            id: `CAD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            floor_id: activeFloor.id,
            type: 'hatch',
            points: [...cadDrawPoints, p0],
            fill: cadActiveColor,
            fillOpacity: 0.35,
            strokeWidth: cadActiveStrokeWidth,
            color: cadActiveColor,
            layer: cadActiveLayerId,
            createdAt: new Date().toISOString()
          };
          commitCADEntities([...(activeFloor.cadEntities || []), newEntity]);
          setCadDrawPoints([]);
          setPromptMessage('Hachura finalizada.');
        } else if (activeTool === 'draw_line') {
          setCadDrawPoints([]);
          setPromptMessage('Linha finalizada.');
        }
        return;
      }

      // Escape: Cancela ação atual ou limpa seleção
      if (e.key === 'Escape') {
        e.preventDefault();
        setCadDrawPoints([]);
        setModifyBasePoint(null);
        setSelectedCADEntityId(null);
        onSelectPlacedSymbol(null);
        setActiveTool('select');
        setPromptMessage('Comando cancelado.');
        return;
      }

      // Delete ou Backspace: Exclui item selecionado
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCADEntityId || selectedPlacedSymbolId) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      // F3: Alterna OSNAP
      if (e.key === 'F3') {
        e.preventDefault();
        setOsnapEnabled((prev) => {
          showToast(`OSNAP (Precisão): ${!prev ? 'ATIVADO' : 'DESATIVADO'}`);
          return !prev;
        });
        return;
      }

      // F8: Alterna Ortho Mode
      if (e.key === 'F8') {
        e.preventDefault();
        setOrthoMode((prev) => {
          showToast(`Ortho (Modo Ortogonal): ${!prev ? 'ATIVADO' : 'DESATIVADO'}`);
          return !prev;
        });
        return;
      }

      // F9: Alterna Grid Snap
      if (e.key === 'F9') {
        e.preventDefault();
        setGridSnap((prev) => {
          showToast(`Grid Snap: ${!prev ? 'ATIVADO' : 'DESATIVADO'}`);
          return !prev;
        });
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoCAD();
        } else {
          handleUndoCAD();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedoCAD();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTool,
    cadDrawPoints,
    cadActiveStrokeWidth,
    cadActiveColor,
    cadActiveLayerId,
    activeFloor,
    commitCADEntities,
    handleDeleteSelected,
    handleUndoCAD,
    handleRedoCAD,
    onSelectPlacedSymbol,
    selectedCADEntityId,
    selectedPlacedSymbolId,
    setActiveTool
  ]);

  return (
    <div 
      className="relative w-full h-full flex flex-col bg-[#090d16] select-none overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFileOver(true);
      }}
      onDragLeave={() => setIsDraggingFileOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFileOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleProcessImageFile(e.dataTransfer.files[0]);
        }
      }}
    >
      {/* Barra Ribbon Superior com todas as 12 Categorias do CAD 2D */}
      <CADDrawingRibbon
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        layers={project.layers}
        activeLayerId={cadActiveLayerId}
        onSelectLayer={setCadActiveLayerId}
        activeColor={cadActiveColor}
        onChangeColor={setCadActiveColor}
        activeStrokeWidth={cadActiveStrokeWidth}
        onChangeStrokeWidth={setCadActiveStrokeWidth}
        orthoMode={orthoMode}
        gridSnap={gridSnap}
        osnapEnabled={osnapEnabled}
        onToggleOrtho={() => setOrthoMode((o) => !o)}
        onToggleGridSnap={() => setGridSnap((g) => !g)}
        onToggleOsnap={() => setOsnapEnabled((s) => !s)}
        onDeleteSelected={handleDeleteSelected}
        onUndo={handleUndoCAD}
        onRedo={handleRedoCAD}
        onFitExtents={() => handleFitExtents('contain')}
      />

      {/* Área Central do Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
      {/* Hidden native input for plan file import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,.pdf,.dxf"
        className="hidden"
        onChange={handleNativeFileInputChange}
      />

      {/* Konva HTML5 Canvas Container */}
      <div 
        ref={containerRef} 
        id="cad-canvas-konva-container"
        className="w-full h-full cursor-crosshair"
      />

      {/* Crosshair Overlay (Eixos finos acompanham o mouse) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bg-sky-500/20 w-full h-[1px]"
          style={{ top: worldToScreen(0, cursorWorldPos.y).y }}
        />
        <div
          className="absolute bg-sky-500/20 h-full w-[1px]"
          style={{ left: worldToScreen(cursorWorldPos.x, 0).x }}
        />
      </div>

      {/* Drag & Drop Visual Dropzone Overlay */}
      {isDraggingFileOver && (
        <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-sm border-4 border-dashed border-sky-400 z-50 flex flex-col items-center justify-center text-white pointer-events-none">
          <Upload className="w-16 h-16 text-sky-400 animate-bounce mb-3" />
          <h2 className="text-xl font-bold">Solte o arquivo da Planta aqui</h2>
          <p className="text-sm text-sky-200 mt-1">PNG, JPG, SVG, PDF ou DXF arquitetônico</p>
        </div>
      )}

      {/* Onboarding Clean Slate - Quando nenhuma planta foi carregada no pavimento */}
      {!activeFloor.floorPlanUrl && (
        <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-20">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl pointer-events-auto space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Nenhuma Planta de Fundo</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Comece do zero importando a planta baixa arquitetônica para alocar os símbolos e gerar o projeto de emergência.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-[11px] font-mono text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-semibold text-sky-400">PDF</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-semibold text-purple-400">DXF CAD</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-semibold text-emerald-400">SVG</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-semibold text-amber-400">PNG / JPG</span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950 transition active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" /> Inserir / Importar Planta Baixa
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Ou arraste e solte o arquivo da planta diretamente aqui na tela
            </p>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notificationToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-sky-500/80 rounded-xl px-4 py-2 text-white shadow-2xl flex items-center gap-2.5 z-40 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Top Floating Viewport Toolbar */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-2xl z-30">
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Inserir Imagem ou Planta Arquitetônica (PNG, JPG, PDF, DXF, SVG)"
          className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
        >
          <Upload className="w-3.5 h-3.5" /> Inserir Planta
        </button>

        <button
          onClick={() => setShowPlanControls(!showPlanControls)}
          title="Controle de Opacidade e Ajustes da Planta"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
            showPlanControls
              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" /> Camada Fundo ({Math.round(realtimeOpacity * 100)}%)
        </button>

        <div className="w-[1px] h-5 bg-slate-800 my-auto" />

        <button
          onClick={() => {
            setActiveTool('calibrate');
            setCalibPointA(null);
            setCalibPointB(null);
            showToast('Clique no Ponto A e depois no Ponto B para definir a escala.');
          }}
          title="Escalonar Planta (2 Pontos -> Dimensão Real)"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
            activeTool === 'calibrate'
              ? 'bg-sky-500 border-sky-300 text-white shadow-lg'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Ruler className="w-3.5 h-3.5 text-sky-400" /> Escalonar (2 Pontos)
        </button>

        <div className="w-[1px] h-5 bg-slate-800 my-auto" />

        <button
          onClick={() => {
            if (stageRef.current) {
              const newZ = Math.min(0.35, stageRef.current.scaleX() * 1.25);
              stageRef.current.scale({ x: newZ, y: newZ });
              stageRef.current.batchDraw();
              setZoom(newZ);
            }
          }}
          title="Zoom In (+)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (stageRef.current) {
              const newZ = Math.max(0.002, stageRef.current.scaleX() * 0.8);
              stageRef.current.scale({ x: newZ, y: newZ });
              stageRef.current.batchDraw();
              setZoom(newZ);
            }
          }}
          title="Zoom Out (-)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleFitExtents('contain')}
          title="Centralizar e Enquadrar 100% da Planta na Área de Trabalho"
          className="px-2 py-1 text-sky-400 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-xs font-bold"
        >
          <Maximize2 className="w-3.5 h-3.5" /> 100% Tela
        </button>
      </div>

      {/* Floating Floor Plan Control Dock (Controle de Opacidade em Tempo Real) */}
      <div className="absolute bottom-4 left-4 z-30 max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
        <div className="p-2.5 px-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              {activeFloor.floorPlanUrl ? 'Planta de Fundo' : 'Planta (Vazia)'}
            </span>
            {activeFloor.floorPlanUrl ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {activeFloor.floorPlanType?.toUpperCase() || 'IMAGEM'}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Sem arquivo
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {activeFloor.floorPlanUrl && (
              <>
                <button
                  onClick={() => handleTogglePlanVisibility()}
                  title={activeFloor.floorPlanVisible === false ? "Mostrar Planta" : "Ocultar Planta"}
                  className={`p-1 rounded transition ${activeFloor.floorPlanVisible === false ? 'text-slate-500 hover:text-white' : 'text-sky-400 hover:text-sky-300'}`}
                >
                  {activeFloor.floorPlanVisible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleTogglePlanLock()}
                  title={activeFloor.floorPlanLocked ? "Planta Travada" : "Planta Destravada"}
                  className={`p-1 rounded transition ${activeFloor.floorPlanLocked ? 'text-amber-400 hover:text-amber-300' : 'text-slate-400 hover:text-white'}`}
                >
                  {activeFloor.floorPlanLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </>
            )}
            <button
              onClick={() => setShowPlanControls(!showPlanControls)}
              title={showPlanControls ? "Recolher Painel" : "Expandir Painel"}
              className="p-1 text-slate-400 hover:text-white rounded transition"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPlanControls ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {showPlanControls && (
          <div className="p-3 space-y-2.5 text-xs">
            {activeFloor.floorPlanUrl ? (
              <>
                {/* Realtime Opacity Slider & Quick Presets */}
                <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Opacidade da Planta:
                    </span>
                    <span className="font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800 text-xs">
                      {Math.round(realtimeOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={realtimeOpacity}
                    onChange={(e) => handleRealtimeOpacityChange(parseFloat(e.target.value))}
                    onMouseUp={(e) => handleCommitOpacity(parseFloat((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => handleCommitOpacity(parseFloat((e.target as HTMLInputElement).value))}
                    className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {[
                      { val: 0.15, label: '15% Suave' },
                      { val: 0.35, label: '35% Médio' },
                      { val: 0.65, label: '65% Nítido' },
                      { val: 1.0, label: '100% Total' }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => handleCommitOpacity(preset.val)}
                        className={`flex-1 py-1 text-[10px] font-mono rounded border transition ${
                          Math.abs(realtimeOpacity - preset.val) < 0.05
                            ? 'bg-sky-600 border-sky-400 text-white font-bold shadow'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Centralizar & Enquadrar 100% */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFitExtents('contain')}
                    title="Ajustar 100% da planta à tela mantendo proporção total"
                    className="py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Enquadrar 100%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFitExtents('fill')}
                    title="Preencher toda a área de trabalho"
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Preenchimento Total
                  </button>
                </div>

                {/* Mover e Alinhar Planta */}
                <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Move className="w-3 h-3 text-purple-400" /> Alinhar Deslocamento:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTogglePlanInvert()}
                      title="Inverter cores da planta (ótimo para fundos pretos CAD DWG)"
                      className={`p-1 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                        activeFloor.floorPlanInvert
                          ? 'bg-amber-600 border-amber-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Contrast className="w-3 h-3" /> Inverter Cores
                    </button>
                  </div>

                  {/* Nudge D-pad */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="grid grid-cols-3 gap-1 w-24">
                      <div />
                      <button
                        type="button"
                        onClick={() => handleNudgePlan(0, -500)}
                        title="Mover Cima (0.5m)"
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <div />
                      <button
                        type="button"
                        onClick={() => handleNudgePlan(-500, 0)}
                        title="Mover Esquerda (0.5m)"
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPlanOffset()}
                        title="Zerar Deslocamento (0,0)"
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded flex items-center justify-center text-[9px] font-mono"
                      >
                        0,0
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgePlan(500, 0)}
                        title="Mover Direita (0.5m)"
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <div />
                      <button
                        type="button"
                        onClick={() => handleNudgePlan(0, 500)}
                        title="Mover Baixo (0.5m)"
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <div />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono text-right">
                      <div>X: {activeFloor.floorPlanOffsetX || 0} mm</div>
                      <div>Y: {activeFloor.floorPlanOffsetY || 0} mm</div>
                      <div>Dim: {activeFloor.widthMeters}m × {activeFloor.heightMeters}m</div>
                    </div>
                  </div>
                </div>

                {/* Ações de Substituição e Limpeza */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-400" /> Trocar Planta
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePlan}
                    className="py-1.5 px-2.5 bg-red-950/70 hover:bg-red-900/80 text-red-300 border border-red-800/80 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    title="Remover planta e começar do zero"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" /> Limpar
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-slate-400">
                  Nenhuma planta baixa carregada neste pavimento.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow transition"
                >
                  <Upload className="w-3.5 h-3.5" /> Inserir Planta Arquitetônica
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Symbol Quick Operations Floating Bar */}
      {selectedSymbol && (
        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-sky-500/80 rounded-xl p-1.5 shadow-2xl">
          <div className="px-2 py-1 bg-slate-950 rounded text-xs font-mono font-bold text-sky-400 border border-slate-800">
            {selectedSymbol.id}
          </div>
          <button
            onClick={handleRotateSymbol}
            title="Girar 90°"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDuplicateSymbol}
            title="Duplicar Símbolo"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowArrayModal(true)}
            title="Matriz Linear (Distribuir N placas a cada X metros)"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-lg transition"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenProperties()}
            title="Propriedades e Orçamento"
            className="px-2 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition"
          >
            Propriedades
          </button>
          <button
            onClick={() => {
              onDeletePlacedSymbol(selectedSymbol.id);
              onSelectPlacedSymbol(null);
              onTriggerAutosave();
            }}
            title="Excluir Símbolo (Del)"
            className="p-1.5 bg-red-950/80 hover:bg-red-800 text-red-300 hover:text-white rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs w-48 space-y-1 animate-in fade-in zoom-in-95"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleRotateSymbol();
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center gap-2"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" /> Girar 90°
          </button>
          <button
            onClick={() => {
              handleDuplicateSymbol();
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" /> Duplicar
          </button>
          <button
            onClick={() => {
              setShowArrayModal(true);
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center gap-2"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> Matriz Linear...
          </button>
          <button
            onClick={() => {
              onOpenProperties();
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center gap-2"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" /> Propriedades / Preço
          </button>
          <div className="h-[1px] bg-slate-800 my-1" />
          <button
            onClick={() => {
              onDeletePlacedSymbol(contextMenu.symbolId);
              onSelectPlacedSymbol(null);
              setContextMenu(null);
              onTriggerAutosave();
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-red-950/80 text-red-400 rounded-lg flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" /> Excluir Símbolo
          </button>
        </div>
      )}

      {/* Modal de Calibração 2 Pontos */}
      {showCalibModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/80 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Ruler className="w-5 h-5 text-sky-400" />
                <span>Calibrar Escala da Planta (2 Pontos)</span>
              </div>
              <button
                onClick={() => {
                  setShowCalibModal(false);
                  setCalibPointA(null);
                  setCalibPointB(null);
                  setActiveTool('select');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Você selecionou <strong>Ponto Inicial (A)</strong> e <strong>Ponto Final (B)</strong> na planta.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="text-slate-400">Ponto A: ({calibPointA?.x} mm, {calibPointA?.y} mm)</div>
                <div className="text-slate-400">Ponto B: ({calibPointB?.x} mm, {calibPointB?.y} mm)</div>
              </div>
              <label className="block pt-2">
                <span className="font-semibold text-white">Qual a distância real entre esses dois pontos (em metros)?</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={calibDistanceInput}
                    onChange={(e) => setCalibDistanceInput(e.target.value)}
                    className="w-full bg-slate-950 border border-sky-500/80 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ex: 5.00"
                    autoFocus
                  />
                  <span className="text-sm font-bold text-sky-400">metros</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowCalibModal(false);
                  setCalibPointA(null);
                  setCalibPointB(null);
                  setActiveTool('select');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyCalibration}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Aplicar Calibração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Matriz Linear */}
      {showArrayModal && selectedSymbol && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                <span>Distribuir Matriz Linear (NBR 13434)</span>
              </div>
              <button onClick={() => setShowArrayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Quantidade de Cópias:</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={arrayCount}
                  onChange={(e) => setArrayCount(parseInt(e.target.value) || 2)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Distância Entre Placas (Metros):</label>
                <input
                  type="number"
                  step="1.0"
                  min="1.0"
                  value={arrayDistanceMeters}
                  onChange={(e) => setArrayDistanceMeters(parseFloat(e.target.value) || 15.0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Direção:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setArrayDirection('X')}
                    className={`py-1.5 rounded-lg border font-semibold ${
                      arrayDirection === 'X'
                        ? 'bg-sky-600 border-sky-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Horizontal (Eixo X)
                  </button>
                  <button
                    type="button"
                    onClick={() => setArrayDirection('Y')}
                    className={`py-1.5 rounded-lg border font-semibold ${
                      arrayDirection === 'Y'
                        ? 'bg-sky-600 border-sky-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Vertical (Eixo Y)
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowArrayModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const distMm = arrayDistanceMeters * 1000;
                  for (let i = 1; i < arrayCount; i++) {
                    const cloned: PlacedSymbol = {
                      ...selectedSymbol,
                      id: `OBJ-${Date.now().toString().slice(-6)}-${i}`,
                      x: arrayDirection === 'X' ? selectedSymbol.x + distMm * i : selectedSymbol.x,
                      y: arrayDirection === 'Y' ? selectedSymbol.y + distMm * i : selectedSymbol.y,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    onAddPlacedSymbol(cloned);
                  }
                  setShowArrayModal(false);
                  onTriggerAutosave();
                  showToast(`${arrayCount - 1} placas geradas na matriz com sucesso!`);
                }}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Criar Matriz
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Linha de Comando Profissional Padrão AutoCAD no Rodapé */}
      <CADCommandLine
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        cursorWorldPos={cursorWorldPos}
        zoom={zoom}
        orthoMode={orthoMode}
        gridSnap={gridSnap}
        osnapEnabled={osnapEnabled}
        onToggleOrtho={() => setOrthoMode((o) => !o)}
        onToggleGridSnap={() => setGridSnap((g) => !g)}
        onToggleOsnap={() => setOsnapEnabled((s) => !s)}
        onDeleteSelected={handleDeleteSelected}
        onUndo={handleUndoCAD}
        onRedo={handleRedoCAD}
        onFitExtents={() => handleFitExtents('contain')}
        promptMessage={promptMessage}
      />
    </div>
  );
};
