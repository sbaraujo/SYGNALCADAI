import { Supplier, Manufacturer, Product, SymbolCategory } from '../types/cad';

export const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'FORN-001',
    razao_social: 'TAG Sinalização de Emergência Indústria e Comércio Ltda',
    nome_fantasia: 'TAG Sinalização',
    cnpj: '03.686.682/0001-26',
    endereco: 'Rua das Indústrias, 450 - Distrito Industrial',
    cidade: 'Jaú',
    estado: 'SP',
    pais: 'Brasil',
    telefone: '(14) 3624-6257',
    whatsapp: '(14) 99876-5432',
    email: 'vendas@tagsinalizacao.com',
    website: 'www.tagsinalizacao.com',
    contato_comercial: 'Guilherme / Kleber (vendas@tagsinalizacao.com | guilherme@tagsinalizacao.com)',
    observacoes: 'Fabricante com certificação ABNT NBR 16820 / NBR 13434. Alta fotoluminescência comprovada até 3.000 minutos, PVC expandido antichamas com laudos do IPT.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-002',
    razao_social: 'Everlux Brasil Sinalização de Segurança Ltda',
    nome_fantasia: 'Everlux',
    cnpj: '04.819.522/0001-80',
    endereco: 'Av. Engenheiro Billings, 2100 - Jaguaré',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    telefone: '(11) 3719-0100',
    whatsapp: '(11) 98765-4321',
    email: 'comercial@everlux.com.br',
    website: 'br.everlux.com.br',
    contato_comercial: 'Departamento Comercial Everlux Brasil',
    observacoes: 'Indústria internacional de referência. Certificação Lloyd\'s Register, garantia de 5 anos, laudos DIN 67510 e ISO 16069. Atendimento em todo o Brasil.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-003',
    razao_social: 'Sinalplast Indústria de Placas e Comunicação Ltda',
    nome_fantasia: 'Sinalplast',
    cnpj: '52.148.963/0001-11',
    endereco: 'Rua do Bosque, 780 - Barra Funda',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    telefone: '(11) 3825-1020',
    whatsapp: '(11) 99123-4567',
    email: 'contato@sinalplast.com.br',
    website: 'www.sinalplast.com.br',
    contato_comercial: 'Equipe Comercial Sinalplast',
    observacoes: 'Mais de 30 anos no mercado nacional. Linha completa de placas fotoluminescentes para rota de fuga, combate a incêndio e sinalização complementar.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-004',
    razao_social: 'Forthlux Fabricação de Sinalização de Segurança Ltda',
    nome_fantasia: 'Forthlux',
    cnpj: '15.987.654/0001-90',
    endereco: 'Av. Presidente Wilson, 3500 - Ipiranga',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    telefone: '(11) 2063-4400',
    whatsapp: '(11) 97654-3210',
    email: 'comercial@forthlux.com.br',
    website: 'www.forthlux.com.br',
    contato_comercial: 'Atendimento Corporativo (contato@forthlux.com.br)',
    observacoes: 'Mais de 12 anos de fábrica própria. Especializada em placas de rota de fuga, saídas de emergência e equipamentos com laudos técnicos IT-20.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-005',
    razao_social: 'Sigma Sinalizações de Segurança Contra Incêndio Ltda',
    nome_fantasia: 'Sigma Sinalizações',
    cnpj: '22.333.444/0001-55',
    endereco: 'Rua Vergueiro, 2800 - Vila Mariana',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    telefone: '(11) 3290-8800',
    whatsapp: '(11) 97123-4567',
    email: 'vendas@sigmasinalizacoes.com.br',
    website: 'www.sigmasinalizacoes.com.br',
    contato_comercial: 'Engenharia de Vendas Sigma',
    observacoes: 'Fabricante especializada de placas fotoluminescentes em PVC rígido 2,0 mm conforme NBR 13434 e NBR 16820. Produção serigráfica e UV de alta durabilidade.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-006',
    razao_social: 'Placas SA Indústria e Comércio de Sinalização Ltda',
    nome_fantasia: 'Placas SA',
    cnpj: '18.765.432/0001-09',
    endereco: 'Av. Brasil, 1420 - Jardim Guanabara',
    cidade: 'Campinas',
    estado: 'SP',
    pais: 'Brasil',
    telefone: '(19) 3241-8000',
    whatsapp: '(19) 99556-6111',
    email: 'contato@placassa.com.br',
    website: 'www.placassa.com.br',
    contato_comercial: 'Vendas Diretas Placas SA',
    observacoes: 'Impressão industrial UV LED de altíssima definição sobre substratos antichamas. Conformidade total com normas ABNT e Instruções Técnicas dos Corpos de Bombeiros.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-007',
    razao_social: 'J7s Sinalização e Segurança Ltda / iSinaliza',
    nome_fantasia: 'iSinaliza (J7s)',
    cnpj: '83.456.789/0001-23',
    endereco: 'Rua Dona Francisca, 8300 - Distrito Industrial',
    cidade: 'Joinville',
    estado: 'SC',
    pais: 'Brasil',
    telefone: '(47) 3451-9000',
    whatsapp: '(47) 99887-7665',
    email: 'sac@isinaliza.com',
    website: 'www.isinaliza.com',
    contato_comercial: 'Central de Atendimento e E-commerce iSinaliza',
    observacoes: 'Mais de 35 anos de mercado com fabricação própria em Santa Catarina. Garantia de 5 anos, sistema de acessibilidade ColorADD para daltônicos e conformidade NBR 16820.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-008',
    razao_social: 'Rota Sinalizações de Segurança Ltda',
    nome_fantasia: 'Rota Sinalizações',
    cnpj: '11.456.789/0001-44',
    endereco: 'Av. Rio Verde, Qd. 45 - Vila Rosa',
    cidade: 'Aparecida de Goiânia',
    estado: 'GO',
    pais: 'Brasil',
    telefone: '(62) 3280-4000',
    whatsapp: '(62) 98111-2233',
    email: 'comercial@rotasinalizacoes.com',
    website: 'www.rotasinalizacoes.com',
    contato_comercial: 'Departamento Comercial Centro-Oeste',
    observacoes: 'Especializada há mais de 15 anos em sinalização de emergência fotoluminescente e planos de fuga para edificações comerciais e industriais.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-009',
    razao_social: 'Athus Sinalizações Industriais Ltda',
    nome_fantasia: 'Athus Sinalizações',
    cnpj: '28.901.234/0001-67',
    endereco: 'Rodovia ES-010, km 8 - Civit II',
    cidade: 'Serra',
    estado: 'ES',
    pais: 'Brasil',
    telefone: '(27) 3338-7000',
    whatsapp: '(27) 99777-8899',
    email: 'vendas@athus.ind.br',
    website: 'www.athus.ind.br',
    contato_comercial: 'Equipe Técnica Athus',
    observacoes: 'Fabricante com certificação ABNT para placas de rota de fuga, equipamentos de combate a incêndio e placas marítimas.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-010',
    razao_social: 'Zeus do Brasil Indústria e Comércio Ltda',
    nome_fantasia: 'Zeus do Brasil',
    cnpj: '07.654.321/0001-88',
    endereco: 'Rua Bahia, 2400 - Salto',
    cidade: 'Blumenau',
    estado: 'SC',
    pais: 'Brasil',
    telefone: '(47) 3323-5500',
    whatsapp: '(47) 99222-3344',
    email: 'contato@zeusdobrasil.com.br',
    website: 'www.zeusdobrasil.com.br',
    contato_comercial: 'Vendas Técnicas Zeus',
    observacoes: 'Produz placas fotoluminescentes em PVC expandido de alta densidade e placas em alumínio com certificação IT CBM.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  },
  {
    id: 'FORN-011',
    razao_social: 'Luminstant Pigmentos Especiais do Brasil Ltda',
    nome_fantasia: 'Luminstant (Insumos)',
    cnpj: '14.567.890/0001-12',
    endereco: 'Rua George Eastman, 280 - Vila Tramontano',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    telefone: '(11) 3740-1500',
    whatsapp: '(11) 97429-4253',
    email: 'contato@luminstant.com.br',
    website: 'www.luminstant.com.br',
    contato_comercial: 'Eng. Químico / Vendas de Insumos',
    observacoes: 'Fornecedor e fabricante de pigmentos fotoluminescentes de alta pureza (aluminato de estrôncio dopado com terras raras Európio e Disprósio) que abastece as principais indústrias de placas.',
    status: 'ativo',
    ativo: true,
    moeda_padrao: 'BRL'
  }
];

export const DEFAULT_MANUFACTURERS: Manufacturer[] = [
  {
    id: 'FAB-001',
    nome: 'TAG Sinalização Indústria',
    cnpj: '03.686.682/0001-26',
    pais: 'Brasil',
    website: 'www.tagsinalizacao.com',
    observacoes: 'Produção industrial própria com laudos de luminância de até 3.000 minutos e certificação NBR 16820.'
  },
  {
    id: 'FAB-002',
    nome: 'Everlux Brasil (Grupo Ertecna)',
    cnpj: '04.819.522/0001-80',
    pais: 'Brasil / Portugal',
    website: 'br.everlux.com.br',
    observacoes: 'Certificação internacional Lloyd\'s Register e conformidade integral NBR 13434 / NBR 16820.'
  },
  {
    id: 'FAB-003',
    nome: 'Forthlux Indústria',
    cnpj: '15.987.654/0001-90',
    pais: 'Brasil',
    website: 'www.forthlux.com.br',
    observacoes: 'Fabricação própria em São Paulo com laudos de fotoluminescência emitidos por laboratórios credenciados.'
  },
  {
    id: 'FAB-004',
    nome: 'Sinalplast Indústria',
    cnpj: '52.148.963/0001-11',
    pais: 'Brasil',
    website: 'www.sinalplast.com.br'
  },
  {
    id: 'FAB-005',
    nome: 'J7s Indústria (iSinaliza)',
    cnpj: '83.456.789/0001-23',
    pais: 'Brasil',
    website: 'www.isinaliza.com'
  }
];

// Definition of all 63 signs base definitions for the database
interface SignBaseDef {
  code: string;
  name: string;
  cat: SymbolCategory;
  w: number;
  h: number;
  basePrice: number;
  material: string;
}

const ALL_63_SIGNS_BASE: SignBaseDef[] = [
  // A1 a A7 (Alerta)
  { code: 'A1', name: 'A1 - Alerta Geral / Perigo', cat: 'ALERTA', w: 200, h: 200, basePrice: 22.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'A2', name: 'A2 - Risco de Substâncias Inflamáveis', cat: 'ALERTA', w: 200, h: 200, basePrice: 22.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'A3', name: 'A3 - Risco de Explosão', cat: 'ALERTA', w: 200, h: 200, basePrice: 22.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'A4', name: 'A4 - Risco de Substâncias Corrosivas', cat: 'ALERTA', w: 200, h: 200, basePrice: 22.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'A5', name: 'A5 - Risco de Choque Elétrico', cat: 'ALERTA', w: 200, h: 200, basePrice: 22.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'A6', name: 'A6 - Risco de Radiação Ionizante', cat: 'ALERTA', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'A7', name: 'A7 - Risco de Substâncias Tóxicas', cat: 'ALERTA', w: 200, h: 200, basePrice: 22.00, material: 'PVC Fotoluminescente 2mm' },

  // C1 a C7 (Complementar / Direcional)
  { code: 'C1', name: 'C1 - Seta Direcional Esquerda (Retangular)', cat: 'COMPLEMENTAR', w: 300, h: 150, basePrice: 28.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'C2', name: 'C2 - Seta Direcional Direita (Quadrada)', cat: 'COMPLEMENTAR', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'C3', name: 'C3 - Seta Direcional Esquerda (Quadrada)', cat: 'COMPLEMENTAR', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'C4', name: 'C4 - Seta Diagonal Sup. Esquerda', cat: 'COMPLEMENTAR', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'C5', name: 'C5 - Seta Diagonal Sup. Direita', cat: 'COMPLEMENTAR', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'C6', name: 'C6 - Seta Diagonal Inf. Esquerda', cat: 'COMPLEMENTAR', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'C7', name: 'C7 - Seta Diagonal Inf. Direita', cat: 'COMPLEMENTAR', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },

  // E1 a E17 (Equipamentos)
  { code: 'E1', name: 'E1 - Alarme Sonoro de Incêndio', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E2', name: 'E2 - Botoeira / Acionador Manual de Alarme', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E3', name: 'E3 - Acionador Manual de Bomba', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E4', name: 'E4 - Telefone de Emergência', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E5', name: 'E5 - Extintor de Incêndio Universal', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E6', name: 'E6 - Extintor de Água Pressurizada (AP)', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E7', name: 'E7 - Extintor de Gás Carbônico (CO2)', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E8', name: 'E8 - Extintor de Pó Químico Seco (PQS)', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E9', name: 'E9 - Extintor de Pó Químico ABC', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E10', name: 'E10 - Mangotinho de Incêndio', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E11', name: 'E11 - Hidrante de Parede (Símbolo H)', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E12', name: 'E12 - Abrigo de Mangueira e Hidrante', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 28.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E13', name: 'E13 - Válvula de Controle de Sprinkler', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E14', name: 'E14 - Carreta Extintora Sobre Rodas', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 32.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E15', name: 'E15 - Manta Antifogo Abafadora', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E16', name: 'E16 - Espelho e Chave Storz', cat: 'EQUIPAMENTOS', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'E17', name: 'E17 - Demarcação de Solo 1x1m para Extintor', cat: 'EQUIPAMENTOS', w: 1000, h: 1000, basePrice: 85.00, material: 'Pintura Epóxi / Adesivo Solo Antiderrapante' },

  // M1 a M4 (Mensagens - Sinalização Complementar)
  { code: 'M1', name: 'M1 - Placa Completa de Sistemas da Edificação', cat: 'COMPLEMENTAR', w: 400, h: 300, basePrice: 68.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'M2', name: 'M2 - Placa de Lotação Máxima', cat: 'COMPLEMENTAR', w: 300, h: 200, basePrice: 34.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'M3', name: 'M3 - Placa Aperte e Empurre (Barra)', cat: 'COMPLEMENTAR', w: 300, h: 150, basePrice: 28.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'M4', name: 'M4 - Porta Corta-Fogo Mantenha Fechada', cat: 'COMPLEMENTAR', w: 300, h: 150, basePrice: 32.00, material: 'PVC Fotoluminescente 2mm' },

  // O1 e O2 (Obstáculos - Sinalização Complementar)
  { code: 'O1', name: 'O1 - Faixa Zebrada Amarelo e Preto', cat: 'COMPLEMENTAR', w: 1000, h: 100, basePrice: 32.00, material: 'Vinil Adesivo Resistente' },
  { code: 'O2', name: 'O2 - Faixa Zebrada Vermelho e Fotoluminescente', cat: 'COMPLEMENTAR', w: 1000, h: 100, basePrice: 36.00, material: 'Vinil Adesivo Fotoluminescente' },

  // P1 a P5 (Proibição)
  { code: 'P1', name: 'P1 - Proibido Fumar', cat: 'PROIBICAO', w: 200, h: 200, basePrice: 22.00, material: 'PVC Rígido 2mm' },
  { code: 'P2', name: 'P2 - Proibido Produzir Fogo ou Fagulha', cat: 'PROIBICAO', w: 200, h: 200, basePrice: 22.00, material: 'PVC Rígido 2mm' },
  { code: 'P3', name: 'P3 - Proibido Apagar com Água', cat: 'PROIBICAO', w: 200, h: 200, basePrice: 22.00, material: 'PVC Rígido 2mm' },
  { code: 'P4', name: 'P4 - Não Use Elevador em Incêndio', cat: 'PROIBICAO', w: 200, h: 200, basePrice: 24.00, material: 'PVC Rígido 2mm' },
  { code: 'P5', name: 'P5 - Proibido Obstruir Este Local', cat: 'PROIBICAO', w: 200, h: 200, basePrice: 24.00, material: 'PVC Rígido 2mm' },

  // S1 a S21 (Saída e Salvamento)
  { code: 'S1', name: 'S1 - Saída de Emergência Direita (Homem/Porta)', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S2', name: 'S2 - Saída de Emergência Esquerda (Homem/Porta)', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S3', name: 'S3 - Saída de Emergência Direita (Porta)', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S4', name: 'S4 - Saída de Emergência Esquerda (Porta)', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S5', name: 'S5 - Rota de Fuga Seta Direita', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S6', name: 'S6 - Rota de Fuga Seta Esquerda', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S7', name: 'S7 - Rota de Fuga Seta Superior (Frente)', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S8', name: 'S8 - Escada de Emergência Descendo Direita', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 28.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S9', name: 'S9 - Escada de Emergência Descendo Esquerda', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 28.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S10', name: 'S10 - Escada de Emergência Subindo Direita', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 28.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S11', name: 'S11 - Escada de Emergência Subindo Esquerda', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 28.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S12', name: 'S12 - Placa Indicativa SAÍDA', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S13', name: 'S13 - Placa SAÍDA com Seta Direita', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S14', name: 'S14 - Placa SAÍDA com Seta Esquerda', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S15', name: 'S15 - Rota Acessível para Cadeirante / PCD', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 28.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S16', name: 'S16 - Identificação de Pavimento (10º Pav.)', cat: 'ORIENTACAO_SALVAMENTO', w: 200, h: 200, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S17', name: 'S17 - Identificação de Pavimento (1º Subsolo)', cat: 'ORIENTACAO_SALVAMENTO', w: 200, h: 200, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S18', name: 'S18 - Saída Final de Emergência', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S19', name: 'S19 - Dispositivo de Abertura / Destravamento', cat: 'ORIENTACAO_SALVAMENTO', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S20', name: 'S20 - Quebre o Vidro em Emergência', cat: 'ORIENTACAO_SALVAMENTO', w: 200, h: 200, basePrice: 24.00, material: 'PVC Fotoluminescente 2mm' },
  { code: 'S21', name: 'S21 - Barra Antipânico Pressione', cat: 'ORIENTACAO_SALVAMENTO', w: 300, h: 150, basePrice: 26.00, material: 'PVC Fotoluminescente 2mm' }
];

// Specific supplier configurations: multipliers, SKU prefixes, and luminance specs
const SUPPLIER_CONFIGS: Record<string, { multiplier: number; prefix: string; fabId: string; lum: number; auto: number }> = {
  'FORN-001': { multiplier: 1.00, prefix: 'TAG', fabId: 'FAB-001', lum: 180, auto: 3000 },
  'FORN-002': { multiplier: 1.15, prefix: 'EVL', fabId: 'FAB-002', lum: 215, auto: 3000 },
  'FORN-003': { multiplier: 0.92, prefix: 'SNP', fabId: 'FAB-004', lum: 110, auto: 1800 },
  'FORN-004': { multiplier: 0.98, prefix: 'FTX', fabId: 'FAB-003', lum: 140, auto: 1800 },
  'FORN-005': { multiplier: 0.95, prefix: 'SIG', fabId: 'FAB-001', lum: 130, auto: 1800 },
  'FORN-006': { multiplier: 0.90, prefix: 'PSA', fabId: 'FAB-001', lum: 120, auto: 1800 },
  'FORN-007': { multiplier: 1.05, prefix: 'ISN', fabId: 'FAB-005', lum: 160, auto: 2400 },
  'FORN-008': { multiplier: 0.94, prefix: 'ROT', fabId: 'FAB-001', lum: 130, auto: 1800 },
  'FORN-009': { multiplier: 1.02, prefix: 'ATH', fabId: 'FAB-001', lum: 150, auto: 2000 },
  'FORN-010': { multiplier: 1.04, prefix: 'ZEU', fabId: 'FAB-001', lum: 155, auto: 2200 },
  'FORN-011': { multiplier: 1.10, prefix: 'LUM', fabId: 'FAB-002', lum: 300, auto: 3600 }
};

// Generate products database for all suppliers across all 63 signs
function generateAllProducts(): Product[] {
  const result: Product[] = [];

  for (const sup of DEFAULT_SUPPLIERS) {
    const config = SUPPLIER_CONFIGS[sup.id] || { multiplier: 1.0, prefix: 'GEN', fabId: 'FAB-001', lum: 140, auto: 1800 };

    for (const sign of ALL_63_SIGNS_BASE) {
      const calculatedPrice = parseFloat((sign.basePrice * config.multiplier).toFixed(2));
      result.push({
        id: `PROD-${sup.id}-${sign.code}`,
        codigo: `${config.prefix}-${sign.code}-${sign.w}x${sign.h}`,
        codigo_sku: `${config.prefix}-${sign.code}`,
        nome: sign.name,
        descricao: `Placa fotoluminescente ${sign.code} segundo ABNT NBR 13434 / NBR 16820 fornecida por ${sup.nome_fantasia}.`,
        categoria: sign.cat,
        fabricante_id: config.fabId,
        fornecedor_id: sup.id,
        unidade: 'un',
        modelo: `${sign.code} ${sign.w}x${sign.h} mm`,
        dimensoes: `${sign.w} x ${sign.h} mm`,
        largura: sign.w,
        altura: sign.h,
        autonomia_minutos: config.auto,
        luminancia_mcd: config.lum,
        espessura: '2,0 mm',
        material: sign.material,
        preco: calculatedPrice,
        preco_unitario: calculatedPrice,
        moeda: 'BRL',
        data_preco: '2026-03-01',
        validade_preco: '2026-12-31',
        observacoes: `Certificado de conformidade corpo de bombeiros IT-20. Fornecedor: ${sup.nome_fantasia}`,
        simbolo_associado_id: `SIG-${sign.code}`
      });
    }
  }

  return result;
}

export const DEFAULT_PRODUCTS: Product[] = generateAllProducts();

// Helper to look up unit price for a given sign code and supplier
export function getSupplierPriceForSymbol(
  supplierId: string,
  symbolCode: string,
  productsList: Product[] = DEFAULT_PRODUCTS
): number {
  const cleanCode = (symbolCode || '').toUpperCase().trim();
  const found = productsList.find(
    (p) => p.fornecedor_id === supplierId && (p.codigo_sku?.endsWith(cleanCode) || p.codigo?.includes(cleanCode))
  );
  if (found && found.preco_unitario) {
    return found.preco_unitario;
  }
  // Fallback to base price with multiplier
  const base = ALL_63_SIGNS_BASE.find((s) => s.code === cleanCode);
  if (base) {
    const config = SUPPLIER_CONFIGS[supplierId] || { multiplier: 1.0 };
    return parseFloat((base.basePrice * config.multiplier).toFixed(2));
  }
  return 25.00;
}
