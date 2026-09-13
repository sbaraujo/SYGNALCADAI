import React, { useState } from 'react';
import { SignSymbol, SymbolCategory, Supplier, ProductItem } from '../types/cad';
import { SymbolGlyph } from './SymbolGlyph';
import { 
  Search, Plus, Upload, Filter, Check, 
  ArrowRight, Shield, Layers, Tag, DollarSign, X,
  Building2, Award, Phone, Mail, MapPin, Eye, 
  TrendingDown, Table, LayoutGrid, CheckCircle2, ChevronRight, Info
} from 'lucide-react';
import { SYMBOL_CATEGORIES_INFO } from '../data/symbolsCatalog';
import { DEFAULT_SUPPLIERS, DEFAULT_PRODUCTS, getSupplierPriceForSymbol } from '../data/suppliersCatalog';

interface LibraryViewProps {
  symbols: SignSymbol[];
  suppliers?: Supplier[];
  products?: ProductItem[];
  onInsertSymbolToCAD: (symbolId: string, supplierId?: string, unitPrice?: number) => void;
  onAddCustomSymbol: (symbol: SignSymbol) => void;
  onUpdateSymbol: (symbol: SignSymbol) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  symbols,
  suppliers = DEFAULT_SUPPLIERS,
  products = DEFAULT_PRODUCTS,
  onInsertSymbolToCAD,
  onAddCustomSymbol,
  onUpdateSymbol,
  isModal = false,
  onCloseModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SymbolCategory | 'ALL'>('ALL');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('FORN-001'); // TAG by default or 'ALL'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modals & Details
  const [comparingSymbol, setComparingSymbol] = useState<SignSymbol | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSymbolForEdit, setSelectedSymbolForEdit] = useState<SignSymbol | null>(null);

  // New Custom Symbol Form State
  const [newSymbolName, setNewSymbolName] = useState('');
  const [newSymbolCode, setNewSymbolCode] = useState('');
  const [newSymbolCategory, setNewSymbolCategory] = useState<SymbolCategory>('ORIENTACAO_SALVAMENTO');
  const [newSymbolWidth, setNewSymbolWidth] = useState(250);
  const [newSymbolHeight, setNewSymbolHeight] = useState(150);
  const [newSymbolPrice, setNewSymbolPrice] = useState(24.00);
  const [newSymbolSupplierId, setNewSymbolSupplierId] = useState<string>('FORN-001');
  const [newSymbolFileUrl, setNewSymbolFileUrl] = useState<string | null>(null);

  // Active supplier object
  const activeSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  // Filtered symbols list
  const filteredSymbols = symbols.filter((sym) => {
    const matchesCategory = selectedCategory === 'ALL' || sym.categoria === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      sym.nome.toLowerCase().includes(term) ||
      sym.codigo_normativo.toLowerCase().includes(term) ||
      sym.codigo_interno.toLowerCase().includes(term) ||
      sym.tags.some((t) => t.toLowerCase().includes(term));
    return matchesCategory && matchesSearch;
  });

  // Calculate price helper for a symbol given current supplier selection
  const getSymbolPrice = (symbol: SignSymbol, supId: string = selectedSupplierId): number => {
    if (supId === 'ALL') {
      return symbol.preco_padrao || 25.00;
    }
    return getSupplierPriceForSymbol(supId, symbol.codigo_normativo || symbol.codigo_interno, products);
  };

  // Get price comparison stats for a symbol across all suppliers
  const getSymbolComparisonStats = (symbol: SignSymbol) => {
    const prices = suppliers.map((s) => ({
      supplier: s,
      price: getSupplierPriceForSymbol(s.id, symbol.codigo_normativo || symbol.codigo_interno, products)
    }));
    prices.sort((a, b) => a.price - b.price);
    const min = prices[0];
    const max = prices[prices.length - 1];
    const avg = prices.reduce((acc, p) => acc + p.price, 0) / prices.length;
    return { list: prices, min, max, avg };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNewSymbolFileUrl(dataUrl);
      if (!newSymbolName) {
        setNewSymbolName(file.name.replace(/\.[^/.]+$/, '').toUpperCase());
      }
      if (!newSymbolCode) {
        setNewSymbolCode(`SIG-${Math.floor(100 + Math.random() * 900)}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbolName) return;

    const newSym: SignSymbol = {
      id: `SIG-USR-${Date.now()}`,
      codigo_interno: newSymbolCode || `SIG-${Math.floor(100 + Math.random() * 900)}`,
      codigo_normativo: newSymbolCode || 'USR',
      nome: newSymbolName,
      categoria: newSymbolCategory,
      descricao: `Símbolo fotoluminescente importado pelo usuário (${newSymbolWidth}x${newSymbolHeight}mm).`,
      tags: [newSymbolName.toLowerCase(), 'custom', 'nbr13434'],
      largura: newSymbolWidth,
      altura: newSymbolHeight,
      unidade: 'mm',
      fornecedor_id: newSymbolSupplierId,
      preco_padrao: newSymbolPrice,
      moeda: 'BRL',
      norma_referencia: 'ABNT NBR 13434 / NBR 16820',
      ativo: true,
      forma_geometrica: 'retangular',
      cor_fundo: '#15803d',
      cor_simbolo: '#dcfce7',
      svgContent: newSymbolFileUrl || undefined
    };

    onAddCustomSymbol(newSym);
    setShowImportModal(false);
    setNewSymbolFileUrl(null);
    setNewSymbolName('');
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950 text-slate-100 ${isModal ? 'p-6 max-h-[88vh]' : 'p-6 flex-1 overflow-y-auto'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight font-sans">
              Biblioteca de Sinalização Fotoluminescente & Banco de Fornecedores
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conforme <strong>ABNT NBR 13434 (Partes 1, 2 e 3)</strong>, <strong>NBR 16820</strong> e <strong>IT-20 CBMESP</strong>. Cada símbolo está vinculado a <strong>fornecedores homologados e preços em Reais (R$)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                viewMode === 'grid' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Galeria
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                viewMode === 'table' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Matriz de Preços
            </button>
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold shadow transition"
          >
            <Upload className="w-4 h-4 text-emerald-400" /> Importar Símbolo
          </button>

          {isModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Supplier Selection & Active Price Bar */}
      <div className="mt-4 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Fornecedor / Tabela de Preços:
            </label>
          </div>

          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:border-sky-500 focus:outline-none min-w-[280px]"
          >
            <option value="ALL">🔍 Comparativo Geral (Preço Base NBR 13434)</option>
            {suppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>
                🏢 {sup.nome_fantasia} ({sup.cidade}/{sup.estado}) - CNPJ {sup.cnpj}
              </option>
            ))}
          </select>
        </div>

        {activeSupplier && selectedSupplierId !== 'ALL' && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 font-sans">
            <span className="bg-sky-950/80 text-sky-400 border border-sky-800/80 px-2 py-0.5 rounded font-mono">
              CNPJ: {activeSupplier.cnpj}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-slate-500" /> {activeSupplier.cidade}/{activeSupplier.estado}
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Phone className="w-3 h-3" /> {activeSupplier.telefone}
            </span>
            <span className="text-amber-400/90 font-mono">
              ★ NBR 16820 / IT-20
            </span>
          </div>
        )}
      </div>

      {/* Search & Category Filter Pills */}
      <div className="py-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Pesquisar por código (S1, S5, E5, P1, A1), nome ou equipamento (extintor, hidrante, alarme, rota, escada)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <span className="text-xs text-slate-400 font-mono shrink-0">
            {filteredSymbols.length} placas cadastradas
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full font-medium transition shrink-0 ${
              selectedCategory === 'ALL' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Todas ({symbols.length})
          </button>
          {SYMBOL_CATEGORIES_INFO.map((cat) => {
            if (cat.id === 'ALL') return null;
            const count = symbols.filter((s) => s.categoria === cat.id).length;
            if (count === 0) return null;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as SymbolCategory)}
                className={`px-3 py-1.5 rounded-full font-medium transition shrink-0 flex items-center gap-1.5 ${
                  isSelected ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>{cat.name.split('(')[0].trim()}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE: VISUAL GRID */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex-1 overflow-y-auto pr-1">
          {filteredSymbols.map((symbol) => {
            const currentPrice = getSymbolPrice(symbol);
            const stats = getSymbolComparisonStats(symbol);
            const displaySupplier = activeSupplier ? activeSupplier.nome_fantasia : 'Tabela Média NBR';

            return (
              <div
                key={symbol.id}
                id={`library-card-${symbol.id}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('symbol_id', symbol.id);
                  e.dataTransfer.setData('supplier_id', selectedSupplierId !== 'ALL' ? selectedSupplierId : 'FORN-001');
                  e.dataTransfer.setData('unit_price', currentPrice.toString());
                }}
                className="group bg-slate-900/85 hover:bg-slate-900 border border-slate-800/90 hover:border-sky-500/60 rounded-xl p-3.5 flex flex-col justify-between shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing"
              >
                <div>
                  {/* Card Header: Code & Category Badge */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/80">
                      {symbol.codigo_normativo}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {symbol.codigo_interno}
                    </span>
                  </div>

                  {/* Graphic Preview */}
                  <div className="w-full h-32 bg-slate-950/90 rounded-lg border border-slate-800/80 flex items-center justify-center p-2 mb-2.5 group-hover:scale-[1.02] transition-transform">
                    <SymbolGlyph
                      symbol={symbol}
                      width={96}
                      height={96}
                      className="max-h-full max-w-full drop-shadow-md"
                    />
                  </div>

                  {/* Title & Dimension */}
                  <h4 className="font-bold text-white text-xs line-clamp-2 min-h-[32px]">
                    {symbol.nome}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Dimensões: {symbol.largura} x {symbol.altura} mm
                  </p>

                  {/* Supplier Info & Unit Price in Brazilian Reais (R$) */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate max-w-[120px] flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">{displaySupplier}</span>
                      </span>
                      <span className="font-mono font-extrabold text-emerald-400 text-sm">
                        R$ {currentPrice.toFixed(2)}
                      </span>
                    </div>

                    {selectedSupplierId === 'ALL' ? (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Menor: R$ {stats.min.price.toFixed(2)}</span>
                        <span>Maior: R$ {stats.max.price.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Fotolum.: 180 mcd/m²</span>
                        <span>PVC 2mm</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions: Insert into CAD & Compare Suppliers */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const targetSupplier = selectedSupplierId !== 'ALL' ? selectedSupplierId : 'FORN-001';
                        onInsertSymbolToCAD(symbol.id, targetSupplier, currentPrice);
                        if (isModal && onCloseModal) onCloseModal();
                      }}
                      className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Inserir no CAD
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSymbolForEdit(symbol)}
                      title="Editar informações"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                    >
                      Editar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setComparingSymbol(symbol)}
                    className="w-full py-1 bg-slate-950 hover:bg-slate-800/90 border border-slate-800 text-slate-300 hover:text-sky-400 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition"
                  >
                    <Building2 className="w-3 h-3 text-sky-400" /> Comparar 11 Fornecedores
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE: PRICING MATRIX TABLE */}
      {viewMode === 'table' && (
        <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 z-10 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-3 w-14 text-center">Placa</th>
                <th className="p-3 w-20">Código</th>
                <th className="p-3">Descrição Normativa</th>
                <th className="p-3 w-24">Dimensões</th>
                <th className="p-3 text-right text-sky-400 font-bold">TAG Sinal. (SP)</th>
                <th className="p-3 text-right text-emerald-400 font-bold">Everlux Brasil</th>
                <th className="p-3 text-right text-slate-300">Sinalplast</th>
                <th className="p-3 text-right text-slate-300">Forthlux</th>
                <th className="p-3 text-right text-slate-300">Sigma</th>
                <th className="p-3 text-right text-amber-400 font-bold">Menor Preço</th>
                <th className="p-3 text-center w-28">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
              {filteredSymbols.map((symbol) => {
                const tagPrice = getSupplierPriceForSymbol('FORN-001', symbol.codigo_normativo || symbol.codigo_interno, products);
                const everluxPrice = getSupplierPriceForSymbol('FORN-002', symbol.codigo_normativo || symbol.codigo_interno, products);
                const sinalplastPrice = getSupplierPriceForSymbol('FORN-003', symbol.codigo_normativo || symbol.codigo_interno, products);
                const forthluxPrice = getSupplierPriceForSymbol('FORN-004', symbol.codigo_normativo || symbol.codigo_interno, products);
                const sigmaPrice = getSupplierPriceForSymbol('FORN-005', symbol.codigo_normativo || symbol.codigo_interno, products);
                const stats = getSymbolComparisonStats(symbol);

                return (
                  <tr key={symbol.id} className="hover:bg-slate-800/60 transition">
                    <td className="p-2 text-center">
                      <div className="w-9 h-9 mx-auto bg-slate-950 rounded p-1 border border-slate-800 flex items-center justify-center">
                        <SymbolGlyph symbol={symbol} width={30} height={30} />
                      </div>
                    </td>
                    <td className="p-3 font-bold text-sky-400">{symbol.codigo_normativo}</td>
                    <td className="p-3 font-sans font-medium text-white max-w-xs truncate">{symbol.nome}</td>
                    <td className="p-3 text-slate-400">{symbol.largura}x{symbol.altura}mm</td>
                    <td className="p-3 text-right font-bold text-sky-300">R$ {tagPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-emerald-300">R$ {everluxPrice.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-300">R$ {sinalplastPrice.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-300">R$ {forthluxPrice.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-300">R$ {sigmaPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-amber-400">
                      R$ {stats.min.price.toFixed(2)}
                      <span className="block text-[9px] text-slate-500 font-sans font-normal">
                        {stats.min.supplier.nome_fantasia}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          const targetSupplier = selectedSupplierId !== 'ALL' ? selectedSupplierId : stats.min.supplier.id;
                          const targetPrice = selectedSupplierId !== 'ALL' ? getSymbolPrice(symbol) : stats.min.price;
                          onInsertSymbolToCAD(symbol.id, targetSupplier, targetPrice);
                          if (isModal && onCloseModal) onCloseModal();
                        }}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-sans font-semibold flex items-center justify-center gap-1 mx-auto transition"
                      >
                        <Plus className="w-3 h-3" /> Inserir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: COMPARATIVO DE PREÇOS ENTRE TODOS OS 11 FORNECEDORES PARA A PLACA SELECIONADA */}
      {comparingSymbol && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-lg p-1 border border-slate-800 flex items-center justify-center">
                  <SymbolGlyph symbol={comparingSymbol} width={40} height={40} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                      {comparingSymbol.codigo_normativo}
                    </span>
                    <h3 className="font-extrabold text-sm text-white">
                      {comparingSymbol.nome}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dimensões: {comparingSymbol.largura} x {comparingSymbol.altura} mm • Norma: {comparingSymbol.norma_referencia || 'ABNT NBR 13434 / NBR 16820'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setComparingSymbol(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Table */}
            <div className="p-5 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span className="font-semibold text-white">
                  Tabela Comercial Comparativa (11 Fornecedores Ativos):
                </span>
                <span className="font-mono text-emerald-400">
                  Preços cotados em Reais (R$)
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 border-b border-slate-800 font-mono text-[11px] text-slate-400">
                    <tr>
                      <th className="p-3">Fornecedor</th>
                      <th className="p-3">Localização</th>
                      <th className="p-3">Material & Luminância</th>
                      <th className="p-3 text-right">Preço Unitário</th>
                      <th className="p-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {suppliers.map((sup) => {
                      const price = getSupplierPriceForSymbol(sup.id, comparingSymbol.codigo_normativo || comparingSymbol.codigo_interno, products);
                      const isSelected = selectedSupplierId === sup.id;

                      return (
                        <tr
                          key={sup.id}
                          className={`hover:bg-slate-800/50 transition ${
                            isSelected ? 'bg-sky-950/40 border-l-4 border-l-sky-500' : ''
                          }`}
                        >
                          <td className="p-3">
                            <span className="font-bold text-white block">{sup.nome_fantasia}</span>
                            <span className="text-[10px] text-slate-400 font-mono">CNPJ: {sup.cnpj}</span>
                          </td>
                          <td className="p-3 text-slate-300">
                            {sup.cidade}/{sup.estado}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            PVC 2,0mm Fotoluminescente • Laudo IT-20
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-emerald-400 text-sm">
                            R$ {price.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                onInsertSymbolToCAD(comparingSymbol.id, sup.id, price);
                                setComparingSymbol(null);
                                if (isModal && onCloseModal) onCloseModal();
                              }}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shadow transition flex items-center justify-center gap-1 mx-auto"
                            >
                              <Plus className="w-3.5 h-3.5" /> Adotar & Inserir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Os preços incluem laudos de luminância e certificação para vistoria do Corpo de Bombeiros.
              </span>
              <button
                onClick={() => setComparingSymbol(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT CUSTOM SYMBOL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" /> Importar Símbolo / Imagem de Sinalização
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmImport} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Selecione o arquivo de imagem (SVG, PNG, JPG, WEBP):
                </label>
                <input
                  type="file"
                  accept="image/svg+xml, image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-sky-600 file:text-white file:text-xs hover:file:bg-sky-500 cursor-pointer"
                />
              </div>

              {newSymbolFileUrl && (
                <div className="w-24 h-24 mx-auto bg-slate-950 rounded-lg p-2 border border-slate-700 flex items-center justify-center">
                  <img src={newSymbolFileUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Nome da Placa:
                  </label>
                  <input
                    type="text"
                    required
                    value={newSymbolName}
                    onChange={(e) => setNewSymbolName(e.target.value)}
                    placeholder="Ex: ROTA DE FUGA - SUBSOLO"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Código Interno / Normativo:
                  </label>
                  <input
                    type="text"
                    value={newSymbolCode}
                    onChange={(e) => setNewSymbolCode(e.target.value)}
                    placeholder="Ex: S-CUSTOM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Categoria Normativa:
                  </label>
                  <select
                    value={newSymbolCategory}
                    onChange={(e) => setNewSymbolCategory(e.target.value as SymbolCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="ORIENTACAO_SALVAMENTO">Orientação e Salvamento (Verde)</option>
                    <option value="EQUIPAMENTOS">Equipamentos de Combate (Vermelho)</option>
                    <option value="ALERTA">Alerta e Risco (Amarelo)</option>
                    <option value="PROIBICAO">Proibição (Circular)</option>
                    <option value="COMPLEMENTAR">Complementar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Fornecedor Inicial:
                  </label>
                  <select
                    value={newSymbolSupplierId}
                    onChange={(e) => setNewSymbolSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome_fantasia}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Largura (mm):</label>
                  <input
                    type="number"
                    value={newSymbolWidth}
                    onChange={(e) => setNewSymbolWidth(parseInt(e.target.value) || 200)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Altura (mm):</label>
                  <input
                    type="number"
                    value={newSymbolHeight}
                    onChange={(e) => setNewSymbolHeight(parseInt(e.target.value) || 200)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Preço em R$:</label>
                  <input
                    type="number"
                    step="0.50"
                    value={newSymbolPrice}
                    onChange={(e) => setNewSymbolPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-lg"
                >
                  Confirmar Importação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SYMBOL PRICE & INFO */}
      {selectedSymbolForEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-white mb-2">
              Editar Dados: {selectedSymbolForEdit.nome}
            </h3>
            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="text-slate-400 block mb-1">Preço Unitário Padrão em Reais (R$):</label>
                <input
                  type="number"
                  step="0.50"
                  value={selectedSymbolForEdit.preco_padrao}
                  onChange={(e) =>
                    setSelectedSymbolForEdit({
                      ...selectedSymbolForEdit,
                      preco_padrao: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-emerald-400 font-bold font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Norma de Referência:</label>
                <input
                  type="text"
                  value={selectedSymbolForEdit.norma_referencia}
                  onChange={(e) =>
                    setSelectedSymbolForEdit({
                      ...selectedSymbolForEdit,
                      norma_referencia: e.target.value
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSymbolForEdit(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSymbol(selectedSymbolForEdit);
                  setSelectedSymbolForEdit(null);
                }}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded text-xs"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
