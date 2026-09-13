/**
 * SIGNAFLUX CAD AI - Types and Data Models
 * Sistema Inteligente de Projeto, Biblioteca, Quantitativos e Orçamento de Sinalização Contra Incêndio
 * Normas de Referência: ABNT NBR 13434 (Partes 1, 2 e 3), NBR 16820, IT-20 CBMESP, ISO 16069, DIN 67510
 */

export type SymbolCategory =
  | 'ORIENTACAO_SALVAMENTO'
  | 'EQUIPAMENTOS'
  | 'ALERTA'
  | 'PROIBICAO'
  | 'COMPLEMENTAR'
  | 'OUTROS';

export interface SignSymbol {
  id: string; // e.g. "SIG-S01", "SIG-E05"
  codigo_interno: string; // e.g. "SIG-001"
  codigo_normativo: string; // e.g. "S-1", "E-5", "P-1" (ou "Não cadastrado")
  codigo_fabricante?: string; // e.g. "PS-310/F", "BR0 001"
  nome: string; // e.g. "Saída de Emergência - Direita"
  nome_alternativo?: string;
  categoria: SymbolCategory;
  subcategoria?: string;
  descricao: string;
  tags: string[];
  largura: number; // in mm, e.g. 250
  altura: number; // in mm, e.g. 150
  largura_padrao_mm?: number;
  altura_padrao_mm?: number;
  unidade: 'mm' | 'cm' | 'm';
  fabricante_id?: string;
  fornecedor_id?: string;
  produto_id?: string;
  preco_padrao: number; // Em Reais (R$)
  moeda: 'BRL';
  data_preco?: string;
  norma_referencia: string; // e.g. "ABNT NBR 13434-2 / ISO 7010"
  fotoluminescente_grau?: string; // e.g. "140/20 - 1800 - K - W"
  observacoes?: string;
  ativo: boolean;
  svgContent?: string; // Inline SVG markup or path
  iconKey?: string; // Lucide or vector key
  forma_geometrica: 'retangular' | 'quadrada' | 'triangular' | 'circular';
  cor_fundo: string;
  cor_simbolo: string;
}

export interface PlacedSymbol {
  id: string; // e.g. "OBJ-000125"
  symbol_id: string;
  project_id: string;
  floor_id: string;
  x: number; // CAD coordinates in mm (or world units)
  y: number;
  scale: number; // 1.0 = 100%
  width: number; // mm
  height: number; // mm
  rotation: number; // 0, 45, 90, 180, 270 degrees
  layer: string; // e.g. "SINALIZAÇÃO", "EXTINTORES", "SAÍDAS"
  quantity: number; // Default 1
  supplier_id?: string;
  manufacturer_id?: string;
  product_id?: string;
  unit_price: number; // Preço unitário em R$
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CADEntityType =
  | 'line'
  | 'polyline'
  | 'rect'
  | 'circle'
  | 'arc'
  | 'ellipse'
  | 'polygon'
  | 'text'
  | 'point'
  | 'hatch'
  | 'dimension_linear'
  | 'dimension_aligned'
  | 'dimension_radial'
  | 'leader';

export interface CADEntity {
  id: string;
  floor_id: string;
  type: CADEntityType;
  layer: string; // e.g. "0", "PAREDES", "COTAS", "ROTAS", "DESENHO"
  color: string; // Hex color e.g. "#38bdf8"
  strokeWidth: number; // in mm, e.g. 50, 100, 200
  dash?: number[];
  fill?: string;
  fillOpacity?: number;
  points: { x: number; y: number }[]; // points in world coordinates (mm)
  radius?: number; // mm for circle
  radiusX?: number; // mm for ellipse
  radiusY?: number; // mm for ellipse
  startAngle?: number; // deg
  endAngle?: number; // deg
  sides?: number; // for regular polygon (3, 5, 6, 8)
  text?: string;
  fontSize?: number; // mm
  rotation?: number; // deg
  isClosed?: boolean; // for polyline
  hatchPattern?: 'solid' | 'diagonal' | 'cross' | 'dots';
  dimensionValue?: number; // in meters or mm
  dimensionText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CADSnapPoint {
  x: number;
  y: number;
  type: 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'perpendicular' | 'grid';
  label: string;
}

export interface CADAnnotation {
  id: string;
  floor_id: string;
  type: 'line' | 'arrow' | 'dimension' | 'text' | 'rect';
  points: { x: number; y: number }[];
  text?: string;
  color: string;
  strokeWidth: number;
}

export interface Floor {
  id: string; // e.g. "FL-001"
  project_id?: string;
  name: string; // e.g. "Térreo", "1º Pavimento", "Subsolo"
  level: number; // e.g. 0, 1, -1
  floorPlanUrl?: string; // Data URL or SVG string of architectural plan
  floorPlanType?: 'vector' | 'raster' | 'demo' | 'svg' | 'dxf' | 'pdf';
  floorPlanScale?: number; // Pixels per meter in world coordinates (e.g. 50 px/m)
  calibrated: boolean;
  calibrationPoints?: [{ x: number; y: number }, { x: number; y: number }];
  realDistanceMeters?: number;
  widthMeters: number;
  heightMeters: number;
  placedSymbols: PlacedSymbol[];
  annotations?: CADAnnotation[];
  cadEntities?: CADEntity[]; // Entidades de desenho técnico CAD 2D
  // Controles Avançados de Manipulação e Legibilidade da Imagem da Planta
  floorPlanOpacity?: number; // 0.0 a 1.0 (ex: 0.65 padrão para desenhar sobre ela)
  floorPlanOffsetX?: number; // Deslocamento X no espaço CAD em mm
  floorPlanOffsetY?: number; // Deslocamento Y no espaço CAD em mm
  floorPlanZoom?: number; // Fator de escala da imagem (1.0 = 100%)
  floorPlanLocked?: boolean; // Bloqueio de posição contra movimento acidental
  floorPlanVisible?: boolean; // Visibilidade da imagem da planta (true/false)
  floorPlanPreserveAspect?: boolean; // Manter proporção original da imagem (evita distorção)
  floorPlanInvert?: boolean; // Inversão de cores (ótimo para plantas com fundo preto/CAD blueprint)
  floorPlanContrast?: number; // Contraste em % (ex: 100%, 130%, 160% para máxima nitidez)
  floorPlanBrightness?: number; // Brilho em % (ex: 100%, 110%)
  evacuationConfig?: {
    youAreHere?: YouAreHereConfig;
    corridors?: EvacuationCorridorItem[];
    arrows?: EvacuationArrowItem[];
    images?: EvacuationPlanImages;
  };
}

export interface Layer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  count?: number;
  printable?: boolean;
}

export type CADLayer = Layer;

export interface Supplier {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  endereco?: string;
  cidade: string;
  estado: string;
  pais?: string;
  telefone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  contato_comercial?: string;
  observacoes?: string;
  status?: 'ativo' | 'inativo';
  ativo?: boolean;
  moeda_padrao?: string;
}

export interface Manufacturer {
  id: string;
  nome: string;
  cnpj?: string;
  pais?: string;
  website?: string;
  observacoes?: string;
}

export interface Product {
  id: string;
  codigo?: string; // e.g. "PROD-250150-08"
  codigo_sku?: string;
  nome: string;
  descricao?: string;
  categoria?: SymbolCategory;
  fabricante_id?: string;
  fornecedor_id: string;
  unidade?: string; // "un", "pc"
  modelo?: string; // e.g. "PAF 250x150 mm"
  dimensoes?: string; // e.g. "250 x 150 mm"
  largura?: number;
  altura?: number;
  autonomia_minutos?: number;
  luminancia_mcd?: number;
  espessura?: string; // "0,8 mm" ou "2,0 mm"
  material?: string; // e.g. "PVC Rígido Auto-extinguível Fotoluminescente"
  preco?: number; // Em Reais (R$)
  preco_unitario?: number;
  moeda?: 'BRL';
  data_preco?: string;
  validade_preco?: string;
  observacoes?: string;
  simbolo_associado_id?: string;
}

export type ProductItem = Product;

export interface PriceHistory {
  id: string;
  produto_id: string;
  fornecedor_id: string;
  preco: number;
  data: string;
  moeda: 'BRL';
  observacao?: string;
}

export interface DrawingSheet {
  id: string;
  number: string; // e.g. "PR-01/02"
  name: string; // e.g. "Planta de Sinalização de Emergência - Térreo"
  floor_id: string;
  scale: string; // e.g. "1:100", "1:75", "1:50"
  format: 'A3' | 'A4' | 'A2' | 'A1';
  orientation: 'horizontal' | 'vertical';
  revision: string; // e.g. "REV 00"
  date: string;
}

export interface AdditionalCosts {
  mao_de_obra_instalacao: number; // R$ por unidade instalada ou valor fixo
  tipo_mao_de_obra: 'por_placa' | 'fixo';
  valor_mao_de_obra_unitario: number; // ex: R$ 8,50 por placa
  fitas_parafusos_acessorios: number; // R$
  frete_transporte: number; // R$
  outros_custos: number; // R$
  bdi_percentual: number; // % BDI (Benefícios e Despesas Indiretas)
  impostos_percentual: number; // % Impostos
  desconto_valor: number; // R$ Desconto concedido
}

export interface ProjectSettings {
  defaultScale: string; // "1:100"
  unit: 'mm' | 'm';
  gridSizeMm: number; // 500 mm
  gridSnap: boolean;
  orthoMode: boolean;
  cadSymbolBadgeMode: boolean; // circle badge with code/dimensions vs graphic plaque
  nightGlowMode: boolean; // simulate dark photoluminescence
}

export interface Project {
  id: string;
  codigo?: string; // e.g. "PRJ-2026-001"
  nome: string;
  name?: string; // alias for nome
  cliente: string;
  empreendimento: string;
  endereco: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  responsavel_tecnico: string;
  crea_cau: string;
  art_rrt: string;
  empresa?: string;
  numero_projeto?: string;
  revisao: string; // e.g. "REV 00"
  data: string;
  descricao?: string;
  observacoes?: string;
  unit?: 'mm' | 'm';
  escala?: string;
  moeda?: 'BRL';
  floors: Floor[];
  layers: Layer[];
  additionalCosts?: AdditionalCosts;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

export interface QuantitativoItem {
  symbol_id: string;
  codigo_normativo: string;
  codigo_interno: string;
  nome: string;
  categoria: SymbolCategory;
  dimensoes: string;
  largura: number;
  altura: number;
  fornecedor_nome: string;
  fabricante_nome: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
  floor_ids: string[];
  floor_names: string[];
}

export interface ProjectValidationResult {
  errors: { id: string; message: string; severity: 'error' }[];
  warnings: { id: string; message: string; severity: 'warning' }[];
  infos: { id: string; message: string; severity: 'info' }[];
  isValid: boolean;
}

export type EvacuationArrowType =
  | 'iso_arrow' // Seta simples ISO 23601 (verde)
  | 'dashed_chevron' // Seta tracejada com chevron (Exit Way)
  | 'bold_arrow' // Seta larga sólida com contorno
  | 'running_man' // Símbolo saída final com homem correndo (ISO 7010-E001/E002)
  | 'stairs_up' // Seta de escada ascendente
  | 'stairs_down' // Seta de escada descendente
  | 'turn_left' // Seta em curva para esquerda
  | 'turn_right'; // Seta em curva para direita

export interface EvacuationArrowItem {
  id: string;
  x: number; // percentage (0-100) or mm
  y: number;
  rotation: number; // 0, 45, 90, 135, 180, 225, 270, 315
  type: EvacuationArrowType;
  size: number; // scale multiplier e.g. 1.0
}

export interface EvacuationCorridorPoint {
  x: number;
  y: number;
}

export interface EvacuationCorridorItem {
  id: string;
  name?: string;
  points: EvacuationCorridorPoint[]; // polygon points in percentage (0-100)
  fillColor?: string; // ISO 23601 standard: #86efac (light green) or #a7f3d0
  opacity?: number; // 0.35 to 0.8
  strokeColor?: string; // #16a34a or #22c55e
  strokeWidth?: number;
}

export interface YouAreHereConfig {
  x: number; // percentage (0-100)
  y: number;
  label: string; // e.g. "VOCÊ ESTÁ AQUI"
  roomName: string; // e.g. "Quarto 22", "Zona Circulação", "Sala de Estar / Bar"
  pointerAngle: number; // angle of ribbon callout banner (e.g. -45, -60, -30)
  leaderLength: number; // length of leader line
}

export interface EvacuationPlanImages {
  compassRoseUrl?: string; // JPEG/PNG or custom compass rose
  compassRotation: number; // 0 to 360 deg
  aerialPhotoUrl?: string; // JPEG/PNG Google Maps / Earth aerial view
  aerialPhotoLabel?: string;
  qrCodeUrl?: string; // Generated or uploaded QR code
  youtubeUrl?: string; // URL of YouTube instructions video
  generalPlanUrl?: string; // Mini overview plan
}

