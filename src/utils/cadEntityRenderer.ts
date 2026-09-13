import Konva from 'konva';
import { CADEntity } from '../types/cad';

export interface RenderCADEntitiesOptions {
  layer: Konva.Layer;
  entities: CADEntity[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string) => void;
  activeTool: string;
}

/**
 * Renderiza todas as entidades vetoriais de desenho 2D do CAD na camada Konva.
 * Suporta: Linhas, Polilinhas, Retângulos, Círculos, Arcos, Elipses, Polígonos,
 * Textos técnicos, Pontos, Hachuras, Cotas Lineares, Cotas Alinhadas, Cotas Radiais e Líderes.
 */
export function renderCADEntities({
  layer,
  entities,
  selectedEntityId,
  onSelectEntity,
  activeTool
}: RenderCADEntitiesOptions): void {
  layer.destroyChildren();

  if (!entities || entities.length === 0) {
    layer.batchDraw();
    return;
  }

  entities.forEach((entity) => {
    const isSelected = entity.id === selectedEntityId;
    const strokeColor = isSelected ? '#38bdf8' : (entity.color || '#ffffff');
    const strokeWidth = entity.strokeWidth || 200;
    const group = new Konva.Group({ id: `entity-group-${entity.id}` });

    // Permite selecionar no clique se a ferramenta atual for de seleção ou modificação
    group.on('click tap', (e) => {
      e.cancelBubble = true;
      onSelectEntity(entity.id);
    });

    switch (entity.type) {
      case 'line': {
        if (entity.points.length >= 2) {
          const p0 = entity.points[0];
          const p1 = entity.points[1];
          group.add(new Konva.Line({
            points: [p0.x, p0.y, p1.x, p1.y],
            stroke: strokeColor,
            strokeWidth: isSelected ? strokeWidth * 1.4 : strokeWidth,
            dash: entity.dash,
            lineCap: 'round',
            lineJoin: 'round',
            hitStrokeWidth: Math.max(300, strokeWidth * 3)
          }));
        }
        break;
      }

      case 'polyline': {
        if (entity.points.length >= 2) {
          const flatPoints = entity.points.flatMap((p) => [p.x, p.y]);
          group.add(new Konva.Line({
            points: flatPoints,
            closed: !!entity.isClosed,
            stroke: strokeColor,
            strokeWidth: isSelected ? strokeWidth * 1.4 : strokeWidth,
            fill: entity.fill,
            fillOpacity: entity.fillOpacity || 0.3,
            dash: entity.dash,
            lineCap: 'round',
            lineJoin: 'round',
            hitStrokeWidth: Math.max(300, strokeWidth * 3)
          }));
        }
        break;
      }

      case 'rect': {
        if (entity.points.length >= 2) {
          const p0 = entity.points[0];
          const p1 = entity.points[1];
          const minX = Math.min(p0.x, p1.x);
          const minY = Math.min(p0.y, p1.y);
          const w = Math.abs(p1.x - p0.x);
          const h = Math.abs(p1.y - p0.y);
          group.add(new Konva.Rect({
            x: minX,
            y: minY,
            width: w,
            height: h,
            stroke: strokeColor,
            strokeWidth: isSelected ? strokeWidth * 1.4 : strokeWidth,
            fill: entity.fill,
            fillOpacity: entity.fillOpacity,
            dash: entity.dash,
            hitStrokeWidth: Math.max(300, strokeWidth * 3)
          }));
        }
        break;
      }

      case 'circle': {
        if (entity.points.length >= 1) {
          const center = entity.points[0];
          const radius = entity.radius || (entity.points[1] ? Math.hypot(entity.points[1].x - center.x, entity.points[1].y - center.y) : 1000);
          group.add(new Konva.Circle({
            x: center.x,
            y: center.y,
            radius,
            stroke: strokeColor,
            strokeWidth: isSelected ? strokeWidth * 1.4 : strokeWidth,
            fill: entity.fill,
            fillOpacity: entity.fillOpacity,
            dash: entity.dash,
            hitStrokeWidth: Math.max(300, strokeWidth * 3)
          }));
        }
        break;
      }

      case 'arc': {
        if (entity.points.length >= 1) {
          const center = entity.points[0];
          const radius = entity.radius || 1000;
          const startAngle = entity.startAngle || 0;
          const endAngle = entity.endAngle || 90;
          const span = (endAngle - startAngle + 360) % 360 || 90;
          group.add(new Konva.Arc({
            x: center.x,
            y: center.y,
            innerRadius: radius,
            outerRadius: radius,
            angle: span,
            rotation: startAngle,
            stroke: strokeColor,
            strokeWidth: isSelected ? strokeWidth * 1.4 : strokeWidth,
            hitStrokeWidth: Math.max(300, strokeWidth * 3)
          }));
        }
        break;
      }

      case 'ellipse': {
        if (entity.points.length >= 1) {
          const center = entity.points[0];
          const radiusX = entity.radiusX || 1200;
          const radiusY = entity.radiusY || 800;
          group.add(new Konva.Ellipse({
            x: center.x,
            y: center.y,
            radiusX,
            radiusY,
            stroke: strokeColor,
            strokeWidth: isSelected ? strokeWidth * 1.4 : strokeWidth,
            fill: entity.fill,
            fillOpacity: entity.fillOpacity,
            hitStrokeWidth: Math.max(300, strokeWidth * 3)
          }));
        }
        break;
      }

      case 'polygon': {
        if (entity.points.length >= 1) {
          const center = entity.points[0];
          const radius = entity.radius || 1000;
          const sides = entity.sides || 6;
          group.add(new Konva.RegularPolygon({
            x: center.x,
            y: center.y,
            sides,
            radius,
            stroke: strokeColor,
            strokeWidth: isSelected ? strokeWidth * 1.4 : strokeWidth,
            fill: entity.fill,
            fillOpacity: entity.fillOpacity,
            hitStrokeWidth: Math.max(300, strokeWidth * 3)
          }));
        }
        break;
      }

      case 'text': {
        if (entity.points.length >= 1) {
          const pos = entity.points[0];
          const fontSize = entity.fontSize || 350;
          group.add(new Konva.Text({
            x: pos.x,
            y: pos.y,
            text: entity.text || 'Texto Técnico CAD',
            fontSize,
            fontFamily: 'monospace',
            fill: strokeColor,
            rotation: entity.rotation || 0,
            padding: 8
          }));
        }
        break;
      }

      case 'point': {
        if (entity.points.length >= 1) {
          const p = entity.points[0];
          const r = Math.max(120, strokeWidth * 0.8);
          // Círculo central
          group.add(new Konva.Circle({
            x: p.x,
            y: p.y,
            radius: r,
            fill: strokeColor
          }));
          // Mira em cruz
          const arm = r * 2.5;
          group.add(new Konva.Line({
            points: [p.x - arm, p.y, p.x + arm, p.y],
            stroke: strokeColor,
            strokeWidth: strokeWidth * 0.5
          }));
          group.add(new Konva.Line({
            points: [p.x, p.y - arm, p.x, p.y + arm],
            stroke: strokeColor,
            strokeWidth: strokeWidth * 0.5
          }));
        }
        break;
      }

      case 'hatch': {
        if (entity.points.length >= 3) {
          const flatPoints = entity.points.flatMap((p) => [p.x, p.y]);
          group.add(new Konva.Line({
            points: flatPoints,
            closed: true,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            fill: entity.fill || strokeColor,
            fillOpacity: entity.fillOpacity || 0.35,
            hitStrokeWidth: Math.max(300, strokeWidth * 3)
          }));
        }
        break;
      }

      case 'dimension_linear':
      case 'dimension_aligned': {
        if (entity.points.length >= 2) {
          const p0 = entity.points[0];
          const p1 = entity.points[1];
          const offsetPt = entity.points[2] || p1;
          const distMm = Math.hypot(p1.x - p0.x, p1.y - p0.y);
          const distMeters = distMm / 1000;
          const textVal = entity.dimensionText || `${distMeters.toFixed(2)} m`;

          // Linha de cota principal
          const midX = (p0.x + p1.x) / 2;
          const midY = (p0.y + p1.y) / 2;
          const angleRad = Math.atan2(p1.y - p0.y, p1.x - p0.x);
          const angleDeg = (angleRad * 180) / Math.PI;

          // Vetor perpendicular para o offset
          const perpX = -Math.sin(angleRad);
          const perpY = Math.cos(angleRad);
          const offsetDist = Math.hypot(offsetPt.x - midX, offsetPt.y - midY) || 800;

          const dimP0 = { x: p0.x + perpX * offsetDist, y: p0.y + perpY * offsetDist };
          const dimP1 = { x: p1.x + perpX * offsetDist, y: p1.y + perpY * offsetDist };

          // Linhas de extensão (witness lines)
          group.add(new Konva.Line({
            points: [p0.x, p0.y, dimP0.x, dimP0.y],
            stroke: strokeColor,
            strokeWidth: strokeWidth * 0.6,
            opacity: 0.7
          }));
          group.add(new Konva.Line({
            points: [p1.x, p1.y, dimP1.x, dimP1.y],
            stroke: strokeColor,
            strokeWidth: strokeWidth * 0.6,
            opacity: 0.7
          }));

          // Linha de cota com setas
          group.add(new Konva.Line({
            points: [dimP0.x, dimP0.y, dimP1.x, dimP1.y],
            stroke: strokeColor,
            strokeWidth: strokeWidth
          }));

          // Ticks / Setas oblíquas arquitetônicas de 45°
          const tickSize = Math.max(200, strokeWidth * 1.5);
          group.add(new Konva.Line({
            points: [dimP0.x - tickSize, dimP0.y - tickSize, dimP0.x + tickSize, dimP0.y + tickSize],
            stroke: strokeColor,
            strokeWidth: strokeWidth * 1.4
          }));
          group.add(new Konva.Line({
            points: [dimP1.x - tickSize, dimP1.y - tickSize, dimP1.x + tickSize, dimP1.y + tickSize],
            stroke: strokeColor,
            strokeWidth: strokeWidth * 1.4
          }));

          // Texto da cota
          const dimMidX = (dimP0.x + dimP1.x) / 2;
          const dimMidY = (dimP0.y + dimP1.y) / 2;
          const textNode = new Konva.Text({
            x: dimMidX,
            y: dimMidY - 350,
            text: textVal,
            fontSize: 280,
            fontFamily: 'monospace',
            fontStyle: 'bold',
            fill: strokeColor,
            rotation: angleDeg > 90 || angleDeg < -90 ? angleDeg + 180 : angleDeg
          });
          textNode.offsetX(textNode.width() / 2);
          group.add(textNode);
        }
        break;
      }

      case 'dimension_radial': {
        if (entity.points.length >= 2) {
          const center = entity.points[0];
          const edge = entity.points[1];
          const radiusMm = Math.hypot(edge.x - center.x, edge.y - center.y);
          const textVal = `R = ${(radiusMm / 1000).toFixed(2)} m`;

          group.add(new Konva.Line({
            points: [center.x, center.y, edge.x, edge.y],
            stroke: strokeColor,
            strokeWidth: strokeWidth
          }));

          // Seta na borda
          group.add(new Konva.Circle({
            x: edge.x,
            y: edge.y,
            radius: strokeWidth * 1.2,
            fill: strokeColor
          }));

          const textNode = new Konva.Text({
            x: edge.x + 200,
            y: edge.y - 300,
            text: textVal,
            fontSize: 280,
            fontFamily: 'monospace',
            fontStyle: 'bold',
            fill: strokeColor
          });
          group.add(textNode);
        }
        break;
      }

      case 'leader': {
        if (entity.points.length >= 2) {
          const p0 = entity.points[0]; // Ponta da seta
          const p1 = entity.points[1]; // Joelho
          const p2 = entity.points[2] || { x: p1.x + 800, y: p1.y }; // Pouso horizontal

          // Linha quebrada
          group.add(new Konva.Line({
            points: [p0.x, p0.y, p1.x, p1.y, p2.x, p2.y],
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            lineJoin: 'miter'
          }));

          // Seta de ponta preenchida
          const angle = Math.atan2(p0.y - p1.y, p0.x - p1.x);
          const arrowLen = Math.max(300, strokeWidth * 2.5);
          const arrowW = arrowLen * 0.4;
          const a1 = {
            x: p0.x - arrowLen * Math.cos(angle) + arrowW * Math.sin(angle),
            y: p0.y - arrowLen * Math.sin(angle) - arrowW * Math.cos(angle)
          };
          const a2 = {
            x: p0.x - arrowLen * Math.cos(angle) - arrowW * Math.sin(angle),
            y: p0.y - arrowLen * Math.sin(angle) + arrowW * Math.cos(angle)
          };
          group.add(new Konva.Line({
            points: [p0.x, p0.y, a1.x, a1.y, a2.x, a2.y],
            closed: true,
            fill: strokeColor
          }));

          // Texto da anotação
          const textNode = new Konva.Text({
            x: p2.x + 150,
            y: p2.y - 180,
            text: entity.text || 'Nota Técnica',
            fontSize: 260,
            fontFamily: 'monospace',
            fill: strokeColor
          });
          group.add(textNode);
        }
        break;
      }
    }

    // Se estiver selecionado, adiciona grips (alças quadradas azuis para manipulação nos vértices)
    if (isSelected) {
      entity.points.forEach((pt, idx) => {
        const grip = new Konva.Rect({
          x: pt.x - 140,
          y: pt.y - 140,
          width: 280,
          height: 280,
          fill: '#0284c7',
          stroke: '#ffffff',
          strokeWidth: 40,
          name: `grip-${idx}`
        });
        group.add(grip);
      });
    }

    layer.add(group);
  });

  layer.batchDraw();
}
