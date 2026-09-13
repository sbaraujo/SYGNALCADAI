import React from 'react';

interface CompassRoseProps {
  rotation?: number; // degrees (0 = North up)
  customImageUrl?: string;
  size?: number;
  className?: string;
}

export const CompassRose: React.FC<CompassRoseProps> = ({
  rotation = 0,
  customImageUrl,
  size = 110,
  className = ''
}) => {
  if (customImageUrl) {
    return (
      <div
        className={`relative flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={customImageUrl}
          alt="Orientação dos Pontos Cardeais"
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
    );
  }

  // Rosa dos Ventos vetorizada de alta precisão baseada fielmente no padrão das imagens de referência (Slide4.JPG / PE Ariane MKT 2024.jpg)
  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-150 ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center'
      }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        {/* Círculo guia sutil */}
        <circle cx="100" cy="100" r="85" fill="none" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2,3" />
        <circle cx="100" cy="100" r="50" fill="none" stroke="#e2e8f0" strokeWidth="0.6" />

        {/* Pontos Secundários (NE, SE, SO, NO) */}
        <g stroke="#0f172a" strokeWidth="0.75">
          {/* NE */}
          <polygon points="100,100 100,55 135,65" fill="#475569" />
          <polygon points="100,100 145,100 135,65" fill="#94a3b8" />
          {/* SE */}
          <polygon points="100,100 145,100 135,135" fill="#475569" />
          <polygon points="100,100 100,145 135,135" fill="#94a3b8" />
          {/* SO */}
          <polygon points="100,100 100,145 65,135" fill="#475569" />
          <polygon points="100,100 55,100 65,135" fill="#94a3b8" />
          {/* NO */}
          <polygon points="100,100 55,100 65,65" fill="#475569" />
          <polygon points="100,100 100,55 65,65" fill="#94a3b8" />
        </g>

        {/* Pontos Cardeais Principais (Norte, Sul, Leste, Oeste) */}
        {/* NORTE (Principal e alongado) */}
        <polygon points="100,100 100,12 88,88" fill="#0f172a" />
        <polygon points="100,100 100,12 112,88" fill="#e2e8f0" stroke="#0f172a" strokeWidth="0.75" />

        {/* SUL */}
        <polygon points="100,100 100,188 112,112" fill="#0f172a" />
        <polygon points="100,100 100,188 88,112" fill="#e2e8f0" stroke="#0f172a" strokeWidth="0.75" />

        {/* LESTE / ESTE */}
        <polygon points="100,100 188,100 112,88" fill="#0f172a" />
        <polygon points="100,100 188,100 112,112" fill="#e2e8f0" stroke="#0f172a" strokeWidth="0.75" />

        {/* OESTE */}
        <polygon points="100,100 12,100 88,112" fill="#0f172a" />
        <polygon points="100,100 12,100 88,88" fill="#e2e8f0" stroke="#0f172a" strokeWidth="0.75" />

        {/* Centro da Rosa dos Ventos */}
        <circle cx="100" cy="100" r="5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />

        {/* Letras dos Pontos Cardeais (N, S, L, O) */}
        <text
          x="100"
          y="2"
          textAnchor="middle"
          dominantBaseline="hanging"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          N
        </text>
        <text
          x="100"
          y="198"
          textAnchor="middle"
          dominantBaseline="ideographic"
          fill="#64748b"
          fontSize="11"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          S
        </text>
        <text
          x="198"
          y="104"
          textAnchor="end"
          dominantBaseline="middle"
          fill="#64748b"
          fontSize="11"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          L
        </text>
        <text
          x="2"
          y="104"
          textAnchor="start"
          dominantBaseline="middle"
          fill="#64748b"
          fontSize="11"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          O
        </text>
      </svg>
    </div>
  );
};
