import React from 'react';
import { Project, Floor, SignSymbol, CADAnnotation } from '../types/cad';
import { SymbolGlyph } from './SymbolGlyph';
import { 
  Table, X, Stamp, Download, CheckCircle2, 
  Layers, FileSpreadsheet, Eye 
} from 'lucide-react';

interface LegendaModalProps {
  project: Project;
  activeFloor: Floor;
  symbolsCatalog: SignSymbol[];
  onUpdateFloor?: (floor: Floor) => void;
  onAddAnnotation?: (ann: any) => void;
  onClose: () => void;
}

export const LegendaModal: React.FC<LegendaModalProps> = ({
  project,
  activeFloor,
  symbolsCatalog,
  onUpdateFloor,
  onAddAnnotation,
  onClose
}) => {
  // Collect distinct symbols used on active floor
  const floorSymbolsMap = new Map<string, { symbol: SignSymbol; count: number }>();
  activeFloor.placedSymbols.forEach((ps) => {
    const def = symbolsCatalog.find((s) => s.id === ps.symbol_id);
    if (!def) return;
    if (!floorSymbolsMap.has(def.id)) {
      floorSymbolsMap.set(def.id, { symbol: def, count: ps.quantity });
    } else {
      floorSymbolsMap.get(def.id)!.count += ps.quantity;
    }
  });

  const legendList = Array.from(floorSymbolsMap.values());
  const totalCount = legendList.reduce((acc, i) => acc + i.count, 0);

  // Stamping legend into floor CAD annotations
  const handleStampLegend = () => {
    const newAnnotations: CADAnnotation[] = [...(activeFloor.annotations || [])];

    // Stamp a title text annotation
    const stampX = (activeFloor.widthMeters * 1000) - 8000;
    const stampY = 2000;

    newAnnotations.push({
      id: `ANN-LEG-TITLE-${Date.now()}`,
      floor_id: activeFloor.id,
      type: 'text',
      points: [{ x: stampX, y: stampY }],
      text: 'LEGENDA DE SINALIZAÇÃO DE EMERGÊNCIA (NBR 13434)',
      color: '#38bdf8',
      strokeWidth: 20
    });

    legendList.forEach((item, idx) => {
      newAnnotations.push({
        id: `ANN-LEG-ROW-${idx}-${Date.now()}`,
        floor_id: activeFloor.id,
        type: 'text',
        points: [{ x: stampX, y: stampY + (idx + 1) * 600 }],
        text: `[${item.symbol.codigo_normativo}] ${item.symbol.nome.substring(0, 28)} (${item.symbol.largura}x${item.symbol.altura}mm) - ${item.count} un`,
        color: '#f8fafc',
        strokeWidth: 15
      });
    });

    onUpdateFloor({
      ...activeFloor,
      annotations: newAnnotations
    });

    alert('Quadro de Legenda NBR 13434 estampado com sucesso na planta ativa!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-800/80 text-sky-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Quadro de Legenda Normativa (ABNT NBR 13434)
              </h3>
              <p className="text-xs text-slate-400">
                Relação oficial entre símbolos gráficos, códigos, dimensões e quantitativos no pavimento: <strong className="text-white">{activeFloor.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto py-4">
          {legendList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhuma placa de sinalização inserida neste pavimento até o momento.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 text-center w-16">Símbolo</th>
                    <th className="p-2.5">Código NBR</th>
                    <th className="p-2.5">Descrição Normativa</th>
                    <th className="p-2.5 text-center">Dimensões</th>
                    <th className="p-2.5 text-center">Forma</th>
                    <th className="p-2.5 text-center">Qtd.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {legendList.map(({ symbol, count }) => (
                    <tr key={symbol.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-2 text-center">
                        <div className="w-10 h-10 mx-auto flex items-center justify-center bg-slate-900/60 rounded p-1 border border-slate-800">
                          <SymbolGlyph symbol={symbol} width={32} height={32} />
                        </div>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-sky-400">
                        {symbol.codigo_normativo}
                      </td>
                      <td className="p-2.5 font-medium">
                        {symbol.nome}
                        <div className="text-[10px] text-slate-500">{symbol.norma_referencia}</div>
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-400">
                        {symbol.largura} x {symbol.altura} mm
                      </td>
                      <td className="p-2.5 text-center capitalize text-slate-400">
                        {symbol.forma_geometrica}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-amber-400">
                        {count}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900/80 font-bold border-t border-slate-800 text-xs">
                  <tr>
                    <td colSpan={5} className="p-2.5 text-right uppercase text-slate-400">
                      Total de Placas no Pavimento:
                    </td>
                    <td className="p-2.5 text-center font-mono text-emerald-400">
                      {totalCount} un
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            {legendList.length} tipos distintos de sinalização cadastrados
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Fechar
            </button>

            <button
              onClick={handleStampLegend}
              disabled={legendList.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition disabled:opacity-50"
            >
              <Stamp className="w-4 h-4" /> Estampar Legenda na Planta CAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
