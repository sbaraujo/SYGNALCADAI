import DxfParser from 'dxf-parser';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker if needed or use inline/fallback
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    // Use worker from unpkg or cdnjs
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  }
} catch (e) {
  console.warn('PDF.js worker initialization:', e);
}

export interface ImportedPlanResult {
  floorPlanUrl: string;
  floorPlanType: 'dxf' | 'pdf' | 'svg' | 'raster';
  widthMeters: number;
  heightMeters: number;
  fileName: string;
  fileSizeBytes: number;
  viewBox?: string;
}

/**
 * Parses a DXF CAD file and converts entities into a crisp vector SVG string (Data URL).
 */
export async function parseDxfFile(file: File): Promise<ImportedPlanResult> {
  const text = await file.text();
  const parser = new DxfParser();
  const dxf = parser.parseSync(text);

  if (!dxf || !dxf.entities || dxf.entities.length === 0) {
    throw new Error('Arquivo DXF inválido ou sem entidades geométricas.');
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const updateBounds = (x: number, y: number) => {
    if (isNaN(x) || isNaN(y)) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  const svgElements: string[] = [];

  for (const entity of dxf.entities) {
    const color = '#38bdf8'; // Default CAD cyan/blue
    const strokeWidth = '1';

    if (entity.type === 'LINE') {
      const line = entity as any;
      if (line.vertices && line.vertices.length >= 2) {
        const v1 = line.vertices[0];
        const v2 = line.vertices[1];
        updateBounds(v1.x, -v1.y);
        updateBounds(v2.x, -v2.y);
        svgElements.push(
          `<line x1="${v1.x}" y1="${-v1.y}" x2="${v2.x}" y2="${-v2.y}" stroke="${color}" stroke-width="${strokeWidth}" />`
        );
      }
    } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
      const poly = entity as any;
      if (poly.vertices && poly.vertices.length > 0) {
        const points = poly.vertices
          .map((v: any) => {
            updateBounds(v.x, -v.y);
            return `${v.x},${-v.y}`;
          })
          .join(' ');
        const isClosed = poly.shape === true || poly.isClosed === true;
        if (isClosed) {
          svgElements.push(
            `<polygon points="${points}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`
          );
        } else {
          svgElements.push(
            `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`
          );
        }
      }
    } else if (entity.type === 'CIRCLE') {
      const circle = entity as any;
      const cx = circle.center.x;
      const cy = -circle.center.y;
      const r = circle.radius;
      updateBounds(cx - r, cy - r);
      updateBounds(cx + r, cy + r);
      svgElements.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`
      );
    } else if (entity.type === 'ARC') {
      const arc = entity as any;
      const cx = arc.center.x;
      const cy = -arc.center.y;
      const r = arc.radius;
      updateBounds(cx - r, cy - r);
      updateBounds(cx + r, cy + r);
      // approximate with circle or arc path
      svgElements.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="4,2" />`
      );
    }
  }

  if (minX === Infinity || minY === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 40000;
    maxY = 28000;
  }

  const padding = Math.max(10, (maxX - minX) * 0.05);
  const bboxMinX = minX - padding;
  const bboxMinY = minY - padding;
  const bboxWidth = Math.max(10, maxX - minX + padding * 2);
  const bboxHeight = Math.max(10, maxY - minY + padding * 2);

  // Determine scale in meters
  // If DXF is in mm (e.g. 40,000 mm = 40m)
  let widthMeters = bboxWidth;
  let heightMeters = bboxHeight;

  if (bboxWidth > 500) {
    // In millimeters
    widthMeters = parseFloat((bboxWidth / 1000).toFixed(2));
    heightMeters = parseFloat((bboxHeight / 1000).toFixed(2));
  } else if (bboxWidth > 5) {
    // In meters already
    widthMeters = parseFloat(bboxWidth.toFixed(2));
    heightMeters = parseFloat(bboxHeight.toFixed(2));
  } else {
    widthMeters = 40;
    heightMeters = 28;
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${bboxMinX} ${bboxMinY} ${bboxWidth} ${bboxHeight}" width="100%" height="100%">
      <rect x="${bboxMinX}" y="${bboxMinY}" width="${bboxWidth}" height="${bboxHeight}" fill="#0b1329" />
      <g stroke-linecap="round" stroke-linejoin="round">
        ${svgElements.join('\n')}
      </g>
    </svg>
  `.trim();

  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

  return {
    floorPlanUrl: svgDataUrl,
    floorPlanType: 'dxf',
    widthMeters: Math.max(5, widthMeters),
    heightMeters: Math.max(5, heightMeters),
    fileName: file.name,
    fileSizeBytes: file.size,
    viewBox: `${bboxMinX} ${bboxMinY} ${bboxWidth} ${bboxHeight}`
  };
}

/**
 * Parses an architectural PDF drawing and renders page 1 (or specified page) to a ultra-high-resolution PNG image for maximum CAD legibility.
 */
export async function parsePdfFile(file: File, pageNumber: number = 1): Promise<ImportedPlanResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const validPageNum = Math.min(Math.max(1, pageNumber), pdfDoc.numPages);
  const page = await pdfDoc.getPage(validPageNum);
  
  // Calculate optimal ultra-high-resolution scale (targets 4000px width for crystal-clear vector lines, text & cotas)
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const targetWidth = 4000;
  const calculatedScale = Math.min(5.5, Math.max(3.0, targetWidth / Math.max(unscaledViewport.width, 100)));
  const viewport = page.getViewport({ scale: calculatedScale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Não foi possível inicializar o contexto Canvas 2D para renderizar o PDF.');
  }

  // Draw pure white background for architectural blueprint clarity
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };

  await page.render(renderContext as any).promise;

  const pngDataUrl = canvas.toDataURL('image/png', 1.0);

  // Calculate architectural dimensions in meters preserving natural aspect ratio
  const aspect = viewport.width / viewport.height;
  let widthM = 50;
  let heightM = parseFloat((50 / aspect).toFixed(2));

  if (aspect < 1.0) {
    // Vertical plan
    heightM = 50;
    widthM = parseFloat((50 * aspect).toFixed(2));
  }

  return {
    floorPlanUrl: pngDataUrl,
    floorPlanType: 'pdf',
    widthMeters: widthM,
    heightMeters: heightM,
    fileName: `${file.name} (Pág. ${validPageNum}/${pdfDoc.numPages})`,
    fileSizeBytes: file.size
  };
}

/**
 * Parses an SVG vector architectural plan.
 */
export async function parseSvgFile(file: File): Promise<ImportedPlanResult> {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');

  if (!svgEl) {
    throw new Error('Arquivo SVG inválido.');
  }

  // Extract or calculate viewBox
  let viewBox = svgEl.getAttribute('viewBox');
  let widthAttr = parseFloat(svgEl.getAttribute('width') || '0');
  let heightAttr = parseFloat(svgEl.getAttribute('height') || '0');

  if (!viewBox && widthAttr && heightAttr) {
    viewBox = `0 0 ${widthAttr} ${heightAttr}`;
    svgEl.setAttribute('viewBox', viewBox);
  } else if (!viewBox) {
    viewBox = '0 0 1000 700';
    svgEl.setAttribute('viewBox', viewBox);
  }

  // Calculate meters aspect ratio
  const vbParts = viewBox.split(/[\s,]+/).map(Number);
  const vbW = vbParts[2] || 1000;
  const vbH = vbParts[3] || 700;
  const aspect = vbW / vbH;

  let widthM = 40;
  let heightM = parseFloat((40 / aspect).toFixed(2));

  const serializer = new XMLSerializer();
  const serialized = serializer.serializeToString(svgEl);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

  return {
    floorPlanUrl: dataUrl,
    floorPlanType: 'svg',
    widthMeters: widthM,
    heightMeters: heightM,
    fileName: file.name,
    fileSizeBytes: file.size,
    viewBox
  };
}

/**
 * Parses raster images (PNG, JPG, WEBP).
 */
export async function parseRasterImageFile(file: File): Promise<ImportedPlanResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.naturalWidth / img.naturalHeight;
        const widthM = 40;
        const heightM = parseFloat((40 / aspect).toFixed(2));

        resolve({
          floorPlanUrl: dataUrl,
          floorPlanType: 'raster',
          widthMeters: widthM,
          heightMeters: heightM,
          fileName: file.name,
          fileSizeBytes: file.size
        });
      };
      img.onerror = () => reject(new Error('Falha ao carregar arquivo de imagem raster.'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Erro na leitura do arquivo.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Unified multi-format architectural plan loader.
 * Handles DXF, PDF, SVG, PNG, JPG, and WEBP.
 */
export async function importArchitecturalPlan(file: File): Promise<ImportedPlanResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'dxf') {
    return parseDxfFile(file);
  } else if (extension === 'pdf') {
    return parsePdfFile(file);
  } else if (extension === 'svg') {
    return parseSvgFile(file);
  } else if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(extension)) {
    return parseRasterImageFile(file);
  } else {
    // Try raster or text fallback
    return parseRasterImageFile(file);
  }
}
