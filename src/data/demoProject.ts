import { Project } from '../types/cad';

export const INITIAL_REAL_PROJECT: Project = {
  id: 'PRJ-CORP-001',
  codigo: 'PRJ-2026-CORP-TOWER',
  nome: 'Edifício Corporate Tower',
  cliente: 'Condomínio Edifício Corporate Tower',
  empreendimento: 'Corporate Tower Business Center',
  endereco: 'Avenida Paulista, 1500 - Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  pais: 'Brasil',
  responsavel_tecnico: 'Eng. Roberto Vasconcelos',
  crea_cau: 'CREA-SP 198472/D',
  art_rrt: 'ART 2026-9943180',
  empresa: 'Sygma SMS Fire Safety Engineering',
  numero_projeto: 'SMS-2026/04',
  revisao: 'REV 01',
  data: '2026-03-10',
  createdAt: '2026-03-10T10:00:00.000Z',
  updatedAt: '2026-03-10T10:00:00.000Z',
  descricao: 'Projeto executivo de sinalização de segurança contra incêndio e pânico em conformidade com ABNT NBR 13434, NBR 16820 e IT-20 CBMESP / CBMGO.',
  observacoes: 'Sinalização com luminância fotoluminescente mínima 140/20-1800-K-W em PVC auto-extinguível 2,0 mm e demarcações de solo nos pontos de combate.',
  unit: 'mm',
  escala: '1:100',
  layers: [
    { id: 'L-ARQ', name: 'Planta Arquitetônica', color: '#94a3b8', visible: true, locked: true },
    { id: 'L-SIN', name: 'Sinalização Geral', color: '#22c55e', visible: true, locked: false },
    { id: 'L-SAI', name: 'Rotas de Saída e Fuga (S1 a S21)', color: '#16a34a', visible: true, locked: false },
    { id: 'L-EXT', name: 'Equipamentos e Combate (E1 a E17)', color: '#ef4444', visible: true, locked: false },
    { id: 'L-HID', name: 'Hidrantes e Mangotinhos', color: '#dc2626', visible: true, locked: false },
    { id: 'L-ALA', name: 'Alarmes e Botoeiras', color: '#f97316', visible: true, locked: false },
    { id: 'L-ALE', name: 'Alertas e Riscos (A1 a A7)', color: '#eab308', visible: true, locked: false },
    { id: 'L-PRO', name: 'Proibições (P1 a P5)', color: '#e11d48', visible: true, locked: false },
    { id: 'L-COT', name: 'Cotas e Medições', color: '#38bdf8', visible: true, locked: false },
    { id: 'L-TXT', name: 'Textos Técnicos', color: '#f8fafc', visible: true, locked: false }
  ],
  settings: {
    defaultScale: '1:100',
    unit: 'mm',
    gridSizeMm: 500,
    gridSnap: true,
    orthoMode: false,
    cadSymbolBadgeMode: false,
    nightGlowMode: false
  },
  additionalCosts: {
    mao_de_obra_instalacao: 18,
    tipo_mao_de_obra: 'por_placa',
    valor_mao_de_obra_unitario: 8.50,
    fitas_parafusos_acessorios: 120.00,
    frete_transporte: 150.00,
    outros_custos: 80.00,
    bdi_percentual: 22.0,
    impostos_percentual: 8.65,
    desconto_valor: 0.00
  },
  floors: [
    {
      id: 'FL-001',
      project_id: 'PRJ-CORP-001',
      name: 'Pavimento Térreo (Hall Principal / Acessos)',
      level: 0,
      floorPlanType: undefined,
      floorPlanUrl: undefined,
      floorPlanScale: 20,
      calibrated: false,
      widthMeters: 40,
      heightMeters: 28,
      placedSymbols: [],
      annotations: []
    },
    {
      id: 'FL-002',
      project_id: 'PRJ-CORP-001',
      name: '1º Pavimento Tipo (Escritórios Corporativos)',
      level: 1,
      floorPlanType: undefined,
      floorPlanUrl: undefined,
      floorPlanScale: 20,
      calibrated: false,
      widthMeters: 40,
      heightMeters: 28,
      placedSymbols: [],
      annotations: []
    },
    {
      id: 'FL-003',
      project_id: 'PRJ-CORP-001',
      name: 'Subsolo Garagem e Casa de Bombas',
      level: -1,
      floorPlanType: undefined,
      floorPlanUrl: undefined,
      floorPlanScale: 20,
      calibrated: false,
      widthMeters: 40,
      heightMeters: 28,
      placedSymbols: [],
      annotations: []
    }
  ]
};

export const DEMO_PROJECT = INITIAL_REAL_PROJECT;
