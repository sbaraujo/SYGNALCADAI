import React, { useState } from 'react';
import { Project, SignSymbol, Supplier, PlacedSymbol, ProductItem } from '../types/cad';
import { SymbolGlyph } from './SymbolGlyph';
import { 
  FileSpreadsheet, Printer, Download, Filter, 
  Building2, DollarSign, Layers, PackageCheck, TrendingUp,
  Sparkles, CheckCircle2, ArrowRightLeft, ShieldAlert
} from 'lucide-react';
import { getSupplierPriceForSymbol, DEFAULT_PRODUCTS } from '../data/suppliersCatalog';

interface QuantitativosViewProps {
  project: Project;
  symbolsCatalog: SignSymbol[];
  suppliers: Supplier[];
  products?: ProductItem[];
  onUpdatePlacedSymbolPrice: (placedId: string, newPrice: number) => void;
  onUpdatePlacedSymbolSupplier: (placedId: string, supplierId: string) => void;
  onBatchUpdateSupplier?: (supplierId: string, floorId?: string) => void;
  onBatchOptimizeLowestPrice?: (floorId?: string) => void;
}

export const QuantitativosView: React.FC<QuantitativosViewProps> = ({
  project,
  symbolsCatalog,
  suppliers,
  products = DEFAULT_PRODUCTS,
  onUpdatePlacedSymbolPrice,
  onUpdatePlacedSymbolSupplier,
  onBatchUpdateSupplier,
  onBatchOptimizeLowestPrice
}) => {
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Collect all placed symbols across selected floor(s)
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

  // Group by symbol_id to aggregate quantities
  interface AggregatedItem {
    symbolId: string;
    symbolDef: SignSymbol;
    totalQuantity: number;
    unitPrice: number;
    totalPrice: number;
    floors: string[];
    supplierId: string;
    placedIds: string[];
  }

  const aggregatedMap = new Map<string, AggregatedItem>();

  allPlacedSymbols.forEach((sym) => {
    const symbolDef = symbolsCatalog.find((s) => s.id === sym.symbol_id);
    if (!symbolDef) return;

    if (!aggregatedMap.has(sym.symbol_id)) {
      aggregatedMap.set(sym.symbol_id, {
        symbolId: sym.symbol_id,
        symbolDef,
        totalQuantity: sym.quantity,
        unitPrice: sym.unit_price,
        totalPrice: sym.unit_price * sym.quantity,
        floors: [sym.floorName],
        supplierId: sym.supplier_id || 'FORN-001',
        placedIds: [sym.id]
      });
    } else {
      const item = aggregatedMap.get(sym.symbol_id)!;
      item.totalQuantity += sym.quantity;
      item.totalPrice += sym.unit_price * sym.quantity;
      if (!item.floors.includes(sym.floorName)) {
        item.floors.push(sym.floorName);
      }
      item.placedIds.push(sym.id);
    }
  });

  const aggregatedList = Array.from(aggregatedMap.values()).filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.symbolDef.nome.toLowerCase().includes(term) ||
      item.symbolDef.codigo_normativo.toLowerCase().includes(term) ||
      item.symbolDef.codigo_interno.toLowerCase().includes(term)
    );
  });

  // Totals calculations
  const totalItemsCount = aggregatedList.reduce((acc, i) => acc + i.totalQuantity, 0);
  const totalBudgetBRL = aggregatedList.reduce((acc, i) => acc + i.totalPrice, 0);
  const averagePriceBRL = totalItemsCount > 0 ? totalBudgetBRL / totalItemsCount : 0;

  // Show a temporary banner notification
  const triggerNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Código Normativo',
      'Código Interno',
      'Descrição da Placa',
      'Dimensões (mm)',
      'Categoria',
      'Pavimentos',
      'Fornecedor',
      'Quantidade',
      'Preço Unitário (R$)',
      'Subtotal (R$)'
    ];

    const rows = aggregatedList.map((i) => {
      const supplier = suppliers.find((s) => s.id === i.supplierId);
      return [
        `"${i.symbolDef.codigo_normativo}"`,
        `"${i.symbolDef.codigo_interno}"`,
        `"${i.symbolDef.nome}"`,
        `"${i.symbolDef.largura}x${i.symbolDef.altura}"`,
        `"${i.symbolDef.categoria}"`,
        `"${i.floors.join(', ')}"`,
        `"${supplier ? supplier.nome_fantasia : 'SYGMA'}"`,
        i.totalQuantity,
        i.unitPrice.toFixed(2).replace('.', ','),
        i.totalPrice.toFixed(2).replace('.', ',')
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quantitativo_Sinalizacao_${project.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto text-slate-100 flex flex-col">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Quadro Geral de Quantitativos & Cotação de Fornecedores
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Levantamento automatizado de placas fotoluminescentes locadas no projeto, com precificação unitária e associação a fornecedores homologados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Download className="w-4 h-4" /> Exportar CSV / Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold shadow transition"
          >
            <Printer className="w-4 h-4" /> Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total de Placas Locadas</span>
            <PackageCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {totalItemsCount} <span className="text-sm font-normal text-slate-400">unidades</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {aggregatedList.length} tipos de placas distintas
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Orçamento Total Estimado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            R$ {totalBudgetBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Base fornecedores homologados
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Custo Médio Unitário</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            R$ {averagePriceBRL.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Por placa fotoluminescente
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pavimentos Analisados</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {selectedFloorFilter === 'ALL' ? project.floors.length : 1}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {selectedFloorFilter === 'ALL' ? 'Todo o edifício' : 'Pavimento isolado'}
          </p>
        </div>
      </div>

      {/* Global Supplier Simulation & Quotation Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl mb-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Simulação Rápida de Cotação por Fornecedor:
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Atualiza todos os preços e fornecedores do projeto com 1 clique
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {suppliers.slice(0, 5).map((sup) => (
            <button
              key={sup.id}
              onClick={() => {
                if (onBatchUpdateSupplier) {
                  onBatchUpdateSupplier(sup.id, selectedFloorFilter);
                  triggerNotice(`Projeto recalculado com a tabela de preços de: ${sup.nome_fantasia}`);
                }
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:border-sky-500 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Cotar com {sup.nome_fantasia.split(' ')[0]}</span>
            </button>
          ))}

          {onBatchOptimizeLowestPrice && (
            <button
              onClick={() => {
                onBatchOptimizeLowestPrice(selectedFloorFilter);
                triggerNotice('Orçamento otimizado! Cada sinalização foi associada ao fornecedor com menor preço.');
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center gap-1.5 ml-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Otimizar para Menor Custo Global</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filtrar Pavimento:
          </span>
          <select
            value={selectedFloorFilter}
            onChange={(e) => setSelectedFloorFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">Todo o Edifício (Todos os Pavimentos)</option>
            {project.floors.map((fl) => (
              <option key={fl.id} value={fl.id}>
                {fl.name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Buscar por código (S1, E5) ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-72 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Quantitativos Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <th className="p-3 w-16 text-center">Placa</th>
                <th className="p-3">Código</th>
                <th className="p-3">Descrição Técnica</th>
                <th className="p-3">Dimensões</th>
                <th className="p-3">Pavimento(s)</th>
                <th className="p-3">Fornecedor Vinculado</th>
                <th className="p-3 text-center">Qtd</th>
                <th className="p-3 text-right">Preço Unit. (R$)</th>
                <th className="p-3 text-right">Subtotal (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {aggregatedList.map((item) => {
                return (
                  <tr key={item.symbolId} className="hover:bg-slate-800/40 transition">
                    {/* Visual Glyph */}
                    <td className="p-2 text-center">
                      <div className="w-10 h-10 mx-auto bg-slate-950 rounded p-1 border border-slate-800 flex items-center justify-center">
                        <SymbolGlyph symbol={item.symbolDef} width={34} height={34} />
                      </div>
                    </td>

                    {/* Codes */}
                    <td className="p-3 font-mono">
                      <span className="font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                        {item.symbolDef.codigo_normativo}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1">
                        {item.symbolDef.codigo_interno}
                      </span>
                    </td>

                    {/* Name & Standard */}
                    <td className="p-3">
                      <div className="font-bold text-white">{item.symbolDef.nome}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Norma: {item.symbolDef.norma_referencia || 'ABNT NBR 13434'}
                      </div>
                    </td>

                    {/* Dimensions */}
                    <td className="p-3 font-mono text-slate-300">
                      {item.symbolDef.largura} x {item.symbolDef.altura} mm
                    </td>

                    {/* Floors */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {item.floors.map((fName, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono"
                          >
                            {fName}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Supplier with Auto-Price Recalculation */}
                    <td className="p-3">
                      <select
                        value={item.supplierId}
                        onChange={(e) => {
                          const newSupId = e.target.value;
                          const newPrice = getSupplierPriceForSymbol(
                            newSupId,
                            item.symbolDef.codigo_normativo || item.symbolDef.codigo_interno,
                            products
                          );
                          item.placedIds.forEach((pid) => {
                            onUpdatePlacedSymbolSupplier(pid, newSupId);
                            onUpdatePlacedSymbolPrice(pid, newPrice);
                          });
                        }}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
                      >
                        {suppliers.map((sup) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.nome_fantasia} ({sup.cidade}/{sup.estado})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="p-3 text-center font-bold font-mono text-white text-sm">
                      {item.totalQuantity}
                    </td>

                    {/* Unit Price (R$) */}
                    <td className="p-3 text-right font-mono text-emerald-400">
                      <input
                        type="number"
                        step="0.50"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          item.placedIds.forEach((pid) => {
                            onUpdatePlacedSymbolPrice(pid, val);
                          });
                        }}
                        className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-emerald-400 font-semibold"
                      />
                    </td>

                    {/* Subtotal (R$) */}
                    <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      R$ {item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {aggregatedList.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Nenhuma placa de sinalização inserida no filtro selecionado. Use o editor CAD 2D para locar placas.
                  </td>
                </tr>
              )}
            </tbody>
            {aggregatedList.length > 0 && (
              <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-mono font-bold">
                <tr>
                  <td colSpan={6} className="p-4 text-right text-white uppercase text-xs">
                    Total Geral do Projeto:
                  </td>
                  <td className="p-4 text-center text-sky-400 text-base">
                    {totalItemsCount} un
                  </td>
                  <td className="p-4 text-right text-slate-400 text-xs">
                    Média: R$ {averagePriceBRL.toFixed(2)}
                  </td>
                  <td className="p-4 text-right text-emerald-400 text-lg font-extrabold">
                    R$ {totalBudgetBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
