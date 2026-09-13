import React, { useState } from 'react';
import { CADTool } from '../CADCanvas';
import { 
  Minus, Square, Circle, CircleDot, Disc, Hexagon, 
  Type, Crosshair, Grid3X3, Move, Copy, RotateCw, 
  FlipHorizontal, Trash2, Undo2, Redo2, Maximize, 
  Ruler, Compass, ArrowUpRight, Magnet, ChevronDown, 
  Layers, Palette, CornerDownRight, Shapes, Plus,
  Scissors, Edit3
} from 'lucide-react';
import { Layer } from '../../types/cad';

interface CADDrawingRibbonProps {
  activeTool: CADTool;
  setActiveTool: (tool: CADTool) => void;
  orthoMode: boolean;
  onToggleOrtho: () => void;
  gridSnap: boolean;
  onToggleGridSnap: () => void;
  osnapEnabled: boolean;
  onToggleOsnap: () => void;
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  activeColor: string;
  onChangeColor: (color: string) => void;
  activeStrokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenLayersModal?: () => void;
  onDeleteSelected?: () => void;
  onFitExtents?: () => void;
}

export const CADDrawingRibbon: React.FC<CADDrawingRibbonProps> = ({
  activeTool,
  setActiveTool,
  orthoMode,
  onToggleOrtho,
  gridSnap,
  onToggleGridSnap,
  osnapEnabled,
  onToggleOsnap,
  layers,
  activeLayerId,
  onSelectLayer,
  activeColor,
  onChangeColor,
  activeStrokeWidth,
  onChangeStrokeWidth,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true,
  onOpenLayersModal,
  onDeleteSelected,
  onFitExtents
}) => {
  const [activeCategory, setActiveCategory] = useState<'draw' | 'modify' | 'dim' | 'precision'>('draw');

  const standardColors = [
    { name: 'Branco', hex: '#ffffff' },
    { name: 'Vermelho', hex: '#ef4444' },
    { name: 'Amarelo', hex: '#eab308' },
    { name: 'Verde', hex: '#22c55e' },
    { name: 'Ciano', hex: '#06b6d4' },
    { name: 'Azul', hex: '#3b82f6' },
    { name: 'Magenta', hex: '#ec4899' },
    { name: 'Cinza', hex: '#94a3b8' }
  ];

  const strokeWidths = [
    { label: '0.15 mm', value: 150 },
    { label: '0.25 mm', value: 250 },
    { label: '0.35 mm', value: 350 },
    { label: '0.50 mm', value: 500 },
    { label: '0.70 mm', value: 700 }
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 select-none z-20 shadow-md">
      {/* Barra de Categorias e Ações Principais */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-slate-800/80 bg-slate-950/60 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveCategory('draw')}
            className={`px-3 py-1 font-semibold rounded-t transition flex items-center gap-1.5 ${
              activeCategory === 'draw'
                ? 'bg-slate-800 text-sky-400 border-t-2 border-sky-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            1. Desenho (Criação)
          </button>

          <button
            onClick={() => setActiveCategory('modify')}
            className={`px-3 py-1 font-semibold rounded-t transition flex items-center gap-1.5 ${
              activeCategory === 'modify'
                ? 'bg-slate-800 text-amber-400 border-t-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            2. Modificação / Edição
          </button>

          <button
            onClick={() => setActiveCategory('dim')}
            className={`px-3 py-1 font-semibold rounded-t transition flex items-center gap-1.5 ${
              activeCategory === 'dim'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            3. Cotas & Medições
          </button>
        </div>

        {/* Controles de Camadas, Cor e Espessura */}
        <div className="flex items-center gap-2">
          {/* Desfazer / Refazer */}
          <div className="flex items-center gap-0.5 mr-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer (Ctrl+Z)"
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Refazer (Ctrl+Y)"
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Seletor de Camada */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-xs">
            <Layers className="w-3 h-3 text-sky-400" />
            <select
              value={activeLayerId}
              onChange={(e) => onSelectLayer(e.target.value)}
              className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer"
            >
              {layers.map((l) => (
                <option key={l.id} value={l.id} className="bg-slate-900 text-slate-200">
                  {l.name}
                </option>
              ))}
            </select>
            <button
              onClick={onOpenLayersModal}
              title="Gerenciador de Camadas (Layers)"
              className="p-0.5 hover:text-sky-300"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Seletor de Cor CAD */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            <Palette className="w-3 h-3 text-amber-400" />
            <div className="flex items-center gap-1">
              {standardColors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onChangeColor(c.hex)}
                  title={c.name}
                  className={`w-3.5 h-3.5 rounded-full border transition ${
                    activeColor === c.hex ? 'ring-2 ring-sky-400 scale-110 border-white' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Seletor de Espessura de Linha */}
          <select
            value={activeStrokeWidth}
            onChange={(e) => onChangeStrokeWidth(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-1.5 py-0.5 outline-none"
            title="Espessura de Linha (Lineweight)"
          >
            {strokeWidths.map((sw) => (
              <option key={sw.value} value={sw.value} className="bg-slate-900">
                {sw.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Faixa de Ferramentas da Categoria Selecionada */}
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto">
        {/* 1. FERRAMENTAS DE DESENHO */}
        {activeCategory === 'draw' && (
          <>
            <button
              onClick={() => setActiveTool('draw_line')}
              title="Linha (L) - Desenha segmentos retos no plano"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'draw_line' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Minus className="w-4 h-4 text-sky-400" />
              <span>Linha (L)</span>
            </button>

            <button
              onClick={() => setActiveTool('draw_polyline')}
              title="Polilinha (PL) - Traçado contínuo aberto ou fechado"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'draw_polyline' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <CornerDownRight className="w-4 h-4 text-sky-400" />
              <span>Polilinha (PL)</span>
            </button>

            <button
              onClick={() => setActiveTool('draw_rect')}
              title="Retângulo / Quadrado (REC) - Clique 2 cantos opostos"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'draw_rect' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Square className="w-4 h-4 text-sky-400" />
              <span>Retângulo (REC)</span>
            </button>

            <button
              onClick={() => setActiveTool('draw_circle')}
              title="Círculo (C) - Centro e raio"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'draw_circle' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Circle className="w-4 h-4 text-sky-400" />
              <span>Círculo (C)</span>
            </button>

            <button
              onClick={() => setActiveTool('draw_arc')}
              title="Arco (A) - Arco por 3 pontos ou centro"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'draw_arc' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <CircleDot className="w-4 h-4 text-sky-400" />
              <span>Arco (A)</span>
            </button>

            <button
              onClick={() => setActiveTool('draw_ellipse')}
              title="Elipse (EL) - Centro e raios X/Y"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'draw_ellipse' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Disc className="w-4 h-4 text-sky-400" />
              <span>Elipse (EL)</span>
            </button>

            <button
              onClick={() => setActiveTool('draw_polygon')}
              title="Polígono Regular (POL) - Polígono equilátero (3 a 12 lados)"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'draw_polygon' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Hexagon className="w-4 h-4 text-sky-400" />
              <span>Polígono (POL)</span>
            </button>

            <button
              onClick={() => setActiveTool('text')}
              title="Texto CAD (T) - Inserir anotação técnica na planta"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'text' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Type className="w-4 h-4 text-sky-400" />
              <span>Texto (T)</span>
            </button>

            <button
              onClick={() => setActiveTool('draw_point')}
              title="Ponto / Marcador (PO) - Insere marco geométrico"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'draw_point' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Crosshair className="w-4 h-4 text-sky-400" />
              <span>Ponto (PO)</span>
            </button>

            <button
              onClick={() => setActiveTool('draw_hatch')}
              title="Hachura / Preenchimento (H) - Preenche área delimitada"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'draw_hatch' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Grid3X3 className="w-4 h-4 text-sky-400" />
              <span>Hachura (H)</span>
            </button>
          </>
        )}

        {/* 2. FERRAMENTAS DE MODIFICAÇÃO / EDIÇÃO */}
        {activeCategory === 'modify' && (
          <>
            <button
              onClick={() => setActiveTool('modify_move')}
              title="Mover (M) - Translada entidades ou símbolos a partir de um ponto base"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'modify_move' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Move className="w-4 h-4 text-amber-400" />
              <span>Mover (M)</span>
            </button>

            <button
              onClick={() => setActiveTool('modify_copy')}
              title="Copiar (CO) - Duplica entidades mantendo o original"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'modify_copy' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Copiar (CO)</span>
            </button>

            <button
              onClick={() => setActiveTool('modify_rotate')}
              title="Rotacionar (RO) - Gira entidades em torno de um ponto"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'modify_rotate' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <RotateCw className="w-4 h-4 text-amber-400" />
              <span>Rotacionar (RO)</span>
            </button>

            <button
              onClick={() => setActiveTool('modify_scale')}
              title="Escala (SC) - Redimensiona proporcionalmente entidades"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'modify_scale' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Maximize className="w-4 h-4 text-amber-400" />
              <span>Escala (SC)</span>
            </button>

            <button
              onClick={() => setActiveTool('modify_mirror')}
              title="Espelhar (MI) - Cria reflexo simétrico em relação a um eixo"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'modify_mirror' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FlipHorizontal className="w-4 h-4 text-amber-400" />
              <span>Espelhar (MI)</span>
            </button>

            <button
              onClick={() => setActiveTool('modify_offset')}
              title="Offset (O) - Cria curvas e linhas paralelas a uma distância definida"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'modify_offset' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Offset (O)</span>
            </button>

            <button
              onClick={() => {
                if (onDeleteSelected) onDeleteSelected();
              }}
              title="Apagar (DEL / E) - Exclui o elemento selecionado"
              className="px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition bg-slate-800/70 hover:bg-red-950 text-red-300 hover:text-red-200 border border-transparent hover:border-red-800"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Apagar (E)</span>
            </button>
          </>
        )}

        {/* 3. COTAS E MEDIÇÕES */}
        {activeCategory === 'dim' && (
          <>
            <button
              onClick={() => setActiveTool('dimension_linear')}
              title="Cota Linear (DLI) - Mede distância ortogonal horizontal ou vertical com linhas de extensão"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'dimension_linear' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Ruler className="w-4 h-4 text-emerald-400" />
              <span>Cota Linear (DLI)</span>
            </button>

            <button
              onClick={() => setActiveTool('dimension_aligned')}
              title="Cota Alinhada (DAL) - Cota paralela ao segmento inclinado"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'dimension_aligned' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Cota Alinhada (DAL)</span>
            </button>

            <button
              onClick={() => setActiveTool('dimension_radial')}
              title="Cota de Raio / Diâmetro (DRA) - Anotação radial de círculos"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'dimension_radial' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <CircleDot className="w-4 h-4 text-emerald-400" />
              <span>Cota Raio (DRA)</span>
            </button>

            <button
              onClick={() => setActiveTool('leader')}
              title="Seta Líder (LE) - Seta apontadora com linha de chamada e texto"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'leader' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>Seta / Líder (LE)</span>
            </button>

            <button
              onClick={() => setActiveTool('measure')}
              title="Medir Distância (DI) - Mede distância real e ângulo temporários"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'measure' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Medir Distância (DI)</span>
            </button>

            <button
              onClick={() => setActiveTool('measure_area')}
              title="Medir Área (AA) - Calcula a área m² de polígono de referência"
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition ${
                activeTool === 'measure_area' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Shapes className="w-4 h-4 text-amber-400" />
              <span>Medir Área (AA)</span>
            </button>
          </>
        )}

        <div className="h-5 w-[1px] bg-slate-800 mx-2" />

        {/* Modos de Precisão Rápidos (Ortho, Snap, OSNAP) */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={onToggleOrtho}
            title={`Modo Ortho (F8) - Força ângulos retos: ${orthoMode ? 'LIGADO' : 'DESLIGADO'}`}
            className={`px-2 py-1 rounded text-xs font-bold font-mono transition flex items-center gap-1 ${
              orthoMode
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 shadow'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>ORTHO [F8]</span>
          </button>

          <button
            onClick={onToggleGridSnap}
            title={`Snap à Grade (F9) - Alinha pontos ao grid: ${gridSnap ? 'LIGADO' : 'DESLIGADO'}`}
            className={`px-2 py-1 rounded text-xs font-bold font-mono transition flex items-center gap-1 ${
              gridSnap
                ? 'bg-sky-950 text-sky-400 border border-sky-700 shadow'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Magnet className="w-3 h-3" />
            <span>SNAP [F9]</span>
          </button>

          <button
            onClick={onToggleOsnap}
            title={`Object Snap (F3) - Atrai cursor a extremidades e centros: ${osnapEnabled ? 'LIGADO' : 'DESLIGADO'}`}
            className={`px-2 py-1 rounded text-xs font-bold font-mono transition flex items-center gap-1 ${
              osnapEnabled
                ? 'bg-purple-950 text-purple-400 border border-purple-700 shadow'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>OSNAP [F3]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
