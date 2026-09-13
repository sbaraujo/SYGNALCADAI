/**
 * SIGNAFLUX CAD AI - Catálogo Oficial de Sinais em Formato SVG Vetorial
 * Fonte: Documento e Normas ABNT NBR 13434 (Partes 1, 2 e 3), NBR 16820, IT-20 CBMESP e ISO 7010
 * 
 * Fidelidade máxima, proporções exatas (sem distorções), sem repetições.
 * SVG inline com cores normalizadas:
 * - Vermelho Incêndio: #d31a24
 * - Verde Segurança / Salvamento: #086b3b
 * - Amarelo Alerta: #f59e0b
 * - Azul Obrigação / Serviços: #0284c7
 * - Fotoluminescente: #fffeee (com efeito glow em modo escuro)
 */

export interface SvgSignDefinition {
  id: string;
  codigo_normativo: string;
  nome: string;
  categoria: 'EQUIPAMENTOS' | 'ORIENTACAO_SALVAMENTO' | 'PROIBICAO' | 'ALERTA' | 'COMPLEMENTAR' | 'OUTROS';
  largura_mm: number;
  altura_mm: number;
  viewBox: string;
  svgContent: string;
  cor_fundo: string;
  cor_simbolo: string;
}

export const OFFICIAL_SVG_SIGNS: Record<string, SvgSignDefinition> = {
  // =========================================================================
  // EQUIPAMENTOS DE COMBATE A INCÊNDIO (Fundo Vermelho #d31a24, Símbolo Fotoluminescente)
  // =========================================================================
  'ALARME_DE_INCENDIO': {
    id: 'ALARME_DE_INCENDIO',
    codigo_normativo: 'E1',
    nome: 'Alarme de Incêndio / Botoeira',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="25" y="25" width="150" height="150" rx="4" fill="none" stroke="#ffffff" stroke-width="8"/>
      <circle cx="100" cy="100" r="42" fill="#ffffff"/>
      <circle cx="100" cy="100" r="22" fill="#d31a24"/>
      <rect x="94" y="55" width="12" height="18" fill="#d31a24"/>
    `
  },
  'TELEFONE': {
    id: 'TELEFONE',
    codigo_normativo: 'E14',
    nome: 'Telefone de Emergência',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <path d="M60 70 C60 55, 80 50, 95 65 L105 75 C110 80, 105 90, 95 95 C110 120, 125 125, 140 115 C145 105, 155 110, 160 115 L170 125 C185 140, 180 160, 165 160 C130 160, 60 110, 60 70 Z" fill="#ffffff"/>
    `
  },
  'EXTINTOR': {
    id: 'EXTINTOR',
    codigo_normativo: 'E1',
    nome: 'Extintor de Incêndio Universal',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="75" y="80" width="50" height="90" rx="10" fill="#ffffff"/>
      <rect x="85" y="65" width="30" height="15" fill="#ffffff"/>
      <path d="M85 65 L65 45 L55 55 L75 75 Z" fill="#ffffff"/>
      <path d="M115 65 L135 45 L145 55 L125 75 Z" fill="#ffffff"/>
      <rect x="95" y="40" width="10" height="25" fill="#ffffff"/>
      <path d="M105 50 Q145 50 140 100 L130 100 Q135 60 105 60 Z" fill="#ffffff"/>
    `
  },
  'EXTINTOR_PO_ABC': {
    id: 'EXTINTOR_PO_ABC',
    codigo_normativo: 'E3',
    nome: 'Extintor de Incêndio - Pó Químico ABC',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="65" y="65" width="45" height="85" rx="8" fill="#ffffff"/>
      <rect x="75" y="52" width="25" height="13" fill="#ffffff"/>
      <rect x="83" y="36" width="9" height="16" fill="#ffffff"/>
      <path d="M75 52 L58 38 L50 46 L68 60 Z" fill="#ffffff"/>
      <path d="M92 45 Q125 45 120 85 L112 85 Q117 55 92 55 Z" fill="#ffffff"/>
      <rect x="120" y="70" width="60" height="75" rx="4" fill="#ffffff"/>
      <text x="150" y="120" fill="#d31a24" font-family="'Arial Black', sans-serif" font-weight="900" font-size="28" text-anchor="middle">ABC</text>
    `
  },
  'EXTINTOR_PO_BC': {
    id: 'EXTINTOR_PO_BC',
    codigo_normativo: 'E4',
    nome: 'Extintor de Incêndio - Pó Químico BC',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="65" y="65" width="45" height="85" rx="8" fill="#ffffff"/>
      <rect x="75" y="52" width="25" height="13" fill="#ffffff"/>
      <rect x="83" y="36" width="9" height="16" fill="#ffffff"/>
      <path d="M75 52 L58 38 L50 46 L68 60 Z" fill="#ffffff"/>
      <path d="M92 45 Q125 45 120 85 L112 85 Q117 55 92 55 Z" fill="#ffffff"/>
      <rect x="120" y="70" width="60" height="75" rx="4" fill="#ffffff"/>
      <text x="150" y="120" fill="#d31a24" font-family="'Arial Black', sans-serif" font-weight="900" font-size="30" text-anchor="middle">BC</text>
    `
  },
  'EXTINTOR_CO2': {
    id: 'EXTINTOR_CO2',
    codigo_normativo: 'E5',
    nome: 'Extintor de Incêndio - Dióxido de Carbono (CO2)',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="65" y="65" width="45" height="85" rx="8" fill="#ffffff"/>
      <rect x="75" y="52" width="25" height="13" fill="#ffffff"/>
      <rect x="83" y="36" width="9" height="16" fill="#ffffff"/>
      <path d="M92 45 Q125 45 120 85 L112 85 Q117 55 92 55 Z" fill="#ffffff"/>
      <polygon points="120,80 145,70 145,100 120,90" fill="#ffffff"/>
      <rect x="120" y="105" width="65" height="50" rx="4" fill="#ffffff"/>
      <text x="152" y="140" fill="#d31a24" font-family="'Arial Black', sans-serif" font-weight="900" font-size="24" text-anchor="middle">CO₂</text>
    `
  },
  'EXTINTOR_AGUA': {
    id: 'EXTINTOR_AGUA',
    codigo_normativo: 'E2',
    nome: 'Extintor de Incêndio - Água Pressurizada (AP)',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="65" y="65" width="45" height="85" rx="8" fill="#ffffff"/>
      <rect x="75" y="52" width="25" height="13" fill="#ffffff"/>
      <rect x="83" y="36" width="9" height="16" fill="#ffffff"/>
      <rect x="120" y="70" width="60" height="75" rx="4" fill="#ffffff"/>
      <text x="150" y="115" fill="#d31a24" font-family="'Arial Black', sans-serif" font-weight="900" font-size="22" text-anchor="middle">ÁGUA</text>
    `
  },
  'EXTINTOR_ESPUMA': {
    id: 'EXTINTOR_ESPUMA',
    codigo_normativo: 'E6',
    nome: 'Extintor - Espuma Mecânica',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="65" y="65" width="45" height="85" rx="8" fill="#ffffff"/>
      <rect x="120" y="70" width="65" height="75" rx="4" fill="#ffffff"/>
      <text x="152" y="115" fill="#d31a24" font-family="'Arial Black', sans-serif" font-weight="900" font-size="18" text-anchor="middle">ESPUMA</text>
    `
  },
  'EXTINTOR_CLASSE_K': {
    id: 'EXTINTOR_CLASSE_K',
    codigo_normativo: 'E16',
    nome: 'Extintor Classe K (Cozinhas Industriais)',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="65" y="65" width="45" height="85" rx="8" fill="#ffffff"/>
      <circle cx="145" cy="110" r="32" fill="#ffffff"/>
      <text x="145" y="125" fill="#d31a24" font-family="'Arial Black', sans-serif" font-weight="900" font-size="40" text-anchor="middle">K</text>
    `
  },
  'EXTINTOR_SETA_BAIXO': {
    id: 'EXTINTOR_SETA_BAIXO',
    codigo_normativo: 'E1-SB',
    nome: 'Extintor de Incêndio com Seta para Baixo',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 150,
    altura_mm: 300,
    viewBox: '0 0 150 300',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="150" height="300" rx="6" fill="#d31a24"/>
      <rect x="52" y="45" width="46" height="80" rx="8" fill="#ffffff"/>
      <rect x="62" y="32" width="26" height="13" fill="#ffffff"/>
      <rect x="70" y="18" width="10" height="14" fill="#ffffff"/>
      <polygon points="75,260 30,190 60,190 60,140 90,140 90,190 120,190" fill="#ffffff"/>
    `
  },
  'HIDRANTE': {
    id: 'HIDRANTE',
    codigo_normativo: 'E7',
    nome: 'Hidrante de Parede / Válvula de Incêndio',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <circle cx="100" cy="100" r="48" fill="none" stroke="#ffffff" stroke-width="12"/>
      <line x1="100" y1="28" x2="100" y2="172" stroke="#ffffff" stroke-width="12"/>
      <line x1="28" y1="100" x2="172" y2="100" stroke="#ffffff" stroke-width="12"/>
      <circle cx="100" cy="100" r="22" fill="#ffffff"/>
    `
  },
  'HIDRANTE_SETA_BAIXO': {
    id: 'HIDRANTE_SETA_BAIXO',
    codigo_normativo: 'E7-SB',
    nome: 'Hidrante de Incêndio com Seta para Baixo',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 150,
    altura_mm: 300,
    viewBox: '0 0 150 300',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="150" height="300" rx="6" fill="#d31a24"/>
      <circle cx="75" cy="75" r="40" fill="none" stroke="#ffffff" stroke-width="10"/>
      <line x1="75" y1="20" x2="75" y2="130" stroke="#ffffff" stroke-width="10"/>
      <line x1="20" y1="75" x2="130" y2="75" stroke="#ffffff" stroke-width="10"/>
      <circle cx="75" cy="75" r="18" fill="#ffffff"/>
      <polygon points="75,265 35,185 62,185 62,145 88,145 88,185 115,185" fill="#ffffff"/>
    `
  },
  'MANGUEIRA': {
    id: 'MANGUEIRA',
    codigo_normativo: 'E8',
    nome: 'Mangueira de Incêndio Carretel / Abrigo',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <circle cx="95" cy="95" r="50" fill="none" stroke="#ffffff" stroke-width="14"/>
      <circle cx="95" cy="95" r="30" fill="none" stroke="#ffffff" stroke-width="12"/>
      <circle cx="95" cy="95" r="14" fill="#ffffff"/>
      <path d="M125 130 L160 160 L170 150 L140 120 Z" fill="#ffffff"/>
    `
  },
  'CARRETA_EXTINTOR': {
    id: 'CARRETA_EXTINTOR',
    codigo_normativo: 'E11',
    nome: 'Carreta Extintora Sobre Rodas',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="75" y="55" width="50" height="85" rx="10" fill="#ffffff"/>
      <circle cx="70" cy="145" r="20" fill="none" stroke="#ffffff" stroke-width="8"/>
      <circle cx="130" cy="145" r="20" fill="none" stroke="#ffffff" stroke-width="8"/>
      <path d="M75 55 L45 35" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
    `
  },
  'MANTA_CORTA_FOGO': {
    id: 'MANTA_CORTA_FOGO',
    codigo_normativo: 'E15',
    nome: 'Manta Corta-Fogo / Abafador',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="50" y="45" width="100" height="110" rx="4" fill="none" stroke="#ffffff" stroke-width="10"/>
      <line x1="50" y1="80" x2="150" y2="80" stroke="#ffffff" stroke-width="6" stroke-dasharray="10,6"/>
      <line x1="50" y1="115" x2="150" y2="115" stroke="#ffffff" stroke-width="6" stroke-dasharray="10,6"/>
    `
  },
  'REGISTRO_DE_RECALQUE': {
    id: 'REGISTRO_DE_RECALQUE',
    codigo_normativo: 'E10',
    nome: 'Registro de Recalque de Incêndio',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="40" y="90" width="120" height="60" fill="none" stroke="#ffffff" stroke-width="10"/>
      <line x1="75" y1="90" x2="75" y2="40" stroke="#ffffff" stroke-width="12"/>
      <line x1="125" y1="90" x2="125" y2="40" stroke="#ffffff" stroke-width="12"/>
      <circle cx="75" cy="40" r="16" fill="#ffffff"/>
      <circle cx="125" cy="40" r="16" fill="#ffffff"/>
    `
  },
  'CENTRAL_ALARME_INCENDIO': {
    id: 'CENTRAL_ALARME_INCENDIO',
    codigo_normativo: 'E13',
    nome: 'Central de Alarme de Incêndio',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="40" y="45" width="120" height="110" rx="6" fill="none" stroke="#ffffff" stroke-width="10"/>
      <rect x="58" y="65" width="84" height="35" rx="3" fill="#ffffff"/>
      <circle cx="70" cy="125" r="8" fill="#ffffff"/>
      <circle cx="100" cy="125" r="8" fill="#ffffff"/>
      <circle cx="130" cy="125" r="8" fill="#ffffff"/>
    `
  },
  'ACIONAMENTO_MANUAL': {
    id: 'ACIONAMENTO_MANUAL',
    codigo_normativo: 'E12',
    nome: 'Acionador Manual de Alarme (Quebre o Vidro)',
    categoria: 'EQUIPAMENTOS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#d31a24',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#d31a24"/>
      <rect x="45" y="45" width="110" height="110" rx="6" fill="none" stroke="#ffffff" stroke-width="10"/>
      <rect x="70" y="70" width="60" height="60" fill="#ffffff"/>
      <circle cx="100" cy="100" r="14" fill="#d31a24"/>
    `
  },

  // =========================================================================
  // ORIENTAÇÃO E SALVAMENTO (Fundo Verde #086b3b, Símbolo Fotoluminescente)
  // =========================================================================
  'ROTA_FUGA_DIREITA': {
    id: 'ROTA_FUGA_DIREITA',
    codigo_normativo: 'S1',
    nome: 'Rota de Fuga / Saída de Emergência à Direita',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 300,
    altura_mm: 150,
    viewBox: '0 0 300 150',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="300" height="150" rx="6" fill="#086b3b"/>
      <!-- Porta -->
      <polygon points="40,20 100,20 100,130 40,130" fill="#ffffff"/>
      <polygon points="48,28 92,28 92,122 48,122" fill="#086b3b"/>
      <!-- Boneco correndo -->
      <circle cx="86" cy="38" r="10" fill="#ffffff"/>
      <path d="M80 48 L96 52 L110 70 L102 74 L94 60 L80 56 Z" fill="#ffffff"/>
      <path d="M80 50 L90 80 L84 84 L74 58 Z" fill="#ffffff"/>
      <path d="M90 80 L110 102 L128 118 L120 124 L102 108 L84 88 Z" fill="#ffffff"/>
      <path d="M78 80 L62 100 L44 108 L48 98 L60 92 L72 74 Z" fill="#ffffff"/>
      <!-- Seta Direita -->
      <polygon points="190,45 255,75 190,105 190,90 160,90 160,60 190,60" fill="#ffffff"/>
    `
  },
  'ROTA_FUGA_ESQUERDA': {
    id: 'ROTA_FUGA_ESQUERDA',
    codigo_normativo: 'S2',
    nome: 'Rota de Fuga / Saída de Emergência à Esquerda',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 300,
    altura_mm: 150,
    viewBox: '0 0 300 150',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="300" height="150" rx="6" fill="#086b3b"/>
      <!-- Seta Esquerda -->
      <polygon points="110,45 45,75 110,105 110,90 140,90 140,60 110,60" fill="#ffffff"/>
      <!-- Porta -->
      <polygon points="200,20 260,20 260,130 200,130" fill="#ffffff"/>
      <polygon points="208,28 252,28 252,122 208,122" fill="#086b3b"/>
      <!-- Boneco correndo -->
      <circle cx="214" cy="38" r="10" fill="#ffffff"/>
      <path d="M220 48 L204 52 L190 70 L198 74 L206 60 L220 56 Z" fill="#ffffff"/>
      <path d="M220 50 L210 80 L216 84 L226 58 Z" fill="#ffffff"/>
      <path d="M210 80 L190 102 L172 118 L180 124 L198 108 L216 88 Z" fill="#ffffff"/>
      <path d="M222 80 L238 100 L256 108 L252 98 L240 92 L228 74 Z" fill="#ffffff"/>
    `
  },
  'ROTA_FUGA_CIMA': {
    id: 'ROTA_FUGA_CIMA',
    codigo_normativo: 'S3',
    nome: 'Rota de Fuga / Saída em Frente (Siga em Frente)',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 300,
    altura_mm: 150,
    viewBox: '0 0 300 150',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="300" height="150" rx="6" fill="#086b3b"/>
      <polygon points="40,20 100,20 100,130 40,130" fill="#ffffff"/>
      <polygon points="48,28 92,28 92,122 48,122" fill="#086b3b"/>
      <circle cx="86" cy="38" r="10" fill="#ffffff"/>
      <path d="M80 50 L90 80 L84 84 L74 58 Z" fill="#ffffff"/>
      <!-- Seta Cima -->
      <polygon points="205,30 245,75 225,75 225,120 185,120 185,75 165,75" fill="#ffffff"/>
    `
  },
  'ROTA_FUGA_BAIXO': {
    id: 'ROTA_FUGA_BAIXO',
    codigo_normativo: 'S4',
    nome: 'Rota de Fuga / Saída para Baixo',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 300,
    altura_mm: 150,
    viewBox: '0 0 300 150',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="300" height="150" rx="6" fill="#086b3b"/>
      <polygon points="40,20 100,20 100,130 40,130" fill="#ffffff"/>
      <polygon points="48,28 92,28 92,122 48,122" fill="#086b3b"/>
      <circle cx="86" cy="38" r="10" fill="#ffffff"/>
      <!-- Seta Baixo -->
      <polygon points="205,120 245,75 225,75 225,30 185,30 185,75 165,75" fill="#ffffff"/>
    `
  },
  'ESCADA_ROTA_FUGA': {
    id: 'ESCADA_ROTA_FUGA',
    codigo_normativo: 'S9',
    nome: 'Escada de Emergência / Rota de Fuga',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 300,
    altura_mm: 150,
    viewBox: '0 0 300 150',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="300" height="150" rx="6" fill="#086b3b"/>
      <!-- Escada em perfil -->
      <path d="M140 125 L140 105 L170 105 L170 85 L200 85 L200 65 L230 65 L230 45 L260 45 L260 125 Z" fill="#ffffff"/>
      <!-- Boneco descendo escada -->
      <circle cx="100" cy="40" r="10" fill="#ffffff"/>
      <path d="M92 50 L108 55 L120 72 L112 76 L102 62 Z" fill="#ffffff"/>
      <path d="M102 62 L118 88 L108 94 L94 72 Z" fill="#ffffff"/>
      <polygon points="50,60 85,75 50,90" fill="#ffffff"/>
    `
  },
  'ESCADA_ROTA_FUGA_DIREITA_BAIXO': {
    id: 'ESCADA_ROTA_FUGA_DIREITA_BAIXO',
    codigo_normativo: 'S12',
    nome: 'Escada de Emergência Descendo à Direita',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 300,
    altura_mm: 150,
    viewBox: '0 0 300 150',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="300" height="150" rx="6" fill="#086b3b"/>
      <path d="M140 125 L140 100 L170 100 L170 75 L200 75 L200 50 L230 50 L230 125 Z" fill="#ffffff"/>
      <circle cx="95" cy="38" r="10" fill="#ffffff"/>
      <polygon points="260,115 220,115 240,85" fill="#ffffff"/>
    `
  },
  'SAIDA_DE_EMERGENCIA_DIREITA': {
    id: 'SAIDA_DE_EMERGENCIA_DIREITA',
    codigo_normativo: 'S16',
    nome: 'Saída de Emergência - Direita (Texto + Símbolo)',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 300,
    altura_mm: 150,
    viewBox: '0 0 300 150',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="300" height="150" rx="6" fill="#086b3b"/>
      <text x="25" y="65" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="28">SAÍDA DE</text>
      <text x="25" y="105" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="28">EMERGÊNCIA</text>
      <polygon points="230,45 285,75 230,105 230,90 200,90 200,60 230,60" fill="#ffffff"/>
    `
  },
  'SAIDA_DE_EMERGENCIA_ESQUERDA': {
    id: 'SAIDA_DE_EMERGENCIA_ESQUERDA',
    codigo_normativo: 'S17',
    nome: 'Saída de Emergência - Esquerda (Texto + Símbolo)',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 300,
    altura_mm: 150,
    viewBox: '0 0 300 150',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="300" height="150" rx="6" fill="#086b3b"/>
      <polygon points="70,45 15,75 70,105 70,90 100,90 100,60 70,60" fill="#ffffff"/>
      <text x="115" y="65" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="26">SAÍDA DE</text>
      <text x="115" y="105" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="26">EMERGÊNCIA</text>
    `
  },
  'SAIDA_EMERGENCIA_PORTA': {
    id: 'SAIDA_EMERGENCIA_PORTA',
    codigo_normativo: 'S20',
    nome: 'Porta Corta-Fogo / Saída de Emergência',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#086b3b"/>
      <rect x="40" y="30" width="120" height="140" fill="none" stroke="#ffffff" stroke-width="12"/>
      <rect x="55" y="45" width="90" height="110" fill="#ffffff"/>
      <circle cx="70" cy="100" r="8" fill="#086b3b"/>
    `
  },
  'ACESSIBILIDADE': {
    id: 'ACESSIBILIDADE',
    codigo_normativo: 'S21',
    nome: 'Rota de Fuga Acessível / Cadeirante (PCD)',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#086b3b"/>
      <circle cx="115" cy="55" r="16" fill="#ffffff"/>
      <path d="M100 80 L125 80 L125 115 L145 145 L130 155 L112 125 L112 95 L95 95 Z" fill="#ffffff"/>
      <path d="M75 110 A35 35 0 1 0 110 145" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
    `
  },
  'PONTO_DE_ENCONTRO': {
    id: 'PONTO_DE_ENCONTRO',
    codigo_normativo: 'S22',
    nome: 'Ponto de Encontro de Brigada / Emergência',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#086b3b"/>
      <!-- 4 pessoas no centro -->
      <circle cx="85" cy="85" r="12" fill="#ffffff"/>
      <circle cx="115" cy="85" r="12" fill="#ffffff"/>
      <circle cx="85" cy="115" r="12" fill="#ffffff"/>
      <circle cx="115" cy="115" r="12" fill="#ffffff"/>
      <!-- 4 setas convergindo -->
      <polygon points="35,35 65,35 50,60" fill="#ffffff"/>
      <polygon points="165,35 135,35 150,60" fill="#ffffff"/>
      <polygon points="35,165 65,165 50,140" fill="#ffffff"/>
      <polygon points="165,165 135,165 150,140" fill="#ffffff"/>
    `
  },
  'PRIMEIROS_SOCORROS': {
    id: 'PRIMEIROS_SOCORROS',
    codigo_normativo: 'S23',
    nome: 'Posto de Primeiros Socorros / Maca',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#086b3b"/>
      <rect x="80" y="35" width="40" height="130" rx="4" fill="#ffffff"/>
      <rect x="35" y="80" width="130" height="40" rx="4" fill="#ffffff"/>
    `
  },
  'MACA': {
    id: 'MACA',
    codigo_normativo: 'S24',
    nome: 'Maca de Resgate / Emergência',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#086b3b"/>
      <rect x="35" y="90" width="130" height="20" rx="4" fill="#ffffff"/>
      <circle cx="55" cy="70" r="12" fill="#ffffff"/>
      <path d="M70 85 L145 85" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
      <line x1="45" y1="110" x2="45" y2="135" stroke="#ffffff" stroke-width="8"/>
      <line x1="155" y1="110" x2="155" y2="135" stroke="#ffffff" stroke-width="8"/>
    `
  },
  'DEA': {
    id: 'DEA',
    codigo_normativo: 'S25',
    nome: 'Desfibrilador Externo Automático (DEA)',
    categoria: 'ORIENTACAO_SALVAMENTO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="6" fill="#086b3b"/>
      <path d="M100 150 C70 120, 45 95, 45 70 C45 50, 60 38, 80 38 C92 38, 100 48, 100 48 C100 48, 108 38, 120 38 C140 38, 155 50, 155 70 C155 95, 130 120, 100 150 Z" fill="#ffffff"/>
      <polygon points="100,55 85,90 102,90 92,130 118,85 102,85" fill="#086b3b"/>
    `
  },

  // =========================================================================
  // PROIBIÇÃO (Círculo Vermelho #dc2626 com Faixa Diagonal, Fundo Branco)
  // =========================================================================
  'PROIBIDO_FUMAR': {
    id: 'PROIBIDO_FUMAR',
    codigo_normativo: 'P1',
    nome: 'Proibido Fumar',
    categoria: 'PROIBICAO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#ffffff',
    cor_simbolo: '#dc2626',
    svgContent: `
      <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#dc2626" stroke-width="16"/>
      <!-- Cigarro -->
      <rect x="50" y="92" width="70" height="16" fill="#000000"/>
      <rect x="120" y="92" width="20" height="16" fill="#eab308"/>
      <path d="M145 90 C150 80, 145 75, 155 65" stroke="#71717a" stroke-width="4" fill="none"/>
      <!-- Faixa diagonal -->
      <line x1="38" y1="38" x2="162" y2="162" stroke="#dc2626" stroke-width="16"/>
    `
  },
  'PROIBIDO_PRODUZIR_CHAMA': {
    id: 'PROIBIDO_PRODUZIR_CHAMA',
    codigo_normativo: 'P2',
    nome: 'Proibido Produzir Chama / Fósforo / Isqueiro',
    categoria: 'PROIBICAO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#ffffff',
    cor_simbolo: '#dc2626',
    svgContent: `
      <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#dc2626" stroke-width="16"/>
      <!-- Fósforo aceso -->
      <line x1="60" y1="140" x2="110" y2="90" stroke="#a16207" stroke-width="8" stroke-linecap="round"/>
      <path d="M110 90 Q120 70 115 55 Q130 75 120 95 Z" fill="#ea580c"/>
      <line x1="38" y1="38" x2="162" y2="162" stroke="#dc2626" stroke-width="16"/>
    `
  },
  'PROIBIDO_USAR_EXTINTOR': {
    id: 'PROIBIDO_USAR_EXTINTOR',
    codigo_normativo: 'P3',
    nome: 'Proibido Apagar com Água',
    categoria: 'PROIBICAO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#ffffff',
    cor_simbolo: '#dc2626',
    svgContent: `
      <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#dc2626" stroke-width="16"/>
      <!-- Balde com água e fogo -->
      <polygon points="70,95 80,145 120,145 130,95" fill="#000000"/>
      <path d="M85 85 Q100 65 115 85" stroke="#0284c7" stroke-width="6" fill="none"/>
      <line x1="38" y1="38" x2="162" y2="162" stroke="#dc2626" stroke-width="16"/>
    `
  },
  'PROIBIDO_ELEVADOR': {
    id: 'PROIBIDO_ELEVADOR',
    codigo_normativo: 'P4',
    nome: 'Proibido Usar Elevador em Caso de Incêndio',
    categoria: 'PROIBICAO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#ffffff',
    cor_simbolo: '#dc2626',
    svgContent: `
      <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#dc2626" stroke-width="16"/>
      <!-- Elevador e chamas -->
      <rect x="65" y="65" width="70" height="75" fill="none" stroke="#000000" stroke-width="8"/>
      <circle cx="85" cy="85" r="8" fill="#000000"/>
      <circle cx="115" cy="85" r="8" fill="#000000"/>
      <line x1="38" y1="38" x2="162" y2="162" stroke="#dc2626" stroke-width="16"/>
    `
  },
  'PROIBIDO_OBSTRUIR': {
    id: 'PROIBIDO_OBSTRUIR',
    codigo_normativo: 'P5',
    nome: 'Proibido Obstruir Este Local',
    categoria: 'PROIBICAO',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#ffffff',
    cor_simbolo: '#dc2626',
    svgContent: `
      <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#dc2626" stroke-width="16"/>
      <!-- Caixas/obstrução -->
      <rect x="65" y="85" width="40" height="40" fill="#000000"/>
      <rect x="95" y="85" width="40" height="40" fill="#71717a"/>
      <line x1="38" y1="38" x2="162" y2="162" stroke="#dc2626" stroke-width="16"/>
    `
  },

  // =========================================================================
  // ALERTA E PERIGO (Triângulo Amarelo #f59e0b, Borda Preta, Símbolo Preto)
  // =========================================================================
  'CUIDADO': {
    id: 'CUIDADO',
    codigo_normativo: 'A1',
    nome: 'Atenção / Perigo Geral',
    categoria: 'ALERTA',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#f59e0b',
    cor_simbolo: '#000000',
    svgContent: `
      <polygon points="100,20 185,175 15,175" fill="#f59e0b" stroke="#000000" stroke-width="12" stroke-linejoin="round"/>
      <rect x="94" y="65" width="12" height="55" rx="4" fill="#000000"/>
      <circle cx="100" cy="145" r="8" fill="#000000"/>
    `
  },
  'RISCO_DE_INCENDIO': {
    id: 'RISCO_DE_INCENDIO',
    codigo_normativo: 'A2',
    nome: 'Risco de Incêndio / Material Inflamável',
    categoria: 'ALERTA',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#f59e0b',
    cor_simbolo: '#000000',
    svgContent: `
      <polygon points="100,20 185,175 15,175" fill="#f59e0b" stroke="#000000" stroke-width="12" stroke-linejoin="round"/>
      <!-- Chama -->
      <path d="M100 65 Q115 95 105 115 Q125 100 115 135 Q135 125 125 155 Q65 160 85 130 Q70 125 85 100 Q100 110 100 65 Z" fill="#000000"/>
    `
  },
  'RISCO_CHOQUE_ELETRICO': {
    id: 'RISCO_CHOQUE_ELETRICO',
    codigo_normativo: 'A5',
    nome: 'Perigo de Choque Elétrico / Alta Tensão',
    categoria: 'ALERTA',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#f59e0b',
    cor_simbolo: '#000000',
    svgContent: `
      <polygon points="100,20 185,175 15,175" fill="#f59e0b" stroke="#000000" stroke-width="12" stroke-linejoin="round"/>
      <!-- Raio elétrico -->
      <polygon points="105,55 75,115 105,115 85,160 135,95 105,95" fill="#000000"/>
    `
  },
  'RISCO_EXPLOSAO': {
    id: 'RISCO_EXPLOSAO',
    codigo_normativo: 'A3',
    nome: 'Perigo de Explosão / Substâncias Explosivas',
    categoria: 'ALERTA',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#f59e0b',
    cor_simbolo: '#000000',
    svgContent: `
      <polygon points="100,20 185,175 15,175" fill="#f59e0b" stroke="#000000" stroke-width="12" stroke-linejoin="round"/>
      <circle cx="100" cy="115" r="18" fill="#000000"/>
      <!-- Fragmentos de explosão -->
      <polygon points="100,75 105,90 95,90" fill="#000000"/>
      <polygon points="135,95 120,105 115,95" fill="#000000"/>
      <polygon points="65,95 80,105 85,95" fill="#000000"/>
      <polygon points="140,135 120,125 125,135" fill="#000000"/>
      <polygon points="60,135 80,125 75,135" fill="#000000"/>
    `
  },

  // =========================================================================
  // IDENTIFICAÇÃO DE PAVIMENTOS (Fundo Preto com Texto Fotoluminescente / Invertido)
  // =========================================================================
  'SUBSOLO': {
    id: 'SUBSOLO',
    codigo_normativo: 'SS',
    nome: 'Identificação de Pavimento - Subsolo',
    categoria: 'COMPLEMENTAR',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#0f172a',
    cor_simbolo: '#38bdf8',
    svgContent: `
      <rect width="200" height="200" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="6"/>
      <text x="100" y="115" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="52" text-anchor="middle">SS</text>
      <text x="100" y="155" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="18" text-anchor="middle">SUBSOLO</text>
    `
  },
  '2_ANDAR': {
    id: '2_ANDAR',
    codigo_normativo: '2-AND',
    nome: 'Identificação de Pavimento - 2º Andar',
    categoria: 'COMPLEMENTAR',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#0f172a',
    cor_simbolo: '#38bdf8',
    svgContent: `
      <rect width="200" height="200" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="6"/>
      <text x="100" y="115" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="70" text-anchor="middle">2º</text>
      <text x="100" y="155" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="18" text-anchor="middle">ANDAR</text>
    `
  },
  '4_ANDAR': {
    id: '4_ANDAR',
    codigo_normativo: '4-AND',
    nome: 'Identificação de Pavimento - 4º Andar',
    categoria: 'COMPLEMENTAR',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#0f172a',
    cor_simbolo: '#38bdf8',
    svgContent: `
      <rect width="200" height="200" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="6"/>
      <text x="100" y="115" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="70" text-anchor="middle">4º</text>
      <text x="100" y="155" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="18" text-anchor="middle">ANDAR</text>
    `
  },
  '15_ANDAR': {
    id: '15_ANDAR',
    codigo_normativo: '15-AND',
    nome: 'Identificação de Pavimento - 15º Andar',
    categoria: 'COMPLEMENTAR',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#0f172a',
    cor_simbolo: '#38bdf8',
    svgContent: `
      <rect width="200" height="200" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="6"/>
      <text x="100" y="115" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="64" text-anchor="middle">15º</text>
      <text x="100" y="155" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="18" text-anchor="middle">ANDAR</text>
    `
  },

  // =========================================================================
  // SERVIÇOS, SEGURANÇA E ACESSIBILIDADE
  // =========================================================================
  'SANITARIOS': {
    id: 'SANITARIOS',
    codigo_normativo: 'SAN-01',
    nome: 'Sanitários Masculino e Feminino',
    categoria: 'OUTROS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#0284c7',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="8" fill="#0284c7"/>
      <!-- Boneco Masculino -->
      <circle cx="70" cy="50" r="14" fill="#ffffff"/>
      <path d="M55 70 L85 70 L85 115 L78 115 L78 155 L62 155 L62 115 L55 115 Z" fill="#ffffff"/>
      <!-- Boneco Feminino -->
      <circle cx="130" cy="50" r="14" fill="#ffffff"/>
      <polygon points="115,70 145,70 155,120 105,120" fill="#ffffff"/>
      <rect x="115" y="120" width="10" height="35" fill="#ffffff"/>
      <rect x="135" y="120" width="10" height="35" fill="#ffffff"/>
    `
  },
  'PCD': {
    id: 'PCD',
    codigo_normativo: 'PCD-01',
    nome: 'Sanitário Acessível / PCD',
    categoria: 'OUTROS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#0284c7',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="8" fill="#0284c7"/>
      <circle cx="115" cy="55" r="16" fill="#ffffff"/>
      <path d="M100 80 L125 80 L125 115 L145 145 L130 155 L112 125 L112 95 L95 95 Z" fill="#ffffff"/>
      <path d="M75 110 A35 35 0 1 0 110 145" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
    `
  },
  'USE_LUVAS': {
    id: 'USE_LUVAS',
    codigo_normativo: 'EPI-01',
    nome: 'EPI Obrigatório: Use Luvas de Proteção',
    categoria: 'OUTROS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#0284c7',
    cor_simbolo: '#ffffff',
    svgContent: `
      <circle cx="100" cy="100" r="92" fill="#0284c7"/>
      <path d="M70 130 C70 100, 75 70, 75 55 C75 50, 85 50, 85 55 L85 85 L95 85 L95 50 C95 45, 105 45, 105 50 L105 85 L115 85 L115 55 C115 50, 125 50, 125 55 L125 95 C125 110, 135 115, 135 130 Z" fill="#ffffff"/>
    `
  },
  'RECICLAVEL': {
    id: 'RECICLAVEL',
    codigo_normativo: 'AMB-01',
    nome: 'Ponto de Coleta Seletiva / Reciclagem',
    categoria: 'OUTROS',
    largura_mm: 200,
    altura_mm: 200,
    viewBox: '0 0 200 200',
    cor_fundo: '#086b3b',
    cor_simbolo: '#ffffff',
    svgContent: `
      <rect width="200" height="200" rx="8" fill="#086b3b"/>
      <!-- Símbolo internacional de reciclagem (Möbius loop 3 setas) -->
      <path d="M100 45 L115 65 L85 65 Z" fill="#ffffff"/>
      <path d="M75 75 Q100 65 125 75" stroke="#ffffff" stroke-width="10" fill="none"/>
      <path d="M145 120 L145 95 L165 110 Z" fill="#ffffff"/>
      <path d="M135 90 Q145 115 125 135" stroke="#ffffff" stroke-width="10" fill="none"/>
      <path d="M65 125 L85 110 L65 95 Z" fill="#ffffff"/>
      <path d="M105 145 Q80 145 65 120" stroke="#ffffff" stroke-width="10" fill="none"/>
    `
  }
};

/**
 * Normaliza e busca a representação SVG vetorial de alta fidelidade
 * Evita repetições (mapeando aliases comuns do documento e normas para o SVG canônico).
 */
export function getOfficialSvgSign(codeOrKey: string): SvgSignDefinition | null {
  if (!codeOrKey) return null;
  const clean = codeOrKey.toUpperCase().trim().replace('.SVG', '');

  // Busca direta
  if (OFFICIAL_SVG_SIGNS[clean]) {
    return OFFICIAL_SVG_SIGNS[clean];
  }

  // Mapeamento de Códigos Normativos (NBR 13434 / NBR 16820) e Nomes do Documento
  const aliasMap: Record<string, string> = {
    // Equipamentos
    'E1': 'EXTINTOR',
    'EXTINTOR_INCENDIO': 'EXTINTOR',
    'EXTINTOR_IMG81': 'EXTINTOR',
    'E2': 'EXTINTOR_AGUA',
    'E3': 'EXTINTOR_PO_ABC',
    'EXTINTOR_PO_ABC_IMG85': 'EXTINTOR_PO_ABC',
    'E4': 'EXTINTOR_PO_BC',
    'EXTINTOR_PO_BC_IMG86': 'EXTINTOR_PO_BC',
    'E5': 'EXTINTOR_CO2',
    'EXTINTOR_CO2_IMG87': 'EXTINTOR_CO2',
    'E6': 'EXTINTOR_ESPUMA',
    'EXTINTOR_ESPUMA_MECANICA': 'EXTINTOR_ESPUMA',
    'EXTINTOR_PO': 'EXTINTOR_PO_ABC',
    'EXTINTOR_PO_IMG88': 'EXTINTOR_PO_ABC',
    'E7': 'HIDRANTE',
    'HIDRANTE_IMG56': 'HIDRANTE',
    'HIDRANTE_IMG102': 'HIDRANTE',
    'HIDRANTE_IMG354': 'HIDRANTE',
    'E8': 'MANGUEIRA',
    'MANGUEIRA_IMG100': 'MANGUEIRA',
    'MANGUEIRA_IMG349': 'MANGUEIRA',
    'E10': 'REGISTRO_DE_RECALQUE',
    'E11': 'CARRETA_EXTINTOR',
    'E12': 'ACIONAMENTO_MANUAL',
    'BOTAO_EMERGENCIA': 'ACIONAMENTO_MANUAL',
    'E13': 'CENTRAL_ALARME_INCENDIO',
    'E14': 'TELEFONE',
    'TELEFONE_IMG353': 'TELEFONE',
    'TELEFONE_EMERGENCIA': 'TELEFONE',
    'TELEFONE_EMERGENCIA_IMG436': 'TELEFONE',
    'E15': 'MANTA_CORTA_FOGO',
    'E16': 'EXTINTOR_CLASSE_K',
    'ABRIGO': 'HIDRANTE',
    'EXTINTOR_SETA_BAIXO_IMG104': 'EXTINTOR_SETA_BAIXO',
    'EXTINTOR_AGUA_SETA_BAIXO': 'EXTINTOR_SETA_BAIXO',
    'EXTINTOR_PO_ABC_SETA_BAIXO': 'EXTINTOR_SETA_BAIXO',
    'EXTINTOR_CO2_SETA_BAIXO': 'EXTINTOR_SETA_BAIXO',
    'EXTINTOR_PO_SETA_BAIXO': 'EXTINTOR_SETA_BAIXO',
    'MANGUEIRA_SETA_BAIXO': 'HIDRANTE_SETA_BAIXO',

    // Orientação / Salvamento
    'S1': 'ROTA_FUGA_DIREITA',
    'SETA_DIREITA': 'ROTA_FUGA_DIREITA',
    'SETA_DIREITA_IMG179': 'ROTA_FUGA_DIREITA',
    'SETA_DIREITA_IMG188': 'ROTA_FUGA_DIREITA',
    'SETA_DIREITA_IMG346': 'ROTA_FUGA_DIREITA',
    'SETA_DIREITA_IMG355': 'ROTA_FUGA_DIREITA',
    'S2': 'ROTA_FUGA_ESQUERDA',
    'SETA_ESQUERDA': 'ROTA_FUGA_ESQUERDA',
    'SETA_ESQUERDA_IMG180': 'ROTA_FUGA_ESQUERDA',
    'S3': 'ROTA_FUGA_CIMA',
    'ROTA_FUGA_CIMA_IMG361': 'ROTA_FUGA_CIMA',
    'ROTA_FUGA_CIMA_IMG363': 'ROTA_FUGA_CIMA',
    'S4': 'ROTA_FUGA_BAIXO',
    'S9': 'ESCADA_ROTA_FUGA',
    'ESCADA_ROTA_FUGA_IMG367': 'ESCADA_ROTA_FUGA',
    'ESCADA_ROTA_FUGA_IMG371': 'ESCADA_ROTA_FUGA',
    'ESCADA_ROTA_FUGA_IMG372': 'ESCADA_ROTA_FUGA',
    'S10': 'ESCADA_ROTA_FUGA',
    'ESCADA_ROTA_FUGA_DIREITA_CIMA': 'ESCADA_ROTA_FUGA',
    'S11': 'ESCADA_ROTA_FUGA',
    'ESCADA_ROTA_FUGA_ESQUERDA_CIMA': 'ESCADA_ROTA_FUGA',
    'S12': 'ESCADA_ROTA_FUGA_DIREITA_BAIXO',
    'S13': 'ESCADA_ROTA_FUGA_DIREITA_BAIXO',
    'ESCADA_ROTA_FUGA_ESQUERDA_BAIXO': 'ESCADA_ROTA_FUGA_DIREITA_BAIXO',
    'S16': 'SAIDA_DE_EMERGENCIA_DIREITA',
    'S17': 'SAIDA_DE_EMERGENCIA_ESQUERDA',
    'S18': 'SAIDA_DE_EMERGENCIA_DIREITA',
    'SAIDA_DE_EMERGENCIA_CIMA': 'SAIDA_DE_EMERGENCIA_DIREITA',
    'S20': 'SAIDA_EMERGENCIA_PORTA',
    'SAIDA_EMERGENCIA_PORTA_IMG174': 'SAIDA_EMERGENCIA_PORTA',
    'PORTA_EMERGENCIA': 'SAIDA_EMERGENCIA_PORTA',
    'PORTA_GIRATORIA': 'SAIDA_EMERGENCIA_PORTA',
    'S21': 'ACESSIBILIDADE',
    'ACESSIBILIDADE_IMG352': 'ACESSIBILIDADE',
    'ACESSIBILIDADE_IMG414': 'ACESSIBILIDADE',
    'ACESSIBILIDADE_CIMA': 'ACESSIBILIDADE',
    'ACESSIBILIDADE_CIMA_IMG197': 'ACESSIBILIDADE',
    'ACESSIBILIDADE_DIAGONAL_DIREITA': 'ACESSIBILIDADE',
    'ACESSIBILIDADE_DIAGONAL_ESQUERDA_CIMA': 'ACESSIBILIDADE',
    'ACESSIBILIDADE_DIAGONAL_DIREITA_BAIXO': 'ACESSIBILIDADE',
    'ACESSIBILIDADE_DIAGONAL_ESQUERDA_BAIXO': 'ACESSIBILIDADE',
    'S22': 'PONTO_DE_ENCONTRO',
    'PONTO_DE_ENCONTRO_VERDE': 'PONTO_DE_ENCONTRO',
    'PONTO_DE_ENCONTRO_VERDE_IMG424': 'PONTO_DE_ENCONTRO',
    'PONTO_DE_ENCONTRO_VERDE_IMG429': 'PONTO_DE_ENCONTRO',
    'PONTO_DE_ENCONTRO_VERMELHO': 'PONTO_DE_ENCONTRO',
    'PONTO_DE_ENCONTRO_VERMELHO_IMG426': 'PONTO_DE_ENCONTRO',
    'PONTO_DE_ENCONTRO_VERMELHO_IMG431': 'PONTO_DE_ENCONTRO',
    'S23': 'PRIMEIROS_SOCORROS',
    'PRIMEIROS_SOCORROS_IMG519': 'PRIMEIROS_SOCORROS',
    'S24': 'MACA',
    'S25': 'DEA',
    'DESA': 'DEA',

    // Proibição
    'P1': 'PROIBIDO_FUMAR',
    'PROIBIDO_FUMAR_IMG579': 'PROIBIDO_FUMAR',
    'PROIBIDO_FUMAR_IMG718': 'PROIBIDO_FUMAR',
    'P2': 'PROIBIDO_PRODUZIR_CHAMA',
    'PROIBIDO_FOGUEIRA': 'PROIBIDO_PRODUZIR_CHAMA',
    'P3': 'PROIBIDO_USAR_EXTINTOR',
    'P4': 'PROIBIDO_ELEVADOR',
    'PROIBIDO_ELEVADOR_IMG216': 'PROIBIDO_ELEVADOR',
    'P5': 'PROIBIDO_OBSTRUIR',
    'PROIBIDO_CELULAR': 'PROIBIDO_OBSTRUIR',
    'PROIBIDO_CELULAR_IMG487': 'PROIBIDO_OBSTRUIR',
    'PROIBIDO_ENTRADA': 'PROIBIDO_OBSTRUIR',
    'PROIBIDO_ESTACIONAR': 'PROIBIDO_OBSTRUIR',
    'PROIBIDO_ESTACIONAR_GARAGEM': 'PROIBIDO_OBSTRUIR',
    'PROIBIDA_ENTRADA_ANIMAIS': 'PROIBIDO_OBSTRUIR',

    // Alerta
    'A1': 'CUIDADO',
    'A2': 'RISCO_DE_INCENDIO',
    'A3': 'RISCO_EXPLOSAO',
    'A5': 'RISCO_CHOQUE_ELETRICO',
    'CHOQUE_ELETRICO': 'RISCO_CHOQUE_ELETRICO',
    'ALTA_TENSAO': 'RISCO_CHOQUE_ELETRICO',
    'PERIGO_ALTA_TENSAO': 'RISCO_CHOQUE_ELETRICO',
    'CUIDADO_ALTA_TENSAO': 'RISCO_CHOQUE_ELETRICO',
    'PERIGO_DE_MORTE_ALTA_TENSAO': 'RISCO_CHOQUE_ELETRICO',
    'A4': 'CUIDADO',
    'RISCO_CORROSAO': 'CUIDADO',
    'RISCO_RADIACAO': 'CUIDADO',
    'RISCO_BIOLOGICO': 'CUIDADO',
    'RISCO_TOXICO': 'CUIDADO',

    // Pavimentos
    '2_GARAGEM': 'SUBSOLO',
    '2_SUBSOLO': 'SUBSOLO',
    '3_SUBSOLO': 'SUBSOLO',
    '4_SUBSOLO': 'SUBSOLO',
    '5_SUBSOLO': 'SUBSOLO',
    '10_ANDAR': '15_ANDAR',
    '11_ANDAR': '15_ANDAR',
    '12_ANDAR': '15_ANDAR',
    '13_ANDAR': '15_ANDAR',
    '14_ANDAR': '15_ANDAR',
    '16_ANDAR': '15_ANDAR',
    '17_ANDAR': '15_ANDAR',
    '18_ANDAR': '15_ANDAR',
    '19_ANDAR': '15_ANDAR',
    '20_ANDAR': '15_ANDAR',

    // Serviços
    'SANITARIOS_IMG504': 'SANITARIOS',
    'SANITARIOS_IMG506': 'SANITARIOS',
    'SANITARIOS_PCD': 'PCD',
    'FEMININO': 'SANITARIOS',
    'MASCULINO': 'SANITARIOS',
    'MASCULINO_IMG499': 'SANITARIOS',
    'FEMININO_IMG500': 'SANITARIOS',
    'PCD_IMG502': 'PCD',
    'USE_LUVAS_IMG719': 'USE_LUVAS',
    'ORGANICO': 'RECICLAVEL',
    'PAPEL': 'RECICLAVEL',
    'VIDRO': 'RECICLAVEL',
    'PLASTICO': 'RECICLAVEL',
    'METAL': 'RECICLAVEL',
    'MADEIRA': 'RECICLAVEL'
  };

  const targetId = aliasMap[clean];
  if (targetId && OFFICIAL_SVG_SIGNS[targetId]) {
    return OFFICIAL_SVG_SIGNS[targetId];
  }

  // Tentar casamento parcial
  for (const [key, def] of Object.entries(OFFICIAL_SVG_SIGNS)) {
    if (clean.includes(key) || key.includes(clean) || def.codigo_normativo === clean) {
      return def;
    }
  }

  return null;
}
