import React, { useState, useRef, useEffect } from 'react';
import { CADTool } from '../CADCanvas';
import { Terminal, CornerDownLeft, ChevronRight } from 'lucide-react';

interface CADCommandLineProps {
  activeTool: CADTool;
  setActiveTool: (tool: CADTool) => void;
  cursorWorldPos: { x: number; y: number };
  zoom: number;
  orthoMode: boolean;
  gridSnap: boolean;
  osnapEnabled: boolean;
  onToggleOrtho: () => void;
  onToggleGridSnap: () => void;
  onToggleOsnap: () => void;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitExtents?: () => void;
  promptMessage?: string;
}

export const CADCommandLine: React.FC<CADCommandLineProps> = ({
  activeTool,
  setActiveTool,
  cursorWorldPos,
  zoom,
  orthoMode,
  gridSnap,
  osnapEnabled,
  onToggleOrtho,
  onToggleGridSnap,
  onToggleOsnap,
  onDeleteSelected,
  onUndo,
  onRedo,
  onFitExtents,
  promptMessage
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([
    'SIGNAFLUX CAD 2D PRO v2.4 iniciado com sucesso.',
    'Digite um comando ou atalho (ex: L, PL, REC, C, M, CO, DI, DLI, Z, E):'
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = inputVal.trim();
    if (!rawCmd) return;

    const cmd = rawCmd.toUpperCase();
    setCommandHistory((prev) => [...prev, rawCmd]);
    setHistoryIndex(-1);

    const appendLog = (msg: string) => {
      setHistory((prev) => [...prev.slice(-15), `> ${rawCmd}: ${msg}`]);
    };

    switch (cmd) {
      case 'L':
      case 'LINE':
      case 'LINHA':
        setActiveTool('draw_line');
        appendLog('Comando LINHA ativado. Especifique o primeiro ponto.');
        break;
      case 'PL':
      case 'PLINE':
      case 'POLILINHA':
        setActiveTool('draw_polyline');
        appendLog('Comando POLILINHA ativado. Clique os vértices contínuos.');
        break;
      case 'REC':
      case 'RECT':
      case 'RECTANG':
      case 'RETANGULO':
        setActiveTool('draw_rect');
        appendLog('Comando RETÂNGULO ativado. Especifique o primeiro canto.');
        break;
      case 'C':
      case 'CIRCLE':
      case 'CIRCULO':
        setActiveTool('draw_circle');
        appendLog('Comando CÍRCULO ativado. Especifique o centro.');
        break;
      case 'A':
      case 'ARC':
      case 'ARCO':
        setActiveTool('draw_arc');
        appendLog('Comando ARCO ativado.');
        break;
      case 'EL':
      case 'ELLIPSE':
      case 'ELIPSE':
        setActiveTool('draw_ellipse');
        appendLog('Comando ELIPSE ativado.');
        break;
      case 'POL':
      case 'POLYGON':
      case 'POLIGONO':
        setActiveTool('draw_polygon');
        appendLog('Comando POLÍGONO regular ativado.');
        break;
      case 'T':
      case 'TEXT':
      case 'TEXTO':
        setActiveTool('text');
        appendLog('Comando TEXTO ativado. Clique no ponto de inserção.');
        break;
      case 'PO':
      case 'POINT':
      case 'PONTO':
        setActiveTool('draw_point');
        appendLog('Comando PONTO ativado.');
        break;
      case 'H':
      case 'HATCH':
      case 'HACHURA':
        setActiveTool('draw_hatch');
        appendLog('Comando HACHURA ativado.');
        break;
      case 'M':
      case 'MOVE':
      case 'MOVER':
        setActiveTool('modify_move');
        appendLog('Comando MOVER ativado.');
        break;
      case 'CO':
      case 'CP':
      case 'COPY':
      case 'COPIAR':
        setActiveTool('modify_copy');
        appendLog('Comando COPIAR ativado.');
        break;
      case 'RO':
      case 'ROTATE':
      case 'GIRAR':
        setActiveTool('modify_rotate');
        appendLog('Comando ROTACIONAR ativado.');
        break;
      case 'SC':
      case 'SCALE':
      case 'ESCALA':
        setActiveTool('modify_scale');
        appendLog('Comando ESCALA ativado.');
        break;
      case 'MI':
      case 'MIRROR':
      case 'ESPELHAR':
        setActiveTool('modify_mirror');
        appendLog('Comando ESPELHAR ativado.');
        break;
      case 'O':
      case 'OFFSET':
        setActiveTool('modify_offset');
        appendLog('Comando OFFSET ativado.');
        break;
      case 'E':
      case 'DEL':
      case 'ERASE':
      case 'APAGAR':
        onDeleteSelected();
        appendLog('Comando APAGAR executado.');
        break;
      case 'DI':
      case 'DIST':
      case 'DISTANCIA':
        setActiveTool('measure');
        appendLog('Comando MEDIR DISTÂNCIA ativado.');
        break;
      case 'AA':
      case 'AREA':
        setActiveTool('measure_area');
        appendLog('Comando MEDIR ÁREA ativado.');
        break;
      case 'DLI':
      case 'DIMLIN':
        setActiveTool('dimension_linear');
        appendLog('Comando COTA LINEAR ativado.');
        break;
      case 'DAL':
      case 'DIMALIGN':
        setActiveTool('dimension_aligned');
        appendLog('Comando COTA ALINHADA ativado.');
        break;
      case 'DRA':
      case 'DIMRAD':
        setActiveTool('dimension_radial');
        appendLog('Comando COTA RAIO ativado.');
        break;
      case 'LE':
      case 'LEADER':
        setActiveTool('leader');
        appendLog('Comando LÍDER / SETA ativado.');
        break;
      case 'Z':
      case 'ZOOM':
      case 'ZE':
        if (onFitExtents) onFitExtents();
        appendLog('Zoom Extents executado.');
        break;
      case 'U':
      case 'UNDO':
        onUndo();
        appendLog('Desfazer executado.');
        break;
      case 'REDO':
        onRedo();
        appendLog('Refazer executado.');
        break;
      case 'ESC':
      case 'CANCEL':
        setActiveTool('select');
        appendLog('Comando cancelado. Seleção normal.');
        break;
      default:
        appendLog(`Comando desconhecido "${cmd}". Digite L, PL, REC, C, M, CO, DI ou Z.`);
        break;
    }

    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx] || '');
      } else {
        setHistoryIndex(-1);
        setInputVal('');
      }
    } else if (e.key === 'Escape') {
      setActiveTool('select');
      setInputVal('');
    }
  };

  return (
    <div className="bg-slate-950 border-t border-slate-800 text-slate-300 font-mono text-xs z-20 select-none">
      {/* Última linha do histórico do console */}
      <div className="px-3 py-1 bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[11px] truncate flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-slate-300">
            {promptMessage || history[history.length - 1] || 'Pronto para comandos CAD.'}
          </span>
        </div>

        {/* Status Bar Coordenadas Dinâmicas CAD */}
        <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0 font-mono">
          <span className="text-sky-300">
            X: <strong className="text-white">{(cursorWorldPos.x / 1000).toFixed(3)}m</strong>
          </span>
          <span className="text-emerald-300">
            Y: <strong className="text-white">{(cursorWorldPos.y / 1000).toFixed(3)}m</strong>
          </span>
          <span className="text-slate-400">
            Zoom: <strong>{Math.round(zoom * 1000)}%</strong>
          </span>
        </div>
      </div>

      {/* Input de Comando Clássico AutoCAD Style */}
      <form onSubmit={handleCommandSubmit} className="flex items-center px-3 py-1.5 gap-2 bg-slate-950">
        <span className="text-sky-400 font-bold flex items-center gap-1">
          <span>Comando:</span>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite um comando (L, PL, REC, C, M, CO, DI, DLI, Z, E)..."
          className="flex-1 bg-transparent text-white placeholder:text-slate-600 outline-none font-mono text-xs"
        />
        <button
          type="submit"
          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition"
        >
          <span>Enter</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
