import React, { useState } from 'react';
import { Project } from '../types/cad';
import { Building2, X, Shield, Save, Check } from 'lucide-react';

interface ProjectSettingsModalProps {
  project: Project;
  onSave: (updatedProject: Project) => void;
  onClose: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<Project>({ ...project });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-extrabold text-white">
                Dados do Empreendimento e Responsabilidade Técnica
              </h3>
              <p className="text-xs text-slate-400">
                Informações para selo de prancha técnica (NBR 6492) e memorial descritivo do Corpo de Bombeiros.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 py-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-slate-400 font-semibold block mb-1">Nome do Projeto:</label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Nome do Edifício / Obra:</label>
              <input
                type="text"
                value={formData.empreendimento}
                onChange={(e) => setFormData({ ...formData, empreendimento: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Cliente / Proprietário:</label>
              <input
                type="text"
                value={formData.cliente}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="text-slate-400 font-semibold block mb-1">Endereço Completo da Edificação:</label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-sky-400 font-bold uppercase text-[11px] tracking-wider mb-2">
              Anotação de Responsabilidade Técnica (ART / RRT)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Responsável Técnico:</label>
                <input
                  type="text"
                  value={formData.responsavel_tecnico}
                  onChange={(e) => setFormData({ ...formData, responsavel_tecnico: e.target.value })}
                  placeholder="Ex: Eng. Roberto Silveira"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Registro CREA / CAU:</label>
                <input
                  type="text"
                  value={formData.crea_cau}
                  onChange={(e) => setFormData({ ...formData, crea_cau: e.target.value })}
                  placeholder="CREA-SP 506214589"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Número da ART / RRT:</label>
                <input
                  type="text"
                  value={formData.art_rrt}
                  onChange={(e) => setFormData({ ...formData, art_rrt: e.target.value })}
                  placeholder="ART-SP-2026-984512"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Revisão do Projeto:</label>
                <input
                  type="text"
                  value={formData.revisao}
                  onChange={(e) => setFormData({ ...formData, revisao: e.target.value })}
                  placeholder="R02"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Moeda do Orçamento: <strong className="text-emerald-400">BRL (Reais R$)</strong></span>
            <span>Normas: <strong className="text-slate-200">NBR 13434 / NBR 16820</strong></span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-lg flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Salvar Dados
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
