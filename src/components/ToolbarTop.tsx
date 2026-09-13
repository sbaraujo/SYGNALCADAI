import React, { useState } from 'react';
import { Project, Floor } from '../types/cad';
import { 
  Flame, Save, FolderOpen, FilePlus, Download, Upload, 
  Layers, Moon, Sun, CheckCircle2, ShieldCheck, Sparkles, 
  Settings, FileText, ChevronDown, Check, RefreshCw, FileCode, Compass
} from 'lucide-react';

export type ActiveTab = 
  | 'cad' 
  | 'library' 
  | 'quantitativos' 
  | 'orcamento' 
  | 'pranchas' 
  | 'evac'
  | 'relatorios'
  | 'suppliers' 
  | 'validation' 
  | 'ai';

interface ToolbarTopProps {
  project: Project;
  activeFloor: Floor;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectFloor: (floorId: string) => void;
  onAddFloor: () => void;
  onNewProject: () => void;
  onOpenProjectModal: () => void;
  onSaveProject: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onRestoreDemo: () => void;
  onOpenExportDxf?: () => void;
  lastSavedTime: string;
  isNightGlowMode: boolean;
  setIsNightGlowMode: (v: boolean) => void;
  isCadBadgeMode: boolean;
  setIsCadBadgeMode: (v: boolean) => void;
  onOpenProjectSettings: () => void;
  onOpenValidation: () => void;
  onOpenAI: () => void;
  validationIssuesCount: number;
}

export const ToolbarTop: React.FC<ToolbarTopProps> = ({
  project,
  activeFloor,
  activeTab,
  setActiveTab,
  onSelectFloor,
  onAddFloor,
  onNewProject,
  onOpenProjectModal,
  onSaveProject,
  onExportBackup,
  onImportBackup,
  onRestoreDemo,
  onOpenExportDxf,
  lastSavedTime,
  isNightGlowMode,
  setIsNightGlowMode,
  isCadBadgeMode,
  setIsCadBadgeMode,
  onOpenProjectSettings,
  onOpenValidation,
  onOpenAI,
  validationIssuesCount
}) => {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showFloorMenu, setShowFloorMenu] = useState(false);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 z-30 select-none">
      {/* Brand & Project Menu */}
      <div className="flex items-center gap-3">
        {/* Brand Icon & Title */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 via-red-500 to-amber-500 flex items-center justify-center shadow-md shadow-red-900/30">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-sm font-sans">
                SIGNAFLUX <span className="text-sky-400 font-mono text-xs px-1 bg-sky-950/80 rounded border border-sky-800/60">CAD AI</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              SYGMA SMS • AI FIRE SAFETY
            </p>
          </div>
        </div>

        {/* Project Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition"
          >
            <span className="font-semibold text-white max-w-[180px] truncate">
              {project.nome}
            </span>
            <span className="text-[10px] bg-slate-700 text-slate-300 px-1 rounded font-mono">
              {project.revisao}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProjectMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 text-xs text-slate-200 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                Gerenciamento de Projeto
              </div>
              <button
                onClick={() => {
                  onNewProject();
                  setShowProjectMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
              >
                <FilePlus className="w-4 h-4 text-emerald-400" /> Novo Projeto
              </button>
              <button
                onClick={() => {
                  onOpenProjectModal();
                  setShowProjectMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" /> Abrir / Projetos Recentes
              </button>
              <button
                onClick={() => {
                  onSaveProject();
                  setShowProjectMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-sky-400" /> Salvar Projeto (Ctrl+S)
              </button>
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={() => {
                  onExportBackup();
                  setShowProjectMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-indigo-400" /> Exportar Backup (.signaflux)
              </button>
              {onOpenExportDxf && (
                <button
                  onClick={() => {
                    onOpenExportDxf();
                    setShowProjectMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-sky-400"
                >
                  <FileCode className="w-4 h-4 text-sky-400" /> Exportar DXF Nativo (AutoCAD)
                </button>
              )}
              <button
                onClick={() => {
                  onImportBackup();
                  setShowProjectMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-teal-400" /> Importar Backup / Restaurar
              </button>
              <button
                onClick={() => {
                  onRestoreDemo();
                  setShowProjectMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" /> Restaurar Projeto Padrão
              </button>
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={() => {
                  onOpenProjectSettings();
                  setShowProjectMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Dados do Empreendimento & ART
              </button>
            </div>
          )}
        </div>

        {/* Floor Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowFloorMenu(!showFloorMenu)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/80 text-xs text-slate-300 transition"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">{activeFloor.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showFloorMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 text-xs text-slate-200 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                Pavimentos do Edifício
              </div>
              {project.floors.map((fl) => (
                <button
                  key={fl.id}
                  onClick={() => {
                    onSelectFloor(fl.id);
                    setShowFloorMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between"
                >
                  <span className={fl.id === activeFloor.id ? 'text-emerald-400 font-semibold' : ''}>
                    {fl.name}
                  </span>
                  {fl.id === activeFloor.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={() => {
                  onAddFloor();
                  setShowFloorMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-sky-400"
              >
                <FilePlus className="w-4 h-4" /> Adicionar Novo Pavimento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab('cad')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${activeTab === 'cad' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          CAD 2D
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${activeTab === 'library' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Biblioteca NBR
        </button>
        <button
          onClick={() => setActiveTab('quantitativos')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${activeTab === 'quantitativos' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Quantitativos
        </button>
        <button
          onClick={() => setActiveTab('orcamento')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${activeTab === 'orcamento' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Orçamento (R$)
        </button>
        <button
          onClick={() => setActiveTab('pranchas')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${activeTab === 'pranchas' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Pranchas A3
        </button>
        <button
          onClick={() => setActiveTab('evac')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${activeTab === 'evac' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Planta de Emergência
        </button>
        <button
          onClick={() => setActiveTab('relatorios')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${activeTab === 'relatorios' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Memorial
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${activeTab === 'suppliers' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Fornecedores
        </button>
      </nav>

      {/* Right Controls: View Toggles, AI Assistant, Validation, Autosave */}
      <div className="flex items-center gap-2">
        {/* Direct Quick Save Button */}
        <button
          onClick={onSaveProject}
          title="Salvar Projeto Agora no Navegador (Ctrl+S)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-xs text-white font-bold shadow-sm transition"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salvar</span>
        </button>

        {/* DXF Export Quick Button */}
        {onOpenExportDxf && (
          <button
            onClick={onOpenExportDxf}
            title="Exportar Desenho CAD Nativo (.DXF)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-sky-400 font-semibold transition"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Exportar DXF</span>
          </button>
        )}
        {/* Toggle ABNT CAD Badge vs Graphic Plaque */}
        <button
          onClick={() => setIsCadBadgeMode(!isCadBadgeMode)}
          title="Alternar entre Placa Fotoluminescente e Notação de Planta Baixa ABNT NBR 13434 (círculo dividido)"
          className={`px-2 py-1 rounded border text-xs font-mono transition ${isCadBadgeMode ? 'bg-sky-950 text-sky-400 border-sky-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
        >
          NBR 13434
        </button>

        {/* Toggle Dark Photoluminescent Mode */}
        <button
          onClick={() => setIsNightGlowMode(!isNightGlowMode)}
          title="Simular visualização no escuro (fotoluminescência ativa)"
          className={`p-1.5 rounded border transition ${isNightGlowMode ? 'bg-lime-950 text-lime-400 border-lime-600 shadow-sm shadow-lime-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
        >
          {isNightGlowMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Validate Project Button */}
        <button
          onClick={onOpenValidation}
          title="Validar conformidade normativa e pendências do projeto"
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Validar</span>
          {validationIssuesCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
              {validationIssuesCount}
            </span>
          )}
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={onOpenAI}
          title="Abrir Assistente Inteligente Signaflux AI"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-900/40 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Signaflux AI</span>
        </button>

        {/* Autosave Status Badge */}
        <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-800 text-xs text-slate-400 font-mono">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Salvo às {lastSavedTime}</span>
        </div>
      </div>
    </header>
  );
};
