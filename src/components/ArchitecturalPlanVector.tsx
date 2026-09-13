import React from 'react';

interface ArchitecturalPlanVectorProps {
  floorLevel?: number;
  widthMeters?: number;
  heightMeters?: number;
  floorPlanUrl?: string;
  floorPlanType?: string;
}

export const ArchitecturalPlanVector: React.FC<ArchitecturalPlanVectorProps> = ({
  widthMeters = 40,
  heightMeters = 28,
  floorPlanUrl
}) => {
  // 1 meter = 1000 mm in world coordinates
  const w = widthMeters * 1000;
  const h = heightMeters * 1000;

  if (floorPlanUrl) {
    return (
      <g className="architectural-plan" id="cad-floor-plan-image">
        <image
          href={floorPlanUrl}
          xlinkHref={floorPlanUrl}
          x="0"
          y="0"
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    );
  }

  // Se não houver planta carregada, inicia do zero com canvas limpo
  return null;
};
