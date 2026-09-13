import React, { useState } from 'react';
import { EvacuationCorridorItem, EvacuationCorridorPoint } from '../../types/cad';
import { Check, X, RotateCcw } from 'lucide-react';

interface EvacuationCorridorCanvasProps {
  corridors: EvacuationCorridorItem[];
  activeCorridorId?: string | null;
  isDrawing?: boolean;
  drawingPoints?: EvacuationCorridorPoint[];
  onSelectCorridor?: (id: string) => void;
  onUpdateCorridorPoints?: (id: string, newPoints: EvacuationCorridorPoint[]) => void;
  onPointMouseDown?: (corridorId: string, pointIndex: number, e: React.MouseEvent) => void;
  onClosePolygon?: () => void;
  onUndoLastPoint?: () => void;
  onCancelDrawing?: () => void;
}

export const EvacuationCorridorCanvas: React.FC<EvacuationCorridorCanvasProps> = ({
  corridors,
  activeCorridorId,
  isDrawing = false,
  drawingPoints = [],
  onSelectCorridor,
  onPointMouseDown,
  onClosePolygon,
  onUndoLastPoint,
  onCancelDrawing
}) => {
  const [hoverFirstPoint, setHoverFirstPoint] = useState(false);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      {/* SVG Canvas de Corredores e Desenho */}
      <svg className="w-full h-full overflow-visible">
        {/* Corredores Existentes */}
        {corridors.map((corridor) => {
          if (!corridor.points || corridor.points.length < 3) return null;
          const isSelected = activeCorridorId === corridor.id;
          const pointsString = corridor.points.map((p) => `${p.x}%,${p.y}%`).join(' ');
          const fillColor = corridor.fillColor || '#86efac';
          const opacity = corridor.opacity ?? 0.65;
          const strokeColor = corridor.strokeColor || '#16a34a';

          return (
            <g key={corridor.id} className="pointer-events-auto">
              {/* Polígono do Corredor com Cor Padrão ISO 23601 */}
              <polygon
                points={pointsString}
                fill={fillColor}
                fillOpacity={opacity}
                stroke={strokeColor}
                strokeWidth={isSelected ? 2.5 : 1.2}
                strokeDasharray={isSelected ? '5,3' : undefined}
                className="cursor-pointer transition-all hover:brightness-105"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCorridor?.(corridor.id);
                }}
              />

              {/* Vértices de Edição se selecionado */}
              {isSelected &&
                corridor.points.map((pt, idx) => (
                  <g key={idx} className="pointer-events-auto">
                    <circle
                      cx={`${pt.x}%`}
                      cy={`${pt.y}%`}
                      r={6}
                      fill="#ffffff"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      className="cursor-move hover:scale-125 transition-transform"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onPointMouseDown?.(corridor.id, idx, e);
                      }}
                    />
                    <text
                      x={`${pt.x}%`}
                      y={`${pt.y - 2}%`}
                      textAnchor="middle"
                      fill="#15803d"
                      fontSize={10}
                      fontWeight="bold"
                      className="select-none pointer-events-none"
                    >
                      {idx + 1}
                    </text>
                  </g>
                ))}
            </g>
          );
        })}

        {/* Linha/Polígono Temporário durante o Desenho */}
        {isDrawing && drawingPoints.length > 0 && (
          <g>
            {/* Polígono semitransparente em formação */}
            {drawingPoints.length >= 3 && (
              <polygon
                points={drawingPoints.map((p) => `${p.x}%,${p.y}%`).join(' ')}
                fill="#86efac"
                fillOpacity={0.45}
                stroke="#16a34a"
                strokeWidth={1.5}
                strokeDasharray="4,3"
                className="pointer-events-none"
              />
            )}

            {/* Linha contínua entre os pontos inseridos */}
            {drawingPoints.length > 1 && (
              <polyline
                points={drawingPoints.map((p) => `${p.x}%,${p.y}%`).join(' ')}
                fill="none"
                stroke="#16a34a"
                strokeWidth={2.2}
                strokeDasharray="5,2"
                className="pointer-events-none"
              />
            )}

            {/* Vértices já clicados */}
            {drawingPoints.map((pt, idx) => {
              const isFirst = idx === 0;
              const canClose = isFirst && drawingPoints.length >= 3;

              return (
                <g key={idx} className="pointer-events-auto">
                  {/* Halo pulsante no 1º ponto para indicar que fecha o polígono */}
                  {isFirst && (
                    <circle
                      cx={`${pt.x}%`}
                      cy={`${pt.y}%`}
                      r={hoverFirstPoint || canClose ? 14 : 9}
                      fill="#22c55e"
                      fillOpacity={hoverFirstPoint ? 0.4 : 0.25}
                      stroke="#16a34a"
                      strokeWidth={1.5}
                      strokeDasharray="3,2"
                      className="animate-pulse"
                    />
                  )}

                  {/* Ponto principal */}
                  <circle
                    cx={`${pt.x}%`}
                    cy={`${pt.y}%`}
                    r={isFirst ? 8 : 5}
                    fill={isFirst ? '#22c55e' : '#ffffff'}
                    stroke={isFirst ? '#14532d' : '#16a34a'}
                    strokeWidth={isFirst ? 2.5 : 2}
                    className={canClose ? 'cursor-pointer hover:scale-125 transition-transform' : 'pointer-events-none'}
                    onMouseEnter={() => isFirst && setHoverFirstPoint(true)}
                    onMouseLeave={() => isFirst && setHoverFirstPoint(false)}
                    onClick={(e) => {
                      if (canClose) {
                        e.stopPropagation();
                        onClosePolygon?.();
                      }
                    }}
                  />

                  {/* Rótulo de fechamento no 1º ponto */}
                  {isFirst && (
                    <text
                      x={`${pt.x}%`}
                      y={`${pt.y - 3.5}%`}
                      textAnchor="middle"
                      fill="#14532d"
                      fontSize={11}
                      fontWeight="bold"
                      className="select-none pointer-events-none bg-white font-sans"
                    >
                      {canClose ? 'Clique para FECHAR' : '1º Ponto'}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Floating Action Bar durante o desenho do corredor para FECHAR / DESFAZER / CANCELAR */}
      {isDrawing && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-emerald-500/70 shadow-2xl rounded-xl px-4 py-2 flex items-center gap-3 z-30 pointer-events-auto backdrop-blur-md">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-emerald-300">
              Desenhando Corredor: <strong className="text-white">{drawingPoints.length}</strong> {drawingPoints.length === 1 ? 'ponto' : 'pontos'}
            </span>
          </div>

          <button
            onClick={onClosePolygon}
            disabled={drawingPoints.length < 3}
            title="Concluir e Fechar Polígono (Enter)"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              drawingPoints.length >= 3
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Fechar Polígono (Enter)
          </button>

          <button
            onClick={onUndoLastPoint}
            disabled={drawingPoints.length === 0}
            title="Desfazer Último Ponto (Backspace)"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Desfazer
          </button>

          <button
            onClick={onCancelDrawing}
            title="Cancelar Desenho (Esc)"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 flex items-center gap-1 transition"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};
