import React, { useState, useRef, useMemo } from 'react';
import { Project, Floor, SignSymbol, Supplier, ProductItem } from '../types/cad';
import { SymbolGlyph } from './SymbolGlyph';
import { CADSvgEntitiesRenderer } from './cad/CADSvgEntitiesRenderer';
import { ExportPdfConfigModal, PdfExportConfig } from './ExportPdfConfigModal';
import { 
  Printer, Download, FileText, Layers, CheckCircle2, 
  ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, Save,
  FileCode, Settings, Compass, Sparkles, Sliders, Check,
  Table, Building2, ShieldCheck, DollarSign, BookOpen, ChevronDown,
  FileCheck, ListFilter
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { DEFAULT_SUPPLIERS, getSupplierPriceForSymbol } from '../data/suppliersCatalog';

interface PranchasA3ViewProps {
  project: Project;
  symbolsCatalog: SignSymbol[];
  suppliers?: Supplier[];
  products?: ProductItem[];
  onUpdateProject?: (project: Project) => void;
  onUpdateFloor?: (floor: Floor) => void;
  onSaveProject?: () => void;
  onExportBackup?: () => void;
  onOpenExportDxf?: () => void;
}

export const PranchasA3View: React.FC<PranchasA3ViewProps> = ({
  project,
  symbolsCatalog,
  suppliers = DEFAULT_SUPPLIERS,
  onUpdateProject,
  onUpdateFloor,
  onSaveProject,
  onExportBackup,
  onOpenExportDxf
}) => {
  const [selectedFloorId, setSelectedFloorId] = useState<string>(project.floors[0]?.id || '');
  const activeFloor = project.floors.find((f) => f.id === selectedFloorId) || project.floors[0];

  // Visualização de folhas (Prancha A3 Integrada, Folha 01: Desenho Gráfico, Folha 02: Orçamento Consolidado ABNT, Folha 03: Legenda Técnica Dinâmica, Dossiê Completo)
  const [activeSheetTab, setActiveSheetTab] = useState<'unified' | 'drawing' | 'budget' | 'legend' | 'both'>('unified');
  const [budgetScope, setBudgetScope] = useState<'floor' | 'project'>('floor');

  // Configurações da Legenda Dinâmica ABNT NBR 13434 / NBR 16820
  const [legendScope, setLegendScope] = useState<'floor' | 'project'>('floor');
  const [legendGrouping, setLegendGrouping] = useState<'category' | 'code'>('category');
  const [includeLegendSpecs, setIncludeLegendSpecs] = useState<boolean>(true);

  // Configurações visuais do viewport
  const [scaleFactor, setScaleFactor] = useState<string>('1:100');
  const [viewportTheme, setViewportTheme] = useState<'light' | 'dark'>('light');
  const [symbolDisplayMode, setSymbolDisplayMode] = useState<'badge' | 'glyph'>('badge');
  const [viewportZoom, setViewportZoom] = useState<number>(1.0);
  const [viewportPan, setViewportPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Controle de exportação e modal de configuração
  const [showPdfConfigModal, setShowPdfConfigModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Edição rápida dos dados do Carimbo / Selo ABNT NBR 6492
  const [isEditingTitleBlock, setIsEditingTitleBlock] = useState<boolean>(false);
  const [empreendimento, setEmpreendimento] = useState<string>(project.empreendimento || project.nome);
  const [cliente, setCliente] = useState<string>(project.cliente || '');
  const [endereco, setEndereco] = useState<string>(project.endereco || '');
  const [responsavelTecnico, setResponsavelTecnico] = useState<string>(project.responsavel_tecnico || '');
  const [creaCau, setCreaCau] = useState<string>(project.crea_cau || '');
  const [artRrt, setArtRrt] = useState<string>(project.art_rrt || '');
  const [revisao, setRevisao] = useState<string>(project.revisao || 'R00');

  const unifiedSheetRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const budgetSheetRef = useRef<HTMLDivElement>(null);
  const legendSheetRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= LEGENDA DINÂMICA EM PDF (ABNT NBR 13434 / NBR 16820) =================
  // Processa dinamicamente todos os símbolos posicionados com especificações técnicas reais
  interface DynamicLegendEntry {
    symbol: SignSymbol;
    count: number;
    category: string;
    categoryLabel: string;
    categoryColor: string;
    dimensions: string;
    viewDistanceMeters: number;
    luminance: string;
    standard: string;
    floors: string[];
  }

  const categoryInfo: Record<string, { label: string; color: string; order: number }> = {
    'ORIENTACAO_SALVAMENTO': { label: 'Orientação e Salvamento (Rotas de Fuga e Saídas)', color: '#16a34a', order: 1 },
    'EQUIPAMENTOS': { label: 'Equipamentos de Combate a Incêndio e Alarme', color: '#dc2626', order: 2 },
    'ALERTA': { label: 'Sinalização de Alerta e Atenção', color: '#ca8a04', order: 3 },
    'PROIBICAO': { label: 'Sinalização de Proibição', color: '#b91c1c', order: 4 },
    'COMPLEMENTAR': { label: 'Sinalização Complementar de Indicação', color: '#2563eb', order: 5 },
    'OUTROS': { label: 'Outros Dispositivos e Sinalizadores', color: '#475569', order: 6 }
  };

  const dynamicLegendItems = useMemo<DynamicLegendEntry[]>(() => {
    const map = new Map<string, DynamicLegendEntry>();
    const symbolsToCount = legendScope === 'floor'
      ? (activeFloor?.placedSymbols || [])
      : project.floors.flatMap((f) => f.placedSymbols);

    symbolsToCount.forEach((ps) => {
      const def = symbolsCatalog.find((s) => s.id === ps.symbol_id);
      if (!def) return;

      const floorName = project.floors.find((f) => f.id === ps.floor_id)?.name || activeFloor?.name || 'Pavimento';
      const cat = def.categoria || 'OUTROS';
      const catMeta = categoryInfo[cat] || categoryInfo['OUTROS'];
      const qty = ps.quantity || 1;

      // Distância máxima de visibilidade conforme NBR 13434: d = sqrt(S/2000)
      const areaMm2 = (def.largura || 200) * (def.altura || 200);
      const viewDist = Math.round(Math.sqrt(areaMm2 / 2000) * 10) / 10 || 4.5;
      const luminance = def.fotoluminescente_grau || 'Classe C (140 mcd/m² @ 10min)';
      const standard = def.norma_referencia || 'NBR 13434 / NBR 16820';

      const existing = map.get(def.id);
      if (existing) {
        existing.count += qty;
        if (!existing.floors.includes(floorName)) {
          existing.floors.push(floorName);
        }
      } else {
        map.set(def.id, {
          symbol: def,
          count: qty,
          category: cat,
          categoryLabel: catMeta.label,
          categoryColor: catMeta.color,
          dimensions: `${def.largura || 200}x${def.altura || 200} mm`,
          viewDistanceMeters: viewDist,
          luminance,
          standard,
          floors: [floorName]
        });
      }
    });

    const items = Array.from(map.values());
    if (legendGrouping === 'category') {
      return items.sort((a, b) => {
        const orderA = categoryInfo[a.category]?.order || 99;
        const orderB = categoryInfo[b.category]?.order || 99;
        if (orderA !== orderB) return orderA - orderB;
        return (a.symbol.codigo_normativo || a.symbol.codigo_interno).localeCompare(
          b.symbol.codigo_normativo || b.symbol.codigo_interno
        );
      });
    } else {
      return items.sort((a, b) => {
        return (a.symbol.codigo_normativo || a.symbol.codigo_interno).localeCompare(
          b.symbol.codigo_normativo || b.symbol.codigo_interno
        );
      });
    }
  }, [legendScope, legendGrouping, activeFloor, project, symbolsCatalog]);

  const totalDynamicSignsCount = useMemo(() => {
    return dynamicLegendItems.reduce((acc, item) => acc + item.count, 0);
  }, [dynamicLegendItems]);

  // Agrupamento por Categoria para a Legenda Dinâmica em PDF
  const dynamicLegendByCategory = useMemo(() => {
    const groups: Record<string, { meta: { label: string; color: string; order: number }; items: DynamicLegendEntry[]; totalCount: number }> = {};
    dynamicLegendItems.forEach((entry) => {
      const cat = entry.category;
      if (!groups[cat]) {
        groups[cat] = {
          meta: categoryInfo[cat] || categoryInfo['OUTROS'],
          items: [],
          totalCount: 0
        };
      }
      groups[cat].items.push(entry);
      groups[cat].totalCount += entry.count;
    });

    return Object.entries(groups)
      .sort(([, a], [, b]) => a.meta.order - b.meta.order)
      .map(([catKey, data]) => ({
        categoryKey: catKey,
        ...data
      }));
  }, [dynamicLegendItems]);

  // Símbolos utilizados no pavimento ativo (compatibilidade legada)
  const floorSymbolsMap = new Map<string, { symbol: SignSymbol; count: number }>();
  activeFloor?.placedSymbols.forEach((ps) => {
    const def = symbolsCatalog.find((s) => s.id === ps.symbol_id);
    if (!def) return;
    if (!floorSymbolsMap.has(def.id)) {
      floorSymbolsMap.set(def.id, { symbol: def, count: ps.quantity });
    } else {
      floorSymbolsMap.get(def.id)!.count += ps.quantity;
    }
  });

  const legendList = Array.from(floorSymbolsMap.values());
  const totalSignsCount = legendList.reduce((acc, item) => acc + item.count, 0);

  // Dimensões do espaço do pavimento em milímetros
  const worldWidthMm = (activeFloor.widthMeters || 40) * 1000;
  const worldHeightMm = (activeFloor.heightMeters || 28) * 1000;

  // ================= CONSOLIDAÇÃO DE ORÇAMENTO E QUANTITATIVOS (ABNT) =================
  const budgetItems = useMemo(() => {
    const map = new Map<string, {
      symbol: SignSymbol;
      count: number;
      unitPrice: number;
      totalPrice: number;
      supplierName: string;
      category: string;
      dimensions: string;
      floors: string[];
    }>();

    const symbolsToCount = budgetScope === 'floor'
      ? activeFloor.placedSymbols
      : project.floors.flatMap((f) => f.placedSymbols);

    symbolsToCount.forEach((ps) => {
      const def = symbolsCatalog.find((s) => s.id === ps.symbol_id);
      if (!def) return;

      const current = map.get(def.id);
      const price = ps.unit_price || def.preco_padrao || getSupplierPriceForSymbol(def.id, ps.supplier_id || def.fornecedor_id);
      const supplierObj = (suppliers || DEFAULT_SUPPLIERS).find(
        (s) => s.id === (ps.supplier_id || def.fornecedor_id)
      );
      const supplierName = supplierObj?.nome_fantasia || 'TAG Sinalização';
      const floorName = project.floors.find((f) => f.id === ps.floor_id)?.name || activeFloor.name;

      if (current) {
        current.count += (ps.quantity || 1);
        current.totalPrice += price * (ps.quantity || 1);
        if (!current.floors.includes(floorName)) {
          current.floors.push(floorName);
        }
      } else {
        map.set(def.id, {
          symbol: def,
          count: ps.quantity || 1,
          unitPrice: price,
          totalPrice: price * (ps.quantity || 1),
          supplierName,
          category: def.categoria,
          dimensions: `${def.largura}x${def.altura} mm`,
          floors: [floorName]
        });
      }
    });

    const categoryOrder: Record<string, number> = {
      'EQUIPAMENTOS': 1,
      'ORIENTACAO_SALVAMENTO': 2,
      'ALERTA': 3,
      'PROIBICAO': 4,
      'COMPLEMENTAR': 5,
      'OUTROS': 6
    };

    return Array.from(map.values()).sort((a, b) => {
      const catDiff = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
      if (catDiff !== 0) return catDiff;
      return (a.symbol.codigo_normativo || a.symbol.codigo_interno).localeCompare(
        b.symbol.codigo_normativo || b.symbol.codigo_interno
      );
    });
  }, [activeFloor, project, budgetScope, symbolsCatalog, suppliers]);

  const grandTotalBudget = useMemo(() => {
    return budgetItems.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [budgetItems]);

  const grandTotalQuantity = useMemo(() => {
    return budgetItems.reduce((acc, item) => acc + item.count, 0);
  }, [budgetItems]);

  // Resumo por categoria
  const categoryTotals = useMemo(() => {
    const totals: Record<string, { count: number; total: number; label: string }> = {
      'EQUIPAMENTOS': { count: 0, total: 0, label: 'Equipamentos de Combate e Alarme' },
      'ORIENTACAO_SALVAMENTO': { count: 0, total: 0, label: 'Orientação e Salvamento' },
      'ALERTA': { count: 0, total: 0, label: 'Alerta e Atenção' },
      'PROIBICAO': { count: 0, total: 0, label: 'Proibição' },
      'COMPLEMENTAR': { count: 0, total: 0, label: 'Sinalização Complementar' },
      'OUTROS': { count: 0, total: 0, label: 'Outros Itens' }
    };

    budgetItems.forEach((it) => {
      const cat = totals[it.category] ? it.category : 'OUTROS';
      totals[cat].count += it.count;
      totals[cat].total += it.totalPrice;
    });

    return totals;
  }, [budgetItems]);

  // Sincronização do Carimbo com o Projeto
  const handleSaveTitleBlock = () => {
    if (onUpdateProject) {
      const updatedProject: Project = {
        ...project,
        empreendimento,
        cliente,
        endereco,
        responsavel_tecnico: responsavelTecnico,
        crea_cau: creaCau,
        art_rrt: artRrt,
        revisao,
        updatedAt: new Date().toISOString()
      };
      onUpdateProject(updatedProject);
    }
    setIsEditingTitleBlock(false);
  };

  // Carregar imagem de planta baixa diretamente
  const handleImportPlanImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateFloor) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const updated: Floor = {
        ...activeFloor,
        floorPlanUrl: dataUrl,
        floorPlanType: 'raster',
        floorPlanVisible: true,
        floorPlanOpacity: 0.85
      };
      onUpdateFloor(updated);
    };
    reader.readAsDataURL(file);
  };

  // Pan interativo do viewport
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewportPan.x, y: e.clientY - viewportPan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewportPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleResetViewport = () => {
    setViewportZoom(1.0);
    setViewportPan({ x: 0, y: 0 });
  };

  // ================= EXPORTAÇÃO E IMPRESSÃO COM jsPDF =================

  // Impressão Direta (A3 Paisagem)
  const handlePrint = () => {
    document.body.classList.add('printing-prancha');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-prancha');
    }, 1000);
  };

  // MOTOR AVANÇADO DE EXPORTAÇÃO PDF A3 VIA jsPDF E html2canvas
  // Captura o container '.a3-sheet-print-container' em página A3 paisagem com alta fidelidade para plantas, símbolos e tabelas
  const handleExecutePdfExport = async (config: PdfExportConfig) => {
    setIsExporting(true);
    setProgressPercent(10);
    setExportMessage('Sincronizando pranchas e tipografia ABNT...');

    try {
      // 0. Sincroniza parâmetros de renderização selecionados pelo usuário
      if (config.budgetScope) setBudgetScope(config.budgetScope);
      if (config.symbolDisplayMode) setSymbolDisplayMode(config.symbolDisplayMode);
      if (config.legendMode) setLegendScope(config.legendMode);
      if (config.legendGrouping) setLegendGrouping(config.legendGrouping);
      if (config.includeLegendSpecs !== undefined) setIncludeLegendSpecs(config.includeLegendSpecs);

      // Aguarda o carregamento das fontes para evitar reflow ou texto truncado
      try {
        if (document.fonts) {
          await document.fonts.ready;
        }
      } catch (fontErr) {
        console.warn('Verificação de fontes concluída com aviso:', fontErr);
      }

      // 1. Sincroniza a aba ativa com o conteúdo solicitado para garantir montagem correta no DOM
      if (config.content === 'unified') {
        setActiveSheetTab('unified');
      } else if (config.content === 'drawing') {
        setActiveSheetTab('drawing');
      } else if (config.content === 'budget') {
        setActiveSheetTab('budget');
      } else if (config.content === 'legend_sheet') {
        setActiveSheetTab('legend');
      } else if (config.content === 'dossier') {
        setActiveSheetTab('both');
      }
      
      // Delay tático para renderização completa do layout React
      await new Promise((r) => setTimeout(r, 200));

      // 2. Localiza os contêineres '.a3-sheet-print-container' no DOM
      let targetContainers: HTMLElement[] = [];

      if (config.content === 'unified' && unifiedSheetRef.current) {
        targetContainers = [unifiedSheetRef.current];
      } else if (config.content === 'drawing' && sheetRef.current) {
        targetContainers = [sheetRef.current];
      } else if (config.content === 'budget' && budgetSheetRef.current) {
        targetContainers = [budgetSheetRef.current];
      } else if (config.content === 'legend_sheet' && legendSheetRef.current) {
        targetContainers = [legendSheetRef.current];
      } else if (config.content === 'dossier') {
        targetContainers = [
          sheetRef.current,
          budgetSheetRef.current,
          config.includeLegendSheetInDossier ? legendSheetRef.current : null
        ].filter(Boolean) as HTMLElement[];
      }

      // Fallback para seleção por classe caso refs diretas não bastem
      if (targetContainers.length === 0) {
        targetContainers = Array.from(
          document.querySelectorAll<HTMLElement>('.a3-sheet-print-container')
        );
      }

      if (targetContainers.length === 0) {
        throw new Error('Nenhum contêiner .a3-sheet-print-container encontrado no DOM para exportação.');
      }

      // 3. Define parâmetros de alta fidelidade e otimização de renderização
      const scale = config.quality === 'ultra' ? 3.0 : config.quality === 'high' ? 2.5 : 1.8;
      const isPng = config.imageFormat === 'png';
      const imgType = isPng ? 'image/png' : 'image/jpeg';
      const pdfFormatType = isPng ? 'PNG' : 'JPEG';
      const compression = isPng ? undefined : 0.98;

      // 4. Instancia jsPDF configurado estritamente para A3 Paisagem (420 x 297 mm)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3', // Exatamente 420mm de largura x 297mm de altura
        compress: true
      });

      // 5. Itera sobre cada container .a3-sheet-print-container capturando com html2canvas
      for (let i = 0; i < targetContainers.length; i++) {
        const container = targetContainers[i];
        const stepPercent = Math.round(20 + (i / targetContainers.length) * 65);
        setProgressPercent(stepPercent);
        setExportMessage(`Renderizando folha ${i + 1} de ${targetContainers.length} em alta resolução (${scale}x)...`);

        const canvas = await html2canvas(container, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000,
          windowWidth: 1190,
          windowHeight: 841,
          scrollX: 0,
          scrollY: 0,
          onclone: (_clonedDoc, clonedEl) => {
            clonedEl.style.transform = 'none';
            clonedEl.style.boxShadow = 'none';
            clonedEl.style.margin = '0';
            
            // Otimização de renderização: remove animações, transições e efeitos pesados
            if (config.optimizeRendering) {
              const allEls = clonedEl.querySelectorAll('*');
              allEls.forEach((el) => {
                (el as HTMLElement).style.animation = 'none';
                (el as HTMLElement).style.transition = 'none';
              });
            }

            // Garante alta fidelidade geométrica dos vetores SVG (linhas CAD, cotas, símbolos e textos)
            const svgs = clonedEl.querySelectorAll('svg');
            svgs.forEach((svg) => {
              svg.setAttribute('shape-rendering', 'geometricPrecision');
              svg.setAttribute('text-rendering', 'geometricPrecision');
              svg.setAttribute('color-rendering', 'optimizeQuality');
            });
          }
        });

        const imgData = canvas.toDataURL(imgType, compression);

        if (i > 0) {
          doc.addPage('a3', 'landscape');
        }

        // Adiciona a imagem cobrindo integralmente as dimensões da prancha A3 Paisagem (420 x 297 mm)
        doc.addImage(imgData, pdfFormatType, 0, 0, 420, 297, undefined, 'FAST');

        // Limpeza de memória do canvas para acelerar processamento de múltiplas páginas
        canvas.width = 1;
        canvas.height = 1;

        // Yield para suavizar a interface e atualizar a barra de progresso
        await new Promise((r) => setTimeout(r, 60));
      }

      setProgressPercent(92);
      setExportMessage('Finalizando e assinando documento PDF A3...');
      await new Promise((r) => setTimeout(r, 80));

      const suffix = config.content === 'unified'
        ? 'PRANCHA_A3_INTEGRADA_ABNT'
        : config.content === 'dossier'
        ? 'CADERNO_TECNICO_COMPLETO_A3'
        : config.content === 'drawing'
        ? 'PRANCHA_A3_GRAFICA'
        : config.content === 'legend_sheet'
        ? 'FOLHA_03_LEGENDA_TECNICA_A3'
        : 'PRANCHA_A3_ORCAMENTO_ABNT';

      const safeProjectName = (project.nome || 'PROJETO').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFloorName = (activeFloor.name || 'PAVIMENTO').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${suffix}_${safeProjectName}_${safeFloorName}.pdf`;

      doc.save(filename);

      setProgressPercent(100);
      setExportMessage('PDF A3 Oficial baixado com sucesso!');

      setTimeout(() => {
        setIsExporting(false);
        setShowPdfConfigModal(false);
        setExportMessage('');
        setProgressPercent(0);
      }, 800);

    } catch (err: any) {
      console.error('Erro na exportação do PDF:', err);
      setIsExporting(false);
      setProgressPercent(0);
      alert('Erro ao gerar documento PDF A3: ' + err.message);
    }
  };

  // Construtor utilitário para objeto de configuração PdfExportConfig completo
  const createExportConfig = (overrides: Partial<PdfExportConfig> = {}): PdfExportConfig => ({
    content: 'unified',
    quality: 'high',
    imageFormat: 'jpeg',
    includeFloorPlan: true,
    includeCadEntities: true,
    includeNorthCompass: true,
    includeGraphicScale: true,
    symbolDisplayMode,
    budgetScope,
    includeNormativeNotes: true,
    includeCategorySummary: true,
    includeSignatures: true,
    legendMode: legendScope,
    legendGrouping: legendGrouping,
    includeLegendSpecs,
    includeLegendQuantities: true,
    includeLegendSheetInDossier: true,
    optimizeRendering: true,
    vectorAntiAliasing: true,
    ...overrides
  });

  // Exportação Direta de 1 Clique (Captura o container .a3-sheet-print-container ativo via jsPDF)
  const handleQuickPdfExport = () => {
    const targetContent = 
      activeSheetTab === 'both' ? 'dossier' : 
      activeSheetTab === 'legend' ? 'legend_sheet' : 
      activeSheetTab;

    handleExecutePdfExport(
      createExportConfig({
        content: targetContent
      })
    );
  };

  // Exportar Imagem HD (PNG)
  const handleExportImageHD = async () => {
    const targetEl = activeSheetTab === 'budget' ? budgetSheetRef.current : sheetRef.current;
    if (!targetEl) return;
    setShowExportMenu(false);
    try {
      setIsExporting(true);
      setExportMessage('Exportando imagem HD da Prancha A3...');
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(targetEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `PRANCHA_A3_${project.nome.replace(/\s+/g, '_')}_${activeFloor.name.replace(/\s+/g, '_')}_HD.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportMessage('Imagem HD baixada com sucesso!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (err: any) {
      console.error('Erro ao exportar imagem HD:', err);
      alert('Erro ao exportar imagem: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // ================= RENDERIZADORES DE FOLHAS TÉCNICAS ABNT =================

  // RENDER DA PRANCHA A3 INTEGRADA (Planta Baixa + Legenda de Símbolos + Tabela Consolidada de Quantitativos + Carimbo ABNT)
  const renderUnifiedSheet = () => (
    <div
      ref={unifiedSheetRef}
      className="a3-sheet-print-container bg-white text-black shadow-2xl relative select-none shrink-0"
      style={{
        width: '1190px',
        height: '841px',
        padding: '35px 35px 35px 88px', // Margens ABNT NBR 6492: 25mm esquerda (88px), 10mm demais (35px)
        boxSizing: 'border-box'
      }}
    >
      <div className="w-full h-full border-2 border-black flex flex-col relative overflow-hidden bg-white">
        
        {/* PARTE SUPERIOR (510px): PLANTA BAIXA COM SÍMBOLOS + LEGENDA TÉCNICA */}
        <div className="flex overflow-hidden border-b-2 border-black" style={{ height: '510px' }}>
          
          {/* VIEWPORT DA PLANTA BAIXA COM A PLANTA REAL DE FUNDO */}
          <div
            className={`flex-1 relative overflow-hidden flex flex-col cursor-move border-r-2 border-black ${
              viewportTheme === 'light' ? 'bg-white text-black' : 'bg-slate-950 text-white'
            }`}
          >
            {/* Cabeçalho do Viewport */}
            <div className="bg-slate-100 text-black border-b border-black px-3 py-1 text-[11px] font-mono flex items-center justify-between font-bold shrink-0 print:bg-white">
              <div className="flex items-center gap-2">
                <span className="text-red-700">●</span>
                <span>PLANTA BAIXA - {activeFloor.name.toUpperCase()}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-700 font-bold">ESCALA {scaleFactor}</span>
              </div>

              {/* Controles de Zoom e Pan do Viewport (Ocultos na Impressão) */}
              <div className="flex items-center gap-1.5 print:hidden">
                {!activeFloor.floorPlanUrl && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded text-[10px] font-bold flex items-center gap-1 transition"
                    title="Inserir arquivo de imagem da planta baixa"
                  >
                    <ImageIcon className="w-3 h-3" />
                    Carregar Imagem da Planta
                  </button>
                )}
                <button
                  onClick={() => setViewportZoom((z) => Math.min(2.5, z + 0.15))}
                  className="p-1 hover:bg-slate-200 text-slate-800 rounded"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportZoom((z) => Math.max(0.4, z - 0.15))}
                  className="p-1 hover:bg-slate-200 text-slate-800 rounded"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetViewport}
                  className="p-1 hover:bg-slate-200 text-slate-800 rounded"
                  title="Resetar Posição e Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                  className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-mono"
                  title="Alternar tema de visualização"
                >
                  {viewportTheme === 'light' ? 'Fundo Escuro' : 'Fundo Claro'}
                </button>
              </div>
            </div>

            {/* Stage Central Interativo da Planta */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="flex-1 w-full relative overflow-hidden flex items-center justify-center select-none"
            >
              {/* Rosa dos Ventos / Norte Técnico ABNT */}
              <div className="absolute top-3 right-3 z-20 pointer-events-none flex flex-col items-center opacity-80">
                <Compass className="w-7 h-7 text-red-700" />
                <span className="text-[9px] font-black text-black font-mono">NORTE</span>
              </div>

              {/* Escala Gráfica de Precisão */}
              <div className="absolute bottom-3 left-3 z-20 pointer-events-none bg-white/95 p-1.5 border border-black rounded shadow-xs font-mono text-[9px] flex flex-col gap-0.5">
                <div className="flex justify-between w-28 text-[8px] font-bold">
                  <span>0</span>
                  <span>2m</span>
                  <span>5m</span>
                  <span>10m</span>
                </div>
                <div className="w-28 h-2 border border-black flex">
                  <div className="w-1/4 bg-black" />
                  <div className="w-1/4 bg-white" />
                  <div className="w-1/4 bg-black" />
                  <div className="w-1/4 bg-white" />
                </div>
                <div className="text-center font-bold text-[8px]">ESCALA GRÁFICA ({scaleFactor})</div>
              </div>

              {/* CONTAINER TRANSFORMÁVEL DO PLANO (ZOOM + PAN) */}
              <div
                style={{
                  transform: `translate(${viewportPan.x}px, ${viewportPan.y}px) scale(${viewportZoom})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                  width: '100%',
                  height: '100%'
                }}
                className="relative flex items-center justify-center"
              >
                {/* Imagem Real da Planta */}
                {activeFloor.floorPlanUrl ? (
                  <div
                    className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none p-2"
                    style={{
                      opacity: activeFloor.floorPlanOpacity ?? 0.9,
                      filter: activeFloor.floorPlanInvert ? 'invert(1)' : undefined
                    }}
                  >
                    <img
                      src={activeFloor.floorPlanUrl}
                      crossOrigin="anonymous"
                      alt="Planta de Fundo do Pavimento"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 pointer-events-none">
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
                      <rect className="w-full h-full" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-slate-700 block">
                          Layout Arquitetônico Paramétrico
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {activeFloor.name} ({activeFloor.widthMeters || 40}m x {activeFloor.heightMeters || 28}m)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* OVERLAY VETORIAL: ENTIDADES CAD + SÍMBOLOS ABNT NBR 13434 */}
                <svg
                  viewBox={`0 0 ${worldWidthMm} ${worldHeightMm}`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 10 }}
                >
                  {!activeFloor.floorPlanUrl && (
                    <g className="arch-fallback opacity-40">
                      <rect
                        x="500"
                        y="500"
                        width={worldWidthMm - 1000}
                        height={worldHeightMm - 1000}
                        fill="none"
                        stroke={viewportTheme === 'light' ? '#0f172a' : '#94a3b8'}
                        strokeWidth="250"
                      />
                      <line
                        x1="500"
                        y1={worldHeightMm / 2}
                        x2={worldWidthMm - 500}
                        y2={worldHeightMm / 2}
                        stroke={viewportTheme === 'light' ? '#334155' : '#64748b'}
                        strokeWidth="180"
                      />
                      <line
                        x1={worldWidthMm / 2}
                        y1="500"
                        x2={worldWidthMm / 2}
                        y2={worldHeightMm - 500}
                        stroke={viewportTheme === 'light' ? '#334155' : '#64748b'}
                        strokeWidth="180"
                      />
                    </g>
                  )}

                  <CADSvgEntitiesRenderer
                    entities={activeFloor.cadEntities || []}
                    theme={viewportTheme}
                  />

                  {activeFloor.placedSymbols.map((sym) => {
                    const symbolDef = symbolsCatalog.find((s) => s.id === sym.symbol_id);
                    if (!symbolDef) return null;

                    if (symbolDisplayMode === 'glyph') {
                      const w = (sym.width || symbolDef.largura || 250) * 1.8;
                      const h = (sym.height || symbolDef.altura || 150) * 1.8;
                      return (
                        <g
                          key={sym.id}
                          transform={`translate(${sym.x}, ${sym.y}) rotate(${sym.rotation})`}
                        >
                          <rect
                            x={-w / 2}
                            y={-h / 2}
                            width={w}
                            height={h}
                            fill={symbolDef.cor_fundo || '#dc2626'}
                            stroke="#ffffff"
                            strokeWidth="25"
                            rx="15"
                          />
                          <text
                            x="0"
                            y={h * 0.15}
                            textAnchor="middle"
                            fill={symbolDef.cor_simbolo || '#ffffff'}
                            fontSize={Math.min(w, h) * 0.45}
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            {symbolDef.codigo_normativo || symbolDef.codigo_interno}
                          </text>
                        </g>
                      );
                    }

                    const radius = 550;
                    const isFireEquipment = symbolDef.categoria === 'EQUIPAMENTOS' || symbolDef.categoria === 'ALERTA';
                    const badgeBorderColor = isFireEquipment ? '#dc2626' : '#16a34a';

                    return (
                      <g
                        key={sym.id}
                        transform={`translate(${sym.x}, ${sym.y}) rotate(${sym.rotation})`}
                      >
                        <circle
                          r={radius}
                          fill="#ffffff"
                          stroke={badgeBorderColor}
                          strokeWidth="80"
                        />
                        <line
                          x1={-radius}
                          y1="0"
                          x2={radius}
                          y2="0"
                          stroke={badgeBorderColor}
                          strokeWidth="60"
                        />
                        <text
                          x="0"
                          y={-radius * 0.2}
                          textAnchor="middle"
                          fill="#000000"
                          fontSize={radius * 0.65}
                          fontWeight="900"
                          fontFamily="monospace"
                        >
                          {symbolDef.codigo_normativo || symbolDef.codigo_interno}
                        </text>
                        <text
                          x="0"
                          y={radius * 0.65}
                          textAnchor="middle"
                          fill="#475569"
                          fontSize={radius * 0.45}
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {symbolDef.largura}x{symbolDef.altura}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* LEGENDA TÉCNICA DINÂMICA DE SÍMBOLOS (LADO DIREITO - 330px) */}
          <div className="w-[330px] shrink-0 flex flex-col bg-white overflow-hidden text-[9px]">
            <div className="bg-slate-900 text-white p-2 font-mono flex items-center justify-between shrink-0">
              <div>
                <strong className="text-[10px] uppercase tracking-wider block">LEGENDA NORMATIVA DINÂMICA</strong>
                <span className="text-[7.5px] text-slate-300">ABNT NBR 13434 / NBR 16820 • {legendScope === 'floor' ? activeFloor.name : 'Geral'}</span>
              </div>
              <span className="bg-red-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                {totalDynamicSignsCount} un
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100">
              {dynamicLegendItems.length === 0 ? (
                <div className="p-4 text-center text-slate-400 italic">
                  Nenhum símbolo posicionado neste pavimento.
                </div>
              ) : (
                dynamicLegendItems.map((item) => (
                  <div key={item.symbol.id} className="pt-1 flex items-center gap-1.5">
                    <div className="w-7 h-6 flex items-center justify-center bg-slate-50 border border-slate-300 rounded shrink-0 overflow-hidden">
                      <SymbolGlyph symbol={item.symbol} width={22} height={22} />
                    </div>
                    <div className="flex-1 min-w-0 leading-tight">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-red-700 font-mono text-[8.5px]">
                            {item.symbol.codigo_normativo || item.symbol.codigo_interno}
                          </span>
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: item.categoryColor }}
                            title={item.categoryLabel}
                          />
                        </div>
                        <span className="font-bold font-mono text-[8px] bg-slate-100 px-1 rounded">
                          {item.count} un
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900 block truncate text-[8px]">
                        {item.symbol.nome}
                      </span>
                      <span className="text-[7px] text-slate-500 block truncate">
                        {item.dimensions} {includeLegendSpecs && `• d_visib ≤ ${item.viewDistanceMeters}m`} • {item.luminance.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-1.5 bg-slate-50 border-t border-slate-300 text-[7.5px] text-slate-700 leading-tight shrink-0">
              <strong className="block text-[8px] text-black font-bold uppercase mb-0.5">Notas de Aplicação:</strong>
              <p>• Sinalização fotoluminescente conforme NBR 13434 e NBR 16820.</p>
              <p>• Fixação a 1,80m do piso ou sobre vergas (2,10m).</p>
            </div>
          </div>
        </div>

        {/* PARTE INFERIOR (261px): TABELA CONSOLIDADA DE QUANTITATIVOS + CARIMBO ABNT NBR 6492 */}
        <div className="flex-1 flex overflow-hidden bg-white">
          
          {/* TABELA TÉCNICA CONSOLIDADA DE QUANTITATIVOS E ORÇAMENTO */}
          <div className="flex-1 flex flex-col border-r-2 border-black overflow-hidden bg-white">
            <div className="bg-slate-100 border-b border-black px-2 py-1 flex items-center justify-between shrink-0">
              <div>
                <strong className="text-[9px] font-black uppercase text-black block leading-none">
                  QUADRO CONSOLIDADO DE QUANTITATIVOS & ESPECIFICAÇÕES TÉCNICAS ABNT
                </strong>
                <span className="text-[7.5px] text-slate-600">
                  Prevenção e Combate a Incêndio • NBR 13434 / NBR 16820 / NBR 6492
                </span>
              </div>
              <div className="flex items-center gap-2 text-[8px] font-mono">
                <span className="font-bold">Total: <strong className="text-black font-mono">{grandTotalQuantity} un</strong></span>
                <span className="font-bold text-emerald-800">
                  R$ {grandTotalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-1">
              <table className="w-full border-collapse text-[8px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono uppercase text-[7px] divide-x divide-slate-700">
                    <th className="p-0.5 text-center w-6">Item</th>
                    <th className="p-0.5 text-center w-10">Cód.</th>
                    <th className="p-0.5 text-center w-7">Pict.</th>
                    <th className="p-0.5 text-left">Especificação Técnica do Sinalizador / Equipamento</th>
                    <th className="p-0.5 text-center w-16">Dimensões</th>
                    <th className="p-0.5 text-center w-20">Fotoluminescência</th>
                    <th className="p-0.5 text-center w-8">Qtd</th>
                    <th className="p-0.5 text-right w-14">Unit. (R$)</th>
                    <th className="p-0.5 text-right w-16">Total (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-b border-black">
                  {budgetItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-2 text-center text-slate-400 text-[8px]">
                        Nenhum item quantificado para este pavimento.
                      </td>
                    </tr>
                  ) : (
                    budgetItems.map((item, index) => (
                      <tr key={item.symbol.id} className="divide-x divide-slate-200 hover:bg-slate-50 leading-none">
                        <td className="p-0.5 text-center font-mono text-[7.5px] text-slate-500">{index + 1}</td>
                        <td className="p-0.5 text-center font-mono font-bold text-red-700 text-[7.5px]">{item.symbol.codigo_normativo}</td>
                        <td className="p-0.5 text-center">
                          <div className="w-5 h-4 mx-auto flex items-center justify-center bg-slate-50 rounded border border-slate-300 overflow-hidden">
                            <SymbolGlyph symbol={item.symbol} width={14} height={14} />
                          </div>
                        </td>
                        <td className="p-0.5">
                          <strong className="text-slate-900 block truncate text-[8px]">{item.symbol.nome}</strong>
                          <span className="text-[7px] text-slate-500 block truncate">{item.symbol.norma_referencia}</span>
                        </td>
                        <td className="p-0.5 text-center font-mono text-[7px]">{item.dimensions}</td>
                        <td className="p-0.5 text-center font-mono text-[7px] text-slate-600">
                          {item.symbol.fotoluminescente_grau || 'NBR 16820 (Classe C)'}
                        </td>
                        <td className="p-0.5 text-center font-mono font-bold text-black text-[8px]">{item.count}</td>
                        <td className="p-0.5 text-right font-mono text-[7.5px]">
                          R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-0.5 text-right font-mono font-bold text-black text-[8px]">
                          R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-black divide-x divide-slate-300 text-[8px]">
                    <td colSpan={6} className="p-1 text-right uppercase font-black">
                      TOTAL GERAL CONSOLIDADO (COM BDI):
                    </td>
                    <td className="p-1 text-center font-mono font-black text-black">
                      {grandTotalQuantity} un
                    </td>
                    <td className="p-1 text-right font-mono text-slate-500">-</td>
                    <td className="p-1 text-right font-mono font-black text-emerald-800 text-[9px]">
                      R$ {grandTotalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* CARIMBO / SELO TÉCNICO OFICIAL ABNT NBR 6492 (CANTO INFERIOR DIREITO PARA DOBRAGEM) */}
          <div className="w-[350px] shrink-0 p-2 flex flex-col justify-between bg-white text-[8.5px] select-none">
            
            {/* Topo do Carimbo: Logo e Empreendimento */}
            <div>
              <div className="flex items-center gap-1.5 pb-1 border-b border-black">
                <div className="w-6 h-6 rounded bg-red-700 flex items-center justify-center text-white font-black text-xs shrink-0">
                  SF
                </div>
                <div className="leading-tight flex-1 min-w-0">
                  <strong className="text-[10px] font-black tracking-tight text-black block">SIGNAFLUX PRO</strong>
                  <span className="text-[7px] text-slate-500 font-mono block">Conformidade ABNT NBR 6492 / NBR 13434</span>
                </div>
              </div>

              <div className="pt-1 space-y-0.5">
                <div>
                  <span className="text-[7px] text-slate-500 font-bold uppercase block">Obra / Empreendimento:</span>
                  <strong className="text-[9px] text-black font-extrabold block truncate leading-tight">{empreendimento}</strong>
                  <span className="text-[7.5px] text-slate-600 block truncate">{endereco}</span>
                </div>
                <div>
                  <span className="text-[7px] text-slate-500 font-bold uppercase block">Proprietário / Cliente:</span>
                  <span className="text-[8px] text-slate-800 block truncate">{cliente}</span>
                </div>
              </div>
            </div>

            {/* Centro do Carimbo: Responsável Técnico, ART e Conteúdo */}
            <div className="border-t border-slate-300 pt-1 space-y-0.5">
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-[7px] text-slate-500 font-bold uppercase block">Resp. Técnico:</span>
                  <strong className="text-[8px] text-black font-bold block truncate">{responsavelTecnico}</strong>
                  <span className="text-[7px] font-mono text-slate-600">{creaCau}</span>
                </div>
                <div>
                  <span className="text-[7px] text-slate-500 font-bold uppercase block">ART / RRT:</span>
                  <span className="text-[8px] font-mono font-bold text-slate-900 block truncate">{artRrt}</span>
                </div>
              </div>

              <div>
                <span className="text-[7px] text-slate-500 font-bold uppercase block">Conteúdo da Folha:</span>
                <strong className="text-[8.5px] uppercase text-red-700 font-black block leading-tight">
                  PLANTA DE SINALIZAÇÃO & QUANTITATIVOS
                </strong>
                <span className="text-[8px] font-bold text-black">{activeFloor.name}</span>
              </div>
            </div>

            {/* Rodapé do Carimbo: Escala, Data, Revisão e Prancha */}
            <div className="border-t-2 border-black pt-1 grid grid-cols-4 gap-1 font-mono text-[8px] leading-tight">
              <div>
                <span className="text-slate-500 block text-[6.5px]">ESCALA:</span>
                <strong className="text-black">{scaleFactor}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[6.5px]">DATA:</span>
                <strong className="text-black">{new Date().toLocaleDateString('pt-BR')}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[6.5px]">REV:</span>
                <strong className="text-black">{revisao}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[6.5px]">PRANCHA:</span>
                <strong className="text-red-700 font-black">01/01</strong>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );

  // RENDER DA FOLHA 01: PRANCHA GRÁFICA A3 (420 x 297 mm)
  const renderDrawingSheet = () => (
    <div
      ref={sheetRef}
      className="a3-sheet-print-container bg-white text-black shadow-2xl relative select-none shrink-0"
      style={{
        width: '1190px',
        height: '841px',
        padding: '35px 35px 35px 88px', // Margens ABNT: 25mm esquerda (88px), 10mm demais (35px)
        boxSizing: 'border-box'
      }}
    >
      <div className="w-full h-full border-2 border-black flex flex-col relative overflow-hidden bg-white">
        {/* 1. ÁREA SUPERIOR: VIEWPORT DA PLANTA BAIXA + LEGENDA TÉCNICA LATERAL */}
        <div className="flex-1 flex overflow-hidden border-b-2 border-black">
          
          {/* VIEWPORT DA PLANTA BAIXA COM A PLANTA REAL DE FUNDO */}
          <div
            className={`flex-1 relative overflow-hidden flex items-center justify-center cursor-move border-r-2 border-black ${
              viewportTheme === 'light' ? 'bg-white text-black' : 'bg-slate-950 text-white'
            }`}
          >
            {/* Cabeçalho do Viewport */}
            <div className="bg-slate-100 text-black border-b border-black px-3 py-1 text-[11px] font-mono flex items-center justify-between font-bold print:bg-white">
              <div className="flex items-center gap-2">
                <span className="text-red-700">●</span>
                <span>PLANTA BAIXA - {activeFloor.name.toUpperCase()}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-700 font-bold">ESCALA {scaleFactor}</span>
              </div>

              {/* Controles de Zoom e Pan do Viewport (Ocultos na Impressão) */}
              <div className="flex items-center gap-1.5 print:hidden">
                {!activeFloor.floorPlanUrl && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded text-[10px] font-bold flex items-center gap-1 transition"
                    title="Inserir arquivo de imagem da planta baixa"
                  >
                    <ImageIcon className="w-3 h-3" />
                    Carregar Imagem da Planta
                  </button>
                )}
                <button
                  onClick={() => setViewportZoom((z) => Math.min(2.5, z + 0.15))}
                  className="p-1 hover:bg-slate-200 text-slate-800 rounded"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportZoom((z) => Math.max(0.4, z - 0.15))}
                  className="p-1 hover:bg-slate-200 text-slate-800 rounded"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetViewport}
                  className="p-1 hover:bg-slate-200 text-slate-800 rounded"
                  title="Resetar Posição e Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                  className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-mono"
                  title="Alternar tema de visualização"
                >
                  {viewportTheme === 'light' ? 'Fundo Escuro' : 'Fundo Claro'}
                </button>
              </div>
            </div>

            {/* Stage Central Interativo da Planta */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-[calc(100%-25px)] relative overflow-hidden flex items-center justify-center select-none"
            >
              {/* Rosa dos Ventos / Norte Técnico ABNT */}
              <div className="absolute top-3 right-3 z-20 pointer-events-none flex flex-col items-center opacity-80">
                <Compass className="w-7 h-7 text-red-700" />
                <span className="text-[9px] font-black text-black font-mono">NORTE</span>
              </div>

              {/* Escala Gráfica de Precisão no Canto Inferior Esquerdo */}
              <div className="absolute bottom-3 left-3 z-20 pointer-events-none bg-white/95 p-1.5 border border-black rounded shadow-xs font-mono text-[9px] flex flex-col gap-0.5">
                <div className="flex justify-between w-28 text-[8px] font-bold">
                  <span>0</span>
                  <span>2m</span>
                  <span>5m</span>
                  <span>10m</span>
                </div>
                <div className="w-28 h-2 border border-black flex">
                  <div className="w-1/4 bg-black" />
                  <div className="w-1/4 bg-white" />
                  <div className="w-1/4 bg-black" />
                  <div className="w-1/4 bg-white" />
                </div>
                <div className="text-center font-bold text-[8px]">ESCALA GRÁFICA ({scaleFactor})</div>
              </div>

              {/* CONTAINER TRANSFORMÁVEL DO PLANO (ZOOM + PAN) */}
              <div
                style={{
                  transform: `translate(${viewportPan.x}px, ${viewportPan.y}px) scale(${viewportZoom})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                  width: '100%',
                  height: '100%'
                }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {/* 1. PLANTA ARQUITETÔNICA DE FUNDO */}
                {activeFloor.floorPlanUrl ? (
                  <div
                    className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none p-2"
                    style={{
                      opacity: activeFloor.floorPlanOpacity ?? 0.9,
                      filter: activeFloor.floorPlanInvert ? 'invert(1)' : undefined
                    }}
                  >
                    <img
                      src={activeFloor.floorPlanUrl}
                      crossOrigin="anonymous"
                      alt="Planta de Fundo do Pavimento"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 pointer-events-none">
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
                      <rect className="w-full h-full" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-slate-700 block">
                          Layout Arquitetônico Paramétrico
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {activeFloor.name} ({activeFloor.widthMeters || 40}m x {activeFloor.heightMeters || 28}m)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. OVERLAY VETORIAL: ENTIDADES CAD + SÍMBOLOS ABNT NBR 13434 */}
                <svg
                  viewBox={`0 0 ${worldWidthMm} ${worldHeightMm}`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 10 }}
                >
                  {/* Layout Arquitetônico Paramétrico caso não haja imagem carregada */}
                  {!activeFloor.floorPlanUrl && (
                    <g className="arch-fallback opacity-40">
                      <rect
                        x="500"
                        y="500"
                        width={worldWidthMm - 1000}
                        height={worldHeightMm - 1000}
                        fill="none"
                        stroke={viewportTheme === 'light' ? '#0f172a' : '#94a3b8'}
                        strokeWidth="250"
                      />
                      <line
                        x1="500"
                        y1={worldHeightMm / 2}
                        x2={worldWidthMm - 500}
                        y2={worldHeightMm / 2}
                        stroke={viewportTheme === 'light' ? '#334155' : '#64748b'}
                        strokeWidth="180"
                      />
                      <line
                        x1={worldWidthMm / 2}
                        y1="500"
                        x2={worldWidthMm / 2}
                        y2={worldHeightMm - 500}
                        stroke={viewportTheme === 'light' ? '#334155' : '#64748b'}
                        strokeWidth="180"
                      />
                    </g>
                  )}

                  {/* Renderizador de Entidades CAD Vetoriais */}
                  <CADSvgEntitiesRenderer
                    entities={activeFloor.cadEntities || []}
                    theme={viewportTheme}
                  />

                  {/* Símbolos Locados na Planta */}
                  {activeFloor.placedSymbols.map((sym) => {
                    const symbolDef = symbolsCatalog.find((s) => s.id === sym.symbol_id);
                    if (!symbolDef) return null;

                    if (symbolDisplayMode === 'glyph') {
                      const w = (sym.width || symbolDef.largura || 250) * 1.8;
                      const h = (sym.height || symbolDef.altura || 150) * 1.8;
                      return (
                        <g
                          key={sym.id}
                          transform={`translate(${sym.x}, ${sym.y}) rotate(${sym.rotation})`}
                        >
                          <rect
                            x={-w / 2}
                            y={-h / 2}
                            width={w}
                            height={h}
                            fill={symbolDef.cor_fundo || '#dc2626'}
                            stroke="#ffffff"
                            strokeWidth="25"
                            rx="15"
                          />
                          <text
                            x="0"
                            y={h * 0.15}
                            textAnchor="middle"
                            fill={symbolDef.cor_simbolo || '#ffffff'}
                            fontSize={Math.min(w, h) * 0.45}
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            {symbolDef.codigo_normativo || symbolDef.codigo_interno}
                          </text>
                        </g>
                      );
                    }

                    // Exibição Oficial ABNT NBR 13434 (Selo Circular com Código e Dimensões)
                    const radius = 550;
                    const isFireEquipment = symbolDef.categoria === 'EQUIPAMENTOS' || symbolDef.categoria === 'ALERTA';
                    const badgeBorderColor = isFireEquipment ? '#dc2626' : '#16a34a';

                    return (
                      <g
                        key={sym.id}
                        transform={`translate(${sym.x}, ${sym.y}) rotate(${sym.rotation})`}
                      >
                        <circle
                          r={radius}
                          fill="#ffffff"
                          stroke={badgeBorderColor}
                          strokeWidth="80"
                        />
                        <line
                          x1={-radius}
                          y1="0"
                          x2={radius}
                          y2="0"
                          stroke={badgeBorderColor}
                          strokeWidth="60"
                        />
                        <text
                          x="0"
                          y={-radius * 0.2}
                          textAnchor="middle"
                          fill="#000000"
                          fontSize={radius * 0.65}
                          fontWeight="900"
                          fontFamily="monospace"
                        >
                          {symbolDef.codigo_normativo || symbolDef.codigo_interno}
                        </text>
                        <text
                          x="0"
                          y={radius * 0.65}
                          textAnchor="middle"
                          fill="#475569"
                          fontSize={radius * 0.45}
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {symbolDef.largura}x{symbolDef.altura}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* 2. LEGENDA TÉCNICA DINÂMICA LATERAL NORMATIVA NBR 13434 */}
          <div className="w-72 bg-white flex flex-col justify-between overflow-hidden text-black select-none">
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-2 bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider text-center border-b border-black flex items-center justify-between">
                <span>Legenda Dinâmica</span>
                <span className="text-[10px] text-slate-300 font-mono font-normal">
                  Total: {totalDynamicSignsCount} un
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-1.5 space-y-1 text-[10px]">
                {dynamicLegendItems.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-[10px]">
                    Nenhum símbolo posicionado neste pavimento.
                  </div>
                ) : (
                  dynamicLegendItems.map((item) => (
                    <div
                      key={item.symbol.id}
                      className="flex items-center gap-2 p-1 border border-slate-200 rounded hover:bg-slate-50 transition"
                    >
                      <div className="w-10 h-7 shrink-0 flex items-center justify-center bg-slate-100 rounded border border-slate-300 overflow-hidden">
                        <SymbolGlyph symbol={item.symbol} width={26} height={26} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <span className="text-red-700 font-mono text-[11px]">
                              {item.symbol.codigo_normativo || item.symbol.codigo_interno}
                            </span>
                            <span
                              className="w-1.5 h-1.5 rounded-full inline-block"
                              style={{ backgroundColor: item.categoryColor }}
                              title={item.categoryLabel}
                            />
                          </div>
                          <span className="bg-slate-900 text-white font-mono px-1.5 py-0.5 rounded text-[9px]">
                            {item.count} un
                          </span>
                        </div>
                        <div className="text-[9px] font-semibold text-slate-900 leading-tight truncate">
                          {item.symbol.nome}
                        </div>
                        <div className="text-[8px] font-mono text-slate-500">
                          Dim: {item.dimensions} {includeLegendSpecs && `| Visib: ≤${item.viewDistanceMeters}m`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quadro de Notas Gerais e Exigências Técnicas */}
            <div className="p-2 border-t-2 border-black bg-slate-50 text-[8px] leading-tight text-slate-800">
              <div className="font-bold uppercase tracking-wider text-[9px] text-black border-b border-slate-300 pb-0.5 mb-1">
                Notas Gerais de Projeto
              </div>
              <ol className="list-decimal pl-3 space-y-0.5">
                <li>Sinalização conforme ABNT NBR 13434 e Instruções Técnicas do CB.</li>
                <li>Placas fotoluminescentes com nível de atenuação NBR 16820.</li>
                <li>Fixação a 1,80m do piso acabado ou acima das vergas (2,10m).</li>
                <li>Extintores desobstruídos com sinalização de piso regulamentar.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 3. CARIMBO / SELO TÉCNICO OFICIAL ABNT NBR 6492 (Inferior da Folha 01) */}
        <div className="h-28 bg-white border-t-2 border-black grid grid-cols-12 divide-x-2 divide-black text-[10px] select-none">
          
          {/* Identificação do Projeto / Software */}
          <div className="col-span-3 p-2 flex flex-col justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-700 flex items-center justify-center text-white font-bold text-base shadow-xs">
                SF
              </div>
              <div>
                <strong className="text-xs font-black tracking-tight text-black block leading-none">
                  SIGNAFLUX PRO
                </strong>
                <span className="text-[8px] text-slate-500 font-mono">
                  Fire Safety CAD Platform
                </span>
              </div>
            </div>
            <div className="text-[8px] text-slate-600 border-t border-slate-300 pt-1 leading-tight">
              Projeto em conformidade com ABNT NBR 13434 / NBR 16820 / NBR 6492.
            </div>
          </div>

          {/* Dados do Empreendimento e Proprietário */}
          <div className="col-span-5 p-2 flex flex-col justify-between">
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-bold block">
                Empreendimento / Obra:
              </span>
              <strong className="text-[11px] text-black font-extrabold block truncate leading-tight">
                {empreendimento}
              </strong>
              <span className="text-[9px] text-slate-600 truncate block mt-0.5">
                {endereco}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-bold block">
                Proprietário / Requerente:
              </span>
              <span className="text-[10px] text-slate-800 truncate block">{cliente}</span>
            </div>
          </div>

          {/* Responsável Técnico e ART */}
          <div className="col-span-2 p-2 space-y-0.5">
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-bold block">
                Responsável Técnico:
              </span>
              <strong className="text-[10px] text-black font-bold block truncate">
                {responsavelTecnico}
              </strong>
              <span className="text-[9px] font-mono text-slate-600">{creaCau}</span>
            </div>
            <div className="pt-0.5">
              <span className="text-[8px] text-slate-500 uppercase font-bold block">
                ART / RRT Nº:
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-900">{artRrt}</span>
            </div>
          </div>

          {/* Informações da Prancha, Escala, Data e Revisão */}
          <div className="col-span-2 p-2 flex flex-col justify-between bg-slate-50">
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-bold block">
                Conteúdo da Folha:
              </span>
              <strong className="text-[10px] uppercase text-red-700 font-extrabold block leading-tight">
                SINALIZAÇÃO DE EMERGÊNCIA
              </strong>
              <span className="text-[9px] font-bold text-black">{activeFloor.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-1 border-t border-black text-[9px] font-mono">
              <div>
                <span className="text-slate-500 block text-[8px]">ESCALA:</span>
                <strong className="text-black">{scaleFactor}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px]">DATA:</span>
                <strong className="text-black">{new Date().toLocaleDateString('pt-BR')}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px]">REV:</span>
                <strong className="text-black">{revisao}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px]">PRANCHA:</span>
                <strong className="text-red-700 font-extrabold">01/02</strong>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // RENDER DA FOLHA 02: QUADRO CONSOLIDADO DE ORÇAMENTO E QUANTITATIVOS ABNT (420 x 297 mm)
  const renderBudgetSheet = () => (
    <div
      ref={budgetSheetRef}
      className="a3-sheet-print-container bg-white text-black shadow-2xl relative select-none shrink-0"
      style={{
        width: '1190px',
        height: '841px',
        padding: '35px 35px 35px 88px', // Margens ABNT: 25mm esquerda, 10mm demais
        boxSizing: 'border-box'
      }}
    >
      <div className="w-full h-full border-2 border-black flex flex-col relative overflow-hidden bg-white">
        
        {/* Cabeçalho Técnico do Quadro ABNT */}
        <div className="bg-slate-100 border-b-2 border-black p-3 flex items-center justify-between print:bg-white">
          <div>
            <h1 className="text-xs font-black uppercase tracking-tight text-black">
              QUADRO GERAL CONSOLIDADO DE ORÇAMENTO E QUANTITATIVOS DE SINALIZAÇÃO E EQUIPAMENTOS
            </h1>
            <p className="text-[9px] text-slate-600">
              Projeto Técnico de Prevenção e Combate a Incêndio • Normas ABNT NBR 13434-1/2/3, NBR 16820 e NBR 6492
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-bold block">Escopo da Relação:</span>
              <span className="text-[10px] font-bold text-emerald-800">
                {budgetScope === 'floor' ? `Pavimento: ${activeFloor.name}` : 'Todo o Empreendimento (Global)'}
              </span>
            </div>
            <div className="border-l border-slate-300 pl-3">
              <span className="text-[8px] text-slate-500 uppercase font-bold block">Total de Peças:</span>
              <span className="text-[11px] font-black text-black font-mono">{grandTotalQuantity} un</span>
            </div>
            <div className="border-l border-slate-300 pl-3">
              <span className="text-[8px] text-slate-500 uppercase font-bold block">Valor Total Estimado:</span>
              <span className="text-xs font-black text-emerald-700 font-mono">
                R$ {grandTotalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Tabela Técnica Consolidada (Impressão ABNT em Alta Resolução) */}
        <div className="flex-1 overflow-y-auto p-2 bg-white">
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-slate-900 text-white font-mono uppercase text-[8px] divide-x divide-slate-700">
                <th className="p-1.5 text-center w-8">Item</th>
                <th className="p-1.5 text-center w-14">Código</th>
                <th className="p-1.5 text-center w-10">Pict.</th>
                <th className="p-1.5 text-left">Discriminação Técnica e Especificação do Equipamento / Sinalizador</th>
                <th className="p-1.5 text-center w-24">Dimensões</th>
                <th className="p-1.5 text-center w-28">Fotoluminescência / Mat.</th>
                <th className="p-1.5 text-center w-14">Qtd. (un)</th>
                <th className="p-1.5 text-right w-20">Unit. (R$)</th>
                <th className="p-1.5 text-right w-24">Total (R$)</th>
                <th className="p-1.5 text-left w-28">Fornecedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b-2 border-black">
              {budgetItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400 text-xs">
                    Nenhum equipamento ou sinalização cadastrado para este escopo.
                  </td>
                </tr>
              ) : (
                budgetItems.map((item, index) => (
                  <tr key={item.symbol.id} className="hover:bg-slate-50 divide-x divide-slate-200 leading-tight">
                    <td className="p-1 text-center font-mono text-[8px] text-slate-500">{index + 1}</td>
                    <td className="p-1 text-center font-mono font-bold text-red-700">{item.symbol.codigo_normativo}</td>
                    <td className="p-1 flex items-center justify-center">
                      <div className="w-6 h-5 flex items-center justify-center bg-slate-100 rounded border border-slate-300 overflow-hidden">
                        <SymbolGlyph symbol={item.symbol} width={18} height={18} />
                      </div>
                    </td>
                    <td className="p-1">
                      <span className="font-bold text-slate-900 block">{item.symbol.nome}</span>
                      <span className="text-[8px] text-slate-500 block truncate">{item.symbol.descricao || item.symbol.norma_referencia}</span>
                    </td>
                    <td className="p-1 text-center font-mono text-[8px]">{item.dimensions}</td>
                    <td className="p-1 text-center font-mono text-[8px] text-slate-600">
                      {item.symbol.fotoluminescente_grau || 'NBR 16820 (Classe C)'}
                    </td>
                    <td className="p-1 text-center font-mono font-bold text-black">{item.count}</td>
                    <td className="p-1 text-right font-mono text-slate-700">
                      R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-1 text-right font-mono font-black text-black">
                      R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-1 text-slate-700 text-[8px] truncate">{item.supplierName}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-black divide-x divide-slate-300">
                <td colSpan={6} className="p-1.5 text-right uppercase text-[9px] font-black">
                  TOTAL GERAL DO ORÇAMENTO CONSOLIDADO:
                </td>
                <td className="p-1.5 text-center font-mono font-black text-black text-[10px]">
                  {grandTotalQuantity} un
                </td>
                <td className="p-1.5 text-right font-mono text-slate-500 text-[9px]">-</td>
                <td className="p-1.5 text-right font-mono font-black text-emerald-800 text-[11px]">
                  R$ {grandTotalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-1.5 text-slate-500 text-[8px]">Com BDI e Laudos</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Seção Inferior: Notas Técnicas de Especificação + Carimbo ABNT */}
        <div className="h-44 border-t-2 border-black grid grid-cols-12 divide-x-2 divide-black bg-white select-none">
          
          {/* Resumo Financeiro por Categoria */}
          <div className="col-span-4 p-2 bg-slate-50 flex flex-col justify-between text-[8px]">
            <div>
              <div className="font-bold uppercase tracking-wider text-[9px] text-black border-b border-slate-300 pb-0.5 mb-1.5 flex items-center justify-between">
                <span>Resumo Financeiro por Categoria</span>
                <DollarSign className="w-3 h-3 text-emerald-700" />
              </div>
              <div className="space-y-1">
                {Object.entries(categoryTotals)
                  .filter(([_, data]) => data.count > 0)
                  .map(([catKey, data]) => {
                    const percent = grandTotalBudget > 0 ? (data.total / grandTotalBudget) * 100 : 0;
                    return (
                      <div key={catKey} className="flex justify-between items-center text-[8px]">
                        <span className="text-slate-700 truncate max-w-[140px] font-semibold">{data.label}:</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-slate-500">({percent.toFixed(0)}%)</span>
                          <strong className="text-black">
                            R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="text-[7.5px] text-slate-500 border-t border-slate-200 pt-1 leading-tight">
              * Preços médios de fabricantes homologados (Everlux / TAG). Não inclui mão de obra de instalação.
            </div>
          </div>

          {/* Quadro de Especificação e Critérios Normativos ABNT */}
          <div className="col-span-4 p-2 bg-white text-[8px] leading-snug flex flex-col justify-between">
            <div>
              <div className="font-bold uppercase tracking-wider text-[9px] text-black border-b border-slate-300 pb-0.5 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-red-700" />
                <span>Especificação e Critérios Normativos ABNT</span>
              </div>
              <ul className="list-disc pl-3 space-y-0.5 text-slate-800">
                <li><strong>Fotoluminescência:</strong> Atendimento à NBR 16820 Classe C (mínimo 140 mcd/m² aos 10 min e 20 mcd/m² aos 60 min) comprovada por laudo IPT.</li>
                <li><strong>Incombustibilidade:</strong> Materiais autoextinguíveis com índice de propagação de chama Classe A/B.</li>
                <li><strong>Instalação:</strong> Fixação mecânica ou fita dupla-face estrutural a 1,80m do piso acabado ou 2,10m sobre portas.</li>
                <li><strong>Extintores:</strong> Altura do bico/manômetro máx. 1,60m e base mín. 0,10m do piso.</li>
              </ul>
            </div>
            <div className="text-[7.5px] font-mono text-slate-600 bg-slate-50 p-1 border border-slate-200 rounded">
              ART/RRT Nº {artRrt || 'Cadastrada no CREA/CAU'} vinculada a esta prancha.
            </div>
          </div>

          {/* Selo / Carimbo Oficial ABNT NBR 6492 da Folha 02 */}
          <div className="col-span-4 p-2 flex flex-col justify-between bg-slate-50 text-[9px]">
            <div>
              <div className="flex justify-between items-start border-b border-black pb-1">
                <div>
                  <span className="text-[7.5px] text-slate-500 uppercase font-bold block">Folha do Projeto:</span>
                  <strong className="text-[10px] text-black uppercase font-black">
                    02/02 - ORÇAMENTO E QUANTITATIVOS
                  </strong>
                </div>
                <span className="bg-slate-900 text-white font-mono px-1.5 py-0.5 rounded text-[8px]">
                  {revisao}
                </span>
              </div>

              <div className="pt-1 space-y-0.5 text-[8px]">
                <div>
                  <span className="text-slate-500 block">OBRA:</span>
                  <strong className="text-black block truncate">{empreendimento}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">RESPONSÁVEL TÉCNICO:</span>
                  <strong className="text-black block truncate">{responsavelTecnico} ({creaCau})</strong>
                </div>
              </div>
            </div>

            <div className="border-t border-black pt-1 flex items-center justify-between text-[8px] font-mono">
              <div>
                <span className="text-slate-500 block text-[7px]">ESCALA:</span>
                <strong className="text-black">S/ESC</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[7px]">DATA:</span>
                <strong className="text-black">{new Date().toLocaleDateString('pt-BR')}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[7px]">VISTO / ASSINATURA:</span>
                <span className="text-[8px] font-serif italic text-slate-800">Doc. Digital Assinado</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );

  // ================= FOLHA 03: LEGENDA TÉCNICA DINÂMICA A3 (NBR 13434 / NBR 16820) =================
  const renderLegendSheet = () => (
    <div
      ref={legendSheetRef}
      className="a3-sheet-print-container bg-white text-black shadow-2xl relative overflow-hidden flex flex-col mx-auto"
      style={{
        width: '1190px',
        height: '841px',
        maxWidth: '1190px',
        maxHeight: '841px',
        padding: '25px 15px 15px 35px', // Margens ABNT: Esquerda 25mm (35px), Outras 10mm (15px)
        boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}
    >
      {/* MOLDURA E BORDAS REGULAMENTARES ABNT NBR 6492 */}
      <div className="w-full h-full border-2 border-black flex flex-col relative overflow-hidden bg-white">
        
        {/* CABEÇALHO DA PRANCHA DE LEGENDA */}
        <div className="h-16 bg-slate-900 text-white px-4 flex items-center justify-between border-b-2 border-black shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-red-700 flex items-center justify-center font-black text-lg text-white shadow-xs">
              L3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wider uppercase text-white leading-none">
                  LEGENDA TÉCNICA NORMATIVA & ESPECIFICAÇÕES DE SINALIZAÇÃO DE EMERGÊNCIA
                </h1>
                <span className="bg-red-700 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                  ABNT NBR 13434 / NBR 16820
                </span>
              </div>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                Escopo: {legendScope === 'floor' ? `Pavimento ${activeFloor.name}` : `Edifício Completo (${project.floors.length} pavimentos)`} • {dynamicLegendItems.length} tipos de sinalizadores cadastrados • {totalDynamicSignsCount} unidades no total
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-right">
              <span className="text-[9px] text-slate-400 block leading-none">TOTAL DE PEÇAS</span>
              <strong className="text-emerald-400 text-sm">{totalDynamicSignsCount} un</strong>
            </div>
            <div className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-right">
              <span className="text-[9px] text-slate-400 block leading-none">CATEGORIAS ABNT</span>
              <strong className="text-sky-300 text-sm">{dynamicLegendByCategory.length} classes</strong>
            </div>
          </div>
        </div>

        {/* CORPO PRINCIPAL DA FOLHA DE LEGENDA (Divisão em 2 colunas: Bento Grid de Símbolos + Painel Normativo/Quadro) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUNA ESQUERDA: GRID DE SÍMBOLOS DINÂMICOS COM DETALHES TÉCNICOS */}
          <div className="flex-1 p-3 overflow-y-auto bg-slate-50/50 flex flex-col space-y-3">
            {dynamicLegendItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic p-8 text-center border border-dashed border-slate-300 rounded-lg">
                <FileText className="w-12 h-12 text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-600">Nenhum símbolo posicionado no escopo selecionado.</p>
                <p className="text-xs text-slate-400 mt-1">Adicione sinalizadores no editor gráfico para compor a legenda técnica oficial.</p>
              </div>
            ) : (
              dynamicLegendByCategory.map((catGroup) => (
                <div key={catGroup.categoryKey} className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
                  {/* Cabeçalho da Categoria */}
                  <div
                    className="px-2.5 py-1 text-white font-mono flex items-center justify-between text-[9.5px] font-bold"
                    style={{ backgroundColor: catGroup.meta.color }}
                  >
                    <span className="uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white/80" />
                      {catGroup.meta.label}
                    </span>
                    <span className="bg-black/30 px-1.5 py-0.5 rounded text-[8.5px]">
                      {catGroup.items.length} itens ({catGroup.totalCount} un)
                    </span>
                  </div>

                  {/* Grid de Cards dos Símbolos desta Categoria */}
                  <div className="p-2 grid grid-cols-2 gap-2 text-[9px]">
                    {catGroup.items.map((item) => (
                      <div
                        key={item.symbol.id}
                        className="border border-slate-200 rounded p-1.5 bg-white flex items-start gap-2 hover:bg-slate-50 transition"
                      >
                        {/* Pictograma Vetorial */}
                        <div className="w-12 h-10 shrink-0 flex items-center justify-center bg-slate-50 rounded border border-slate-300 p-0.5 overflow-hidden">
                          <SymbolGlyph symbol={item.symbol} width={38} height={38} />
                        </div>

                        {/* Informações Técnicas e Normativas */}
                        <div className="flex-1 min-w-0 leading-tight">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-black text-red-700 font-mono text-[10px]">
                              {item.symbol.codigo_normativo || item.symbol.codigo_interno}
                            </span>
                            <span className="font-bold font-mono text-[8.5px] bg-slate-100 text-slate-900 px-1 rounded border border-slate-300">
                              {item.count} un
                            </span>
                          </div>

                          <div className="font-bold text-slate-900 text-[9px] truncate" title={item.symbol.nome}>
                            {item.symbol.nome}
                          </div>

                          <div className="text-[8px] text-slate-500 flex flex-wrap gap-x-2 mt-0.5">
                            <span>Dim: <strong className="text-slate-700 font-mono">{item.dimensions}</strong></span>
                            <span>Visib: <strong className="text-slate-700 font-mono">≤ {item.viewDistanceMeters}m</strong></span>
                          </div>

                          <div className="text-[7.5px] text-slate-600 mt-0.5 font-mono truncate">
                            Fotolum: {item.luminance}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* COLUNA DIREITA (340px): REQUISITOS NORMATIVOS, CRITÉRIOS DE INSTALAÇÃO E RESUMO */}
          <div className="w-[340px] shrink-0 border-l-2 border-black flex flex-col bg-white overflow-hidden text-[9px]">
            {/* 1. QUADRO DE NOTAS TÉCNICAS E DIRETRIZES DO CORPO DE BOMBEIROS */}
            <div className="p-3 bg-slate-50 border-b-2 border-black space-y-2">
              <div className="font-bold uppercase tracking-wider text-[10px] text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>DIRETRIZES DE INSTALAÇÃO</span>
                <span className="text-[8px] font-mono text-slate-500">ABNT NBR 13434</span>
              </div>
              <ul className="space-y-1 text-[8.5px] text-slate-700 leading-tight">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Altura padrão:</strong> Instalação a 1,80 m do piso acabado medidos até a base da placa.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Portas de saída:</strong> Placas sobre vergas instaladas diretamente acima do vão, a 2,10 m a 2,50 m.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Extintores e Hidrantes:</strong> Placa de identificação imediatamente acima do equipamento, com sinalização de solo regulamentar (1,00 x 1,00 m).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Fotoluminescência:</strong> Atender requisitos NBR 16820 Classe C com ensaio fotométrico comprovado pelo fabricante.</span>
                </li>
              </ul>
            </div>

            {/* 2. QUADRO RESUMO DE QUANTITATIVOS POR CLASSE NORMATIVA */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col">
              <div className="font-bold uppercase tracking-wider text-[10px] text-slate-900 border-b border-slate-300 pb-1 mb-2">
                RESUMO POR CLASSE DE SINALIZAÇÃO
              </div>
              <table className="w-full border-collapse text-[8.5px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono uppercase text-[7.5px]">
                    <th className="p-1 text-left">Classe / Grupo</th>
                    <th className="p-1 text-center w-12">Tipos</th>
                    <th className="p-1 text-right w-14">Total (un)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dynamicLegendByCategory.map((cg) => (
                    <tr key={cg.categoryKey} className="hover:bg-slate-50">
                      <td className="p-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cg.meta.color }} />
                        <span className="font-semibold text-slate-800 truncate" title={cg.meta.label}>
                          {cg.meta.label.split(' ')[0]} {cg.meta.label.split(' ')[1] || ''}
                        </span>
                      </td>
                      <td className="p-1 text-center font-mono text-slate-600">{cg.items.length}</td>
                      <td className="p-1 text-right font-mono font-bold text-slate-900">{cg.totalCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black bg-slate-100 font-bold">
                    <td className="p-1 text-slate-900 uppercase">Total Geral</td>
                    <td className="p-1 text-center font-mono text-slate-900">{dynamicLegendItems.length}</td>
                    <td className="p-1 text-right font-mono text-emerald-800 text-[9px]">{totalDynamicSignsCount}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Notas de Responsabilidade Técnica */}
              <div className="mt-auto pt-3 border-t border-slate-200 text-[8px] text-slate-500">
                <p>• As placas devem ser fixadas de maneira segura e indelével.</p>
                <p>• Inspeção periódica conforme ABNT NBR 16820 a cada 6 meses.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CARIMBO / SELO TÉCNICO OFICIAL ABNT NBR 6492 NO RODAPÉ */}
        <div className="h-28 bg-white border-t-2 border-black grid grid-cols-12 divide-x-2 divide-black text-[10px] select-none shrink-0">
          {/* Identificação do Projeto / Software */}
          <div className="col-span-3 p-2 flex flex-col justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-700 flex items-center justify-center text-white font-bold text-base shadow-xs">
                SF
              </div>
              <div>
                <strong className="text-xs font-black tracking-tight text-black block leading-none">
                  SIGNAFLUX PRO
                </strong>
                <span className="text-[8px] text-slate-500 font-mono">
                  Fire Safety CAD Platform
                </span>
              </div>
            </div>
            <div className="text-[8px] text-slate-600 border-t border-slate-300 pt-1 leading-tight">
              Sistema Integrado de Prevenção e Combate a Incêndio • Normas ABNT NBR 13434 / 16820
            </div>
          </div>

          {/* Dados do Empreendimento e Local */}
          <div className="col-span-4 p-2 flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-bold text-slate-400 block uppercase leading-none mb-0.5">
                Empreendimento / Obra
              </span>
              <strong className="text-xs text-black block truncate">
                {empreendimento || project.nome}
              </strong>
              <span className="text-[9px] text-slate-600 block truncate">
                {endereco || 'Localização não informada'}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-0.5 flex justify-between text-[8px] text-slate-500">
              <span>Cliente: <strong className="text-black">{cliente || 'Não informado'}</strong></span>
              <span>Data: <strong className="text-black">{new Date().toLocaleDateString('pt-BR')}</strong></span>
            </div>
          </div>

          {/* Conteúdo da Prancha e Responsável Técnico */}
          <div className="col-span-3 p-2 flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-bold text-slate-400 block uppercase leading-none mb-0.5">
                Conteúdo da Folha
              </span>
              <strong className="text-[11px] text-black block leading-tight font-black uppercase">
                LEGENDA TÉCNICA NORMATIVA
              </strong>
              <span className="text-[9px] text-slate-700 block">
                Especificações e Diretrizes de Sinalização de Emergência
              </span>
            </div>
            <div className="border-t border-slate-200 pt-0.5 text-[8px] text-slate-600 flex justify-between">
              <span>Resp: <strong className="text-black">{responsavelTecnico || 'Engenharia'}</strong></span>
              <span>CREA/CAU: <strong className="text-black">{creaCau || 'S/N'}</strong></span>
            </div>
          </div>

          {/* Código da Prancha, Escala e Folha */}
          <div className="col-span-2 p-2 flex flex-col justify-between bg-slate-50 text-right">
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-bold text-slate-500 uppercase">REV.</span>
              <strong className="text-xs font-mono text-black">{revisao}</strong>
            </div>
            <div>
              <span className="text-[8px] font-bold text-slate-400 block uppercase leading-none">
                PRANCHA
              </span>
              <strong className="text-base font-black font-mono text-red-700 tracking-tight block">
                FOLHA 03/03
              </strong>
              <span className="text-[8px] text-slate-500 font-mono block">
                FORMATO A3 (420x297mm)
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans print:p-0 print:bg-white print:text-black">
      {/* Input oculto para importação de imagem de planta */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.dxf"
        className="hidden"
        onChange={handleImportPlanImage}
      />

      {/* ================= BARRA DE FERRAMENTAS SUPERIOR (Oculta na Impressão) ================= */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                Pranchas A3 & Caderno Técnico (ABNT NBR 6492 / NBR 13434)
              </h2>
              <span className="text-[10px] text-slate-400 block">
                Prancha Gráfica com Planta de Fundo Real + Quadro Consolidado de Orçamento
              </span>
            </div>
          </div>

          {/* Seletor de Folha Ativa */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 ml-2">
            <button
              onClick={() => setActiveSheetTab('unified')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                activeSheetTab === 'unified' ? 'bg-red-600 text-white shadow ring-1 ring-red-400/50' : 'text-slate-400 hover:text-white'
              }`}
              title="Prancha única com Planta Baixa, Legenda Normativa e Tabela Consolidada ABNT"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Prancha A3 Integrada
            </button>
            <button
              onClick={() => setActiveSheetTab('drawing')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                activeSheetTab === 'drawing' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Folha 01: Prancha Gráfica
            </button>
            <button
              onClick={() => setActiveSheetTab('budget')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                activeSheetTab === 'budget' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Folha 02: Orçamento ABNT
            </button>
            <button
              onClick={() => setActiveSheetTab('legend')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                activeSheetTab === 'legend' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Folha 03: Legenda Dinâmica
            </button>
            <button
              onClick={() => setActiveSheetTab('both')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                activeSheetTab === 'both' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Dossiê Completo
            </button>
          </div>

          {/* Seletor de Pavimento */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">Pavimento:</span>
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

          {/* Seleção de Escala Técnica (apenas na folha de desenho ou integrada) */}
          {(activeSheetTab === 'drawing' || activeSheetTab === 'unified' || activeSheetTab === 'both') && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
              <span className="text-slate-400 text-[11px]">Escala:</span>
              <select
                value={scaleFactor}
                onChange={(e) => setScaleFactor(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold"
              >
                <option value="1:50">1:50</option>
                <option value="1:75">1:75</option>
                <option value="1:100">1:100</option>
                <option value="1:125">1:125</option>
                <option value="1:200">1:200</option>
                <option value="1:250">1:250</option>
              </select>
            </div>
          )}

          {/* Modo de Exibição do Símbolo */}
          {(activeSheetTab === 'drawing' || activeSheetTab === 'unified' || activeSheetTab === 'both') && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setSymbolDisplayMode('badge')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  symbolDisplayMode === 'badge' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Notação Oficial NBR 13434 (círculo dividido com código normativo)"
              >
                Selo NBR
              </button>
              <button
                onClick={() => setSymbolDisplayMode('glyph')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  symbolDisplayMode === 'glyph' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Placa Fotoluminescente Real (pictograma)"
              >
                Placa Real
              </button>
            </div>
          )}

          {/* Filtro de Escopo do Orçamento (quando na folha de orçamento) */}
          {activeSheetTab === 'budget' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
              <span className="text-slate-400 text-[11px]">Escopo Orçado:</span>
              <select
                value={budgetScope}
                onChange={(e) => setBudgetScope(e.target.value as 'floor' | 'project')}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
              >
                <option value="floor">Apenas {activeFloor.name}</option>
                <option value="project">Todo o Empreendimento (Global)</option>
              </select>
            </div>
          )}

          {/* Controles Específicos da Legenda Dinâmica (quando na folha de legenda) */}
          {activeSheetTab === 'legend' && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Escopo:</span>
                <select
                  value={legendScope}
                  onChange={(e) => setLegendScope(e.target.value as 'floor' | 'project')}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                >
                  <option value="floor">Pavimento ({activeFloor.name})</option>
                  <option value="project">Todo o Empreendimento (Global)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Agrupar:</span>
                <select
                  value={legendGrouping}
                  onChange={(e) => setLegendGrouping(e.target.value as 'category' | 'code')}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="category">Por Categoria ABNT</option>
                  <option value="code">Por Código</option>
                </select>
              </div>

              <button
                onClick={() => setIncludeLegendSpecs(!includeLegendSpecs)}
                className={`px-2 py-1 rounded text-xs font-semibold transition border ${
                  includeLegendSpecs 
                    ? 'bg-slate-800 border-sky-500 text-sky-300' 
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
                title="Exibir cálculo de distância máxima de visibilidade e especificações técnicas"
              >
                {includeLegendSpecs ? '✓ Specs & Visibilidade' : 'Specs Simples'}
              </button>
            </div>
          )}
        </div>

        {/* Controles de Ação, Exportação jsPDF e Impressão */}
        <div className="flex items-center gap-2">
          {/* Botão Salvar Projeto */}
          {onSaveProject && (
            <button
              onClick={onSaveProject}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition"
              title="Salvar Projeto (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar
            </button>
          )}

          {/* Botão Editar Selo/Carimbo */}
          <button
            onClick={() => setIsEditingTitleBlock(!isEditingTitleBlock)}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
              isEditingTitleBlock
                ? 'bg-amber-950 border-amber-700 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Editar Carimbo
          </button>

          {/* BOTÃO PRINCIPAL 1-CLIQUE: EXPORTAR PDF A3 (jsPDF) */}
          <button
            onClick={handleQuickPdfExport}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold rounded-lg shadow-lg flex items-center gap-1.5 transition text-xs border border-red-400/30 disabled:opacity-50"
            title="Exportar Prancha A3 Paisagem diretamente em PDF oficial ABNT via jsPDF"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>EXPORTAR PDF A3</span>
            <span className="bg-red-950/70 text-red-200 text-[9px] px-1 py-0.2 rounded font-mono">jsPDF</span>
          </button>

          {/* BOTÃO CONFIGURAR EXPORTAÇÃO PDF */}
          <button
            onClick={() => setShowPdfConfigModal(true)}
            disabled={isExporting}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition text-xs"
            title="Configurar opções de resolução, escopo, camadas e folhas"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>CONFIGURAR EXPORTAÇÃO PDF</span>
          </button>

          {/* Menu Dropdown de Opções Rápidas */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition"
              title="Opções de Download Rápido"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-76 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-slate-200">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Formatos de Documento ABNT
                </div>

                {/* Opção 01: Prancha Integrada */}
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExecutePdfExport(createExportConfig({ content: 'unified' }));
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-800 flex items-start gap-2.5 text-white transition bg-red-950/20"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      Prancha A3 Integrada (1 Folha)
                      <span className="bg-red-900/80 text-red-200 text-[9px] px-1 rounded font-mono">Recomendado</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Planta + Legenda de Símbolos + Tabela Consolidada ABNT
                    </div>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1" />

                {/* Opção 02: Dossiê Completo 3 Folhas */}
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExecutePdfExport(createExportConfig({ 
                      content: 'dossier',
                      includeLegendSheetInDossier: true
                    }));
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-800 flex items-start gap-2.5 text-white transition"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Caderno Técnico Completo (3 Folhas A3)</div>
                    <div className="text-[10px] text-slate-400">
                      Folha 01 (Gráfica) + Folha 02 (Orçamento) + Folha 03 (Legenda Técnica Dinâmica)
                    </div>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExecutePdfExport(createExportConfig({ content: 'drawing' }));
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-start gap-2 text-slate-200 transition"
                >
                  <ImageIcon className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs">Folha 01: Prancha Gráfica A3</div>
                    <div className="text-[10px] text-slate-400">Planta baixa com símbolos e carimbo</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExecutePdfExport(createExportConfig({ content: 'budget' }));
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-start gap-2 text-slate-200 transition"
                >
                  <Table className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs">Folha 02: Orçamento ABNT A3</div>
                    <div className="text-[10px] text-slate-400">Tabela de custos, quantitativos e laudos</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExecutePdfExport(createExportConfig({ content: 'legend_sheet' }));
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-start gap-2 text-emerald-300 transition"
                >
                  <ListFilter className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs">Folha 03: Legenda Dinâmica A3</div>
                    <div className="text-[10px] text-slate-400">Diretrizes NBR 13434, distâncias e cards técnicos</div>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  onClick={handleExportImageHD}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300 transition"
                >
                  <Download className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Baixar Imagem HD (PNG 300 DPI)</span>
                </button>

                {onOpenExportDxf && (
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onOpenExportDxf();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-sky-400 transition"
                  >
                    <FileCode className="w-4 h-4 shrink-0" />
                    <span>Exportar Desenho CAD (.DXF)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Botão de Impressão Direta */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-semibold flex items-center gap-1.5 shadow transition"
            title="Imprimir prancha técnica em tamanho A3 Paisagem"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir A3</span>
          </button>
        </div>
      </div>

      {/* Notificação Flutuante de Exportação Ativa */}
      {isExporting && !showPdfConfigModal && (
        <div className="fixed top-16 right-6 bg-slate-900 border border-sky-500 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 text-xs animate-fadeIn">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <span className="font-bold text-white block">{exportMessage}</span>
            <span className="text-[10px] text-sky-400 font-mono">jsPDF renderizando documento oficial ABNT</span>
          </div>
        </div>
      )}

      {/* Painel Retrátil de Edição do Carimbo / Selo ABNT NBR 6492 */}
      {isEditingTitleBlock && (
        <div className="bg-slate-900 border-b border-amber-900/50 p-3 text-xs flex flex-wrap items-end gap-3 shrink-0 print:hidden z-10 animate-fadeIn">
          <div>
            <label className="text-[10px] text-slate-400 block font-bold mb-1">Empreendimento / Obra</label>
            <input
              type="text"
              value={empreendimento}
              onChange={(e) => setEmpreendimento(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-52"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block font-bold mb-1">Proprietário / Cliente</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-48"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block font-bold mb-1">Endereço Completo</label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-64"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block font-bold mb-1">Responsável Técnico</label>
            <input
              type="text"
              value={responsavelTecnico}
              onChange={(e) => setResponsavelTecnico(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-44"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block font-bold mb-1">CREA / CAU</label>
            <input
              type="text"
              value={creaCau}
              onChange={(e) => setCreaCau(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-32"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block font-bold mb-1">ART / RRT</label>
            <input
              type="text"
              value={artRrt}
              onChange={(e) => setArtRrt(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-32"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block font-bold mb-1">Revisão</label>
            <input
              type="text"
              value={revisao}
              onChange={(e) => setRevisao(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-20 font-mono text-center font-bold"
            />
          </div>
          <button
            onClick={handleSaveTitleBlock}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-1 transition"
          >
            <Check className="w-3.5 h-3.5" />
            Salvar Dados
          </button>
        </div>
      )}

      {/* ================= ÁREA DE VISUALIZAÇÃO DAS FOLHAS A3 ================= */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start gap-8 print:p-0 print:overflow-visible">
        
        {/* PRANCHA A3 INTEGRADA: Visível quando ativa */}
        {activeSheetTab === 'unified' && (
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:hidden flex items-center gap-1.5">
              <span className="bg-red-900 text-red-200 px-2 py-0.5 rounded font-mono">PRANCHA INTEGRADA 01/01</span>
              <span>PLANTA BAIXA + LEGENDA DE SÍMBOLOS + TABELA CONSOLIDADA DE QUANTITATIVOS ABNT</span>
            </div>
            {renderUnifiedSheet()}
          </div>
        )}

        {/* FOLHA 01: Visível quando ativa */}
        {(activeSheetTab === 'drawing' || activeSheetTab === 'both') && (
          <div className="flex flex-col items-center page-break-after">
            {activeSheetTab === 'both' && (
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:hidden flex items-center gap-1.5">
                <span className="bg-sky-900 text-sky-200 px-2 py-0.5 rounded font-mono">FOLHA 01 / 03</span>
                <span>PRANCHA GRÁFICA DE SINALIZAÇÃO E EQUIPAMENTOS</span>
              </div>
            )}
            {renderDrawingSheet()}
          </div>
        )}

        {/* FOLHA 02: Visível quando ativa */}
        {(activeSheetTab === 'budget' || activeSheetTab === 'both') && (
          <div className="flex flex-col items-center page-break-after">
            {activeSheetTab === 'both' && (
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:hidden flex items-center gap-1.5">
                <span className="bg-amber-900 text-amber-200 px-2 py-0.5 rounded font-mono">FOLHA 02 / 03</span>
                <span>QUADRO GERAL CONSOLIDADO DE ORÇAMENTO E QUANTITATIVOS ABNT</span>
              </div>
            )}
            {renderBudgetSheet()}
          </div>
        )}

        {/* FOLHA 03: LEGENDA DINÂMICA: Visível quando ativa */}
        {(activeSheetTab === 'legend' || activeSheetTab === 'both') && (
          <div className="flex flex-col items-center">
            {activeSheetTab === 'both' && (
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:hidden flex items-center gap-1.5">
                <span className="bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-mono">FOLHA 03 / 03</span>
                <span>LEGENDA TÉCNICA NORMATIVA & DIRETRIZES DE SINALIZAÇÃO ABNT NBR 13434</span>
              </div>
            )}
            {activeSheetTab === 'legend' && (
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:hidden flex items-center gap-1.5">
                <span className="bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-mono">FOLHA 03 (LEGENDA DINÂMICA)</span>
                <span>LEGENDA TÉCNICA NORMATIVA & ESPECIFICAÇÕES ABNT NBR 13434 / NBR 16820</span>
              </div>
            )}
            {renderLegendSheet()}
          </div>
        )}

      </div>

      {/* MODAL DE CONFIGURAÇÃO DE EXPORTAÇÃO PDF A3 (CONFIGURAR EXPORTAÇÃO PDF) */}
      <ExportPdfConfigModal
        isOpen={showPdfConfigModal}
        onClose={() => setShowPdfConfigModal(false)}
        project={project}
        activeFloor={activeFloor}
        scaleFactor={scaleFactor}
        grandTotalQuantity={grandTotalQuantity}
        grandTotalBudget={grandTotalBudget}
        isGenerating={isExporting}
        progressMessage={exportMessage}
        progressPercent={progressPercent}
        onExecuteExport={handleExecutePdfExport}
      />
    </div>
  );
};

/**
 * Função utilitária autônoma para exportação de pranchas A3 em PDF paisagem (420 x 297 mm)
 * Captura o conteúdo do container '.a3-sheet-print-container' via html2canvas e jsPDF
 * com alta fidelidade para plantas, símbolos e tabelas ABNT.
 */
export async function exportPranchasA3ToPdf(
  containerSelector: string = '.a3-sheet-print-container',
  options?: {
    quality?: 'draft' | 'high' | 'ultra';
    imageFormat?: 'jpeg' | 'png';
    fileName?: string;
  }
): Promise<jsPDF | null> {
  const containers = Array.from(document.querySelectorAll<HTMLElement>(containerSelector));
  if (containers.length === 0) {
    console.error(`Nenhum contêiner '${containerSelector}' encontrado para exportação.`);
    return null;
  }

  const scale = options?.quality === 'ultra' ? 3.0 : options?.quality === 'draft' ? 1.8 : 2.5;
  const isPng = options?.imageFormat === 'png';
  const imgType = isPng ? 'image/png' : 'image/jpeg';
  const pdfFormatType = isPng ? 'PNG' : 'JPEG';
  const compression = isPng ? undefined : 0.98;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3', // exatamente 420 x 297 mm
    compress: true
  });

  for (let i = 0; i < containers.length; i++) {
    const canvas = await html2canvas(containers[i], {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      windowWidth: 1190,
      windowHeight: 841,
      scrollX: 0,
      scrollY: 0,
      onclone: (_clonedDoc, clonedEl) => {
        clonedEl.style.transform = 'none';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.margin = '0';
        const svgs = clonedEl.querySelectorAll('svg');
        svgs.forEach((svg) => {
          svg.setAttribute('shape-rendering', 'geometricPrecision');
          svg.setAttribute('text-rendering', 'geometricPrecision');
        });
      }
    });

    const imgData = canvas.toDataURL(imgType, compression);
    if (i > 0) {
      doc.addPage('a3', 'landscape');
    }
    doc.addImage(imgData, pdfFormatType, 0, 0, 420, 297, undefined, 'FAST');
  }

  if (options?.fileName) {
    const safeName = options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`;
    doc.save(safeName);
  }

  return doc;
}

// Vincula ao escopo global para acesso programático e testes caso necessário
if (typeof window !== 'undefined') {
  (window as any).exportPranchasA3ToPdf = exportPranchasA3ToPdf;
}
