import React from 'react';
import { CADEntity } from '../../types/cad';

interface CADSvgEntitiesRendererProps {
  entities: CADEntity[];
  theme?: 'light' | 'dark';
}

/**
 * Renderizador Vetorial SVG de Entidades CAD 2D
 * Converte entidades geométricas (linhas, polilinhas, retângulos, círculos, arcos,
 * elipses, polígonos, textos, hachuras, cotas e líderes) em elementos SVG puros.
 * No modo 'light' (plotagem A3 em papel branco), traços brancos são convertidos para
 * preto técnico (#0f172a) mantendo contraste e nitidez perfeitos.
 */
export const CADSvgEntitiesRenderer: React.FC<CADSvgEntitiesRendererProps> = ({
  entities,
  theme = 'light'
}) => {
  if (!entities || entities.length === 0) return null;

  const adaptColor = (hex?: string): string => {
    if (!hex) return theme === 'light' ? '#0f172a' : '#ffffff';
    const lower = hex.toLowerCase().trim();
    if (theme === 'light') {
      if (lower === '#ffffff' || lower === '#fff' || lower === '#f8fafc' || lower === '#f1f5f9') {
        return '#0f172a';
      }
    } else {
      if (lower === '#000000' || lower === '#000' || lower === '#090d16' || lower === '#0f172a') {
        return '#e2e8f0';
      }
    }
    return hex;
  };

  return (
    <g className="cad-entities-vector-group">
      {entities.map((entity) => {
        const strokeColor = adaptColor(entity.color);
        const strokeWidth = Math.max(80, entity.strokeWidth || 150);
        const dashArray = entity.dash && entity.dash.length > 0 ? entity.dash.join(',') : undefined;

        switch (entity.type) {
          case 'line': {
            if (entity.points.length < 2) return null;
            const [p0, p1] = entity.points;
            return (
              <line
                key={entity.id}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeLinecap="round"
              />
            );
          }

          case 'polyline': {
            if (entity.points.length < 2) return null;
            const ptsStr = entity.points.map((p) => `${p.x},${p.y}`).join(' ');
            if (entity.isClosed) {
              return (
                <polygon
                  key={entity.id}
                  points={ptsStr}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill={entity.fill ? adaptColor(entity.fill) : 'none'}
                  fillOpacity={entity.fillOpacity || 0.25}
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
            return (
              <polyline
                key={entity.id}
                points={ptsStr}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={dashArray}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          case 'rect': {
            if (entity.points.length < 2) return null;
            const [p0, p1] = entity.points;
            const minX = Math.min(p0.x, p1.x);
            const minY = Math.min(p0.y, p1.y);
            const w = Math.abs(p1.x - p0.x);
            const h = Math.abs(p1.y - p0.y);
            return (
              <rect
                key={entity.id}
                x={minX}
                y={minY}
                width={w}
                height={h}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={entity.fill ? adaptColor(entity.fill) : 'none'}
                fillOpacity={entity.fillOpacity || 0.2}
                strokeDasharray={dashArray}
              />
            );
          }

          case 'circle': {
            if (entity.points.length < 1) return null;
            const center = entity.points[0];
            const r = entity.radius || (entity.points.length >= 2 ? Math.hypot(entity.points[1].x - center.x, entity.points[1].y - center.y) : 1000);
            return (
              <circle
                key={entity.id}
                cx={center.x}
                cy={center.y}
                r={r}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={entity.fill ? adaptColor(entity.fill) : 'none'}
                fillOpacity={entity.fillOpacity || 0.2}
                strokeDasharray={dashArray}
              />
            );
          }

          case 'arc': {
            if (entity.points.length < 3) return null;
            const [p1, p2, p3] = entity.points;
            return (
              <path
                key={entity.id}
                d={`M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y}`}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={dashArray}
                strokeLinecap="round"
              />
            );
          }

          case 'ellipse': {
            if (entity.points.length < 1) return null;
            const center = entity.points[0];
            const rx = entity.radiusX || 1200;
            const ry = entity.radiusY || 800;
            return (
              <ellipse
                key={entity.id}
                cx={center.x}
                cy={center.y}
                rx={rx}
                ry={ry}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={entity.fill ? adaptColor(entity.fill) : 'none'}
                fillOpacity={entity.fillOpacity || 0.2}
                strokeDasharray={dashArray}
              />
            );
          }

          case 'polygon': {
            if (entity.points.length < 1) return null;
            const center = entity.points[0];
            const r = entity.radius || 1000;
            const sides = entity.sides || 6;
            const pts: { x: number; y: number }[] = [];
            for (let i = 0; i < sides; i++) {
              const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
              pts.push({ x: center.x + r * Math.cos(angle), y: center.y + r * Math.sin(angle) });
            }
            return (
              <polygon
                key={entity.id}
                points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={entity.fill ? adaptColor(entity.fill) : 'none'}
                fillOpacity={entity.fillOpacity || 0.2}
                strokeDasharray={dashArray}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          case 'hatch': {
            if (entity.points.length < 3) return null;
            const ptsStr = entity.points.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <polygon
                key={entity.id}
                points={ptsStr}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={entity.fill ? adaptColor(entity.fill) : strokeColor}
                fillOpacity={entity.fillOpacity || 0.3}
                strokeDasharray={dashArray}
              />
            );
          }

          case 'text': {
            if (entity.points.length < 1 || !entity.text) return null;
            const pt = entity.points[0];
            const fSize = entity.fontSize || 350;
            return (
              <text
                key={entity.id}
                x={pt.x}
                y={pt.y}
                fontSize={fSize}
                fill={strokeColor}
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="start"
                dominantBaseline="middle"
              >
                {entity.text}
              </text>
            );
          }

          case 'point': {
            if (entity.points.length < 1) return null;
            const pt = entity.points[0];
            const size = Math.max(120, strokeWidth * 1.5);
            return (
              <g key={entity.id}>
                <line x1={pt.x - size} y1={pt.y} x2={pt.x + size} y2={pt.y} stroke={strokeColor} strokeWidth={strokeWidth} />
                <line x1={pt.x} y1={pt.y - size} x2={pt.x} y2={pt.y + size} stroke={strokeColor} strokeWidth={strokeWidth} />
                <circle cx={pt.x} cy={pt.y} r={size * 0.5} stroke={strokeColor} strokeWidth={strokeWidth * 0.8} fill="none" />
              </g>
            );
          }

          case 'dimension_linear':
          case 'dimension_aligned': {
            if (entity.points.length < 2) return null;
            const [p0, p1] = entity.points;
            const dist = entity.dimensionValue || Math.hypot(p1.x - p0.x, p1.y - p0.y);
            const distM = (dist / 1000).toFixed(2);
            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;
            const offset = 400; // deslocamento da linha de cota
            const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
            const perpX = -Math.sin(angle) * offset;
            const perpY = Math.cos(angle) * offset;

            const c0 = { x: p0.x + perpX, y: p0.y + perpY };
            const c1 = { x: p1.x + perpX, y: p1.y + perpY };
            const textX = midX + perpX * 1.4;
            const textY = midY + perpY * 1.4;
            const textAngle = (angle * 180) / Math.PI;

            return (
              <g key={entity.id} className="cad-dimension">
                {/* Linhas de chamada */}
                <line x1={p0.x} y1={p0.y} x2={c0.x + perpX * 0.2} y2={c0.y + perpY * 0.2} stroke={strokeColor} strokeWidth={strokeWidth * 0.7} />
                <line x1={p1.x} y1={p1.y} x2={c1.x + perpX * 0.2} y2={c1.y + perpY * 0.2} stroke={strokeColor} strokeWidth={strokeWidth * 0.7} />
                {/* Linha principal de cota */}
                <line x1={c0.x} y1={c0.y} x2={c1.x} y2={c1.y} stroke={strokeColor} strokeWidth={strokeWidth} />
                {/* Ticks arquitetônicos nas extremidades */}
                <line
                  x1={c0.x - perpY * 0.4 - perpX * 0.4}
                  y1={c0.y + perpX * 0.4 - perpY * 0.4}
                  x2={c0.x + perpY * 0.4 + perpX * 0.4}
                  y2={c0.y - perpX * 0.4 + perpY * 0.4}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth * 1.4}
                />
                <line
                  x1={c1.x - perpY * 0.4 - perpX * 0.4}
                  y1={c1.y + perpX * 0.4 - perpY * 0.4}
                  x2={c1.x + perpY * 0.4 + perpX * 0.4}
                  y2={c1.y - perpX * 0.4 + perpY * 0.4}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth * 1.4}
                />
                {/* Texto da cota */}
                <text
                  x={textX}
                  y={textY}
                  fontSize={strokeWidth * 2.5}
                  fill={strokeColor}
                  fontFamily="monospace, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={Math.abs(textAngle) > 90 ? `rotate(${textAngle + 180}, ${textX}, ${textY})` : `rotate(${textAngle}, ${textX}, ${textY})`}
                >
                  {entity.dimensionText || `${distM}m`}
                </text>
              </g>
            );
          }

          default:
            return null;
        }
      })}
    </g>
  );
};
