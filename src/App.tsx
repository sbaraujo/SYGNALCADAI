import React, { useState, useEffect, useCallback } from 'react';
import { Project, Floor, PlacedSymbol, SignSymbol, Supplier, Manufacturer, ProductItem } from './types/cad';
import { storage } from './services/storage';
import { DEMO_PROJECT } from './data/demoProject';
import { DEFAULT_SYMBOLS_CATALOG } from './data/symbolsCatalog';
import { DEFAULT_SUPPLIERS, DEFAULT_MANUFACTURERS, DEFAULT_PRODUCTS, getSupplierPriceForSymbol } from './data/suppliersCatalog';

// Components
import { ToolbarTop, ActiveTab } from './components/ToolbarTop';
import { ToolbarSide } from './components/ToolbarSide';
import { CADCanvas, CADTool } from './components/CADCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LibraryView } from './components/LibraryView';
import { QuantitativosView } from './components/QuantitativosView';
import { PranchasA3View } from './components/PranchasA3View';
import { SuppliersView } from './components/SuppliersView';
import { ValidationModal } from './components/ValidationModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { OpenProjectModal } from './components/OpenProjectModal';
import { UploadPlanModal } from './components/UploadPlanModal';
import { LayersModal } from './components/LayersModal';
import { EvacuationPlanView } from './components/EvacuationPlanView';
import { TechnicalReportView } from './components/TechnicalReportView';
import { ExportDxfModal } from './components/ExportDxfModal';
import { LegendaModal } from './components/LegendaModal';
import { CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  // Main Project State
  const [project, setProject] = useState<Project>(DEMO_PROJECT);
  const [activeFloorId, setActiveFloorId] = useState<string>(DEMO_PROJECT.floors[0].id);

  // Catalogs State
  const [symbolsCatalog, setSymbolsCatalog] = useState<SignSymbol[]>(DEFAULT_SYMBOLS_CATALOG);
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEFAULT_SUPPLIERS);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(DEFAULT_MANUFACTURERS);
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);

  // View Navigation & Tools
  const [activeTab, setActiveTab] = useState<ActiveTab>('cad');
  const [activeTool, setActiveTool] = useState<CADTool>('select');
  const [selectedSymbolIdToInsert, setSelectedSymbolIdToInsert] = useState<string | null>(null);
  const [selectedSupplierForInsert, setSelectedSupplierForInsert] = useState<string | null>(null);
  const [selectedPriceForInsert, setSelectedPriceForInsert] = useState<number | null>(null);
  const [selectedPlacedSymbolId, setSelectedPlacedSymbolId] = useState<string | null>(null);

  // CAD Visual Modes
  const [isNightGlowMode, setIsNightGlowMode] = useState<boolean>(false);
  const [isCadBadgeMode, setIsCadBadgeMode] = useState<boolean>(false);

  // Autosave tracking
  const [lastSavedTime, setLastSavedTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [recenterCount, setRecenterCount] = useState<number>(0);

  // Modals Visibility
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [showOpenProjectModal, setShowOpenProjectModal] = useState(false);
  const [showUploadPlanModal, setShowUploadPlanModal] = useState(false);
  const [showLayersModal, setShowLayersModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showAIAssistantModal, setShowAIAssistantModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showExportDxfModal, setShowExportDxfModal] = useState(false);
  const [showLegendaModal, setShowLegendaModal] = useState(false);

  // Load project on initial mount
  useEffect(() => {
    storage.getProject(DEMO_PROJECT.id).then((savedProj) => {
      if (savedProj) {
        setProject(savedProj);
        if (savedProj.floors.length > 0) {
          setActiveFloorId(savedProj.floors[0].id);
        }
      } else {
        storage.saveProject(DEMO_PROJECT);
      }
    });

    storage.getSymbols().then((syms) => {
      if (syms && syms.length > 0) {
        setSymbolsCatalog(syms);
      }
    });
  }, []);

  // Autosave handler (debounced or on changes)
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const triggerAutosave = useCallback(async (updatedProj?: Project) => {
    const projToSave = updatedProj || project;
    await storage.saveProject(projToSave);
    setLastSavedTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  }, [project]);

  const handleManualSave = useCallback(async () => {
    await triggerAutosave();
    setSaveToast('Projeto salvo com sucesso no navegador!');
    setTimeout(() => setSaveToast(null), 3000);
  }, [triggerAutosave]);

  // Tecla de atalho global Ctrl+S / Cmd+S para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  // Active floor helper
  const activeFloor = project.floors.find((f) => f.id === activeFloorId) || project.floors[0];

  // Placed Symbols operations
  const handleUpdateFloor = (updatedFloor: Floor, shouldFitExtents?: boolean) => {
    const newFloors = project.floors.map((f) => (f.id === updatedFloor.id ? updatedFloor : f));
    const newProj: Project = {
      ...project,
      floors: newFloors,
      updatedAt: new Date().toISOString()
    };
    setProject(newProj);
    triggerAutosave(newProj);

    if (shouldFitExtents) {
      setActiveTab('cad');
      setRecenterCount((c) => c + 1);
    }
  };

  const handleAddPlacedSymbol = (newSymbol: PlacedSymbol) => {
    const updatedPlaced = [...activeFloor.placedSymbols, newSymbol];
    handleUpdateFloor({
      ...activeFloor,
      placedSymbols: updatedPlaced
    });
  };

  const handleUpdatePlacedSymbol = (updatedSymbol: PlacedSymbol) => {
    const updatedPlaced = activeFloor.placedSymbols.map((s) =>
      s.id === updatedSymbol.id ? updatedSymbol : s
    );
    handleUpdateFloor({
      ...activeFloor,
      placedSymbols: updatedPlaced
    });
  };

  const handleDeletePlacedSymbol = (symbolId: string) => {
    const updatedPlaced = activeFloor.placedSymbols.filter((s) => s.id !== symbolId);
    handleUpdateFloor({
      ...activeFloor,
      placedSymbols: updatedPlaced
    });
    if (selectedPlacedSymbolId === symbolId) {
      setSelectedPlacedSymbolId(null);
    }
  };

  const handleDuplicatePlacedSymbol = () => {
    if (!selectedPlacedSymbolId) return;
    const current = activeFloor.placedSymbols.find((s) => s.id === selectedPlacedSymbolId);
    if (!current) return;

    const copy: PlacedSymbol = {
      ...current,
      id: `OBJ-${Date.now().toString().slice(-6)}`,
      x: current.x + 1500,
      y: current.y + 1500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    handleAddPlacedSymbol(copy);
    setSelectedPlacedSymbolId(copy.id);
  };

  // Floor management
  const handleAddFloor = () => {
    const newLevel = project.floors.length;
    const newFloor: Floor = {
      id: `FL-${Date.now().toString().slice(-5)}`,
      name: `${newLevel + 1}º Pavimento Tipo`,
      level: newLevel,
      widthMeters: 40,
      heightMeters: 28,
      calibrated: true,
      placedSymbols: [],
      annotations: []
    };
    const updatedProj: Project = {
      ...project,
      floors: [...project.floors, newFloor],
      updatedAt: new Date().toISOString()
    };
    setProject(updatedProj);
    setActiveFloorId(newFloor.id);
    triggerAutosave(updatedProj);
  };

  // Symbols Library operations
  const handleInsertSymbolToCAD = (symbolId: string, supplierId?: string, unitPrice?: number) => {
    setSelectedSymbolIdToInsert(symbolId);
    setSelectedSupplierForInsert(supplierId || null);
    setSelectedPriceForInsert(unitPrice !== undefined && unitPrice !== null ? unitPrice : null);
    setActiveTool('insert_symbol');
    setActiveTab('cad');
  };

  const handleAddCustomSymbol = async (symbol: SignSymbol) => {
    const updated = [symbol, ...symbolsCatalog];
    setSymbolsCatalog(updated);
    await storage.saveSymbols(updated);
  };

  const handleUpdateSymbol = async (symbol: SignSymbol) => {
    const updated = symbolsCatalog.map((s) => (s.id === symbol.id ? symbol : s));
    setSymbolsCatalog(updated);
    await storage.saveSymbols(updated);
  };

  // Suppliers & Products operations with 100% Offline Persistence
  const handleAddSupplier = async (supplier: Supplier) => {
    const updated = [...suppliers, supplier];
    setSuppliers(updated);
    await storage.saveSupplier(supplier);
  };

  const handleUpdateSupplier = async (supplier: Supplier) => {
    const updated = suppliers.map((s) => (s.id === supplier.id ? supplier : s));
    setSuppliers(updated);
    await storage.saveSupplier(supplier);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    const updated = suppliers.filter((s) => s.id !== supplierId);
    setSuppliers(updated);
    await storage.deleteSupplier(supplierId);
  };

  const handleAddProduct = async (product: ProductItem) => {
    const updated = [product, ...products];
    setProducts(updated);
    await storage.saveProduct(product);
  };

  const handleUpdateProduct = async (product: ProductItem) => {
    const updated = products.map((p) => (p.id === product.id ? product : p));
    setProducts(updated);
    await storage.saveProduct(product);
  };

  const handleDeleteProduct = async (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    await storage.deleteProduct(productId);
  };

  const handleUpdateProductPrice = async (productId: string, newPrice: number) => {
    const updated = products.map((p) => (p.id === productId ? { ...p, preco_unitario: newPrice } : p));
    setProducts(updated);
    const prod = updated.find((p) => p.id === productId);
    if (prod) {
      await storage.saveProduct(prod);
    }
    // Also update any placed symbol referencing this product or supplier
    const updatedFloors = project.floors.map((fl) => ({
      ...fl,
      placedSymbols: fl.placedSymbols.map((sym) =>
        sym.product_id === productId ? { ...sym, unit_price: newPrice } : sym
      )
    }));
    const newProj = { ...project, floors: updatedFloors, updatedAt: new Date().toISOString() };
    setProject(newProj);
    triggerAutosave(newProj);
  };

  const handleUpdatePlacedSymbolPrice = (placedId: string, newPrice: number) => {
    const updatedFloors = project.floors.map((fl) => ({
      ...fl,
      placedSymbols: fl.placedSymbols.map((sym) =>
        sym.id === placedId ? { ...sym, unit_price: newPrice } : sym
      )
    }));
    const newProj = { ...project, floors: updatedFloors, updatedAt: new Date().toISOString() };
    setProject(newProj);
    triggerAutosave(newProj);
  };

  const handleUpdatePlacedSymbolSupplier = (placedId: string, supplierId: string) => {
    const updatedFloors = project.floors.map((fl) => ({
      ...fl,
      placedSymbols: fl.placedSymbols.map((sym) => {
        if (sym.id === placedId) {
          const def = symbolsCatalog.find((s) => s.id === sym.symbol_id);
          const newPrice = def
            ? getSupplierPriceForSymbol(supplierId, def.codigo_normativo || def.codigo_interno, products)
            : sym.unit_price;
          return { ...sym, supplier_id: supplierId, unit_price: newPrice };
        }
        return sym;
      })
    }));
    const newProj = { ...project, floors: updatedFloors, updatedAt: new Date().toISOString() };
    setProject(newProj);
    triggerAutosave(newProj);
  };

  const handleBatchUpdateSupplier = (supplierId: string, floorId?: string) => {
    const updatedFloors = project.floors.map((fl) => {
      if (floorId && floorId !== 'ALL' && fl.id !== floorId) return fl;
      return {
        ...fl,
        placedSymbols: fl.placedSymbols.map((sym) => {
          const def = symbolsCatalog.find((s) => s.id === sym.symbol_id);
          const newPrice = def
            ? getSupplierPriceForSymbol(supplierId, def.codigo_normativo || def.codigo_interno, products)
            : sym.unit_price;
          return {
            ...sym,
            supplier_id: supplierId,
            unit_price: newPrice,
            updatedAt: new Date().toISOString()
          };
        })
      };
    });
    const newProj = { ...project, floors: updatedFloors, updatedAt: new Date().toISOString() };
    setProject(newProj);
    triggerAutosave(newProj);
  };

  const handleBatchOptimizeLowestPrice = (floorId?: string) => {
    const updatedFloors = project.floors.map((fl) => {
      if (floorId && floorId !== 'ALL' && fl.id !== floorId) return fl;
      return {
        ...fl,
        placedSymbols: fl.placedSymbols.map((sym) => {
          const def = symbolsCatalog.find((s) => s.id === sym.symbol_id);
          if (!def) return sym;
          const code = def.codigo_normativo || def.codigo_interno;
          let bestSupId = suppliers[0]?.id || 'FORN-001';
          let bestPrice = Infinity;
          for (const s of suppliers) {
            const p = getSupplierPriceForSymbol(s.id, code, products);
            if (p < bestPrice) {
              bestPrice = p;
              bestSupId = s.id;
            }
          }
          return {
            ...sym,
            supplier_id: bestSupId,
            unit_price: bestPrice,
            updatedAt: new Date().toISOString()
          };
        })
      };
    });
    const newProj = { ...project, floors: updatedFloors, updatedAt: new Date().toISOString() };
    setProject(newProj);
    triggerAutosave(newProj);
  };

  const handleApplySupplierToAllMatching = (symbolCode: string, supplierId: string, unitPrice: number) => {
    const updatedPlaced = activeFloor.placedSymbols.map((sym) => {
      const def = symbolsCatalog.find((s) => s.id === sym.symbol_id);
      if (def && (def.codigo_normativo === symbolCode || def.codigo_interno === symbolCode)) {
        return {
          ...sym,
          supplier_id: supplierId,
          unit_price: unitPrice,
          updatedAt: new Date().toISOString()
        };
      }
      return sym;
    });
    handleUpdateFloor({
      ...activeFloor,
      placedSymbols: updatedPlaced
    });
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(
      {
        project,
        symbolsCatalog,
        suppliers,
        version: '1.0.0',
        exportedAt: new Date().toISOString()
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SIGNAFLUX_${project.nome.replace(/\s+/g, '_')}_Backup.signaflux`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.signaflux,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.project) {
            setProject(parsed.project);
            setActiveFloorId(parsed.project.floors[0]?.id || '');
            if (parsed.symbolsCatalog) setSymbolsCatalog(parsed.symbolsCatalog);
            if (parsed.suppliers) setSuppliers(parsed.suppliers);
            await storage.saveProject(parsed.project);
            alert('Projeto importado com sucesso!');
          }
        } catch (err) {
          alert('Erro ao importar arquivo de backup.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleRestoreDemo = async () => {
    if (confirm('Deseja recarregar o projeto demonstrativo da Torre Rio Sul?')) {
      setProject(DEMO_PROJECT);
      setActiveFloorId(DEMO_PROJECT.floors[0].id);
      setSymbolsCatalog(DEFAULT_SYMBOLS_CATALOG);
      setSuppliers(DEFAULT_SUPPLIERS);
      await storage.saveProject(DEMO_PROJECT);
      triggerAutosave(DEMO_PROJECT);
    }
  };

  const handleNewProject = () => {
    const newProj: Project = {
      id: `PROJ-${Date.now().toString().slice(-6)}`,
      nome: 'Novo Projeto de Sinalização',
      cliente: 'Cliente Padrão',
      empreendimento: 'Edificação Nova',
      endereco: 'Av. Brasil, 1000 - São Paulo, SP',
      responsavel_tecnico: 'Engenheiro Responsável',
      crea_cau: 'CREA-SP 000000',
      art_rrt: 'ART-SP-2026',
      revisao: 'R00',
      moeda: 'BRL',
      data: new Date().toISOString().split('T')[0],
      floors: [
        {
          id: `FL-${Date.now().toString().slice(-5)}`,
          name: 'Pavimento Térreo',
          level: 0,
          widthMeters: 40,
          heightMeters: 28,
          calibrated: true,
          placedSymbols: [],
          annotations: []
        }
      ],
      layers: DEMO_PROJECT.layers,
      settings: DEMO_PROJECT.settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProject(newProj);
    setActiveFloorId(newProj.floors[0].id);
    triggerAutosave(newProj);
  };

  // Auto-fix issue from validation tool
  const handleApplyAutoFix = (issueId: string) => {
    if (issueId.startsWith('LOW_EXITS_')) {
      // Add missing exit direction sign S-1 to hallway
      const newSymbol: PlacedSymbol = {
        id: `OBJ-${Date.now().toString().slice(-6)}`,
        symbol_id: 'SIG-001',
        project_id: project.id,
        floor_id: activeFloor.id,
        x: 20000,
        y: 14000,
        scale: 1,
        width: 250,
        height: 150,
        rotation: 0,
        layer: 'L-SAI',
        quantity: 1,
        supplier_id: 'FORN-001',
        manufacturer_id: 'FAB-001',
        product_id: 'PROD-250150-20-SYG',
        unit_price: 18.50,
        notes: 'Locado automaticamente pelo Validador de Conformidade NBR 13434',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      handleAddPlacedSymbol(newSymbol);
      setSelectedPlacedSymbolId(newSymbol.id);
      alert('Placa de Rota de Saída S-1 inserida automaticamente no corredor!');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Application Toolbar */}
      <ToolbarTop
        project={project}
        activeFloor={activeFloor}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectFloor={setActiveFloorId}
        onAddFloor={handleAddFloor}
        onNewProject={handleNewProject}
        onOpenProjectModal={() => setShowOpenProjectModal(true)}
        onSaveProject={handleManualSave}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onRestoreDemo={handleRestoreDemo}
        onOpenExportDxf={() => setShowExportDxfModal(true)}
        lastSavedTime={lastSavedTime}
        isNightGlowMode={isNightGlowMode}
        setIsNightGlowMode={setIsNightGlowMode}
        isCadBadgeMode={isCadBadgeMode}
        setIsCadBadgeMode={setIsCadBadgeMode}
        onOpenProjectSettings={() => setShowProjectSettings(true)}
        onOpenValidation={() => setShowValidationModal(true)}
        onOpenAI={() => setShowAIAssistantModal(true)}
        validationIssuesCount={activeFloor.placedSymbols.filter((s) => s.layer === 'L-SAI').length < 2 ? 1 : 0}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'cad' && (
          <>
            {/* CAD Vertical Toolbar */}
            <ToolbarSide
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              project={project}
              onToggleGridSnap={() => {
                const updated = {
                  ...project,
                  settings: { ...project.settings, gridSnap: !project.settings.gridSnap }
                };
                setProject(updated);
                triggerAutosave(updated);
              }}
              onToggleOrtho={() => {
                const updated = {
                  ...project,
                  settings: { ...project.settings, orthoMode: !project.settings.orthoMode }
                };
                setProject(updated);
                triggerAutosave(updated);
              }}
              onOpenUploadPlanModal={() => setShowUploadPlanModal(true)}
              onOpenLibraryModal={() => setShowLibraryModal(true)}
              onOpenLayersModal={() => setShowLayersModal(true)}
              onOpenLegendaModal={() => setShowLegendaModal(true)}
              onFitExtents={() => setRecenterCount((c) => c + 1)}
            />

            {/* Interactive 2D Vector CAD Canvas */}
            <CADCanvas
              project={project}
              activeFloor={activeFloor}
              symbolsCatalog={symbolsCatalog}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              selectedSymbolIdToInsert={selectedSymbolIdToInsert}
              selectedSupplierForInsert={selectedSupplierForInsert}
              selectedPriceForInsert={selectedPriceForInsert}
              selectedPlacedSymbolId={selectedPlacedSymbolId}
              onSelectPlacedSymbol={setSelectedPlacedSymbolId}
              onUpdatePlacedSymbol={handleUpdatePlacedSymbol}
              onAddPlacedSymbol={handleAddPlacedSymbol}
              onDeletePlacedSymbol={handleDeletePlacedSymbol}
              onUpdateFloor={handleUpdateFloor}
              onTriggerAutosave={() => triggerAutosave()}
              isNightGlowMode={isNightGlowMode}
              isCadBadgeMode={isCadBadgeMode}
              onOpenProperties={() => {}}
              recenterTrigger={recenterCount}
            />

            {/* Right Properties Panel */}
            <PropertiesPanel
              project={project}
              activeFloor={activeFloor}
              selectedPlacedSymbolId={selectedPlacedSymbolId}
              symbolsCatalog={symbolsCatalog}
              suppliers={suppliers}
              manufacturers={manufacturers}
              products={products}
              onUpdatePlacedSymbol={handleUpdatePlacedSymbol}
              onDeletePlacedSymbol={handleDeletePlacedSymbol}
              onDuplicatePlacedSymbol={handleDuplicatePlacedSymbol}
              onApplySupplierToAllMatching={handleApplySupplierToAllMatching}
              onClose={() => setSelectedPlacedSymbolId(null)}
            />
          </>
        )}

        {activeTab === 'library' && (
          <LibraryView
            symbols={symbolsCatalog}
            suppliers={suppliers}
            products={products}
            onInsertSymbolToCAD={handleInsertSymbolToCAD}
            onAddCustomSymbol={handleAddCustomSymbol}
            onUpdateSymbol={handleUpdateSymbol}
          />
        )}

        {(activeTab === 'quantitativos' || activeTab === 'orcamento') && (
          <QuantitativosView
            project={project}
            symbolsCatalog={symbolsCatalog}
            suppliers={suppliers}
            products={products}
            onUpdatePlacedSymbolPrice={handleUpdatePlacedSymbolPrice}
            onUpdatePlacedSymbolSupplier={handleUpdatePlacedSymbolSupplier}
            onBatchUpdateSupplier={handleBatchUpdateSupplier}
            onBatchOptimizeLowestPrice={handleBatchOptimizeLowestPrice}
          />
        )}

        {activeTab === 'pranchas' && (
          <PranchasA3View
            project={project}
            symbolsCatalog={symbolsCatalog}
            suppliers={suppliers}
            products={products}
            onUpdateProject={(up) => {
              setProject(up);
              triggerAutosave(up);
            }}
            onUpdateFloor={handleUpdateFloor}
            onSaveProject={handleManualSave}
            onExportBackup={handleExportBackup}
            onOpenExportDxf={() => setShowExportDxfModal(true)}
          />
        )}

        {activeTab === 'evac' && (
          <EvacuationPlanView
            project={project}
            activeFloor={activeFloor}
            symbolsCatalog={symbolsCatalog}
            onUpdateFloor={handleUpdateFloor}
            onUpdateProject={(up) => {
              setProject(up);
              triggerAutosave(up);
            }}
            onSaveProject={handleManualSave}
            onExportBackup={handleExportBackup}
          />
        )}

        {activeTab === 'relatorios' && (
          <TechnicalReportView
            project={project}
            symbolsCatalog={symbolsCatalog}
            suppliers={suppliers}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            manufacturers={manufacturers}
            products={products}
            symbolsCatalog={symbolsCatalog}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProductPrice={handleUpdateProductPrice}
          />
        )}
      </div>

      {/* MODALS */}
      {/* Symbol Library Quick Insert Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <LibraryView
              symbols={symbolsCatalog}
              onInsertSymbolToCAD={handleInsertSymbolToCAD}
              onAddCustomSymbol={handleAddCustomSymbol}
              onUpdateSymbol={handleUpdateSymbol}
              isModal={true}
              onCloseModal={() => setShowLibraryModal(false)}
            />
          </div>
        </div>
      )}

      {/* Project Settings & ART Modal */}
      {showProjectSettings && (
        <ProjectSettingsModal
          project={project}
          onSave={(up) => {
            setProject(up);
            triggerAutosave(up);
          }}
          onClose={() => setShowProjectSettings(false)}
        />
      )}

      {/* Open/Switch Project Modal */}
      {showOpenProjectModal && (
        <OpenProjectModal
          currentProjectId={project.id}
          onSelectProject={async (id) => {
            const p = await storage.getProject(id);
            if (p) {
              setProject(p);
              setActiveFloorId(p.floors[0]?.id || '');
            }
          }}
          onNewProject={handleNewProject}
          onClose={() => setShowOpenProjectModal(false)}
        />
      )}

      {/* Upload Architectural Floor Plan Modal */}
      {showUploadPlanModal && (
        <UploadPlanModal
          activeFloor={activeFloor}
          onUpdateFloor={handleUpdateFloor}
          onClose={() => setShowUploadPlanModal(false)}
        />
      )}

      {/* CAD Layers Management Modal */}
      {showLayersModal && (
        <LayersModal
          project={project}
          onUpdateLayers={(layers) => {
            const updated = { ...project, layers };
            setProject(updated);
            triggerAutosave(updated);
          }}
          onClose={() => setShowLayersModal(false)}
        />
      )}

      {/* Project Normative Validator Modal */}
      {showValidationModal && (
        <ValidationModal
          project={project}
          activeFloor={activeFloor}
          onClose={() => setShowValidationModal(false)}
          onApplyAutoFix={handleApplyAutoFix}
        />
      )}

      {/* Signaflux AI Assistant Modal */}
      {showAIAssistantModal && (
        <AIAssistantModal
          project={project}
          activeFloor={activeFloor}
          onClose={() => setShowAIAssistantModal(false)}
          onAddSymbolSuggested={handleInsertSymbolToCAD}
        />
      )}

      {/* Export DXF Modal */}
      {showExportDxfModal && (
        <ExportDxfModal
          project={project}
          activeFloor={activeFloor}
          symbolsCatalog={symbolsCatalog}
          onClose={() => setShowExportDxfModal(false)}
        />
      )}

      {/* Stamp Legenda NBR 13434 Modal */}
      {showLegendaModal && (
        <LegendaModal
          project={project}
          activeFloor={activeFloor}
          symbolsCatalog={symbolsCatalog}
          onAddAnnotation={(ann) => {
            const updatedFloors = project.floors.map((fl) =>
              fl.id === activeFloor.id
                ? { ...fl, annotations: [...(fl.annotations || []), ann] }
                : fl
            );
            const updated = { ...project, floors: updatedFloors, updatedAt: new Date().toISOString() };
            setProject(updated);
            triggerAutosave(updated);
          }}
          onClose={() => setShowLegendaModal(false)}
        />
      )}

      {/* Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <LibraryView
              symbols={symbolsCatalog}
              suppliers={suppliers}
              products={products}
              onInsertSymbolToCAD={(symId, supId, price) => {
                handleInsertSymbolToCAD(symId, supId, price);
                setShowLibraryModal(false);
              }}
              onAddCustomSymbol={handleAddCustomSymbol}
              onUpdateSymbol={handleUpdateSymbol}
              isModal={true}
              onCloseModal={() => setShowLibraryModal(false)}
            />
          </div>
        </div>
      )}

      {/* Floating Save Success Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 border border-emerald-400 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl z-50 flex items-center gap-2 text-xs animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
};

export default App;
