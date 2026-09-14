import React, { useState } from 'react';
import { Project, Floor } from '../types/cad';
import { 
  X, FileText, Sliders, CheckCircle2, ShieldCheck, 
  Layers, Download, Image as ImageIcon, Table, BookOpen, 
  Sparkles, Compass, Ruler, DollarSign, Check, HelpCircle
} from 'lucide-react';

export interface PdfExportConfig {
  content: 'unified' | 'dossier' | 'drawing' | 'budget' | 'legend_sheet';
  quality: 'high' | 'ultra' | 'draft';
  imageFormat: 'jpeg' | 'png';
  includeFloorPlan: boolean;
  includeCadEntities: boolean;
  includeNorthCompass: boolean;
  includeGraphicScale: boolean;
  symbolDisplayMode: 'badge' | 'glyph';
  budgetScope: 'floor' | 'project';
  includeNormativeNotes: boolean;
  includeCategorySummary: boolean;
  includeSignatures: boolean;
  // Configurações da Legenda Dinâmica em PDF
  legendMode: 'floor' | 'project';
  legendGrouping: 'category' | 'code';
  includeLegendSpecs: boolean;
  includeLegendQuantities: boolean;
  includeLegendSheetInDossier: boolean;
  // Otimizações de Renderização PDF
  optimizeRendering: boolean;
  vectorAntiAliasing: boolean;
}

interface ExportPdfConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  activeFloor: Floor;
  scaleFactor: string;
  grandTotalQuantity: number;
  grandTotalBudget: number;
  isGenerating: boolean;
  progressMessage: string;
  progressPercent: number;
  onExecuteExport: (config: PdfExportConfig) => Promise<void>;
}

export const ExportPdfConfigModal: React.FC<ExportPdfConfigModalProps> = ({
  isOpen,
  onClose,
  project,
  activeFloor,
  scaleFactor,
  grandTotalQuantity,
  grandTotalBudget,
  isGenerating,
  progressMessage,
  progressPercent,
  onExecuteExport
}) => {
  const [content, setContent] = useState<'unified' | 'dossier' | 'drawing' | 'budget' | 'legend_sheet'>('unified');
  const [quality, setQuality] = useState<'high' | 'ultra' | 'draft'>('high');
  const [imageFormat, setImageFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [includeFloorPlan, setIncludeFloorPlan] = useState<boolean>(true);
  const [includeCadEntities, setIncludeCadEntities] = useState<boolean>(true);
  const [includeNorthCompass, setIncludeNorthCompass] = useState<boolean>(true);
  const [includeGraphicScale, setIncludeGraphicScale] = useState<boolean>(true);
  const [symbolDisplayMode, setSymbolDisplayMode] = useState<'badge' | 'glyph'>('badge');
  const [budgetScope, setBudgetScope] = useState<'floor' | 'project'>('floor');
  const [includeNormativeNotes, setIncludeNormativeNotes] = useState<boolean>(true);
  const [includeCategorySummary, setIncludeCategorySummary] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);

  // Configurações da Legenda Dinâmica
  const [legendMode, setLegendMode] = useState<'floor' | 'project'>('floor');
  const [legendGrouping, setLegendGrouping] = useState<'category' | 'code'>('category');
  const [includeLegendSpecs, setIncludeLegendSpecs] = useState<boolean>(true);
  const [includeLegendQuantities, setIncludeLegendQuantities] = useState<boolean>(true);
  const [includeLegendSheetInDossier, setIncludeLegendSheetInDossier] = useState<boolean>(true);

  // Otimizações de Renderização PDF
  const [optimizeRendering, setOptimizeRendering] = useState<boolean>(true);
  const [vectorAntiAliasing, setVectorAntiAliasing] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleStartExport = () => {
    onExecuteExport({
      content,
      quality,
      imageFormat,
      includeFloorPlan,
      includeCadEntities,
      includeNorthCompass,
      includeGraphicScale,
      symbolDisplayMode,
      budgetScope,
      includeNormativeNotes,
      includeCategorySummary,
      includeSignatures,
      legendMode,
      legendGrouping,
      includeLegendSpecs,
      includeLegendQuantities,
      includeLegendSheetInDossier,
      optimizeRendering,
      vectorAntiAliasing
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                CONFIGURAR EXPORTAÇÃO PDF A3 (jsPDF)
                <span className="bg-red-950/80 text-red-400 border border-red-800/60 px-2 py-0.5 rounded text-[10px] font-mono">
                  ABNT NBR 6492 / NBR 13434
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Geração em alta fidelidade da Prancha Técnica A3 (420 x 297 mm Paisagem) e Tabela Consolidada de Quantitativos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-200">
          
          {/* 1. SELEÇÃO DE CONTEÚDO E COMPOSIÇÃO */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-400" />
              1. Seleção de Conteúdo e Folhas do Documento
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Opção 01: Prancha A3 Integrada (Planta + Legenda + Tabela Consolidada) */}
              <div
                onClick={() => setContent('unified')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  content === 'unified'
                    ? 'bg-gradient-to-br from-red-950/40 via-slate-900 to-sky-950/40 border-red-500 shadow-lg ring-2 ring-red-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Prancha A3 Integrada (Recomendado)
                    </span>
                    <span className="bg-red-900/60 text-red-200 border border-red-700/50 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      1 Página A3
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Planta Baixa arquitetônica + Legenda Normativa de Símbolos NBR 13434 + Quadro Consolidado de Quantitativos & Orçamento + Selo/Carimbo ABNT NBR 6492 em prancha única.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-emerald-400 font-bold">● ABNT Completo em Folha Única</span>
                  {content === 'unified' && <Check className="w-4 h-4 text-red-400 font-bold" />}
                </div>
              </div>

              {/* Opção 02: Dossiê Completo (2 Folhas) */}
              <div
                onClick={() => setContent('dossier')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  content === 'dossier'
                    ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      Caderno Técnico Completo
                    </span>
                    <span className="bg-emerald-900/60 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      2 Páginas A3
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Folha 01 (Prancha Gráfica Ampliada com Planta de Fundo e Símbolos) + Folha 02 (Tabela Consolidada de Orçamento, Subtotais e Normas ABNT).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Padrão Corpo de Bombeiros</span>
                  {content === 'dossier' && <Check className="w-4 h-4 text-sky-400" />}
                </div>
              </div>

              {/* Opção 03: Apenas Prancha Gráfica */}
              <div
                onClick={() => setContent('drawing')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  content === 'drawing'
                    ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                      Apenas Prancha Gráfica
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Folha 01
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Planta Baixa arquitetônica, entidades CAD, símbolos locados, legenda normativa, rosa dos ventos e carimbo oficial.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Escala {scaleFactor}</span>
                  {content === 'drawing' && <Check className="w-4 h-4 text-sky-400" />}
                </div>
              </div>

              {/* Opção 04: Apenas Orçamento */}
              <div
                onClick={() => setContent('budget')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  content === 'budget'
                    ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-amber-400" />
                      Apenas Orçamento ABNT
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Folha 02
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tabela detalhada de quantitativos, especificações fotoluminescentes, preços unitários/totais, subtotais e laudos IPT.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{grandTotalQuantity} un | R$ {grandTotalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  {content === 'budget' && <Check className="w-4 h-4 text-sky-400" />}
                </div>
              </div>

              {/* Opção 05: Folha Exclusiva de Legenda Técnica Dinâmica A3 */}
              <div
                onClick={() => setContent('legend_sheet')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between md:col-span-2 ${
                  content === 'legend_sheet'
                    ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      Folha 03: Legenda Técnica Dinâmica ABNT (Prancha A3 Exclusiva)
                    </span>
                    <span className="bg-purple-900/60 text-purple-300 border border-purple-700/50 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Folha 03 - NBR 13434 / NBR 16820
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Prancha A3 dedicada integralmente à Legenda Normativa: cards com pictogramas de alta definição, códigos regulamentares, dimensões em milímetros, classes fotoluminescentes, distâncias de visualização e notas técnicas do Corpo de Bombeiros.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-purple-400">
                  <span>Fichas técnicas individuais de cada sinalizador instalado</span>
                  {content === 'legend_sheet' && <Check className="w-4 h-4 text-purple-400" />}
                </div>
              </div>

            </div>
          </div>

          {/* 2. CONFIGURAÇÃO AVANÇADA DA LEGENDA DINÂMICA EM PDF */}
          <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider block flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                2. Configuração da Legenda Dinâmica em PDF
              </label>
              <span className="bg-purple-950 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-800">
                NBR 13434 • NBR 16820 • IT-20
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Escopo da Legenda Dinâmica */}
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 font-bold block">Escopo dos Símbolos na Legenda:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLegendMode('floor')}
                    className={`p-2 rounded-lg border text-left text-xs transition ${
                      legendMode === 'floor'
                        ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-white">Pavimento Atual</div>
                    <div className="text-[10px] text-slate-400">Apenas {activeFloor.name}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegendMode('project')}
                    className={`p-2 rounded-lg border text-left text-xs transition ${
                      legendMode === 'project'
                        ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-white">Global do Projeto</div>
                    <div className="text-[10px] text-slate-400">Todos os pavimentos</div>
                  </button>
                </div>
              </div>

              {/* Critério de Agrupamento */}
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 font-bold block">Agrupamento Normativo:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLegendGrouping('category')}
                    className={`p-2 rounded-lg border text-left text-xs transition ${
                      legendGrouping === 'category'
                        ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-white">Por Categorias ABNT</div>
                    <div className="text-[10px] text-slate-400">Salvamento, Combate, etc.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegendGrouping('code')}
                    className={`p-2 rounded-lg border text-left text-xs transition ${
                      legendGrouping === 'code'
                        ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-white">Código Sequencial</div>
                    <div className="text-[10px] text-slate-400">S1, S2, E1, E2, M1...</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Opções Detalhadas da Legenda */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 p-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLegendSpecs}
                  onChange={(e) => setIncludeLegendSpecs(e.target.checked)}
                  className="rounded text-purple-500"
                />
                <span>Dimensões e Fotoluminescência</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLegendQuantities}
                  onChange={(e) => setIncludeLegendQuantities(e.target.checked)}
                  className="rounded text-purple-500"
                />
                <span>Contadores de Peças Locadas</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLegendSheetInDossier}
                  onChange={(e) => setIncludeLegendSheetInDossier(e.target.checked)}
                  className="rounded text-purple-500"
                />
                <span>Anexar Folha 03 no Dossiê Completo</span>
              </label>
            </div>
          </div>

          {/* 3. OTIMIZAÇÃO AVANÇADA DA RENDERIZAÇÃO PDF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  3. Fidelidade e Resolução de Plotagem
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">html2canvas-pro + jsPDF</span>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quality"
                      checked={quality === 'high'}
                      onChange={() => setQuality('high')}
                      className="text-sky-500"
                    />
                    <div>
                      <span className="font-bold text-white text-xs">Alta Definição (300 DPI - Escala 2.5x)</span>
                      <span className="text-[10px] text-slate-400 block">Excelente para plotters A3, pranchas e envio oficial ao Bombeiro</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Recomendado</span>
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quality"
                      checked={quality === 'ultra'}
                      onChange={() => setQuality('ultra')}
                      className="text-sky-500"
                    />
                    <div>
                      <span className="font-bold text-white text-xs">Ultra-HD Gráfica (400 DPI - Escala 3.0x)</span>
                      <span className="text-[10px] text-slate-400 block">Nitidez extrema para textos microscópicos e detalhes vetoriais</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">Ultra Nitidez</span>
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quality"
                      checked={quality === 'draft'}
                      onChange={() => setQuality('draft')}
                      className="text-sky-500"
                    />
                    <div>
                      <span className="font-bold text-white text-xs">Rápida / Pré-visualização (150 DPI - Escala 1.8x)</span>
                      <span className="text-[10px] text-slate-400 block">Geração ultra veloz com menor tamanho de arquivo</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">Leve</span>
                </label>
              </div>

              {/* Formato de Compressão da Imagem Interna */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Compressão da Imagem no PDF:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImageFormat('jpeg')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      imageFormat === 'jpeg' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    JPEG 98% (Otimizado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageFormat('png')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      imageFormat === 'png' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    PNG (Sem Perdas)
                  </button>
                </div>
              </div>

              {/* Otimização de Performance e Memória */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optimizeRendering}
                    onChange={(e) => setOptimizeRendering(e.target.checked)}
                    className="rounded text-sky-500"
                  />
                  <span>Aceleração de Renderização (Limpeza de memória & Remoção de sombras)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vectorAntiAliasing}
                    onChange={(e) => setVectorAntiAliasing(e.target.checked)}
                    className="rounded text-sky-500"
                  />
                  <span>Suavização Vetorial Geométrica (geometricPrecision em nós SVG)</span>
                </label>
              </div>
            </div>

            {/* 3. PARÂMETROS DA FOLHA GRÁFICA & CARIMBO ABNT */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                3. Elementos Gráficos e Notação Normativa
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-xs text-white">Notação dos Símbolos na Planta:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSymbolDisplayMode('badge')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        symbolDisplayMode === 'badge' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Selo Circular NBR 13434
                    </button>
                    <button
                      type="button"
                      onClick={() => setSymbolDisplayMode('glyph')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        symbolDisplayMode === 'glyph' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Pictograma Real
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 p-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFloorPlan}
                    onChange={(e) => setIncludeFloorPlan(e.target.checked)}
                    className="rounded text-sky-500"
                  />
                  <span>Renderizar Imagem da Planta Baixa Arquitetônica de Fundo</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCadEntities}
                    onChange={(e) => setIncludeCadEntities(e.target.checked)}
                    className="rounded text-sky-500"
                  />
                  <span>Renderizar Entidades Vetoriais CAD (Paredes, Portas, Rotas)</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNorthCompass}
                    onChange={(e) => setIncludeNorthCompass(e.target.checked)}
                    className="rounded text-sky-500"
                  />
                  <span>Incluir Rosa dos Ventos / Indicador de Norte Técnico</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGraphicScale}
                    onChange={(e) => setIncludeGraphicScale(e.target.checked)}
                    className="rounded text-sky-500"
                  />
                  <span>Incluir Escala Gráfica ABNT (Escala {scaleFactor})</span>
                </label>
              </div>

              {/* Escopo do Orçamento */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Escopo da Tabela de Orçamento:</span>
                <select
                  value={budgetScope}
                  onChange={(e) => setBudgetScope(e.target.value as 'floor' | 'project')}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-emerald-400 font-bold"
                >
                  <option value="floor">Apenas {activeFloor.name}</option>
                  <option value="project">Todo o Empreendimento (Global)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. DADOS NORMATIVOS DO SELO / CARIMBO ABNT NBR 6492 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-sky-400" />
                4. Dados Cadastrais do Carimbo / Selo Técnico ABNT NBR 6492
              </label>
              <span className="text-[10px] text-slate-500">Configurado no projeto</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Obra / Empreendimento</span>
                <span className="text-white font-semibold truncate block">{project.empreendimento || project.nome}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Proprietário / Cliente</span>
                <span className="text-white font-semibold truncate block">{project.cliente || 'Não informado'}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Responsável Técnico</span>
                <span className="text-white font-semibold truncate block">{project.responsavel_tecnico || 'Não informado'}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">ART / RRT e CREA</span>
                <span className="text-emerald-400 font-mono font-bold truncate block">{project.art_rrt || 'Registrada'}</span>
              </div>
            </div>
          </div>

          {/* 5. ESPECIFICAÇÃO DE FORMATAÇÃO ABNT NBR 6492 */}
          <div className="bg-sky-950/20 border border-sky-900/50 p-3.5 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed space-y-1">
              <strong className="text-sky-300 block font-bold">
                Conformidade Oficial com a Norma ABNT NBR 6492 (Representação de Projetos de Arquitetura):
              </strong>
              <p>
                O documento PDF gerado pelo <strong>jsPDF</strong> adota as dimensões exatas de <strong>420 mm x 297 mm</strong> (A3 Paisagem), com margem esquerda de <strong>25 mm</strong> para arquivamento e margens superior, direita e inferior de <strong>10 mm</strong>. Todas as linhas de cota, símbolos fotoluminescentes conforme NBR 13434 e tabelas orçamentárias respeitam a espessura e contraste para plotagem profissional.
              </p>
            </div>
          </div>

          {/* Indicador de Progresso de Geração */}
          {isGenerating && (
            <div className="bg-slate-950 p-4 rounded-xl border border-sky-600/50 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-300 font-bold flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  {progressMessage || 'Gerando documento PDF A3...'}
                </span>
                <span className="font-mono font-bold text-sky-400">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Formato: A3 Paisagem (420 x 297 mm) • Motor: jsPDF v2.5</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleStartExport}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold rounded-xl shadow-lg flex items-center gap-2 transition text-xs border border-red-400/30 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Renderizando PDF...' : 'GERAR E BAIXAR PDF A3 OFICIAL'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
