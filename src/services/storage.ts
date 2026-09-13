/**
 * SIGNAFLUX CAD AI - Local Storage Engine (IndexedDB + LocalStorage Fallback)
 * Handles auto-save, projects management, export/import of .signaflux backups
 */

import { Project, SignSymbol, Supplier, Manufacturer, Product, ProductItem } from '../types/cad';
import { DEMO_PROJECT } from '../data/demoProject';
import { STANDARD_SYMBOLS } from '../data/symbolsCatalog';
import { DEFAULT_SUPPLIERS, DEFAULT_MANUFACTURERS, DEFAULT_PRODUCTS } from '../data/suppliersCatalog';

const DB_NAME = 'signaflux_cad_ai_db';
const DB_VERSION = 1;

const LS_CURRENT_PROJECT_KEY = 'signaflux_current_project_id';
const LS_LAST_SAVE_TIME = 'signaflux_last_save_time';
const LS_FALLBACK_PROJECTS = 'signaflux_projects_fallback';

export interface StorageDatabase {
  projects: Project[];
  symbols: SignSymbol[];
  suppliers: Supplier[];
  manufacturers: Manufacturer[];
  products: Product[];
  lastSavedAt: string;
}

class StorageManager {
  private db: IDBDatabase | null = null;
  private isIndexedDBAvailable: boolean = false;

  constructor() {
    this.checkIndexedDB();
  }

  private checkIndexedDB() {
    try {
      this.isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window;
    } catch {
      this.isIndexedDBAvailable = false;
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (!this.isIndexedDBAvailable) {
      throw new Error('IndexedDB is not available, falling back to LocalStorage.');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('symbols')) {
          db.createObjectStore('symbols', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('suppliers')) {
          db.createObjectStore('suppliers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('manufacturers')) {
          db.createObjectStore('manufacturers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // ==========================================
  // INITIALIZATION & SEEDING
  // ==========================================
  public async initialize(): Promise<{
    projects: Project[];
    currentProject: Project;
    symbols: SignSymbol[];
    suppliers: Supplier[];
    manufacturers: Manufacturer[];
    products: Product[];
  }> {
    let projects = await this.getAllProjects();
    let symbols = await this.getAllSymbols();
    let suppliers = await this.getAllSuppliers();
    let manufacturers = await this.getAllManufacturers();
    let products = await this.getAllProducts();

    // Seed defaults if empty
    if (symbols.length === 0) {
      symbols = STANDARD_SYMBOLS;
      for (const s of symbols) {
        await this.saveSymbol(s);
      }
    }

    if (suppliers.length === 0) {
      suppliers = DEFAULT_SUPPLIERS;
      for (const sup of suppliers) {
        await this.saveSupplier(sup);
      }
    }

    if (manufacturers.length === 0) {
      manufacturers = DEFAULT_MANUFACTURERS;
      for (const m of manufacturers) {
        await this.saveManufacturer(m);
      }
    }

    if (products.length === 0) {
      products = DEFAULT_PRODUCTS;
      for (const p of products) {
        await this.saveProduct(p);
      }
    }

    if (projects.length === 0) {
      projects = [DEMO_PROJECT];
      await this.saveProject(DEMO_PROJECT);
    }

    // Determine current project to resume
    const lastProjectId = localStorage.getItem(LS_CURRENT_PROJECT_KEY);
    let currentProject = projects.find((p) => p.id === lastProjectId) || projects[0];

    localStorage.setItem(LS_CURRENT_PROJECT_KEY, currentProject.id);

    return {
      projects,
      currentProject,
      symbols,
      suppliers,
      manufacturers,
      products
    };
  }

  // ==========================================
  // PROJECTS CRUD
  // ==========================================
  public async getAllProjects(): Promise<Project[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('projects', 'readonly');
        const store = transaction.objectStore('projects');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this.getFallbackProjects());
      });
    } catch {
      return this.getFallbackProjects();
    }
  }

  public async getProject(id: string): Promise<Project | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('projects', 'readonly');
        const store = transaction.objectStore('projects');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      const projects = this.getFallbackProjects();
      return projects.find((p) => p.id === id) || null;
    }
  }

  public async saveProject(project: Project): Promise<void> {
    project.updatedAt = new Date().toISOString();
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('projects', 'readwrite');
        const store = transaction.objectStore('projects');
        const req = store.put(project);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
      this.saveFallbackProject(project);
    }

    // Record last save time
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR');
    localStorage.setItem(LS_LAST_SAVE_TIME, timeStr);
    localStorage.setItem(LS_CURRENT_PROJECT_KEY, project.id);
  }

  public async deleteProject(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('projects', 'readwrite');
        const store = transaction.objectStore('projects');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const fallback = this.getFallbackProjects().filter((p) => p.id !== id);
      localStorage.setItem(LS_FALLBACK_PROJECTS, JSON.stringify(fallback));
    }
  }

  public async clearAllProjects(): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('projects', 'readwrite');
        const store = transaction.objectStore('projects');
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
    localStorage.removeItem(LS_FALLBACK_PROJECTS);
    localStorage.removeItem(LS_CURRENT_PROJECT_KEY);
  }

  public async duplicateProject(id: string): Promise<Project | null> {
    const original = await this.getProject(id);
    if (!original) return null;
    const copy: Project = {
      ...JSON.parse(JSON.stringify(original)),
      id: `PRJ-${Date.now()}`,
      nome: `${original.nome} (Cópia)`,
      revisao: `${original.revisao} - CÓPIA`,
      data: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.saveProject(copy);
    return copy;
  }

  // ==========================================
  // SYMBOLS CRUD
  // ==========================================
  public async getAllSymbols(): Promise<SignSymbol[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('symbols', 'readonly');
        const store = transaction.objectStore('symbols');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(STANDARD_SYMBOLS);
      });
    } catch {
      return STANDARD_SYMBOLS;
    }
  }

  public async getSymbols(): Promise<SignSymbol[]> {
    return this.getAllSymbols();
  }

  public async saveSymbol(symbol: SignSymbol): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('symbols', 'readwrite');
        const store = transaction.objectStore('symbols');
        const req = store.put(symbol);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // no-op fallback
    }
  }

  public async saveSymbols(symbols: SignSymbol[]): Promise<void> {
    for (const sym of symbols) {
      await this.saveSymbol(sym);
    }
  }

  // ==========================================
  // SUPPLIERS & PRODUCTS CRUD
  // ==========================================
  public async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('suppliers', 'readonly');
        const store = transaction.objectStore('suppliers');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          if (list.length > 0) {
            localStorage.setItem('signaflux_suppliers_cache', JSON.stringify(list));
            resolve(list);
          } else {
            const cached = localStorage.getItem('signaflux_suppliers_cache');
            resolve(cached ? JSON.parse(cached) : DEFAULT_SUPPLIERS);
          }
        };
        req.onerror = () => {
          const cached = localStorage.getItem('signaflux_suppliers_cache');
          resolve(cached ? JSON.parse(cached) : DEFAULT_SUPPLIERS);
        };
      });
    } catch {
      const cached = localStorage.getItem('signaflux_suppliers_cache');
      return cached ? JSON.parse(cached) : DEFAULT_SUPPLIERS;
    }
  }

  public async saveSupplier(supplier: Supplier): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('suppliers', 'readwrite');
        const store = transaction.objectStore('suppliers');
        const req = store.put(supplier);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // no-op
    }
    // Mirror to LocalStorage for 100% offline persistence
    try {
      const current = await this.getAllSuppliers();
      const updated = current.some((s) => s.id === supplier.id)
        ? current.map((s) => (s.id === supplier.id ? supplier : s))
        : [...current, supplier];
      localStorage.setItem('signaflux_suppliers_cache', JSON.stringify(updated));
    } catch {}
  }

  public async deleteSupplier(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('suppliers', 'readwrite');
        const store = transaction.objectStore('suppliers');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // no-op
    }
    try {
      const cached = localStorage.getItem('signaflux_suppliers_cache');
      if (cached) {
        const filtered = JSON.parse(cached).filter((s: Supplier) => s.id !== id);
        localStorage.setItem('signaflux_suppliers_cache', JSON.stringify(filtered));
      }
    } catch {}
  }

  public async getAllManufacturers(): Promise<Manufacturer[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('manufacturers', 'readonly');
        const store = transaction.objectStore('manufacturers');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(DEFAULT_MANUFACTURERS);
      });
    } catch {
      return DEFAULT_MANUFACTURERS;
    }
  }

  public async saveManufacturer(man: Manufacturer): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('manufacturers', 'readwrite');
        const store = transaction.objectStore('manufacturers');
        const req = store.put(man);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // no-op
    }
  }

  public async deleteManufacturer(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('manufacturers', 'readwrite');
        const store = transaction.objectStore('manufacturers');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
  }

  public async getAllProducts(): Promise<ProductItem[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('products', 'readonly');
        const store = transaction.objectStore('products');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          if (list.length > 0) {
            localStorage.setItem('signaflux_products_cache', JSON.stringify(list));
            resolve(list);
          } else {
            const cached = localStorage.getItem('signaflux_products_cache');
            resolve(cached ? JSON.parse(cached) : DEFAULT_PRODUCTS);
          }
        };
        req.onerror = () => {
          const cached = localStorage.getItem('signaflux_products_cache');
          resolve(cached ? JSON.parse(cached) : DEFAULT_PRODUCTS);
        };
      });
    } catch {
      const cached = localStorage.getItem('signaflux_products_cache');
      return cached ? JSON.parse(cached) : DEFAULT_PRODUCTS;
    }
  }

  public async saveProduct(prod: ProductItem): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('products', 'readwrite');
        const store = transaction.objectStore('products');
        const req = store.put(prod);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // no-op
    }
    // Mirror to LocalStorage for 100% offline persistence
    try {
      const current = await this.getAllProducts();
      const updated = current.some((p) => p.id === prod.id)
        ? current.map((p) => (p.id === prod.id ? prod : p))
        : [...current, prod];
      localStorage.setItem('signaflux_products_cache', JSON.stringify(updated));
    } catch {}
  }

  public async deleteProduct(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('products', 'readwrite');
        const store = transaction.objectStore('products');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
    try {
      const cached = localStorage.getItem('signaflux_products_cache');
      if (cached) {
        const filtered = JSON.parse(cached).filter((p: ProductItem) => p.id !== id);
        localStorage.setItem('signaflux_products_cache', JSON.stringify(filtered));
      }
    } catch {}
  }

  public async updateProductPrice(productId: string, newPrice: number): Promise<void> {
    const products = await this.getAllProducts();
    const item = products.find((p) => p.id === productId);
    if (item) {
      item.preco_unitario = newPrice;
      await this.saveProduct(item);
    }
  }

  // ==========================================
  // BACKUP & RESTORE (.SIGNAFLUX / JSON)
  // ==========================================
  public async exportFullBackup(): Promise<string> {
    const projects = await this.getAllProjects();
    const symbols = await this.getAllSymbols();
    const suppliers = await this.getAllSuppliers();
    const manufacturers = await this.getAllManufacturers();
    const products = await this.getAllProducts();

    const backupData = {
      app: 'SIGNAFLUX CAD AI',
      brand: 'SYGMA SMS AI FIRE SAFETY ENGINEERING',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      projects,
      symbols,
      suppliers,
      manufacturers,
      products
    };

    return JSON.stringify(backupData, null, 2);
  }

  public async importFullBackup(jsonContent: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonContent);
      if (!data.projects || !Array.isArray(data.projects)) {
        throw new Error('Arquivo de backup inválido: dados de projetos não encontrados.');
      }

      for (const p of data.projects) {
        await this.saveProject(p);
      }
      if (data.symbols && Array.isArray(data.symbols)) {
        for (const s of data.symbols) {
          await this.saveSymbol(s);
        }
      }
      if (data.suppliers && Array.isArray(data.suppliers)) {
        for (const sup of data.suppliers) {
          await this.saveSupplier(sup);
        }
      }
      if (data.manufacturers && Array.isArray(data.manufacturers)) {
        for (const m of data.manufacturers) {
          await this.saveManufacturer(m);
        }
      }
      if (data.products && Array.isArray(data.products)) {
        for (const pr of data.products) {
          await this.saveProduct(pr);
        }
      }

      if (data.projects.length > 0) {
        localStorage.setItem(LS_CURRENT_PROJECT_KEY, data.projects[0].id);
      }
      return true;
    } catch (err) {
      console.error('Erro ao restaurar backup:', err);
      return false;
    }
  }

  // ==========================================
  // LOCALSTORAGE FALLBACK HELPERS
  // ==========================================
  private getFallbackProjects(): Project[] {
    try {
      const raw = localStorage.getItem(LS_FALLBACK_PROJECTS);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [DEMO_PROJECT];
  }

  private saveFallbackProject(project: Project) {
    const list = this.getFallbackProjects();
    const index = list.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      list[index] = project;
    } else {
      list.push(project);
    }
    localStorage.setItem(LS_FALLBACK_PROJECTS, JSON.stringify(list));
  }

  public getLastSavedTime(): string {
    return localStorage.getItem(LS_LAST_SAVE_TIME) || new Date().toLocaleTimeString('pt-BR');
  }
}

export const storage = new StorageManager();
