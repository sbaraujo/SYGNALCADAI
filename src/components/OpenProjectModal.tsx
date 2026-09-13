import React, { useState, useEffect } from 'react';
import { Project } from '../types/cad';
import { storage } from '../services/storage';
import { FolderOpen, Plus, Trash2, Layers, X, Copy, AlertTriangle } from 'lucide-react';

interface OpenProjectModalProps {
  currentProjectId: string;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onClose: () => void;
}

export const OpenProjectModal: React.FC<OpenProjectModalProps> = ({
  currentProjectId,
  onSelectProject,
  onNewProject,
  onClose
}) => {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const loadProjects = async () => {
    const list = await storage.getAllProjects();
    setProjectsList(list);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    const deletedId = projectToDelete.id;
    await storage.deleteProject(deletedId);
    setProjectToDelete(null);
    const updated = await storage.getAllProjects();
    setProjectsList(updated);

    // Se o projeto excluído for o que estava aberto atualmente
    if (deletedId === currentProjectId) {
      if (updated.length > 0) {
        onSelectProject(updated[0].id);
      } else {
        onNewProject();
      }
    }
  };

  const handleConfirmClearAll = async () => {
    await storage.clearAllProjects();
    setShowClearAllConfirm(false);
    setProjectsList([]);
    window.location.reload();
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const copy = await storage.duplicateProject(id);
    if (copy) {
      await loadProjects();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">
              Gerenciar e Abrir Projetos Salvos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 py-4 text-xs">
          {projectsList.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Nenhum projeto salvo no armazenamento local.
            </div>
          ) : (
            projectsList.map((proj) => {
              const isCurrent = proj.id === currentProjectId;
              const totalSigns = proj.floors.reduce((acc, f) => acc + (f.placedSymbols ? f.placedSymbols.length : 0), 0);

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${isCurrent ? 'bg-slate-800/90 border-sky-500 shadow-md' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{proj.nome}</h4>
                      {isCurrent && (
                        <span className="text-[10px] font-mono text-sky-400 bg-sky-950 border border-sky-800 px-1.5 py-0.5 rounded">
                          Ativo Agora
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{proj.empreendimento || 'Sem empreendimento'} • {proj.endereco || 'Sem endereço'}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-2">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-400" /> {proj.floors.length} pavimentos
                      </span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">{totalSigns} placas</span>
                      <span>•</span>
                      <span>Rev: {proj.revisao}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDuplicate(e, proj.id)}
                      title="Duplicar Projeto"
                      className="p-2 text-slate-400 hover:text-sky-400 rounded-lg hover:bg-slate-800 transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(proj);
                      }}
                      title="Excluir este projeto"
                      className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" /> Criar Novo Projeto
            </button>
            {projectsList.length > 0 && (
              <button
                onClick={() => setShowClearAllConfirm(true)}
                className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                title="Limpar todos os projetos do armazenamento local"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Limpar Todos
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700 transition"
          >
            Fechar
          </button>
        </div>

        {/* Modal Caixa de Diálogo de Confirmação de Exclusão de Projeto Específico */}
        {projectToDelete && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-60 p-4">
            <div className="bg-slate-900 border border-red-600/80 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-150">
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    Excluir Projeto Definitivamente?
                  </h4>
                  <span className="text-[11px] text-red-400/90 font-mono">
                    Ação irreversível de exclusão
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 mb-4 text-xs space-y-1.5">
                <div className="text-white font-bold text-sm">
                  {projectToDelete.nome}
                </div>
                <div className="text-slate-400">
                  Código: <span className="font-mono text-slate-300">{projectToDelete.codigo}</span>
                </div>
                <div className="text-slate-400">
                  Empreendimento: <span className="text-slate-300">{projectToDelete.empreendimento}</span>
                </div>
                <div className="text-slate-400">
                  Pavimentos: <span className="text-emerald-400 font-bold">{projectToDelete.floors.length}</span> | 
                  Placas cadastradas: <span className="text-amber-400 font-bold">{projectToDelete.floors.reduce((a, f) => a + (f.placedSymbols ? f.placedSymbols.length : 0), 0)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                Tem certeza que deseja apagar este projeto do seu sistema? Todos os pavimentos, configurações e símbolos alocados serão removidos do armazenamento.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950 flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-4 h-4" /> Sim, Excluir Projeto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmação Limpar Todos */}
        {showClearAllConfirm && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-60 p-4">
            <div className="bg-slate-900 border border-red-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    Excluir TODOS os Projetos?
                  </h4>
                  <span className="text-xs text-red-400 font-mono">
                    Todos os projetos locais serão destruídos
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mb-5">
                Esta ação apagará todos os projetos do navegador. Deseja continuar?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearAllConfirm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmClearAll}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
                >
                  Confirmar Exclusão Geral
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
