import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Project, SignSymbol, Supplier, PlacedSymbol } from '../types/cad';
import { SymbolGlyph } from './SymbolGlyph';
import { 
  FileText, Printer, Download, Calculator, ShieldCheck, 
  Layers, Building2, CheckCircle2, DollarSign, Award, Check
} from 'lucide-react';

interface TechnicalReportViewProps {
  project: Project;
  symbolsCatalog: SignSymbol[];
  suppliers: Supplier[];
}

export const TechnicalReportView: React.FC<TechnicalReportViewProps> = ({
  project,
  symbolsCatalog,
  suppliers
}) => {
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('ALL');

  // Collect all placed symbols
  const allPlacedSymbols: (PlacedSymbol & { floorName: string })[] = [];
  project.floors.forEach((fl) => {
    if (selectedFloorFilter === 'ALL' || selectedFloorFilter === fl.id) {
      fl.placedSymbols.forEach((sym) => {
        allPlacedSymbols.push({
          ...sym,
          floorName: fl.name
        });
      });
    }
  });

  // Group by symbol_id
  interface GroupedItem {
    symbolId: string;
    def: SignSymbol;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    floors: string[];
  }

  const groupedMap = new Map<string, GroupedItem>();
  allPlacedSymbols.forEach((sym) => {
    const def = symbolsCatalog.find((s) => s.id === sym.symbol_id);
    if (!def) return;
    if (!groupedMap.has(def.id)) {
      groupedMap.set(def.id, {
        symbolId: def.id,
        def,
        quantity: sym.quantity,
        unitPrice: sym.unit_price,
        subtotal: sym.unit_price * sym.quantity,
        floors: [sym.floorName]
      });
    } else {
      const g = groupedMap.get(def.id)!;
      g.quantity += sym.quantity;
      g.subtotal += sym.unit_price * sym.quantity;
      if (!g.floors.includes(sym.floorName)) g.floors.push(sym.floorName);
    }
  });

  const materialsList = Array.from(groupedMap.values());
  const totalPlaques = materialsList.reduce((acc, i) => acc + i.quantity, 0);
  const totalMaterialsCost = materialsList.reduce((acc, i) => acc + i.subtotal, 0);

  // Additional budget calculations
  const costs = project.additionalCosts || {
    mao_de_obra_instalacao: 15,
    tipo_mao_de_obra: 'por_placa',
    valor_mao_de_obra_unitario: 8.5,
    fitas_parafusos_acessorios: 120,
    frete_transporte: 150,
    outros_custos: 80,
    bdi_percentual: 22,
    impostos_percentual: 8.65,
    desconto_valor: 0
  };

  const laborTotal =
    costs.tipo_mao_de_obra === 'por_placa'
      ? totalPlaques * (costs.valor_mao_de_obra_unitario || 8.5)
      : costs.mao_de_obra_instalacao || 0;

  const directCosts =
    totalMaterialsCost +
    laborTotal +
    (costs.fitas_parafusos_acessorios || 0) +
    (costs.frete_transporte || 0) +
    (costs.outros_custos || 0);

  const bdiValue = directCosts * ((costs.bdi_percentual || 0) / 100);
  const taxesValue = (directCosts + bdiValue) * ((costs.impostos_percentual || 0) / 100);
  const grandTotal = Math.max(0, directCosts + bdiValue + taxesValue - (costs.desconto_valor || 0));

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGeneratePdf = () => {
    try {
      setIsGeneratingPdf(true);
      setPdfFeedback(null);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Margins and dimensions
      const marginL = 14;
      const marginR = 196;
      let y = 16;

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(marginL, y, 182, 18, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(56, 189, 248); // sky-400
      doc.text('SIGNAFLUX CAD AI - SISTEMA DE ENGENHARIA DE SEGURANÇA', marginL + 4, y + 6);
      
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('MEMORIAL DESCRITIVO E DE CÁLCULO DE SINALIZAÇÃO', marginL + 4, y + 13);
      y += 24;

      // Project Meta Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(marginL, y, 182, 28, 'FD');

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('EMPREENDIMENTO:', marginL + 4, y + 6);
      doc.text('CLIENTE / PROPRIETÁRIO:', marginL + 4, y + 12);
      doc.text('ENDEREÇO / LOCAL:', marginL + 4, y + 18);
      doc.text('RESPONSÁVEL TÉCNICO:', marginL + 4, y + 24);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(project.empreendimento || 'Edifício Corporate Tower', marginL + 38, y + 6);
      doc.text(project.cliente || 'Condomínio Edifício Corporate Tower', marginL + 48, y + 12);
      doc.text(`${project.endereco || 'Av. Paulista'}, ${project.cidade || 'SP'} - ${project.estado || 'SP'}`, marginL + 38, y + 18);
      doc.text(`${project.responsavel_tecnico || 'Eng. Responsável'} (${project.crea_cau || 'CREA-SP'} / ${project.art_rrt || 'ART'})`, marginL + 44, y + 24);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`DOC N°: ${project.numero_projeto || 'SMS-2026/01'}`, marginR - 38, y + 6);
      doc.text(`DATA: ${project.data || new Date().toLocaleDateString('pt-BR')}`, marginR - 38, y + 12);
      doc.text(`REV: ${project.revisao || 'REV 01'}`, marginR - 38, y + 18);
      doc.text('STATUS: APROVADO', marginR - 38, y + 24);
      y += 34;

      // 1. ESPECIFICAÇÕES TÉCNICAS E NORMAS
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('1. ESPECIFICAÇÕES TÉCNICAS E NORMAS DE REFERÊNCIA', marginL, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const normText = 'Projeto elaborado em conformidade com ABNT NBR 13434 (Partes 1, 2 e 3), ABNT NBR 16820 e Instruções Técnicas dos Corpos de Bombeiros Militares. As placas são fabricadas em PVC rígido auto-extinguível 2,0mm com pigmentos fotoluminescentes Classe 140/20-1800-K-W de alta performance.';
      const splitNorm = doc.splitTextToSize(normText, 182);
      doc.text(splitNorm, marginL, y);
      y += splitNorm.length * 4 + 4;

      // 2. MEMORIAL DE CÁLCULO DE VISIBILIDADE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('2. MEMORIAL DE CÁLCULO DE VISIBILIDADE E DISTÂNCIAS (NBR 13434-2)', marginL, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Fórmula de visualização: d <= sqrt(A / k)  [k = 0,0005 | d = distância em metros | A = área da placa em m²]', marginL, y);
      y += 4;
      doc.text('- Placas 250 x 150 mm (Rotas S1/S2): d <= 8,66 m | Altura de fixação: 1,80 a 2,20 m do piso', marginL + 2, y);
      y += 4;
      doc.text('- Placas 200 x 200 mm (Extintores E5/E8): d <= 8,94 m | Altura de fixação: 1,60 m do piso', marginL + 2, y);
      y += 4;
      doc.text('- Placas 150 x 150 mm (Alarmes/Botoeiras E2): d <= 6,70 m | Altura de fixação: 1,20 a 1,50 m', marginL + 2, y);
      y += 8;

      // 3. LISTA CONSOLIDADA DE MATERIAIS
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`3. LISTA CONSOLIDADA DE MATERIAIS (TOTAL: ${totalPlaques} PLACAS)`, marginL, y);
      y += 5;

      // Table Header
      doc.setFillColor(226, 232, 240);
      doc.rect(marginL, y, 182, 6, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('CÓDIGO', marginL + 2, y + 4.2);
      doc.text('DESCRIÇÃO DA PLACA (NBR 13434)', marginL + 24, y + 4.2);
      doc.text('DIMENSÕES', marginL + 104, y + 4.2);
      doc.text('QTD', marginL + 130, y + 4.2);
      doc.text('UNITÁRIO', marginL + 146, y + 4.2);
      doc.text('SUBTOTAL', marginL + 166, y + 4.2);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      if (materialsList.length === 0) {
        doc.setTextColor(148, 163, 184);
        doc.text('Nenhum símbolo alocado ainda na planta. Adicione placas no CAD para quantitativo.', marginL + 2, y + 5);
        y += 8;
      } else {
        materialsList.slice(0, 14).forEach((item, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(marginL, y, 182, 5.5, 'F');
          }
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.text(item.def.codigo_normativo || item.symbolId, marginL + 2, y + 4);
          doc.setFont('helvetica', 'normal');
          const desc = item.def.nome.length > 45 ? item.def.nome.substring(0, 42) + '...' : item.def.nome;
          doc.text(desc, marginL + 24, y + 4);
          doc.text(`${item.def.largura}x${item.def.altura} mm`, marginL + 104, y + 4);
          doc.text(String(item.quantity), marginL + 133, y + 4);
          doc.text(`R$ ${item.unitPrice.toFixed(2)}`, marginL + 146, y + 4);
          doc.setFont('helvetica', 'bold');
          doc.text(`R$ ${item.subtotal.toFixed(2)}`, marginL + 166, y + 4);
          y += 5.5;
        });

        // Subtotal row
        doc.setFillColor(241, 245, 249);
        doc.rect(marginL, y, 182, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('SUBTOTAL MATERIAIS FOTOLUMINESCENTES:', marginL + 2, y + 4.2);
        doc.text(`${totalPlaques} un`, marginL + 132, y + 4.2);
        doc.setTextColor(22, 101, 52);
        doc.text(`R$ ${totalMaterialsCost.toFixed(2)}`, marginL + 164, y + 4.2);
        y += 9;
      }

      // 4. RESUMO ORÇAMENTÁRIO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('4. CONSOLIDAÇÃO ORÇAMENTÁRIA DO PROJETO', marginL, y);
      y += 5;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(marginL, y, 182, 24, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`- Materiais Fotoluminescentes: R$ ${totalMaterialsCost.toFixed(2)}`, marginL + 4, y + 5);
      doc.text(`- Mão de Obra de Instalação: R$ ${laborTotal.toFixed(2)}`, marginL + 4, y + 10);
      doc.text(`- Acessórios de Fixação: R$ ${(costs.fitas_parafusos_acessorios || 0).toFixed(2)}`, marginL + 4, y + 15);
      doc.text(`- Frete e Logística: R$ ${(costs.frete_transporte || 0).toFixed(2)}`, marginL + 4, y + 20);

      doc.text(`- BDI (${costs.bdi_percentual || 0}%): R$ ${bdiValue.toFixed(2)}`, marginL + 95, y + 5);
      doc.text(`- Impostos Incidentes (${costs.impostos_percentual || 0}%): R$ ${taxesValue.toFixed(2)}`, marginL + 95, y + 10);
      doc.text(`- Desconto: - R$ ${(costs.desconto_valor || 0).toFixed(2)}`, marginL + 95, y + 15);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(22, 101, 52);
      doc.text(`VALOR TOTAL: R$ ${grandTotal.toFixed(2)}`, marginL + 95, y + 21);
      y += 28;

      // 5. ASSINATURAS
      doc.setDrawColor(100, 116, 139);
      doc.line(marginL + 8, y + 12, marginL + 76, y + 12);
      doc.line(marginL + 106, y + 12, marginL + 174, y + 12);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(project.responsavel_tecnico || 'Eng. Responsável', marginL + 18, y + 16);
      doc.text(project.cliente || 'Proprietário / Representante', marginL + 116, y + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${project.crea_cau || 'CREA'} | ${project.art_rrt || 'ART'}`, marginL + 22, y + 20);
      doc.text('Responsável pela Edificação', marginL + 124, y + 20);

      // Save PDF directly to user's device
      const fileName = `${project.codigo || 'PRJ-2026'}_Memorial_Descritivo_Sinalizacao.pdf`;
      doc.save(fileName);
      setPdfFeedback({ type: 'success', message: `Relatório Técnico "${fileName}" baixado com sucesso!` });
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      setPdfFeedback({ type: 'error', message: `Erro ao gerar PDF: ${err.message || err}` });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto font-sans print:p-0 print:bg-white print:text-black">
      {/* Toast Feedback */}
      {pdfFeedback && (
        <div
          className={`mb-4 p-3 rounded-xl border flex items-center justify-between text-xs font-semibold print:hidden animate-in fade-in slide-in-from-top-2 ${
            pdfFeedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
              : 'bg-red-950/90 border-red-600 text-red-200'
          }`}
        >
          <span>{pdfFeedback.message}</span>
          <button
            onClick={() => setPdfFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header / Actions (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-extrabold text-white">
              Memorial Descritivo e de Cálculo (NBR 13434 / NBR 16820)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Documentação técnica executiva consolidada para submissão e aprovação junto ao Corpo de Bombeiros Militar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="w-4 h-4 text-emerald-400" /> Pavimento:
            <select
              value={selectedFloorFilter}
              onChange={(e) => setSelectedFloorFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="ALL">Todos os Pavimentos (Consolidado)</option>
              {project.floors.map((fl) => (
                <option key={fl.id} value={fl.id}>
                  {fl.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar Relatório em PDF (.pdf)'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Printer className="w-4 h-4" /> Imprimir A4
          </button>
        </div>
      </div>

      {/* A4 Technical Document Container */}
      <div className="max-w-4xl mx-auto my-6 bg-white text-slate-900 border border-slate-300 rounded-xl shadow-2xl p-8 print:border-none print:shadow-none print:m-0 print:p-6">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 block font-bold">
              SIGNAFLUX CAD ENGINE • LAUDO TÉCNICO EXECUTIVO
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              MEMORIAL DESCRITIVO E DE CÁLCULO DE SINALIZAÇÃO
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Segurança Contra Incêndio e Pânico em Edificações
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-600">
            <div>Documento N°: <strong>{project.numero_projeto || 'SMS-2026/01'}</strong></div>
            <div>Data: <strong>{project.data}</strong> | Rev: <strong>{project.revisao}</strong></div>
            <div>Status: <span className="text-emerald-700 font-bold">APROVADO</span></div>
          </div>
        </div>

        {/* 1. DADOS DO EMPREENDIMENTO E RESPONSÁVEIS */}
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-sky-700" /> 1. IDENTIFICAÇÃO DO PROJETO E EMPREENDIMENTO
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div><span className="text-slate-500">Empreendimento:</span> <strong>{project.empreendimento}</strong></div>
            <div><span className="text-slate-500">Cliente / Proprietário:</span> <strong>{project.cliente}</strong></div>
            <div><span className="text-slate-500">Localização:</span> <strong>{project.endereco}, {project.cidade} - {project.estado}</strong></div>
            <div><span className="text-slate-500">Pavimentos Cadastrados:</span> <strong>{project.floors.length} pavimentos</strong></div>
            <div><span className="text-slate-500">Responsável Técnico:</span> <strong>{project.responsavel_tecnico}</strong></div>
            <div><span className="text-slate-500">Registro Profissional:</span> <strong>{project.crea_cau}</strong></div>
            <div><span className="text-slate-500">ART / RRT de Projeto:</span> <strong>{project.art_rrt}</strong></div>
            <div><span className="text-slate-500">Empresa Projetista:</span> <strong>{project.empresa || 'Sygma SMS Fire Engineering'}</strong></div>
          </div>
        </section>

        {/* 2. BASE NORMATIVA E ESPECIFICAÇÃO DE MATERIAIS */}
        <section className="mb-6 text-xs leading-relaxed text-slate-700">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> 2. ESPECIFICAÇÕES TÉCNICAS E NORMAS DE REFERÊNCIA
          </h2>
          <p className="mb-2">
            Este projeto foi desenvolvido em estrita conformidade com as diretrizes das normas brasileiras 
            <strong> ABNT NBR 13434 (Partes 1, 2 e 3)</strong>, <strong>ABNT NBR 16820</strong>, 
            e Instruções Técnicas correlatas dos Corpos de Bombeiros Militares estaduais.
          </p>
          <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
            <li><strong>Material Base:</strong> Placas em PVC rígido auto-extinguível espessura mínima de 2,0 mm, não propagante de chama.</li>
            <li><strong>Desempenho Fotoluminescente:</strong> Nível normativo <strong>140/20 - 1800 - K - W</strong> (luminância mínima de 140 mcd/m² aos 10 min e 20 mcd/m² aos 60 min, autonomia superior a 1.800 minutos).</li>
            <li><strong>Cores de Segurança:</strong> Verde Segurança (Munsell 2.5G 3/4), Vermelho Segurança (Munsell 5R 4/14), e Amarelo Advertência (Munsell 5Y 8/12).</li>
          </ul>
        </section>

        {/* 3. MEMORIAL DE CÁLCULO DE VISIBILIDADE E ALTURAS */}
        <section className="mb-6 text-xs leading-relaxed text-slate-700">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-amber-700" /> 3. MEMORIAL DE CÁLCULO DE VISIBILIDADE E DISTÂNCIAS (NBR 13434-2)
          </h2>
          <div className="p-3 bg-amber-50/60 rounded border border-amber-200 text-[11px] mb-3">
            <p className="font-semibold text-amber-950 mb-1">
              Fórmula Normativa de Distância Máxima de Observação:
            </p>
            <div className="font-mono text-xs text-amber-900 bg-white p-2 rounded border border-amber-300 inline-block">
              d ≤ √(A / k) &nbsp;|&nbsp; Onde: d = distância de visualização (m), A = área da placa (m²), k = constante dimensional (0,0005)
            </div>
          </div>

          <table className="w-full text-[11px] border border-slate-300 mb-3">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 text-left">Dimensão da Placa</th>
                <th className="p-2 text-center">Área (m²)</th>
                <th className="p-2 text-center">Distância Máx. (d)</th>
                <th className="p-2 text-left">Altura de Fixação Normativa</th>
                <th className="p-2 text-left">Aplicação Típica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 font-mono font-bold">250 x 150 mm</td>
                <td className="p-2 text-center font-mono">0,0375 m²</td>
                <td className="p-2 text-center font-mono font-bold text-emerald-700">8,66 metros</td>
                <td className="p-2">1,80 m a 2,20 m do piso</td>
                <td className="p-2">Rotas de Fuga e Saídas (S1, S2, S3)</td>
              </tr>
              <tr>
                <td className="p-2 font-mono font-bold">300 x 150 mm</td>
                <td className="p-2 text-center font-mono">0,0450 m²</td>
                <td className="p-2 text-center font-mono font-bold text-emerald-700">9,48 metros</td>
                <td className="p-2">1,80 m a 2,20 m do piso</td>
                <td className="p-2">Mensagens e Saídas Amplas (S13, S14)</td>
              </tr>
              <tr>
                <td className="p-2 font-mono font-bold">200 x 200 mm</td>
                <td className="p-2 text-center font-mono">0,0400 m²</td>
                <td className="p-2 text-center font-mono font-bold text-emerald-700">8,94 metros</td>
                <td className="p-2">1,60 m do piso (acima do suporte)</td>
                <td className="p-2">Extintores e Hidrantes (E5, E8)</td>
              </tr>
              <tr>
                <td className="p-2 font-mono font-bold">150 x 150 mm</td>
                <td className="p-2 text-center font-mono">0,0225 m²</td>
                <td className="p-2 text-center font-mono font-bold text-emerald-700">6,70 metros</td>
                <td className="p-2">1,20 m a 1,50 m do piso</td>
                <td className="p-2">Botoeiras e Alarmes Manuais (E2, A1)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 4. LISTA DE MATERIAIS CONSOLIDADA */}
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-sky-700" /> 4. LISTA CONSOLIDADA DE MATERIAIS (BILL OF MATERIALS)</span>
            <span className="text-[10px] font-mono text-slate-500 font-normal">Total: {totalPlaques} placas alocadas</span>
          </h2>
          <table className="w-full text-[11px] border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 text-center w-12">Símbolo</th>
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">Descrição da Placa</th>
                <th className="p-2 text-center">Dimensões</th>
                <th className="p-2 text-center">Qtd.</th>
                <th className="p-2 text-right">Unitário (R$)</th>
                <th className="p-2 text-right">Subtotal (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {materialsList.map((item) => (
                <tr key={item.symbolId}>
                  <td className="p-1 text-center">
                    <div className="w-8 h-8 mx-auto flex items-center justify-center">
                      <SymbolGlyph symbol={item.def} width={26} height={26} />
                    </div>
                  </td>
                  <td className="p-2 font-mono font-bold text-slate-900">{item.def.codigo_normativo}</td>
                  <td className="p-2">
                    <div className="font-semibold text-slate-900">{item.def.nome}</div>
                    <div className="text-[10px] text-slate-500">Pavimentos: {item.floors.join(', ')}</div>
                  </td>
                  <td className="p-2 text-center font-mono">{item.def.largura}x{item.def.altura}mm</td>
                  <td className="p-2 text-center font-mono font-bold bg-slate-50">{item.quantity}</td>
                  <td className="p-2 text-right font-mono">R$ {item.unitPrice.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">R$ {item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-xs">
              <tr>
                <td colSpan={4} className="p-2 text-right uppercase">Subtotal dos Materiais:</td>
                <td className="p-2 text-center font-mono">{totalPlaques} un</td>
                <td colSpan={2} className="p-2 text-right font-mono text-emerald-800">
                  R$ {totalMaterialsCost.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* 5. RESUMO ORÇAMENTÁRIO DO PROJETO */}
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-700" /> 5. CONSOLIDAÇÃO ORÇAMENTÁRIA DO PROJETO
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="space-y-1.5 border-r border-slate-200 pr-3">
              <div className="flex justify-between"><span>Materiais Fotoluminescentes:</span> <strong className="font-mono">R$ {totalMaterialsCost.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Mão de Obra de Instalação:</span> <strong className="font-mono">R$ {laborTotal.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Acessórios de Fixação / Fitas Dupla-Face:</span> <strong className="font-mono">R$ {(costs.fitas_parafusos_acessorios || 0).toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Frete e Logística:</span> <strong className="font-mono">R$ {(costs.frete_transporte || 0).toFixed(2)}</strong></div>
            </div>
            <div className="space-y-1.5 pl-2">
              <div className="flex justify-between"><span>BDI ({costs.bdi_percentual || 0}%):</span> <strong className="font-mono">R$ {bdiValue.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Impostos Incidentes ({costs.impostos_percentual || 0}%):</span> <strong className="font-mono">R$ {taxesValue.toFixed(2)}</strong></div>
              <div className="flex justify-between text-rose-700"><span>Desconto Concedido:</span> <strong className="font-mono">- R$ {(costs.desconto_valor || 0).toFixed(2)}</strong></div>
              <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-sm text-emerald-800">
                <span>VALOR TOTAL DO PROJETO:</span>
                <span className="font-mono">R$ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. QUADRO DE ASSINATURAS E APROVAÇÃO */}
        <section className="pt-8 border-t-2 border-slate-800 mt-8 text-xs">
          <div className="grid grid-cols-2 gap-12 text-center">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
                {project.responsavel_tecnico}
              </div>
              <div className="text-[11px] text-slate-600">Responsável Técnico pelo Projeto</div>
              <div className="text-[10px] font-mono text-slate-500">{project.crea_cau} • {project.art_rrt}</div>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
                {project.cliente}
              </div>
              <div className="text-[11px] text-slate-600">Proprietário / Representante Legal</div>
              <div className="text-[10px] text-slate-500">{project.empreendimento}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
