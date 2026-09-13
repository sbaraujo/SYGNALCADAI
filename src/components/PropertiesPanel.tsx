import React from 'react';
import { Project, Floor, PlacedSymbol, SignSymbol, Supplier, Manufacturer, ProductItem } from '../types/cad';
import { SymbolGlyph } from './SymbolGlyph';
import { 
  X, RotateCw, Copy, Trash2, Sliders, 
  Layers, MapPin, Tag, Building2, DollarSign, Check,
  Sparkles, CheckCheck
} from 'lucide-react';
import { getSupplierPriceForSymbol, DEFAULT_PRODUCTS } from '../data/suppliersCatalog';

interface PropertiesPanelProps {
  project: Project;
  activeFloor: Floor;
  selectedPlacedSymbolId: string | null;
  symbolsCatalog: SignSymbol[];
  suppliers: Supplier[];
  manufacturers: Manufacturer[];
  products?: ProductItem[];
  onUpdatePlacedSymbol: (symbol: PlacedSymbol) => void;
  onDeletePlacedSymbol: (id: string) => void;
  onDuplicatePlacedSymbol: () => void;
  onApplySupplierToAllMatching?: (symbolCode: string, supplierId: string, unitPrice: number) => void;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  project,
  activeFloor,
  selectedPlacedSymbolId,
  symbolsCatalog,
  suppliers,
  manufacturers,
  products,
  onUpdatePlacedSymbol,
  onDeletePlacedSymbol,
  onDuplicatePlacedSymbol,
  onApplySupplierToAllMatching,
  onClose
}) => {
  const selectedSymbol = activeFloor.placedSymbols.find((s) => s.id === selectedPlacedSymbolId);
  const symbolDef = selectedSymbol ? symbolsCatalog.find((s) => s.id === selectedSymbol.symbol_id) : null;

  // If an object is selected
  if (selectedSymbol && symbolDef) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 select-none overflow-y-auto">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">
              Propriedades do Objeto
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {/* Symbol Card Overview */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-14 h-14 bg-slate-900 rounded-lg p-1 border border-slate-800 flex items-center justify-center shrink-0">
              <SymbolGlyph symbol={symbolDef} width={48} height={48} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800">
                {selectedSymbol.id}
              </span>
              <h4 className="font-semibold text-white text-xs truncate mt-1">
                {symbolDef.nome}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Norma: {symbolDef.codigo_normativo} ({symbolDef.largura}x{symbolDef.altura} mm)
              </p>
            </div>
          </div>

          {/* Location Coordinates (X, Y mm) */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-sky-400" /> Coordenadas na Planta (mm)
            </label>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-500">X (mm):</span>
                <input
                  type="number"
                  step="100"
                  value={selectedSymbol.x}
                  onChange={(e) =>
                    onUpdatePlacedSymbol({
                      ...selectedSymbol,
                      x: parseInt(e.target.value) || 0,
                      updatedAt: new Date().toISOString()
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  = {(selectedSymbol.x / 1000).toFixed(2)} m
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Y (mm):</span>
                <input
                  type="number"
                  step="100"
                  value={selectedSymbol.y}
                  onChange={(e) =>
                    onUpdatePlacedSymbol({
                      ...selectedSymbol,
                      y: parseInt(e.target.value) || 0,
                      updatedAt: new Date().toISOString()
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  = {(selectedSymbol.y / 1000).toFixed(2)} m
                </span>
              </div>
            </div>
          </div>

          {/* Dimensions & Rotation */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" /> Rotação e Escala
            </label>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-500">Rotação (°):</span>
                <select
                  value={selectedSymbol.rotation}
                  onChange={(e) =>
                    onUpdatePlacedSymbol({
                      ...selectedSymbol,
                      rotation: parseInt(e.target.value),
                      updatedAt: new Date().toISOString()
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                >
                  <option value={0}>0° (Horizontal)</option>
                  <option value={45}>45° (Diagonal)</option>
                  <option value={90}>90° (Vertical)</option>
                  <option value={180}>180° (Invertida)</option>
                  <option value={270}>270°</option>
                </select>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Escala (%):</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="3"
                  value={selectedSymbol.scale}
                  onChange={(e) =>
                    onUpdatePlacedSymbol({
                      ...selectedSymbol,
                      scale: parseFloat(e.target.value) || 1,
                      updatedAt: new Date().toISOString()
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Layer */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Camada (Layer)
            </label>
            <select
              value={selectedSymbol.layer}
              onChange={(e) =>
                onUpdatePlacedSymbol({
                  ...selectedSymbol,
                  layer: e.target.value,
                  updatedAt: new Date().toISOString()
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
            >
              {project.layers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier & Price in Brazilian Reais (R$) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Fornecedor & Custo (R$)
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                Catálogo NBR
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500">Fornecedor Selecionado:</span>
              <select
                value={selectedSymbol.supplier_id || 'FORN-001'}
                onChange={(e) => {
                  const newSupId = e.target.value;
                  const newPrice = getSupplierPriceForSymbol(
                    newSupId,
                    symbolDef.codigo_normativo || symbolDef.codigo_interno,
                    products || DEFAULT_PRODUCTS
                  );
                  onUpdatePlacedSymbol({
                    ...selectedSymbol,
                    supplier_id: newSupId,
                    unit_price: newPrice,
                    updatedAt: new Date().toISOString()
                  });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs mt-0.5 focus:border-sky-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome_fantasia} ({s.cidade}/{s.estado})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Supplier Price Switching Chips */}
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">
                Comparar & Trocar com 1 Clique:
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-0.5">
                {suppliers.slice(0, 6).map((sup) => {
                  const supPrice = getSupplierPriceForSymbol(
                    sup.id,
                    symbolDef.codigo_normativo || symbolDef.codigo_interno,
                    products || DEFAULT_PRODUCTS
                  );
                  const isActive = (selectedSymbol.supplier_id || 'FORN-001') === sup.id;

                  return (
                    <button
                      key={sup.id}
                      type="button"
                      onClick={() => {
                        onUpdatePlacedSymbol({
                          ...selectedSymbol,
                          supplier_id: sup.id,
                          unit_price: supPrice,
                          updatedAt: new Date().toISOString()
                        });
                      }}
                      className={`px-1.5 py-1 rounded text-[10px] text-left border flex items-center justify-between transition ${
                        isActive
                          ? 'bg-sky-950 border-sky-500 text-sky-200 font-bold'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate max-w-[80px]">{sup.nome_fantasia.split(' ')[0]}</span>
                      <span className="font-mono text-emerald-400 font-semibold ml-1">
                        R${supPrice.toFixed(0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-500">Preço Unitário (R$):</span>
                <div className="relative mt-0.5">
                  <span className="absolute left-2 top-1.5 text-slate-500 text-xs">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    value={selectedSymbol.unit_price}
                    onChange={(e) =>
                      onUpdatePlacedSymbol({
                        ...selectedSymbol,
                        unit_price: parseFloat(e.target.value) || 0,
                        updatedAt: new Date().toISOString()
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-emerald-400 font-bold text-xs"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Quantidade:</span>
                <input
                  type="number"
                  min="1"
                  value={selectedSymbol.quantity}
                  onChange={(e) =>
                    onUpdatePlacedSymbol({
                      ...selectedSymbol,
                      quantity: parseInt(e.target.value) || 1,
                      updatedAt: new Date().toISOString()
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs mt-0.5"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Subtotal do Objeto:</span>
              <span className="text-emerald-400 font-bold text-sm font-mono">
                R$ {(selectedSymbol.unit_price * selectedSymbol.quantity).toFixed(2)}
              </span>
            </div>

            {/* Batch Apply Button */}
            {onApplySupplierToAllMatching && (
              <button
                type="button"
                onClick={() => {
                  onApplySupplierToAllMatching(
                    symbolDef.codigo_normativo || symbolDef.codigo_interno,
                    selectedSymbol.supplier_id || 'FORN-001',
                    selectedSymbol.unit_price
                  );
                }}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-sky-300 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
              >
                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Aplicar a todas {symbolDef.codigo_normativo} no pavimento</span>
              </button>
            )}
          </div>

          {/* Technical Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Observações / Instrução de Fixação:
            </label>
            <textarea
              rows={2}
              value={selectedSymbol.notes || ''}
              onChange={(e) =>
                onUpdatePlacedSymbol({
                  ...selectedSymbol,
                  notes: e.target.value,
                  updatedAt: new Date().toISOString()
                })
              }
              placeholder="Ex: Instalar a h=1,80m do piso acabado"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-xs focus:border-sky-500"
            />
          </div>

          {/* Actions: Duplicate, Rotate 90, Delete */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onDuplicatePlacedSymbol}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" /> Duplicar
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdatePlacedSymbol({
                    ...selectedSymbol,
                    rotation: (selectedSymbol.rotation + 90) % 360,
                    updatedAt: new Date().toISOString()
                  })
                }
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <RotateCw className="w-3.5 h-3.5 text-sky-400" /> Girar 90°
              </button>
            </div>
            <button
              type="button"
              onClick={() => onDeletePlacedSymbol(selectedSymbol.id)}
              className="w-full px-3 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir do Projeto
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // If NO object is selected: Show Floor & Project summary
  const floorTotalValue = activeFloor.placedSymbols.reduce(
    (acc, s) => acc + s.unit_price * s.quantity,
    0
  );

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 select-none overflow-y-auto">
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">
            Resumo do Pavimento
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
          {activeFloor.placedSymbols.length} sinais
        </span>
      </div>

      <div className="p-4 space-y-4 text-xs text-slate-300">
        {/* Floor Info Card */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">{activeFloor.name}</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded">
              Nível {activeFloor.level}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Dimensões da Planta: {activeFloor.widthMeters}m x {activeFloor.heightMeters}m (
            {activeFloor.widthMeters * activeFloor.heightMeters} m²)
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Sinalização:</span>
            <strong className="text-emerald-400 font-mono font-bold">
              R$ {floorTotalValue.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="bg-sky-950/30 border border-sky-900/60 rounded-xl p-3 text-[11px] text-sky-200 space-y-1.5 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5 text-sky-300">
            💡 Dica Rápida de Projeto:
          </p>
          <p>
            • Clique em qualquer placa para editar coordenadas, fornecedor e preço.
          </p>
          <p>
            • Arraste símbolos da aba <strong>"Biblioteca NBR"</strong> diretamente para a planta.
          </p>
          <p>
            • Pressione <strong>F3</strong> para Snap ao Grid e <strong>F8</strong> para modo Ortho.
          </p>
        </div>

        {/* Breakdown by Category on this Floor */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Distribuição por Categoria:
          </span>
          <div className="space-y-1.5">
            {[
              {
                cat: 'ORIENTACAO_SALVAMENTO',
                label: 'Rotas de Saída',
                color: 'text-emerald-400',
                count: activeFloor.placedSymbols.filter((s) => s.layer === 'L-SAI').length
              },
              {
                cat: 'EQUIPAMENTOS',
                label: 'Extintores e Hidrantes',
                color: 'text-red-400',
                count: activeFloor.placedSymbols.filter((s) => s.layer === 'L-EXT' || s.layer === 'L-HID').length
              },
              {
                cat: 'ALARME',
                label: 'Alarmes e Botoeiras',
                color: 'text-orange-400',
                count: activeFloor.placedSymbols.filter((s) => s.layer === 'L-ALA').length
              },
              {
                cat: 'PROIBICAO',
                label: 'Proibição',
                color: 'text-rose-400',
                count: activeFloor.placedSymbols.filter((s) => s.layer === 'L-PRO').length
              }
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between"
              >
                <span className={`font-medium ${item.color}`}>{item.label}</span>
                <span className="font-mono text-slate-300 font-semibold">{item.count} un</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Technical Data */}
        <div className="pt-3 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
          <div>
            <strong>Empreendimento:</strong> {project.empreendimento}
          </div>
          <div>
            <strong>Responsável:</strong> {project.responsavel_tecnico}
          </div>
          <div>
            <strong>ART:</strong> {project.art_rrt}
          </div>
        </div>
      </div>
    </aside>
  );
};
