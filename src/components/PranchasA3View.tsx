import React, { useState, useRef } from 'react';
import { Project, Floor, SignSymbol } from '../types/cad';
import { SymbolGlyph } from './SymbolGlyph';
import { CADSvgEntitiesRenderer } from './cad/CADSvgEntitiesRenderer';
import { 
  Printer, Download, FileText, Layers, CheckCircle2, 
  ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, Save,
  FileCode, Settings, Compass, Sparkles, Sliders, Check
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PranchasA3ViewProps {
  project: Project;
  symbolsCatalog: SignSymbol[];
  onUpdateProject?: (project: Project) => void;
  onUpdateFloor?: (floor: Floor) => void;
  onSaveProject?: () => void;
  onExportBackup?: () => void;
  onOpenExportDxf?: () => void;
}

export const PranchasA3View: React.FC<PranchasA3ViewProps> = ({
  project,
  symbolsCatalog,
  onUpdateProject,
  onUpdateFloor,
  onSaveProject,
  onExportBackup,
  onOpenExportDxf
}) => {
  const [selectedFloorId, setSelectedFloorId] = useState<string>(project.floors[0]?.id || '');
  const activeFloor = project.floors.find((f) => f.id === selectedFloorId) || project.floors[0];

  // Configurações visuais da prancha
  const [scaleFactor, setScaleFactor] = useState<string>('1:100');
  const [viewportTheme, setViewportTheme] = useState<'light' | 'dark'>('light');
  const [symbolDisplayMode, setSymbolDisplayMode] = useState<'badge' | 'glyph'>('badge');
  const [viewportZoom, setViewportZoom] = useState<number>(1.0);
  const [viewportPan, setViewportPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');

  // Edição rápida dos dados do Carimbo / Selo ABNT NBR 6492
  const [isEditingTitleBlock, setIsEditingTitleBlock] = useState<boolean>(false);
  const [empreendimento, setEmpreendimento] = useState<string>(project.empreendimento || project.nome);
  const [cliente, setCliente] = useState<string>(project.cliente || '');
  const [endereco, setEndereco] = useState<string>(project.endereco || '');
  const [responsavelTecnico, setResponsavelTecnico] = useState<string>(project.responsavel_tecnico || '');
  const [creaCau, setCreaCau] = useState<string>(project.crea_cau || '');
  const [artRrt, setArtRrt] = useState<string>(project.art_rrt || '');
  const [pranchaNumero, setPranchaNumero] = useState<string>('01/01');
  const [revisao, setRevisao] = useState<string>(project.revisao || 'R00');

  const sheetRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Símbolos utilizados neste pavimento com contagem
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

  // ================= EXPORTAÇÃO E IMPRESSÃO =================

  // 1. Impressão Direta (A3 Paisagem)
  const handlePrint = () => {
    document.body.classList.add('printing-prancha');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-prancha');
    }, 1000);
  };

  // 2. Exportar PDF A3 de Alta Resolução (420mm x 297mm)
  const handleDownloadPdfA3 = async () => {
    if (!sheetRef.current) return;
    try {
      setIsExporting(true);
      setExportMessage('Gerando PDF A3 de alta definição...');
      await new Promise((r) => setTimeout(r, 100));

      const sheetEl = sheetRef.current;
      const canvas = await html2canvas(sheetEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [420, 297]
      });

      doc.addImage(imgData, 'JPEG', 0, 0, 420, 297, undefined, 'FAST');
      const filename = `PRANCHA_A3_${project.nome.replace(/\s+/g, '_')}_${activeFloor.name.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
      setExportMessage('PDF A3 gerado com sucesso!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (err: any) {
      console.error('Erro ao gerar PDF A3:', err);
      alert('Erro ao gerar PDF A3: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Exportar Imagem HD (PNG 300 DPI)
  const handleExportImageHD = async () => {
    if (!sheetRef.current) return;
    try {
      setIsExporting(true);
      setExportMessage('Exportando imagem HD da Prancha A3...');
      await new Promise((r) => setTimeout(r, 100));

      const sheetEl = sheetRef.current;
      const canvas = await html2canvas(sheetEl, {
        scale: 2.8,
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

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans print:p-0 print:bg-white print:text-black">
      {/* Hidden input para importação rápida de imagem de planta */}
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
                Prancha Técnica A3 (ABNT NBR 6492 / NBR 13434)
              </h2>
              <span className="text-[10px] text-slate-400 block">
                Planta Baixa Plotada com Planta de Fundo Real e Notação Normativa para Bombeiros
              </span>
            </div>
          </div>

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

          {/* Seleção de Escala Técnica */}
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

          {/* Modo de Exibição do Símbolo */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSymbolDisplayMode('badge')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                symbolDisplayMode === 'badge' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Notação Oficial NBR 13434 (círculo dividido com código normativo)"
            >
              Selo NBR 13434
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

          {/* Alternar Fundo Técnico Branco vs Escuro */}
          <button
            onClick={() => setViewportTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
              viewportTheme === 'light'
                ? 'bg-slate-800 text-amber-300 border-slate-700'
                : 'bg-slate-950 text-slate-300 border-slate-800'
            }`}
            title="Alternar entre Papel Branco de Plotagem e Fundo Preto CAD"
          >
            <Sliders className="w-3.5 h-3.5" />
            {viewportTheme === 'light' ? 'Fundo Branco (Plotagem Papel)' : 'Fundo Escuro (Tela CAD)'}
          </button>
        </div>

        {/* Ações de Exportação, Impressão e Salvamento */}
        <div className="flex items-center gap-2">
          {exportMessage && (
            <span className="text-xs text-emerald-400 font-semibold animate-pulse mr-2">
              {exportMessage}
            </span>
          )}

          {/* Botão para Editar Carimbo ABNT */}
          <button
            onClick={() => setIsEditingTitleBlock(!isEditingTitleBlock)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            title="Editar dados do Empreendimento, Proprietário, Responsável Técnico e ART"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            Editar Carimbo
          </button>

          {/* Salvar Projeto */}
          {onSaveProject && (
            <button
              onClick={onSaveProject}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Salvar Projeto no Navegador (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Projeto
            </button>
          )}

          {/* Exportar DXF */}
          {onOpenExportDxf && (
            <button
              onClick={onOpenExportDxf}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Exportar Desenho CAD Nativo (.DXF) compatível com AutoCAD"
            >
              <FileCode className="w-3.5 h-3.5" />
              DXF Nativo
            </button>
          )}

          {/* Exportar Imagem HD */}
          <button
            onClick={handleExportImageHD}
            disabled={isExporting}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            title="Baixar imagem em Alta Resolução (300 DPI) da Prancha A3"
          >
            <Download className="w-3.5 h-3.5" />
            Imagem HD
          </button>

          {/* Exportar PDF A3 */}
          <button
            onClick={handleDownloadPdfA3}
            disabled={isExporting}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 transition"
            title="Exportar Prancha Técnica em PDF no tamanho oficial A3 (420 x 297 mm)"
          >
            <FileText className="w-4 h-4" />
            PDF A3 Oficial
          </button>

          {/* Imprimir Prancha A3 */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 transition"
            title="Imprimir Prancha Técnica A3 diretamente"
          >
            <Printer className="w-4 h-4" />
            Imprimir A3
          </button>
        </div>
      </div>

      {/* Modal / Gaveta de Edição do Carimbo ABNT */}
      {isEditingTitleBlock && (
        <div className="p-4 bg-slate-900 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs z-20 shrink-0 print:hidden">
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">
              Empreendimento / Edificação:
            </label>
            <input
              type="text"
              value={empreendimento}
              onChange={(e) => setEmpreendimento(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">
              Proprietário / Cliente:
            </label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">
              Endereço da Obra:
            </label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">
              Responsável Técnico:
            </label>
            <input
              type="text"
              value={responsavelTecnico}
              onChange={(e) => setResponsavelTecnico(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">
              Registro CREA / CAU:
            </label>
            <input
              type="text"
              value={creaCau}
              onChange={(e) => setCreaCau(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">
              Nº ART / RRT:
            </label>
            <input
              type="text"
              value={artRrt}
              onChange={(e) => setArtRrt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">
              Nº da Prancha / Folha:
            </label>
            <input
              type="text"
              value={pranchaNumero}
              onChange={(e) => setPranchaNumero(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSaveTitleBlock}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded text-xs transition flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Salvar no Projeto
            </button>
            <button
              onClick={() => setIsEditingTitleBlock(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-3 rounded text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ================= ÁREA DA PRANCHA A3 (Scrollável e com Zoom) ================= */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
        {/* Folha A3 (Proporção 420x297 = 1.414, Margens NBR 6492: 25mm esquerda, 10mm demais) */}
        <div
          ref={sheetRef}
          className="a3-sheet-print-container w-full max-w-[1240px] min-h-[820px] bg-white text-slate-900 shadow-2xl p-6 border border-slate-300 flex flex-col justify-between print:border-none print:shadow-none print:m-0 print:max-w-none print:p-3 print:min-h-[96vh] relative select-none"
        >
          {/* Moldura Externa e Margem Técnica ABNT: 25mm esquerda, 10mm direita/superior/inferior */}
          <div className="border-[2.5px] border-black p-3.5 flex flex-col justify-between flex-1 relative">
            
            {/* ================= LINHA PRINCIPAL: VIEWPORT DA PLANTA + LEGENDA ================= */}
            <div className="grid grid-cols-12 gap-3 flex-1 min-h-[560px]">
              
              {/* VIEWPORT DA PLANTA ARQUITETÔNICA (Cols 1 a 9) */}
              <div 
                className={`col-span-9 border-2 border-black relative flex flex-col overflow-hidden ${
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
                        title="Inserir arquivo de imagem, PDF ou DXF da planta baixa"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Carregar Imagem da Planta
                      </button>
                    )}
                    <button
                      onClick={() => setViewportZoom((z) => Math.min(2.5, z + 0.15))}
                      className="p-1 hover:bg-slate-200 text-slate-800 rounded"
                      title="Aumentar Zoom do Viewport"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewportZoom((z) => Math.max(0.4, z - 0.15))}
                      className="p-1 hover:bg-slate-200 text-slate-800 rounded"
                      title="Diminuir Zoom do Viewport"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleResetViewport}
                      className="p-1 hover:bg-slate-200 text-slate-800 rounded text-[10px] font-mono"
                      title="Redefinir Enquadramento 100%"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Área de Desenho SVG Interativa */}
                <div 
                  className="flex-1 relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <svg
                    viewBox={`0 0 ${worldWidthMm} ${worldHeightMm}`}
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      transform: `translate(${viewportPan.x}px, ${viewportPan.y}px) scale(${viewportZoom})`,
                      transformOrigin: 'center center',
                      transition: isPanning ? 'none' : 'transform 0.15s ease-out'
                    }}
                  >
                    {/* Grid técnico sutil de fundo para precisão visual */}
                    <defs>
                      <pattern id="prancha-grid" width="5000" height="5000" patternUnits="userSpaceOnUse">
                        <path 
                          d="M 5000 0 L 0 0 0 5000" 
                          fill="none" 
                          stroke={viewportTheme === 'light' ? '#e2e8f0' : '#1e293b'} 
                          strokeWidth="40" 
                        />
                      </pattern>
                    </defs>
                    <rect width={worldWidthMm} height={worldHeightMm} fill="url(#prancha-grid)" />

                    {/* 1. PLANTA ARQUITETÔNICA DE FUNDO REAL */}
                    {activeFloor.floorPlanUrl ? (
                      <image
                        href={activeFloor.floorPlanUrl}
                        x={activeFloor.floorPlanOffsetX || 0}
                        y={activeFloor.floorPlanOffsetY || 0}
                        width={worldWidthMm * (activeFloor.floorPlanZoom || 1)}
                        height={worldHeightMm * (activeFloor.floorPlanZoom || 1)}
                        opacity={activeFloor.floorPlanOpacity ?? 0.85}
                        style={{
                          filter: activeFloor.floorPlanInvert ? 'invert(1)' : undefined
                        }}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    ) : (
                      /* Layout Arquitetônico Paramétrico de Alvenarias quando não houver imagem carregada */
                      <g className="architectural-default-layout">
                        {/* Paredes Perimetrais Externas */}
                        <rect
                          x="1000"
                          y="1000"
                          width={worldWidthMm - 2000}
                          height={worldHeightMm - 2000}
                          fill="none"
                          stroke={viewportTheme === 'light' ? '#0f172a' : '#cbd5e1'}
                          strokeWidth="350"
                        />
                        {/* Corredor Central de Circulação */}
                        <line
                          x1="1000"
                          y1={worldHeightMm * 0.45}
                          x2={worldWidthMm - 1000}
                          y2={worldHeightMm * 0.45}
                          stroke={viewportTheme === 'light' ? '#334155' : '#94a3b8'}
                          strokeWidth="200"
                        />
                        <line
                          x1="1000"
                          y1={worldHeightMm * 0.55}
                          x2={worldWidthMm - 1000}
                          y2={worldHeightMm * 0.55}
                          stroke={viewportTheme === 'light' ? '#334155' : '#94a3b8'}
                          strokeWidth="200"
                        />
                        {/* Divisórias de Salas / Quartos */}
                        {[0.25, 0.5, 0.75].map((pct, i) => (
                          <g key={i}>
                            <line
                              x1={worldWidthMm * pct}
                              y1="1000"
                              x2={worldWidthMm * pct}
                              y2={worldHeightMm * 0.45}
                              stroke={viewportTheme === 'light' ? '#334155' : '#94a3b8'}
                              strokeWidth="180"
                            />
                            <line
                              x1={worldWidthMm * pct}
                              y1={worldHeightMm * 0.55}
                              x2={worldWidthMm * pct}
                              y2={worldHeightMm - 1000}
                              stroke={viewportTheme === 'light' ? '#334155' : '#94a3b8'}
                              strokeWidth="180"
                            />
                          </g>
                        ))}
                        {/* Textos de Identificação de Ambientes */}
                        <text
                          x={worldWidthMm * 0.5}
                          y={worldHeightMm * 0.5}
                          fill={viewportTheme === 'light' ? '#64748b' : '#94a3b8'}
                          fontSize="700"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          CIRCULAÇÃO / ROTA DE FUGA
                        </text>
                        <text
                          x={worldWidthMm * 0.125}
                          y={worldHeightMm * 0.25}
                          fill={viewportTheme === 'light' ? '#94a3b8' : '#64748b'}
                          fontSize="550"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                        >
                          SALA 01
                        </text>
                        <text
                          x={worldWidthMm * 0.375}
                          y={worldHeightMm * 0.25}
                          fill={viewportTheme === 'light' ? '#94a3b8' : '#64748b'}
                          fontSize="550"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                        >
                          SALA 02
                        </text>
                        <text
                          x={worldWidthMm * 0.625}
                          y={worldHeightMm * 0.25}
                          fill={viewportTheme === 'light' ? '#94a3b8' : '#64748b'}
                          fontSize="550"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                        >
                          SALA 03
                        </text>
                        <text
                          x={worldWidthMm * 0.875}
                          y={worldHeightMm * 0.25}
                          fill={viewportTheme === 'light' ? '#94a3b8' : '#64748b'}
                          fontSize="550"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                        >
                          ESCADA PRESSURIZADA
                        </text>
                      </g>
                    )}

                    {/* 2. TODAS AS ENTIDADES VETORIAIS DO CAD 2D (Linhas, Polilinhas, Paredes, Cotas) */}
                    <CADSvgEntitiesRenderer
                      entities={activeFloor.cadEntities || []}
                      theme={viewportTheme}
                    />

                    {/* 3. SÍMBOLOS DE SINALIZAÇÃO E EQUIPAMENTOS LOCADOS */}
                    {activeFloor.placedSymbols.map((sym) => {
                      const symbolDef = symbolsCatalog.find((s) => s.id === sym.symbol_id);
                      if (!symbolDef) return null;

                      if (symbolDisplayMode === 'glyph') {
                        // Exibição como Placa Real
                        const w = (sym.width || symbolDef.largura || 250) * 3;
                        const h = (sym.height || symbolDef.altura || 150) * 3;
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
                              fill={symbolDef.cor_fundo || '#16a34a'}
                              stroke="#ffffff"
                              strokeWidth="40"
                              rx="20"
                            />
                            <text
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

                      // Exibição Oficial ABNT NBR 13434 (Selo Circular com Código Normativo e Dimensão)
                      const radius = 550;
                      const isFireEquipment = symbolDef.categoria === 'combate' || symbolDef.categoria === 'alarme';
                      const badgeBorderColor = isFireEquipment ? '#dc2626' : '#16a34a';

                      return (
                        <g
                          key={sym.id}
                          transform={`translate(${sym.x}, ${sym.y}) rotate(${sym.rotation})`}
                        >
                          {/* Círculo da Norma NBR 13434 */}
                          <circle
                            r={radius}
                            fill="#ffffff"
                            stroke={badgeBorderColor}
                            strokeWidth="80"
                          />
                          {/* Linha Divisória Central */}
                          <line
                            x1={-radius}
                            y1="0"
                            x2={radius}
                            y2="0"
                            stroke={badgeBorderColor}
                            strokeWidth="60"
                          />
                          {/* Código Normativo (Parte Superior) */}
                          <text
                            y="-90"
                            textAnchor="middle"
                            fill="#0f172a"
                            fontSize="360"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            {symbolDef.codigo_normativo || symbolDef.codigo_interno}
                          </text>
                          {/* Dimensão da Placa em mm (Parte Inferior) */}
                          <text
                            y="320"
                            textAnchor="middle"
                            fill="#334155"
                            fontSize="260"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {sym.width || symbolDef.largura}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Rosa dos Ventos e Escala Gráfica Flutuante no Canto do Viewport */}
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs p-2.5 border-2 border-black rounded text-[10px] text-black font-mono shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold text-red-600">
                        ▲ N
                      </div>
                      <div>
                        <div className="font-bold text-[9px] uppercase tracking-wider">
                          ESCALA GRÁFICA ({scaleFactor})
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-10 h-2 bg-black flex items-center justify-center text-[7px] text-white font-bold">
                            0m
                          </div>
                          <div className="w-10 h-2 bg-white border border-black flex items-center justify-center text-[7px] text-black font-bold">
                            2m
                          </div>
                          <div className="w-10 h-2 bg-black flex items-center justify-center text-[7px] text-white font-bold">
                            4m
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUNA DA LEGENDA NORMATIVA ABNT NBR 13434 (Cols 10 a 12) */}
              <div className="col-span-3 border-2 border-black flex flex-col justify-between text-[10px] bg-white">
                {/* Título da Legenda */}
                <div>
                  <div className="bg-black text-white font-bold p-1.5 text-center uppercase tracking-wider text-[11px]">
                    Legenda de Sinalização e Equipamentos
                  </div>
                  <div className="p-1.5 bg-slate-100 border-b border-black text-[9px] text-slate-700 flex justify-between font-mono">
                    <span>NBR 13434 / IT-20</span>
                    <span className="font-bold text-red-700">{totalSignsCount} ITENS NO PAVIMENTO</span>
                  </div>

                  {/* Lista de Símbolos Presentes no Pavimento */}
                  <div className="p-2 space-y-2 max-h-[460px] overflow-y-auto">
                    {legendList.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        Nenhum símbolo locado neste pavimento.
                      </div>
                    ) : (
                      legendList.map((item) => (
                        <div
                          key={item.symbol.id}
                          className="flex items-start gap-2 pb-2 border-b border-slate-200"
                        >
                          <div className="w-9 h-9 shrink-0 bg-slate-50 p-0.5 border border-black flex items-center justify-center">
                            <SymbolGlyph symbol={item.symbol} width={32} height={32} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold flex justify-between items-center">
                              <span className="text-red-700 font-mono text-[11px]">
                                {item.symbol.codigo_normativo}
                              </span>
                              <span className="bg-slate-900 text-white font-mono px-1.5 py-0.5 rounded text-[9px]">
                                {item.count} un
                              </span>
                            </div>
                            <div className="text-[9px] font-semibold text-slate-900 leading-tight truncate">
                              {item.symbol.nome}
                            </div>
                            <div className="text-[8px] font-mono text-slate-500">
                              Dim: {item.symbol.largura}x{item.symbol.altura} mm | {item.symbol.distancia_maxima}m
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
                    Notas Gerais de PPCI (NBR 13434 / NBR 16820):
                  </div>
                  <ol className="list-decimal pl-3 space-y-0.5">
                    <li>Sinalização fotoluminescente com autonomia mínima de 140 mcd/m² aos 10 min e 20 mcd/m² aos 60 min.</li>
                    <li>Altura de fixação: placas de rota de saída a 1,80m a 2,20m do piso acabado.</li>
                    <li>Placas de extintores e hidrantes instaladas a 1,80m do piso acabado.</li>
                    <li>Qualquer divergência de obra deve ser comunicada ao responsável técnico.</li>
                  </ol>
                </div>
              </div>

            </div>

            {/* ================= SELO / CARIMBO TÉCNICO ABNT NBR 6492 ================= */}
            <div className="mt-3 border-2 border-black grid grid-cols-12 text-black text-xs divide-x divide-black bg-white">
              {/* Logo e Identificação do Sistema */}
              <div className="col-span-3 p-2.5 flex flex-col justify-center bg-slate-50">
                <div className="font-extrabold text-sm tracking-tight text-slate-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-sm inline-block" />
                  SIGNAFLUX CAD AI
                </div>
                <div className="text-[10px] text-slate-700 uppercase font-bold mt-0.5">
                  Sygma SMS Engenharia de Segurança
                </div>
                <div className="text-[8px] text-slate-500">
                  Projeto de Prevenção e Proteção Contra Incêndio (PPCI)
                </div>
              </div>

              {/* Dados do Empreendimento e Proprietário */}
              <div className="col-span-5 p-2 space-y-0.5">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase font-bold block">
                    Empreendimento / Obra:
                  </span>
                  <strong className="text-xs uppercase text-black font-extrabold truncate block">
                    {empreendimento}
                  </strong>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase font-bold block">
                    Endereço:
                  </span>
                  <span className="text-[10px] text-slate-800 truncate block">{endereco}</span>
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
                    <strong className="text-red-700 font-extrabold">{pranchaNumero}</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
