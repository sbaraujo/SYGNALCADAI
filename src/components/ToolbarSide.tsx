import React from 'react';
import { CADTool } from './CADCanvas';
import { 
  MousePointer, Hand, PlusCircle, Ruler, Move,
  Maximize2, Magnet, Compass, Upload, Layers, Table,
  Minus, CornerDownRight, Square, Circle
} from 'lucide-react';
import { Project } from '../types/cad';

interface ToolbarSideProps {
  activeTool: CADTool;
  setActiveTool: (tool: CADTool) => void;
  project: Project;
  onToggleGridSnap: () => void;
  onToggleOrtho: () => void;
  onOpenUploadPlanModal: () => void;
  onOpenLibraryModal: () => void;
  onOpenLayersModal: () => void;
  onOpenLegendaModal?: () => void;
  onFitExtents?: () => void;
}

export const ToolbarSide: React.FC<ToolbarSideProps> = ({
  activeTool,
  setActiveTool,
  project,
  onToggleGridSnap,
  onToggleOrtho,
  onOpenUploadPlanModal,
  onOpenLibraryModal,
  onOpenLayersModal,
  onOpenLegendaModal,
  onFitExtents
}) => {
  return (
    <aside className="w-12 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-2 gap-1.5 z-20 select-none">
      {/* Selection Tool */}
      <button
        onClick={() => setActiveTool('select')}
        title="Selecionar / Mover (V)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${activeTool === 'select' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
      >
        <MousePointer className="w-4 h-4" />
      </button>

      {/* Pan / Hand Tool */}
      <button
        onClick={() => setActiveTool('pan')}
        title="Arrastar Tela (Pan) - ou segure Espaço / botão do meio"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${activeTool === 'pan' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
      >
        <Hand className="w-4 h-4" />
      </button>

      {/* Move / Align Plan Tool */}
      <button
        onClick={() => setActiveTool('move_plan')}
        title="Mover e Alinhar Planta Arquitetônica de Fundo (M)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${activeTool === 'move_plan' ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400' : 'text-purple-400 hover:text-white hover:bg-slate-800'}`}
      >
        <Move className="w-4 h-4" />
      </button>

      {/* Insert Symbol */}
      <button
        onClick={() => {
          onOpenLibraryModal();
        }}
        title="Inserir Símbolo Fotoluminescente (I)"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition"
      >
        <PlusCircle className="w-4 h-4" />
      </button>

      <div className="w-6 h-[1px] bg-slate-800 my-1" />

      {/* CAD Drawing: Line */}
      <button
        onClick={() => setActiveTool('draw_line')}
        title="Desenhar Linha (L)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${activeTool === 'draw_line' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
      >
        <Minus className="w-4 h-4 rotate-45" />
      </button>

      {/* CAD Drawing: Polyline */}
      <button
        onClick={() => setActiveTool('draw_polyline')}
        title="Desenhar Polilinha Contínua (PL)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${activeTool === 'draw_polyline' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
      >
        <CornerDownRight className="w-4 h-4" />
      </button>

      {/* CAD Drawing: Rectangle */}
      <button
        onClick={() => setActiveTool('draw_rect')}
        title="Desenhar Retângulo (REC)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${activeTool === 'draw_rect' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
      >
        <Square className="w-4 h-4" />
      </button>

      {/* CAD Drawing: Circle */}
      <button
        onClick={() => setActiveTool('draw_circle')}
        title="Desenhar Círculo (C)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${activeTool === 'draw_circle' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
      >
        <Circle className="w-4 h-4" />
      </button>

      <div className="w-6 h-[1px] bg-slate-800 my-1" />

      {/* Calibrate Scale */}
      <button
        onClick={() => setActiveTool('calibrate')}
        title="Calibrar Escala da Planta (Marcar 2 pontos com distância conhecida)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${activeTool === 'calibrate' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
      >
        <Ruler className="w-4 h-4" />
      </button>

      {/* Measure Tool */}
      <button
        onClick={() => setActiveTool('measure')}
        title="Medir Distância Real (Cota / Régua)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${activeTool === 'measure' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
      >
        <Compass className="w-4 h-4" />
      </button>

      {/* Centralizar e Ajustar à Tela (Fit Extents) */}
      {onFitExtents && (
        <button
          onClick={onFitExtents}
          title="Centralizar e Ajustar Planta à Tela (Z + E / Fit Extents)"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sky-400 hover:text-white hover:bg-slate-800 transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      {/* Upload Architectural Floor Plan */}
      <button
        onClick={onOpenUploadPlanModal}
        title="Importar Planta Arquitetônica (PDF, DXF, PNG, JPG, SVG)"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition"
      >
        <Upload className="w-4 h-4" />
      </button>

      {/* Layers Manager */}
      <button
        onClick={onOpenLayersModal}
        title="Gerenciar Camadas (Layers)"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
      >
        <Layers className="w-4 h-4" />
      </button>

      {/* Legenda Quadro NBR 13434 */}
      {onOpenLegendaModal && (
        <button
          onClick={onOpenLegendaModal}
          title="Quadro de Legenda NBR 13434 / Estampar na Planta"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition"
        >
          <Table className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1" />

      {/* Grid Snap Toggle (F3) */}
      <button
        onClick={onToggleGridSnap}
        title={`Snap ao Grid (F3): ${project.settings.gridSnap ? 'Ativado' : 'Desativado'}`}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${project.settings.gridSnap ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'}`}
      >
        <Magnet className="w-4 h-4" />
      </button>

      {/* Ortho Mode Toggle (F8) */}
      <button
        onClick={onToggleOrtho}
        title={`Modo Ortho (F8): ${project.settings.orthoMode ? 'Ativado' : 'Desativado'}`}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${project.settings.orthoMode ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'}`}
      >
        <span className="font-mono font-bold text-xs">90°</span>
      </button>
    </aside>
  );
};
