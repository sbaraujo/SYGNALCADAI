import React from 'react';

interface YouAreHereCalloutProps {
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  label?: string; // e.g. "VOCÊ ESTÁ AQUI"
  calloutOffsetX?: number; // offset in px for banner relative to pin
  calloutOffsetY?: number;
  isSelected?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  className?: string;
}

export const YouAreHereCallout: React.FC<YouAreHereCalloutProps> = ({
  x,
  y,
  label = 'VOCÊ ESTÁ AQUI',
  calloutOffsetX = -60,
  calloutOffsetY = -65,
  isSelected = false,
  onMouseDown,
  className = ''
}) => {
  // Coordenadas relativas do banner em relação ao ponto de referência (0,0)
  const bannerW = 148;
  const bannerH = 28;
  const bannerX = calloutOffsetX;
  const bannerY = calloutOffsetY;

  // Pontos para a bandeira/haste triangular que liga o banner ao ponto central do pino
  const wedgeBaseX1 = bannerX + bannerW * 0.2;
  const wedgeBaseX2 = bannerX + bannerW * 0.55;
  const wedgeBaseY = bannerY + bannerH;

  return (
    <div
      className={`absolute z-30 pointer-events-auto select-none ${className}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(0, 0)'
      }}
      onMouseDown={onMouseDown}
    >
      <svg
        className="overflow-visible"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1,
          height: 1
        }}
      >
        <defs>
          <filter id="vah-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Haste/Wedge Triangular de Ligação (azul sólido) */}
        <polygon
          points={`${wedgeBaseX1},${wedgeBaseY} ${wedgeBaseX2},${wedgeBaseY} 0,0`}
          fill="#2563eb"
          filter="url(#vah-shadow)"
        />

        {/* Retângulo do Banner Azul com cantos retos ou levemente arredondados */}
        <rect
          x={bannerX}
          y={bannerY}
          width={bannerW}
          height={bannerH}
          rx="2"
          fill="#2563eb"
          stroke={isSelected ? '#facc15' : '#1d4ed8'}
          strokeWidth={isSelected ? '2' : '1'}
          filter="url(#vah-shadow)"
        />

        {/* Texto "VOCÊ ESTÁ AQUI" em branco, maiúsculas, bold e legível */}
        <text
          x={bannerX + bannerW / 2}
          y={bannerY + bannerH / 2 + 4}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="11"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.05em"
        >
          {label}
        </text>

        {/* Pino / Gota Azul no ponto exato (0, 0) */}
        <g transform="translate(0, 0)" filter="url(#vah-shadow)">
          {/* Gotícula azul apontando para baixo */}
          <path
            d="M 0 0 C -7 -9 -11 -16 0 -26 C 11 -16 7 -9 0 0 Z"
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          {/* Ponto central branco */}
          <circle cx="0" cy="-15" r="3" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
};
