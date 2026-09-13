import React from 'react';
import { EvacuationArrowType } from '../../types/cad';

interface ISOArrowProps {
  type: EvacuationArrowType;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  className?: string;
}

export const ISOArrow: React.FC<ISOArrowProps> = ({
  type,
  width = 48,
  height = 28,
  rotation = 0,
  color = '#16a34a',
  className = ''
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        width: `${width}px`,
        height: `${height}px`
      }}
    >
      {renderArrowSvg(type, width, height, color)}
    </div>
  );
};

function renderArrowSvg(type: EvacuationArrowType, w: number, h: number, col: string) {
  switch (type) {
    case 'dashed_chevron':
      // Estilo fiel ao "Exit Way.png": Linha verde tracejada com chevron central pontiagudo
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
          {/* Tracinho esquerdo */}
          <rect x="5" y="17" width="22" height="6" fill={col} rx="1" />
          {/* Tracinho médio */}
          <rect x="33" y="17" width="22" height="6" fill={col} rx="1" />
          {/* Chevron em V apontando para a direita */}
          <path
            d="M 58 6 L 76 20 L 58 34 L 66 34 L 84 20 L 66 6 Z"
            fill={col}
          />
          {/* Tracinho direito */}
          <rect x="88" y="17" width="12" height="6" fill={col} rx="1" />
        </svg>
      );

    case 'bold_arrow':
      // Seta larga de evacuação contornada
      return (
        <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
          <path
            d="M 10 18 L 60 18 L 60 8 L 90 25 L 60 42 L 60 32 L 10 32 Z"
            fill={col}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'running_man':
      // Percurso Final de Evacuação (ISO 7010 E001/E002) - Homem correndo + Porta + Seta
      return (
        <svg viewBox="0 0 140 60" className="w-full h-full overflow-visible">
          {/* Fundo verde ISO com borda branca */}
          <rect x="2" y="2" width="136" height="56" rx="4" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />
          {/* Porta de saída */}
          <rect x="12" y="10" width="14" height="40" fill="#ffffff" />
          <rect x="14" y="12" width="10" height="36" fill="#16a34a" />
          {/* Silhueta pessoa correndo */}
          <circle cx="42" cy="18" r="4.5" fill="#ffffff" />
          <path
            d="M 38 25 L 47 25 L 43 35 L 50 48 L 44 48 L 39 38 L 33 44 L 28 41 L 35 34 L 37 25 Z"
            fill="#ffffff"
          />
          <path d="M 44 26 L 53 31 L 49 34 L 42 30 Z" fill="#ffffff" />
          {/* Seta direcional branca */}
          <path
            d="M 64 30 L 102 30 M 92 18 L 108 30 L 92 42"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'stairs_down':
      // Seta indicando descida de escadas de emergência
      return (
        <svg viewBox="0 0 90 60" className="w-full h-full overflow-visible">
          {/* Degraus da escada */}
          <path
            d="M 15 15 L 30 15 L 30 25 L 45 25 L 45 35 L 60 35 L 60 45 L 75 45"
            fill="none"
            stroke="#334155"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Seta diagonal descendente */}
          <path
            d="M 22 26 L 56 46 M 45 48 L 60 48 L 58 35"
            fill="none"
            stroke={col}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'stairs_up':
      // Seta indicando subida de escadas
      return (
        <svg viewBox="0 0 90 60" className="w-full h-full overflow-visible">
          {/* Degraus da escada */}
          <path
            d="M 15 45 L 30 45 L 30 35 L 45 35 L 45 25 L 60 25 L 60 15 L 75 15"
            fill="none"
            stroke="#334155"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Seta diagonal ascendente */}
          <path
            d="M 22 36 L 56 16 M 45 14 L 60 14 L 58 27"
            fill="none"
            stroke={col}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'turn_left':
      // Seta em curva para a esquerda (90 graus)
      return (
        <svg viewBox="0 0 60 60" className="w-full h-full overflow-visible">
          <path
            d="M 50 50 L 50 30 Q 50 18 36 18 L 20 18"
            fill="none"
            stroke={col}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <polygon points="22,10 8,18 22,26" fill={col} />
        </svg>
      );

    case 'turn_right':
      // Seta em curva para a direita (90 graus)
      return (
        <svg viewBox="0 0 60 60" className="w-full h-full overflow-visible">
          <path
            d="M 10 50 L 10 30 Q 10 18 24 18 L 40 18"
            fill="none"
            stroke={col}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <polygon points="38,10 52,18 38,26" fill={col} />
        </svg>
      );

    case 'iso_arrow':
    default:
      // Seta padrão ISO 23601 (reta, verde sinal, proporção padrão)
      return (
        <svg viewBox="0 0 80 40" className="w-full h-full overflow-visible">
          {/* Corpo da seta */}
          <rect x="8" y="15" width="42" height="10" fill={col} rx="1" />
          {/* Cabeça triangular */}
          <polygon points="46,6 74,20 46,34" fill={col} />
        </svg>
      );
  }
}
