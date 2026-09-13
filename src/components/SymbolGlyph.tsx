import React, { useState } from 'react';
import { SignSymbol } from '../types/cad';
import { getOfficialSvgSign } from '../data/officialSvgSigns';

interface SymbolGlyphProps {
  symbol: SignSymbol;
  width?: number | string;
  height?: number | string;
  className?: string;
  showCadBadge?: boolean;
  isGlowMode?: boolean;
}

export const SymbolGlyph: React.FC<SymbolGlyphProps> = ({
  symbol,
  width = 64,
  height = 64,
  className = '',
  showCadBadge = false,
  isGlowMode = false,
}) => {
  const [hasError, setHasError] = useState(false);

  // If CAD badge mode is requested (ABNT NBR 13434 circular split notation)
  if (showCadBadge) {
    return (
      <svg
        viewBox="0 0 100 100"
        width={width}
        height={height}
        className={`select-none ${className}`}
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="3.5"
        />
        <line
          x1="4"
          y1="50"
          x2="96"
          y2="50"
          stroke="#38bdf8"
          strokeWidth="3"
        />
        <text
          x="50"
          y="36"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="22"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {symbol.codigo_normativo || symbol.codigo_interno}
        </text>
        <text
          x="50"
          y="72"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="14"
          fontFamily="monospace"
          fontWeight="600"
        >
          {symbol.largura}x{symbol.altura}
        </text>
      </svg>
    );
  }

  const code = (symbol.codigo_normativo || symbol.codigo_interno || '').toUpperCase().trim();
  const officialSvg = getOfficialSvgSign(code) || getOfficialSvgSign(symbol.id) || getOfficialSvgSign(symbol.nome);

  // Se tivermos a definição oficial em SVG vetorial de alta fidelidade
  if (officialSvg) {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{
          width,
          height,
          filter: isGlowMode
            ? 'drop-shadow(0 0 12px #a3e635) drop-shadow(0 0 20px rgba(163, 230, 53, 0.8)) brightness(1.25)'
            : undefined,
        }}
        title={`${officialSvg.nome} (${officialSvg.codigo_normativo})`}
      >
        <svg
          viewBox={officialSvg.viewBox}
          className="w-full h-full object-contain"
          preserveAspectRatio="xMidYMid meet"
          dangerouslySetInnerHTML={{ __html: officialSvg.svgContent }}
        />
      </div>
    );
  }

  const svgUrl = `/signs/${code}.svg`;

  if (hasError) {
    // Fallback badge in case of missing graphic
    return (
      <div
        className={`inline-flex flex-col items-center justify-center rounded border border-slate-700 font-mono font-bold text-xs p-1 select-none ${className}`}
        style={{
          width,
          height,
          backgroundColor: symbol.cor_fundo || '#1e293b',
          color: symbol.cor_simbolo || '#f8fafc',
        }}
        title={`${symbol.nome || code} (${code})`}
      >
        <span className="text-[11px] leading-none">{code}</span>
        <span className="text-[9px] opacity-80 leading-tight mt-0.5">
          {symbol.largura}x{symbol.altura}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{
        width,
        height,
        filter: isGlowMode
          ? 'drop-shadow(0 0 10px #84cc16) drop-shadow(0 0 18px rgba(132, 204, 22, 0.65)) brightness(1.2)'
          : undefined,
      }}
      title={`${symbol.nome || code} (${code})`}
    >
      <img
        src={svgUrl}
        alt={symbol.nome || code}
        className="w-full h-full object-contain pointer-events-none drop-shadow-sm transition-transform duration-200"
        loading="eager"
        decoding="async"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
