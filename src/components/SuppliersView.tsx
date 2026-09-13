import React, { useState, useMemo, useRef } from 'react';
import { Supplier, Manufacturer, ProductItem, SignSymbol, SymbolCategory } from '../types/cad';
import { 
  Building2, Phone, Mail, MapPin, Globe, 
  Plus, Edit2, Trash2, Check, DollarSign, Package, ShieldCheck,
  Search, Download, Upload, Percent, AlertTriangle, X, CheckCircle2, HardDrive
} from 'lucide-react';

interface SuppliersViewProps {
  suppliers: Supplier[];
  manufacturers: Manufacturer[];
  products: ProductItem[];
  symbolsCatalog?: SignSymbol[];
  onAddSupplier: (supplier: Supplier) => Promise<void> | void;
  onUpdateSupplier: (supplier: Supplier) => Promise<void> | void;
  onDeleteSupplier: (supplierId: string) => Promise<void> | void;
  onAddProduct: (product: ProductItem) => Promise<void> | void;
  onUpdateProduct: (product: ProductItem) => Promise<void> | void;
  onDeleteProduct: (productId: string) => Promise<void> | void;
  onUpdateProductPrice: (productId: string, newPrice: number) => Promise<void> | void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  manufacturers,
  products,
  symbolsCatalog = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateProductPrice
}) => {
  const [activeSupplierId, setActiveSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Modals state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Active supplier
  const currentSupplier = suppliers.find((s) => s.id === activeSupplierId) || suppliers[0];

  // Filtered products for active supplier
  const supplierProducts = useMemo(() => {
    if (!currentSupplier) return [];
    return products.filter((p) => {
      if (p.fornecedor_id !== currentSupplier.id) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.codigo_sku && p.codigo_sku.toLowerCase().includes(q)) ||
        (p.nome && p.nome.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q)) ||
        (p.categoria && p.categoria.toLowerCase().includes(q)) ||
        (p.dimensoes && p.dimensoes.toLowerCase().includes(q))
      );
    });
  }, [products, currentSupplier, searchQuery]);

  // Handle Create / Update Supplier
  const handleSaveSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editingSupplier?.id || `FORN-${Date.now().toString().slice(-4)}`;
    const nomeFantasia = formData.get('nome_fantasia') as string;
    const razaoSocial = (formData.get('razao_social') as string) || nomeFantasia;
    const cnpj = (formData.get('cnpj') as string) || '00.000.000/0001-00';
    const cidade = (formData.get('cidade') as string) || 'São Paulo';
    const estado = (formData.get('estado') as string) || 'SP';
    const telefone = (formData.get('telefone') as string) || '(11) 3000-0000';
    const email = (formData.get('email') as string) || 'contato@fornecedor.com.br';
    const website = formData.get('website') as string;

    const sup: Supplier = {
      id,
      nome_fantasia: nomeFantasia,
      razao_social: razaoSocial,
      cnpj,
      cidade,
      estado,
      telefone,
      email,
      website: website || undefined,
      moeda_padrao: 'BRL',
      ativo: true
    };

    if (editingSupplier) {
      await onUpdateSupplier(sup);
      showToast(`Fornecedor "${nomeFantasia}" atualizado com sucesso (Salvo Offline).`);
    } else {
      await onAddSupplier(sup);
      setActiveSupplierId(sup.id);
      showToast(`Novo fornecedor "${nomeFantasia}" cadastrado e persistido.`);
    }

    setShowSupplierModal(false);
    setEditingSupplier(null);
  };

  // Handle Delete Supplier
  const handleConfirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    const id = supplierToDelete.id;
    const name = supplierToDelete.nome_fantasia;
    await onDeleteSupplier(id);
    setSupplierToDelete(null);

    // Switch active supplier
    const remaining = suppliers.filter((s) => s.id !== id);
    if (remaining.length > 0) {
      setActiveSupplierId(remaining[0].id);
    }
    showToast(`Fornecedor "${name}" excluído do sistema.`);
  };

  // Handle Create / Update Product (Sign Price)
  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentSupplier) return;

    const formData = new FormData(e.currentTarget);
    const sku = (formData.get('codigo_sku') as string).trim();
    const nome = (formData.get('nome') as string).trim();
    const categoria = (formData.get('categoria') as SymbolCategory) || 'EQUIPAMENTOS';
    const largura = parseFloat(formData.get('largura') as string) || 200;
    const altura = parseFloat(formData.get('altura') as string) || 200;
    const material = (formData.get('material') as string) || 'PVC Rígido Auto-extinguível Fotoluminescente 1mm';
    const autonomia = parseInt(formData.get('autonomia_minutos') as string, 10) || 1800;
    const luminancia = parseInt(formData.get('luminancia_mcd') as string, 10) || 140;
    const preco = parseFloat(formData.get('preco_unitario') as string) || 0;
    const simboloId = (formData.get('simbolo_associado_id') as string) || undefined;

    const prod: ProductItem = {
      id: editingProduct?.id || `PROD-${Date.now().toString().slice(-6)}`,
      codigo_sku: sku,
      nome,
      categoria,
      fornecedor_id: currentSupplier.id,
      fabricante_id: manufacturers[0]?.id || 'FAB-001',
      dimensoes: `${largura} x ${altura} mm`,
      largura,
      altura,
      material,
      autonomia_minutos: autonomia,
      luminancia_mcd: luminancia,
      preco_unitario: preco,
      preco,
      moeda: 'BRL',
      simbolo_associado_id: simboloId,
      data_preco: new Date().toISOString().split('T')[0]
    };

    if (editingProduct) {
      await onUpdateProduct(prod);
      showToast(`Sinal "${sku} - ${nome}" atualizado no catálogo.`);
    } else {
      await onAddProduct(prod);
      showToast(`Novo sinal "${sku}" adicionado à tabela de preços.`);
    }

    setShowProductModal(false);
    setEditingProduct(null);
  };

  // Handle Delete Product
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const sku = productToDelete.codigo_sku || productToDelete.nome;
    await onDeleteProduct(productToDelete.id);
    setProductToDelete(null);
    showToast(`Sinal "${sku}" removido da tabela de preços.`);
  };

  // Batch adjust prices by percentage
  const handleBatchAdjustPrices = async (percentChange: number) => {
    if (!currentSupplier) return;
    const count = supplierProducts.length;
    if (count === 0) return;

    for (const prod of supplierProducts) {
      const current = prod.preco_unitario || 0;
      const updated = Math.max(0.5, parseFloat((current * (1 + percentChange / 100)).toFixed(2)));
      await onUpdateProductPrice(prod.id, updated);
    }
    showToast(`Reajuste de ${percentChange > 0 ? '+' : ''}${percentChange}% aplicado a todos os ${count} sinais de ${currentSupplier.nome_fantasia}.`);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!currentSupplier || supplierProducts.length === 0) return;

    const headers = ['codigo_sku', 'nome', 'categoria', 'largura_mm', 'altura_mm', 'material', 'autonomia_min', 'luminancia_mcd', 'preco_unitario_brl'];
    const rows = supplierProducts.map((p) => [
      `"${p.codigo_sku || ''}"`,
      `"${p.nome.replace(/"/g, '""')}"`,
      `"${p.categoria || ''}"`,
      p.largura || 200,
      p.altura || 200,
      `"${(p.material || '').replace(/"/g, '""')}"`,
      p.autonomia_minutos || 1800,
      p.luminancia_mcd || 140,
      (p.preco_unitario || 0).toFixed(2)
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tabela_Precos_${currentSupplier.nome_fantasia.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Tabela de preços exportada em CSV com sucesso!`);
  };

  // Import CSV
  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSupplier) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        alert('Arquivo CSV vazio ou sem linhas de dados.');
        return;
      }

      let importedCount = 0;
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(';').map((col) => col.replace(/^["']|["']$/g, '').trim());
        if (parts.length >= 2) {
          const sku = parts[0] || `SKU-${Date.now().toString().slice(-4)}`;
          const nome = parts[1] || 'Sinalização Fotoluminescente';
          const rawCat = parts[2] as SymbolCategory;
          const categoria: SymbolCategory = (['EQUIPAMENTOS', 'ORIENTACAO_SALVAMENTO', 'ALERTA', 'PROIBICAO', 'COMPLEMENTAR', 'OUTROS'].includes(rawCat) ? rawCat : 'EQUIPAMENTOS');
          const largura = parseFloat(parts[3]) || 200;
          const altura = parseFloat(parts[4]) || 200;
          const material = parts[5] || 'PVC Rígido 1mm Fotoluminescente';
          const autonomia = parseInt(parts[6], 10) || 1800;
          const luminancia = parseInt(parts[7], 10) || 140;
          const preco = parseFloat(parts[8]?.replace(',', '.')) || 15.0;

          const prod: ProductItem = {
            id: `PROD-CSV-${Date.now().toString().slice(-5)}-${i}`,
            codigo_sku: sku,
            nome,
            categoria,
            fornecedor_id: currentSupplier.id,
            fabricante_id: manufacturers[0]?.id || 'FAB-001',
            dimensoes: `${largura} x ${altura} mm`,
            largura,
            altura,
            material,
            autonomia_minutos: autonomia,
            luminancia_mcd: luminancia,
            preco_unitario: preco,
            preco,
            moeda: 'BRL',
            data_preco: new Date().toISOString().split('T')[0]
          };

          await onAddProduct(prod);
          importedCount++;
        }
      }

      showToast(`${importedCount} sinais importados do CSV e salvos offline!`);
    } catch (err: any) {
      alert(`Erro ao importar CSV: ${err.message || err}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto font-sans">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-16 right-6 z-50 bg-sky-950 border border-sky-500 text-sky-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Gestão de Empresas & Catálogo de Preços de Sinais
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
              <HardDrive className="w-3 h-3 text-emerald-400" />
              100% Offline (IndexedDB + Storage)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cadastro completo (CRUD) de empresas fornecedoras, tabelas de preços em <strong>Reais (R$)</strong> e especificações NBR 13434 / NBR 16820.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingSupplier(null);
              setShowSupplierModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4" /> Cadastrar Empresa Fornecedora
          </button>
        </div>
      </div>

      {/* Main Grid: Suppliers List on Left, Active Supplier & Product Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Left Column: Suppliers Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Empresas Cadastradas ({suppliers.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {suppliers.map((sup) => {
              const isSelected = sup.id === activeSupplierId;
              const productCount = products.filter((p) => p.fornecedor_id === sup.id).length;

              return (
                <div
                  key={sup.id}
                  onClick={() => setActiveSupplierId(sup.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer relative group ${
                    isSelected
                      ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{sup.nome_fantasia}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                          {sup.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{sup.razao_social}</p>
                    </div>

                    {/* Card action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSupplier(sup);
                          setShowSupplierModal(true);
                        }}
                        title="Editar Empresa"
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {suppliers.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSupplierToDelete(sup);
                          }}
                          title="Excluir Empresa"
                          className="p-1.5 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{sup.cidade} - {sup.estado}</span>
                    <span className="text-emerald-400 font-semibold">{productCount} itens no catálogo</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Supplier Data & Product Price List */}
        <div className="lg:col-span-2 space-y-6">
          {currentSupplier ? (
            <>
              {/* Supplier Info Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-sky-400 uppercase font-bold tracking-wider">
                        {currentSupplier.id}
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                        Ativo / Catálogo R$
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">
                      {currentSupplier.nome_fantasia}
                    </h3>
                    <p className="text-xs text-slate-400">{currentSupplier.razao_social}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingSupplier(currentSupplier);
                        setShowSupplierModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar Cadastro
                    </button>
                    {suppliers.length > 1 && (
                      <button
                        onClick={() => setSupplierToDelete(currentSupplier)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg text-xs font-semibold border border-red-800/80 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>{currentSupplier.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <span>{currentSupplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>CNPJ: {currentSupplier.cnpj}</span>
                  </div>
                </div>
              </div>

              {/* Products Table with Complete CRUD & Offline Controls */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                {/* Table Header and Toolbar */}
                <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      Tabela de Preços de Sinais ({supplierProducts.length} itens)
                    </h4>
                  </div>

                  {/* Action Buttons: Add Sign, Batch Adjustment, CSV Export/Import */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setShowProductModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Cadastrar Novo Sinal / Preço
                    </button>

                    {/* Batch Adjustment dropdown buttons */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                      <span className="text-slate-500 px-1">Reajustar:</span>
                      <button
                        type="button"
                        onClick={() => handleBatchAdjustPrices(5)}
                        title="Reajustar todos os preços em +5%"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded"
                      >
                        +5%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchAdjustPrices(10)}
                        title="Reajustar todos os preços em +10%"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded"
                      >
                        +10%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchAdjustPrices(-5)}
                        title="Desconto de 5% em todos os preços"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded"
                      >
                        -5%
                      </button>
                    </div>

                    {/* CSV Export & Import */}
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      title="Exportar Tabela de Preços para Planilha CSV"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" /> Exportar CSV
                    </button>

                    <label
                      title="Importar Tabela de Preços via CSV"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 cursor-pointer transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-teal-400" /> Importar CSV
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleImportCsv}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-slate-800/80 bg-slate-950/20">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Pesquisar sinal por código SKU, descrição, material ou dimensões..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800 z-10 shadow-xs">
                      <tr>
                        <th className="p-3">Código SKU</th>
                        <th className="p-3">Descrição do Sinal</th>
                        <th className="p-3">Dimensões (mm)</th>
                        <th className="p-3">Material & Espessura</th>
                        <th className="p-3">Fotoluminescência</th>
                        <th className="p-3 text-right">Preço Unitário (R$)</th>
                        <th className="p-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-200">
                      {supplierProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            Nenhum sinal encontrado no catálogo deste fornecedor. Clique em "Cadastrar Novo Sinal / Preço" para adicionar.
                          </td>
                        </tr>
                      ) : (
                        supplierProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-mono font-bold text-sky-400 whitespace-nowrap">
                              {prod.codigo_sku || prod.id}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-white">{prod.nome}</div>
                              {prod.simbolo_associado_id && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  Símbolo Vinculado: {prod.simbolo_associado_id}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                              {prod.largura || 200} x {prod.altura || 200} mm
                            </td>
                            <td className="p-3 text-slate-300">{prod.material || 'PVC 1.0mm'}</td>
                            <td className="p-3 font-mono text-emerald-400 whitespace-nowrap">
                              {prod.autonomia_minutos || 1800} min ({prod.luminancia_mcd || 140} mcd/m²)
                            </td>
                            <td className="p-3 text-right font-mono whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-slate-400 text-xs">R$</span>
                                <input
                                  type="number"
                                  step="0.50"
                                  min="0"
                                  value={prod.preco_unitario || 0}
                                  onChange={(e) =>
                                    onUpdateProductPrice(prod.id, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-24 bg-slate-950 border border-slate-700 hover:border-sky-500 focus:border-sky-500 rounded px-2 py-1 text-right text-emerald-400 font-bold font-mono transition"
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(prod);
                                    setShowProductModal(true);
                                  }}
                                  title="Editar Especificações do Sinal"
                                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProductToDelete(prod)}
                                  title="Excluir Sinal do Catálogo"
                                  className="p-1 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
              Nenhuma empresa fornecedora selecionada. Cadastre um novo fornecedor para começar.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CADASTRAR / EDITAR EMPRESA FORNECEDORA */}
      {/* ======================================================== */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                {editingSupplier ? 'Editar Empresa Fornecedora' : 'Cadastrar Nova Empresa Fornecedora'}
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs pt-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nome Fantasia (Comercial) *</label>
                <input
                  type="text"
                  name="nome_fantasia"
                  required
                  defaultValue={editingSupplier?.nome_fantasia || ''}
                  placeholder="Ex: Luminum Sinalização"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Razão Social Completa</label>
                <input
                  type="text"
                  name="razao_social"
                  defaultValue={editingSupplier?.razao_social || ''}
                  placeholder="Ex: Luminum Comércio e Indústria Ltda"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">CNPJ</label>
                  <input
                    type="text"
                    name="cnpj"
                    defaultValue={editingSupplier?.cnpj || ''}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    name="telefone"
                    defaultValue={editingSupplier?.telefone || ''}
                    placeholder="(11) 3456-7890"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    defaultValue={editingSupplier?.cidade || 'São Paulo'}
                    placeholder="São Paulo"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    name="estado"
                    maxLength={2}
                    defaultValue={editingSupplier?.estado || 'SP'}
                    placeholder="SP"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">E-mail Comercial de Contato</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingSupplier?.email || ''}
                  placeholder="vendas@fornecedor.com.br"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Website / Catálogo Online (opcional)</label>
                <input
                  type="text"
                  name="website"
                  defaultValue={editingSupplier?.website || ''}
                  placeholder="https://www.fornecedor.com.br"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-lg transition"
                >
                  {editingSupplier ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CADASTRAR / EDITAR SINAL E PREÇO */}
      {/* ======================================================== */}
      {showProductModal && currentSupplier && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  {editingProduct ? 'Editar Sinal / Preço do Catálogo' : 'Cadastrar Novo Sinal / Preço'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fornecedor: <strong>{currentSupplier.nome_fantasia}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs pt-4">
              {/* Optional template picker from Symbols Catalog */}
              {symbolsCatalog.length > 0 && !editingProduct && (
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Preencher a partir de Símbolo Base da Biblioteca NBR (Opcional):
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                    onChange={(e) => {
                      const sym = symbolsCatalog.find((s) => s.id === e.target.value);
                      if (sym) {
                        const form = e.target.form;
                        if (form) {
                          const skuInput = form.elements.namedItem('codigo_sku') as HTMLInputElement;
                          const nomeInput = form.elements.namedItem('nome') as HTMLInputElement;
                          const catInput = form.elements.namedItem('categoria') as HTMLSelectElement;
                          const largInput = form.elements.namedItem('largura') as HTMLInputElement;
                          const altInput = form.elements.namedItem('altura') as HTMLInputElement;
                          const symIdInput = form.elements.namedItem('simbolo_associado_id') as HTMLInputElement;

                          if (skuInput) skuInput.value = `${currentSupplier.nome_fantasia.slice(0, 3).toUpperCase()}-${sym.codigo_normativo || sym.codigo_interno}`;
                          if (nomeInput) nomeInput.value = sym.nome;
                          if (catInput) catInput.value = sym.categoria;
                          if (largInput) largInput.value = (sym.largura_padrao_mm || 200).toString();
                          if (altInput) altInput.value = (sym.altura_padrao_mm || 200).toString();
                          if (symIdInput) symIdInput.value = sym.id;
                        }
                      }
                    }}
                  >
                    <option value="">-- Selecione para preenchimento automático --</option>
                    {symbolsCatalog.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.codigo_normativo || s.codigo_interno} - {s.nome} ({s.largura_padrao_mm}x{s.altura_padrao_mm} mm)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="hidden"
                name="simbolo_associado_id"
                defaultValue={editingProduct?.simbolo_associado_id || ''}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Código SKU / Referência *</label>
                  <input
                    type="text"
                    name="codigo_sku"
                    required
                    defaultValue={editingProduct?.codigo_sku || ''}
                    placeholder="Ex: LUM-S1-200"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Categoria Normativa</label>
                  <select
                    name="categoria"
                    defaultValue={editingProduct?.categoria || 'EQUIPAMENTOS'}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white"
                  >
                    <option value="EQUIPAMENTOS">Equipamentos e Combate a Incêndio</option>
                    <option value="ORIENTACAO_SALVAMENTO">Orientação e Salvamento (Rotas de Fuga)</option>
                    <option value="ALERTA">Alerta e Aviso</option>
                    <option value="PROIBICAO">Proibição</option>
                    <option value="COMPLEMENTAR">Complementar</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Descrição / Nome do Produto *</label>
                <input
                  type="text"
                  name="nome"
                  required
                  defaultValue={editingProduct?.nome || ''}
                  placeholder="Ex: Placa Extintor de Incêndio Fotoluminescente"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Largura (mm)</label>
                  <input
                    type="number"
                    name="largura"
                    defaultValue={editingProduct?.largura || 200}
                    placeholder="200"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Altura (mm)</label>
                  <input
                    type="number"
                    name="altura"
                    defaultValue={editingProduct?.altura || 200}
                    placeholder="200"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Material & Espessura</label>
                <input
                  type="text"
                  name="material"
                  defaultValue={editingProduct?.material || 'PVC Rígido Auto-extinguível Fotoluminescente 1,0 mm'}
                  placeholder="Ex: PVC Rígido 1,0 mm ou Alumínio 0,8 mm"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Autonomia (minutos)</label>
                  <input
                    type="number"
                    name="autonomia_minutos"
                    defaultValue={editingProduct?.autonomia_minutos || 1800}
                    placeholder="1800"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Luminância (mcd/m²)</label>
                  <input
                    type="number"
                    name="luminancia_mcd"
                    defaultValue={editingProduct?.luminancia_mcd || 140}
                    placeholder="140"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-emerald-900/60">
                <label className="text-emerald-400 font-bold block mb-1">Preço Unitário Comercial em Reais (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    name="preco_unitario"
                    defaultValue={editingProduct?.preco_unitario || 18.5}
                    placeholder="18.50"
                    className="w-full bg-slate-900 border border-emerald-700 focus:border-emerald-500 rounded-lg pl-10 pr-3 py-2 text-emerald-300 font-black font-mono text-base"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition"
                >
                  {editingProduct ? 'Salvar Sinal' : 'Adicionar ao Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE FORNECEDOR */}
      {/* ======================================================== */}
      {supplierToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-base text-white">Confirmar Exclusão de Empresa</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir a empresa fornecedora <strong>"{supplierToDelete.nome_fantasia}"</strong>?
              Esta operação removerá o cadastro do banco de dados local.
            </p>
            <div className="flex justify-end gap-2.5 pt-5 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSupplier}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-lg"
              >
                Sim, Excluir Empresa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE PRODUTO / SINAL */}
      {/* ======================================================== */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-base text-white">Excluir Sinal da Tabela de Preços</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja remover o sinal <strong>"{productToDelete.codigo_sku} - {productToDelete.nome}"</strong> da tabela de preços deste fornecedor?
            </p>
            <div className="flex justify-end gap-2.5 pt-5 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-lg"
              >
                Excluir Sinal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
