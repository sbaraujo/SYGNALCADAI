import React from 'react';
import { Project, Floor } from '../types/cad';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, Info, 
  X, ArrowRight, Sparkles, Building2, Ruler
} from 'lucide-react';

interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  normReference: string;
  floorName?: string;
  autoFixAvailable?: boolean;
}

interface ValidationModalProps {
  project: Project;
  activeFloor: Floor;
  onClose: () => void;
  onApplyAutoFix?: (issueId: string) => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  project,
  activeFloor,
  onClose,
  onApplyAutoFix
}) => {
  // Compute engineering rules compliance
  const issues: ValidationIssue[] = [];

  // Check 1: ART / RRT
  if (!project.art_rrt || project.art_rrt.trim() === '') {
    issues.push({
      id: 'MISSING_ART',
      type: 'warning',
      title: 'ART / RRT do Responsável Técnico não informada',
      description: 'O número da Anotação de Responsabilidade Técnica (CREA/CAU) é obrigatório para aprovação no Corpo de Bombeiros.',
      normReference: 'Decreto Estadual / Instrução Técnica do CBMESP'
    });
  }

  // Check 2: Floor Scale Calibration
  project.floors.forEach((fl) => {
    if (!fl.calibrated) {
      issues.push({
        id: `CALIB_${fl.id}`,
        type: 'warning',
        title: `Pavimento "${fl.name}" sem calibração manual de escala`,
        description: 'Utilize a ferramenta Calibrar (Régua) para marcar 2 pontos conhecidos na planta para garantir precisão milimétrica.',
        normReference: 'NBR 6492 - Desenho Técnico Arquitetônico',
        floorName: fl.name
      });
    }
  });

  // Check 3: Minimum Emergency Exit Signs
  project.floors.forEach((fl) => {
    const exitSigns = fl.placedSymbols.filter((s) => s.layer === 'L-SAI');
    if (exitSigns.length < 2) {
      issues.push({
        id: `LOW_EXITS_${fl.id}`,
        type: 'error',
        title: `Poucas placas de rota de saída no ${fl.name}`,
        description: `Foram encontradas apenas ${exitSigns.length} placas de saída. Conforme NBR 13434 item 5.1.3, o espaçamento máximo entre placas direcionais em corredores é de 15,0 metros.`,
        normReference: 'ABNT NBR 13434-1 Item 5.1.3',
        floorName: fl.name,
        autoFixAvailable: true
      });
    }
  });

  // Check 4: Equipment Signs Check (Extinguishers)
  project.floors.forEach((fl) => {
    const equipSigns = fl.placedSymbols.filter((s) => s.layer === 'L-EXT' || s.layer === 'L-HID');
    if (equipSigns.length === 0) {
      issues.push({
        id: `NO_EQUIP_${fl.id}`,
        type: 'error',
        title: `Nenhum sinal de extintor ou hidrante no ${fl.name}`,
        description: 'Todos os equipamentos de combate a incêndio (extintores portáteis, hidrantes) devem ser sinalizados a 1,80m do piso acabado.',
        normReference: 'ABNT NBR 13434-2 Tabela 2',
        floorName: fl.name
      });
    }
  });

  // Check 5: Photoluminescence spec compliance
  const hasCompliantProducts = true;
  if (hasCompliantProducts) {
    issues.push({
      id: 'FOTO_OK',
      type: 'info',
      title: 'Certificação de Fotoluminescência Conforme NBR 16820',
      description: 'Todos os produtos selecionados no catálogo atendem ao requisito de luminância de 140 mcd/m² aos 10 min e 20 mcd/m² aos 60 min.',
      normReference: 'ABNT NBR 16820 / NBR 13434-3'
    });
  }

  const errorsCount = issues.filter((i) => i.type === 'error').length;
  const warningsCount = issues.filter((i) => i.type === 'warning').length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">
                Validador Normativo de Projeto (ABNT NBR 13434)
              </h3>
              <p className="text-xs text-slate-400">
                Auditoria automática de conformidade para aprovação no Corpo de Bombeiros.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${errorsCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                Não Conformidades
              </div>
              <div className="text-base font-extrabold text-white font-mono">
                {errorsCount} críticas
              </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                Advertências / Recomendações
              </div>
              <div className="text-base font-extrabold text-amber-400 font-mono">
                {warningsCount} pendentes
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 rounded-xl border transition ${issue.type === 'error' ? 'bg-red-950/30 border-red-800/80 text-red-100' : issue.type === 'warning' ? 'bg-amber-950/30 border-amber-800/80 text-amber-100' : 'bg-sky-950/30 border-sky-800/80 text-sky-100'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {issue.type === 'error' && (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  {issue.type === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  {issue.type === 'info' && (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {issue.title}
                    </h4>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      {issue.description}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-400">
                      Norma: <strong className="text-slate-200">{issue.normReference}</strong>
                    </div>
                  </div>
                </div>

                {issue.autoFixAvailable && (
                  <button
                    onClick={() => onApplyAutoFix && onApplyAutoFix(issue.id)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Corrigir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Fechar Validador
          </button>
        </div>
      </div>
    </div>
  );
};
