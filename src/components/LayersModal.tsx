import React, { useState } from 'react';
import { Project, CADLayer } from '../types/cad';
import { Layers, Eye, EyeOff, Lock, Unlock, Plus, X } from 'lucide-react';

interface LayersModalProps {
  project: Project;
  onUpdateLayers: (layers: CADLayer[]) => void;
  onClose: () => void;
}

export const LayersModal: React.FC<LayersModalProps> = ({
  project,
  onUpdateLayers,
  onClose
}) => {
  const [layers, setLayers] = useState<CADLayer[]>(project.layers);
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerColor, setNewLayerColor] = useState('#38bdf8');

  const toggleVisibility = (id: string) => {
    const updated = layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l));
    setLayers(updated);
    onUpdateLayers(updated);
  };

  const toggleLock = (id: string) => {
    const updated = layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l));
    setLayers(updated);
    onUpdateLayers(updated);
  };

  const handleAddLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName) return;

    const newL: CADLayer = {
      id: `L-${Date.now().toString().slice(-4)}`,
      name: newLayerName,
      color: newLayerColor,
      visible: true,
      locked: false,
      printable: true
    };
    const updated = [...layers, newL];
    setLayers(updated);
    onUpdateLayers(updated);
    setNewLayerName('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-extrabold text-white">
              Gerenciador de Camadas (Layers CAD)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 py-4 text-xs">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                <div>
                  <h4 className="font-semibold text-white">{layer.name}</h4>
                  <span className="text-[10px] font-mono text-slate-500">{layer.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleVisibility(layer.id)}
                  title={layer.visible ? 'Ocultar camada' : 'Exibir camada'}
                  className={`p-1.5 rounded transition ${layer.visible ? 'text-sky-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-800'}`}
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toggleLock(layer.id)}
                  title={layer.locked ? 'Desbloquear camada' : 'Bloquear camada'}
                  className={`p-1.5 rounded transition ${layer.locked ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-800'}`}
                >
                  {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddLayer} className="pt-3 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Nome da nova camada..."
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <input
            type="color"
            value={newLayerColor}
            onChange={(e) => setNewLayerColor(e.target.value)}
            className="w-9 h-8 bg-transparent border-0 cursor-pointer"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
          >
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
};
