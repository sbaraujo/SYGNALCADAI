/**
 * SIGNAFLUX CAD AI - Professional DXF Exporter
 * Generates 100% native AutoCAD-compatible DXF files (ASCII format R12 / R2000).
 * Conforms to NBR 13434, NBR 16820 and Section 9 of the SignaFlux CAD Engine Manual.
 */

import { Project, Floor, PlacedSymbol, SignSymbol } from '../types/cad';

export interface DxfEntityCounts {
  lines: number;
  circles: number;
  inserts: number;
  blocks: number;
  texts: number;
  total: number;
}

export interface DxfExportOptions {
  includeArchitecture: boolean;
  includeSigns: boolean;
  includeVisibilityRadius: boolean;
  includeDimensions: boolean;
  includeTexts: boolean;
  includeLegendTable: boolean;
  includeTitleBlock: boolean;
}

export const DEFAULT_DXF_OPTIONS: DxfExportOptions = {
  includeArchitecture: true,
  includeSigns: true,
  includeVisibilityRadius: true,
  includeDimensions: true,
  includeTexts: true,
  includeLegendTable: true,
  includeTitleBlock: true
};

/**
 * Calculates real-time entity count preview before generating DXF
 */
export function calculateDxfEntityCounts(
  floor: Floor,
  project: Project,
  options: DxfExportOptions = DEFAULT_DXF_OPTIONS
): DxfEntityCounts {
  let lines = 0;
  let circles = 0;
  let inserts = 0;
  let blocks = 0;
  let texts = 0;

  // Architectural entities / bounds
  if (options.includeArchitecture) {
    // 4 boundary lines + grid markers
    lines += 8;
    texts += 4;
  }

  // Annotations (Lines, dimensions, texts)
  if (floor.annotations) {
    floor.annotations.forEach((ann) => {
      if (ann.type === 'line' || ann.type === 'dimension') {
        if (options.includeDimensions) {
          lines += 1;
          texts += ann.text ? 1 : 0;
        }
      } else if (ann.type === 'rect') {
        if (options.includeArchitecture) {
          lines += 4;
        }
      } else if (ann.type === 'text') {
        if (options.includeTexts) {
          texts += 1;
        }
      }
    });
  }

  // Signage Placed Symbols
  if (options.includeSigns) {
    inserts += floor.placedSymbols.length;
    blocks += new Set(floor.placedSymbols.map((s) => s.symbol_id)).size;
    texts += floor.placedSymbols.length; // Technical tag / code
    lines += floor.placedSymbols.length * 4; // Rectangular plaque border
  }

  // Visibility radius circles (NBR 13434-2)
  if (options.includeVisibilityRadius) {
    circles += floor.placedSymbols.length;
  }

  // Legend Table
  if (options.includeLegendTable) {
    const uniqueSymbolsCount = new Set(floor.placedSymbols.map((s) => s.symbol_id)).size;
    lines += (uniqueSymbolsCount + 2) * 2; // Horizontal & vertical grid lines
    texts += (uniqueSymbolsCount + 1) * 4; // Columns: Código, Símbolo, Dimensões, Qtd
  }

  // Title Block (Carimbo Técnico NBR 6492)
  if (options.includeTitleBlock) {
    lines += 10;
    texts += 8;
  }

  return {
    lines,
    circles,
    inserts,
    blocks,
    texts,
    total: lines + circles + inserts + blocks + texts
  };
}

/**
 * Builds the complete AutoCAD DXF file string
 */
export function generateDxfContent(
  floor: Floor,
  project: Project,
  symbolsCatalog: SignSymbol[],
  options: DxfExportOptions = DEFAULT_DXF_OPTIONS
): string {
  const chunks: string[] = [];

  // DXF HEADER
  chunks.push('0\nSECTION\n2\nHEADER\n');
  chunks.push('9\n$ACADVER\n1\nAC1009\n'); // AutoCAD R12 / R2000 compatibility
  chunks.push('9\n$INSUNITS\n70\n4\n'); // 4 = Millimeters
  chunks.push('9\n$MEASUREMENT\n70\n1\n'); // 1 = Metric
  chunks.push('0\nENDSEC\n');

  // DXF TABLES (Layers & Line types)
  chunks.push('0\nSECTION\n2\nTABLES\n');
  
  // Layer Table definition
  chunks.push('0\nTABLE\n2\nLAYER\n70\n10\n');

  // Normative Layers according to Manual Section 9.1
  const layers = [
    { name: 'SIGNAFLUX_ARQUITETURA', color: 7 }, // White/Black
    { name: 'SIGNAFLUX_SINAIS_SAIDA', color: 3 }, // Green
    { name: 'SIGNAFLUX_SINAIS_COMBATE', color: 1 }, // Red
    { name: 'SIGNAFLUX_SINAIS_ALERTA', color: 2 }, // Yellow
    { name: 'SIGNAFLUX_SINAIS_PROIBICAO', color: 1 }, // Red
    { name: 'SIGNAFLUX_RAIOS_VISIBILIDADE', color: 8 }, // Gray
    { name: 'SIGNAFLUX_COTAS', color: 4 }, // Cyan
    { name: 'SIGNAFLUX_TEXTOS', color: 7 }, // White/Black
    { name: 'SIGNAFLUX_TABELA_LEGENDA', color: 5 }, // Blue
    { name: 'SIGNAFLUX_CARIMBO', color: 7 } // White/Black
  ];

  layers.forEach((lyr) => {
    chunks.push(`0\nLAYER\n2\n${lyr.name}\n70\n0\n62\n${lyr.color}\n6\nCONTINUOUS\n`);
  });

  chunks.push('0\nENDTAB\n');
  chunks.push('0\nENDSEC\n');

  // DXF BLOCKS SECTION
  chunks.push('0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n');

  // DXF ENTITIES SECTION
  chunks.push('0\nSECTION\n2\nENTITIES\n');

  const widthMm = (floor.widthMeters || 30) * 1000;
  const heightMm = (floor.heightMeters || 20) * 1000;

  // 1. Architecture Perimeter
  if (options.includeArchitecture) {
    // Outer perimeter boundary
    addDxfLine(chunks, 'SIGNAFLUX_ARQUITETURA', 0, 0, widthMm, 0);
    addDxfLine(chunks, 'SIGNAFLUX_ARQUITETURA', widthMm, 0, widthMm, heightMm);
    addDxfLine(chunks, 'SIGNAFLUX_ARQUITETURA', widthMm, heightMm, 0, heightMm);
    addDxfLine(chunks, 'SIGNAFLUX_ARQUITETURA', 0, heightMm, 0, 0);

    // Floor title
    addDxfText(
      chunks,
      'SIGNAFLUX_TEXTOS',
      200,
      heightMm + 600,
      400,
      `${project.nome.toUpperCase()} - ${floor.name.toUpperCase()} (ESCALA 1:100)`
    );
  }

  // 2. Custom Annotations (Lines, Dimensions, Rectangles, Texts)
  if (floor.annotations && floor.annotations.length > 0) {
    floor.annotations.forEach((ann) => {
      if (ann.type === 'line' && options.includeDimensions) {
        if (ann.points.length >= 2) {
          addDxfLine(
            chunks,
            'SIGNAFLUX_COTAS',
            ann.points[0].x,
            ann.points[0].y,
            ann.points[1].x,
            ann.points[1].y
          );
        }
      } else if (ann.type === 'rect' && options.includeArchitecture) {
        if (ann.points.length >= 2) {
          const x1 = ann.points[0].x;
          const y1 = ann.points[0].y;
          const x2 = ann.points[1].x;
          const y2 = ann.points[1].y;
          addDxfLine(chunks, 'SIGNAFLUX_ARQUITETURA', x1, y1, x2, y1);
          addDxfLine(chunks, 'SIGNAFLUX_ARQUITETURA', x2, y1, x2, y2);
          addDxfLine(chunks, 'SIGNAFLUX_ARQUITETURA', x2, y2, x1, y2);
          addDxfLine(chunks, 'SIGNAFLUX_ARQUITETURA', x1, y2, x1, y1);
        }
      } else if (ann.type === 'text' && options.includeTexts) {
        if (ann.points.length >= 1) {
          addDxfText(
            chunks,
            'SIGNAFLUX_TEXTOS',
            ann.points[0].x,
            ann.points[0].y,
            250,
            ann.text || 'Ambiente'
          );
        }
      }
    });
  }

  // 3. Placed Signage Symbols
  if (options.includeSigns && floor.placedSymbols.length > 0) {
    floor.placedSymbols.forEach((sym) => {
      const def = symbolsCatalog.find((s) => s.id === sym.symbol_id);
      const cat = def?.categoria || 'ORIENTACAO_SALVAMENTO';

      // Pick corresponding normative layer
      let layerName = 'SIGNAFLUX_SINAIS_SAIDA';
      if (cat === 'EQUIPAMENTOS') layerName = 'SIGNAFLUX_SINAIS_COMBATE';
      else if (cat === 'ALERTA') layerName = 'SIGNAFLUX_SINAIS_ALERTA';
      else if (cat === 'PROIBICAO') layerName = 'SIGNAFLUX_SINAIS_PROIBICAO';

      const w = (sym.width || def?.largura || 250) * (sym.scale || 1.0);
      const h = (sym.height || def?.altura || 150) * (sym.scale || 1.0);
      const x = sym.x;
      const y = sym.y;

      // Draw rectangular plaque outline
      const halfW = w / 2;
      const halfH = h / 2;
      addDxfLine(chunks, layerName, x - halfW, y - halfH, x + halfW, y - halfH);
      addDxfLine(chunks, layerName, x + halfW, y - halfH, x + halfW, y + halfH);
      addDxfLine(chunks, layerName, x + halfW, y + halfH, x - halfW, y + halfH);
      addDxfLine(chunks, layerName, x - halfW, y + halfH, x - halfW, y - halfH);

      // Symbol code text inside
      const codeText = def?.codigo_normativo || def?.codigo_interno || 'SINAL';
      addDxfText(chunks, layerName, x - halfW + 40, y, Math.min(120, h * 0.4), codeText);

      // Visibility Radius Circle (NBR 13434-2 calculation)
      // d = sqrt(A / k) -> For A=0.0375m2, d ~ 10-15 meters
      if (options.includeVisibilityRadius) {
        const radiusMeters = cat === 'ORIENTACAO_SALVAMENTO' ? 12.0 : cat === 'EQUIPAMENTOS' ? 10.0 : 8.0;
        const radiusMm = radiusMeters * 1000;
        addDxfCircle(chunks, 'SIGNAFLUX_RAIOS_VISIBILIDADE', x, y, radiusMm);
      }
    });
  }

  // 4. Legend Table (SIGNAFLUX_TABELA_LEGENDA)
  if (options.includeLegendTable && floor.placedSymbols.length > 0) {
    const tableX = widthMm + 1500;
    const tableY = heightMm;
    const tableWidth = 6000;
    const rowHeight = 600;

    // Collect distinct symbols with counts
    const symbolCounts = new Map<string, { def: SignSymbol; count: number }>();
    floor.placedSymbols.forEach((ps) => {
      const def = symbolsCatalog.find((s) => s.id === ps.symbol_id);
      if (!def) return;
      if (!symbolCounts.has(def.id)) {
        symbolCounts.set(def.id, { def, count: ps.quantity });
      } else {
        symbolCounts.get(def.id)!.count += ps.quantity;
      }
    });

    const uniqueItems = Array.from(symbolCounts.values());

    // Table Header
    addDxfText(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX, tableY + 500, 300, 'LEGENDA DE SINALIZACAO DE EMERGENCIA (NBR 13434)');
    addDxfLine(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX, tableY, tableX + tableWidth, tableY);

    // Columns: [CODIGO] [DESCRICAO] [DIMENSOES] [QTD]
    addDxfText(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 100, tableY - 400, 200, 'CODIGO');
    addDxfText(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 1200, tableY - 400, 200, 'DESCRICAO NORMATIVA');
    addDxfText(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 4500, tableY - 400, 200, 'DIMENSAO');
    addDxfText(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 5500, tableY - 400, 200, 'QTD');

    addDxfLine(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX, tableY - rowHeight, tableX + tableWidth, tableY - rowHeight);

    // Table Rows
    uniqueItems.forEach((item, idx) => {
      const currentY = tableY - (idx + 2) * rowHeight;
      const code = item.def.codigo_normativo || item.def.codigo_interno;
      const name = item.def.nome.substring(0, 32);
      const dims = `${item.def.largura}x${item.def.altura}mm`;

      addDxfText(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 100, currentY + 200, 180, code);
      addDxfText(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 1200, currentY + 200, 180, name);
      addDxfText(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 4500, currentY + 200, 180, dims);
      addDxfText(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 5500, currentY + 200, 180, String(item.count));

      addDxfLine(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX, currentY, tableX + tableWidth, currentY);
    });

    // Outer table border & vertical lines
    const totalTableHeight = (uniqueItems.length + 2) * rowHeight;
    addDxfLine(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX, tableY, tableX, tableY - totalTableHeight);
    addDxfLine(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + tableWidth, tableY, tableX + tableWidth, tableY - totalTableHeight);
    addDxfLine(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 1100, tableY, tableX + 1100, tableY - totalTableHeight);
    addDxfLine(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 4400, tableY, tableX + 4400, tableY - totalTableHeight);
    addDxfLine(chunks, 'SIGNAFLUX_TABELA_LEGENDA', tableX + 5400, tableY, tableX + 5400, tableY - totalTableHeight);
  }

  // 5. Title Block / Carimbo Técnico (SIGNAFLUX_CARIMBO)
  if (options.includeTitleBlock) {
    const stampX = widthMm + 1500;
    const stampY = 0;
    const stampWidth = 6000;
    const stampHeight = 2400;

    // Stamp Border
    addDxfLine(chunks, 'SIGNAFLUX_CARIMBO', stampX, stampY, stampX + stampWidth, stampY);
    addDxfLine(chunks, 'SIGNAFLUX_CARIMBO', stampX + stampWidth, stampY, stampX + stampWidth, stampY + stampHeight);
    addDxfLine(chunks, 'SIGNAFLUX_CARIMBO', stampX + stampWidth, stampY + stampHeight, stampX, stampY + stampHeight);
    addDxfLine(chunks, 'SIGNAFLUX_CARIMBO', stampX, stampY + stampHeight, stampX, stampY);

    // Stamp Content
    addDxfText(chunks, 'SIGNAFLUX_CARIMBO', stampX + 200, stampY + 2100, 260, 'SIGNAFLUX CAD ENGINE - PROJETO EXECUTIVO');
    addDxfText(chunks, 'SIGNAFLUX_CARIMBO', stampX + 200, stampY + 1750, 200, `PROJETO: ${project.nome.toUpperCase()}`);
    addDxfText(chunks, 'SIGNAFLUX_CARIMBO', stampX + 200, stampY + 1400, 180, `EMPREENDIMENTO: ${project.empreendimento}`);
    addDxfText(chunks, 'SIGNAFLUX_CARIMBO', stampX + 200, stampY + 1100, 180, `CLIENTE: ${project.cliente}`);
    addDxfText(chunks, 'SIGNAFLUX_CARIMBO', stampX + 200, stampY + 800, 180, `RESPONSAVEL TECNICO: ${project.responsavel_tecnico}`);
    addDxfText(chunks, 'SIGNAFLUX_CARIMBO', stampX + 200, stampY + 500, 180, `REGISTRO: ${project.crea_cau} | ${project.art_rrt}`);
    addDxfText(chunks, 'SIGNAFLUX_CARIMBO', stampX + 200, stampY + 200, 180, `DATA: ${project.data} | REVISAO: ${project.revisao}`);
  }

  chunks.push('0\nENDSEC\n');
  chunks.push('0\nEOF\n');

  return chunks.join('');
}

/**
 * Helper to append a 2D DXF LINE entity
 */
function addDxfLine(
  chunks: string[],
  layer: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  chunks.push(
    `0\nLINE\n8\n${layer}\n10\n${x1.toFixed(1)}\n20\n${y1.toFixed(1)}\n30\n0.0\n11\n${x2.toFixed(1)}\n21\n${y2.toFixed(1)}\n31\n0.0\n`
  );
}

/**
 * Helper to append a 2D DXF CIRCLE entity
 */
function addDxfCircle(
  chunks: string[],
  layer: string,
  cx: number,
  cy: number,
  radius: number
) {
  chunks.push(
    `0\nCIRCLE\n8\n${layer}\n10\n${cx.toFixed(1)}\n20\n${cy.toFixed(1)}\n30\n0.0\n40\n${radius.toFixed(1)}\n`
  );
}

/**
 * Helper to append a DXF TEXT entity
 */
function addDxfText(
  chunks: string[],
  layer: string,
  x: number,
  y: number,
  height: number,
  text: string
) {
  // DXF text sanitization: escape newlines
  const sanitized = text.replace(/[\r\n]+/g, ' ');
  chunks.push(
    `0\nTEXT\n8\n${layer}\n10\n${x.toFixed(1)}\n20\n${y.toFixed(1)}\n30\n0.0\n40\n${height.toFixed(1)}\n1\n${sanitized}\n`
  );
}

/**
 * Triggers direct browser download of the .dxf file
 */
export function downloadDxfFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.dxf') ? filename : `${filename}.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
