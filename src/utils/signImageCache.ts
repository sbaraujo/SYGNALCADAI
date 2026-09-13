import { SignSymbol } from '../types/cad';
import { getOfficialSvgSign } from '../data/officialSvgSigns';

// Cache for loaded images & rendered canvas glyphs
const imageCache = new Map<string, HTMLImageElement | HTMLCanvasElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement | HTMLCanvasElement>>();

/**
 * Normaliza o código do símbolo para busca oficial (ex: "S-1" -> "S1", "E-01" -> "E1")
 */
export function normalizeSignCode(symbol: SignSymbol): string {
  const raw = (symbol.codigo_normativo || symbol.codigo_interno || symbol.id || '').toUpperCase().trim();
  // Remove hífens e espaços extras: "S-1" -> "S1"
  return raw.replace(/[-\s]/g, '');
}

/**
 * Retorna cor oficial de fundo por categoria da norma ABNT NBR 13434
 */
export function getCategoryStandardColors(categoria?: string): { bg: string; fg: string; border: string } {
  switch (categoria) {
    case 'ORIENTACAO_SALVAMENTO':
      return { bg: '#086b3b', fg: '#fffeee', border: '#15803d' };
    case 'EQUIPAMENTOS':
      return { bg: '#d31a24', fg: '#ffffff', border: '#b91c1c' };
    case 'ALERTA':
      return { bg: '#f59e0b', fg: '#111827', border: '#d97706' };
    case 'PROIBICAO':
      return { bg: '#ffffff', fg: '#dc2626', border: '#dc2626' };
    case 'COMPLEMENTAR':
    default:
      return { bg: '#0284c7', fg: '#ffffff', border: '#0369a1' };
  }
}

/**
 * Cria um canvas de fallback vetorizado e estilizado com alta resolução
 */
function createCrispFallbackCanvas(
  symbol: SignSymbol,
  isCadBadge: boolean,
  isGlow: boolean
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const code = normalizeSignCode(symbol);
  const colors = getCategoryStandardColors(symbol.categoria);

  if (isCadBadge) {
    // ABNT NBR 13434 Badge Circular Bipartido
    ctx.clearRect(0, 0, size, size);
    
    // Círculo externo
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Linha divisória horizontal
    ctx.beginPath();
    ctx.moveTo(8, size / 2);
    ctx.lineTo(size - 8, size / 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Texto superior: Código Normativo (ex: S1, E1)
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 54px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code || symbol.codigo_normativo || 'S1', size / 2, size / 2 - 45);

    // Texto inferior: Dimensões (ex: 200x200)
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px monospace, sans-serif';
    ctx.fillText(`${symbol.largura}x${symbol.altura}`, size / 2, size / 2 + 45);

    return canvas;
  }

  // Placa padrão de sinalização com borda fotoluminescente
  ctx.clearRect(0, 0, size, size);

  if (isGlow) {
    ctx.shadowColor = '#84cc16';
    ctx.shadowBlur = 24;
  }

  // Fundo da placa
  const radius = 18;
  ctx.beginPath();
  ctx.roundRect(10, 10, size - 20, size - 20, radius);
  ctx.fillStyle = colors.bg;
  ctx.fill();

  // Borda fotoluminescente
  ctx.lineWidth = 6;
  ctx.strokeStyle = isGlow ? '#bef264' : colors.fg;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Texto / Código central de alta legibilidade
  ctx.fillStyle = colors.fg;
  ctx.font = 'bold 64px monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, size / 2, size / 2 - 15);

  // Sublegenda com dimensões
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`${symbol.largura}×${symbol.altura} mm`, size / 2, size / 2 + 55);

  return canvas;
}

/**
 * Obtém ou carrega a imagem do sinal em alta resolução
 */
export function getSignGraphic(
  symbol: SignSymbol,
  isCadBadge: boolean = false,
  isGlow: boolean = false,
  onLoaded?: () => void
): HTMLImageElement | HTMLCanvasElement {
  const code = normalizeSignCode(symbol);
  const cacheKey = `${symbol.id}_${code}_${isCadBadge ? 'cad' : 'plaque'}_${isGlow ? 'glow' : 'norm'}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  if (isCadBadge) {
    const badgeCanvas = createCrispFallbackCanvas(symbol, true, isGlow);
    imageCache.set(cacheKey, badgeCanvas);
    return badgeCanvas;
  }

  // Verifica se temos SVG oficial inline
  const official = getOfficialSvgSign(code) || 
                   getOfficialSvgSign(symbol.id) || 
                   getOfficialSvgSign(symbol.nome) ||
                   getOfficialSvgSign(symbol.codigo_normativo);

  if (official) {
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${official.viewBox}" width="256" height="256">${official.svgContent}</svg>`;
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fullSvg)}`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(cacheKey, img);
      if (onLoaded) onLoaded();
    };
    img.onerror = () => {
      const fallback = createCrispFallbackCanvas(symbol, false, isGlow);
      imageCache.set(cacheKey, fallback);
      if (onLoaded) onLoaded();
    };
    img.src = dataUrl;
    
    // Armazena temporariamente o canvas fallback até carregar
    const placeholder = createCrispFallbackCanvas(symbol, false, isGlow);
    imageCache.set(cacheKey, placeholder);
    return placeholder;
  }

  // Tenta carregar do /signs/{code}.svg
  const directSvgUrl = `/signs/${code}.svg`;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    imageCache.set(cacheKey, img);
    if (onLoaded) onLoaded();
  };
  img.onerror = () => {
    // Se falhar, usa o fallback vetorizado bonito
    const fallback = createCrispFallbackCanvas(symbol, false, isGlow);
    imageCache.set(cacheKey, fallback);
    if (onLoaded) onLoaded();
  };
  img.src = directSvgUrl;

  const fallback = createCrispFallbackCanvas(symbol, false, isGlow);
  imageCache.set(cacheKey, fallback);
  return fallback;
}
