import React, { useState, useMemo } from 'react';
import { Project, Floor, SignSymbol } from '../types/cad';
import { 
  calculateDxfEntityCounts, 
  generateDxfContent, 
  downloadDxfFile, 
  DxfExportOptions, 
  DEFAULT_DXF_OPTIONS 
} from '../services/dxfExporter';
import { 
  Download, X, FileCode, CheckCircle2, ShieldCheck, 
  Layers, Settings, Sparkles, AlertTriangle 
} from 'lucide-react';

interface ExportDxfModalProps {
  project: Project;
  activeFloor: Floor;
  symbolsCatalog: SignSymbol[];
  onClose: () => void;
}

export const ExportDxfModal: React.FC<ExportDxfModalProps> = ({
  project,
  activeFloor,
  symbolsCatalog,
  onClose
}) => {
  const [options, setOptions] = useState<DxfExportOptions>(DEFAULT_DXF_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Real-time calculation of entity counts based on current options
  const entityCounts = useMemo(() => {
    return calculateDxfEntityCounts(activeFloor, project, options);
  }, [activeFloor, project, options]);

  const handleExport = () => {
    setIsExporting(true);
    setProgress(15);

    setTimeout(() => {
      setProgress(55);

      setTimeout(() => {
        try {
          const dxfString = generateDxfContent(activeFloor, project, symbolsCatalog, options);
          setProgress(90);

          const safeProjName = project.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const safeFloorName = activeFloor.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const fileName = `SIGNAFLUX_${safeProjName}_${safeFloorName}.dxf`;

          downloadDxfFile(fileName, dxfString);
          setProgress(100);

          setTimeout(() => {
            setIsExporting(false);
            onClose();
          }, 400);
        } catch (error) {
          console.error('Erro na exportação DXF:', error);
          alert('Houve um erro ao processar o arquivo DXF. Foi acionado o gerador de contingência.');
          setIsExporting(false);
        }
      }, 250);
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-800/80 text-sky-400">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Exportação CAD Profissional (.DXF)
              </h3>
              <p className="text-xs text-slate-400">
                Compatibilidade nativa 100% com AutoCAD, Revit, ZwCAD, GstarCAD e LibreCAD
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 text-xs text-slate-300">
          {/* Target Floor Info */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[11px] text-slate-400">Pavimento Ativo:</span>
                <p className="font-bold text-white text-sm">{activeFloor.name}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400">Sinalizações fixadas:</span>
              <p className="font-mono font-bold text-amber-400">{activeFloor.placedSymbols.length} placas</p>
            </div>
          </div>

          {/* Real-Time Entity Count Preview Boxes (Page 14 & 15 of Manual) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Pré-Visualização de Entidades Vetoriais
              </span>
              <span className="text-[11px] font-mono text-sky-400 font-semibold">
                Total: {entityCounts.total} entidades
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 font-mono">
              <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-slate-400 block">Lines</span>
                <span className="text-base font-bold text-cyan-400">{entityCounts.lines}</span>
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-slate-400 block">Circles</span>
                <span className="text-base font-bold text-emerald-400">{entityCounts.circles}</span>
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-slate-400 block">Inserts</span>
                <span className="text-base font-bold text-amber-400">{entityCounts.inserts}</span>
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-slate-400 block">Blocks</span>
                <span className="text-base font-bold text-purple-400">{entityCounts.blocks}</span>
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-slate-400 block">Texts</span>
                <span className="text-base font-bold text-white">{entityCounts.texts}</span>
              </div>
            </div>
          </div>

          {/* Export Settings Checkboxes */}
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Camadas e Elementos a Incluir
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeSigns}
                  onChange={(e) => setOptions({ ...options, includeSigns: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Sinais de Emergência</span>
                  <span className="text-[10px] text-slate-400">SIGNAFLUX_SINAIS (Saída, Combate, Alerta)</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeVisibilityRadius}
                  onChange={(e) => setOptions({ ...options, includeVisibilityRadius: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Raios de Visibilidade NBR</span>
                  <span className="text-[10px] text-slate-400">SIGNAFLUX_RAIOS_VISIBILIDADE (Circunferências)</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeLegendTable}
                  onChange={(e) => setOptions({ ...options, includeLegendTable: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Tabela de Legenda NBR 13434</span>
                  <span className="text-[10px] text-slate-400">SIGNAFLUX_TABELA_LEGENDA (Contagem e descrições)</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeTitleBlock}
                  onChange={(e) => setOptions({ ...options, includeTitleBlock: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Carimbo Técnico NBR 6492</span>
                  <span className="text-[10px] text-slate-400">SIGNAFLUX_CARIMBO (Dados do cliente, RT e ART)</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeDimensions}
                  onChange={(e) => setOptions({ ...options, includeDimensions: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Cotas e Medições</span>
                  <span className="text-[10px] text-slate-400">SIGNAFLUX_COTAS (Cor 4 Ciano)</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeArchitecture}
                  onChange={(e) => setOptions({ ...options, includeArchitecture: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Paredes e Arquitetura</span>
                  <span className="text-[10px] text-slate-400">SIGNAFLUX_ARQUITETURA (Perímetro e divisórias)</span>
                </div>
              </label>
            </div>
          </div>

          {/* Standard DXF Layers Reference Table */}
          <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-[11px]">
            <div className="font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Tabela de Cores Normatizadas do DXF (AutoCAD Color Index)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-500" /> Sinais Saída: Cor 3 (Verde)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500" /> Sinais Combate: Cor 1 (Vermelho)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-yellow-400" /> Sinais Alerta: Cor 2 (Amarelo)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-400" /> Cotas Técnicas: Cor 4 (Ciano)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> Tabela Legenda: Cor 5 (Azul)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gray-400" /> Raios Cobertura: Cor 8 (Cinza)</div>
            </div>
          </div>

          {/* Progress Bar during generation */}
          {isExporting && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-sky-400 font-bold animate-pulse">Serializando entidades vetoriais...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-900/40 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Gerando DXF...' : 'Baixar Arquivo .DXF Nativo'}
          </button>
        </div>
      </div>
    </div>
  );
};
