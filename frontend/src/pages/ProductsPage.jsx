import React, { useState, useEffect } from 'react';
import api, { getBackendUrl } from '../api';
import { PackageSearch, Plus, X, Loader2, Edit2, Trash2, AlertTriangle, Tag, Search, Copy } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORY_ATTRIBUTES = {
  "Bebidas": [{ key: "sabor", label: "Sabor" }, { key: "volumen_ml", label: "Volumen (ML)" }],
  "Ropa y Moda": [{ key: "talla", label: "Talla" }, { key: "color", label: "Color" }, { key: "genero", label: "Género" }],
  "Zapatos y Calzado": [{ key: "talla", label: "Talla" }, { key: "color", label: "Color" }],
  "Electrónica y Tecnología": [{ key: "marca", label: "Marca" }, { key: "modelo", label: "Modelo" }, { key: "garantia", label: "Garantía (Meses)" }],
  "Abarrotes y Alimentos": [{ key: "peso", label: "Peso/Gramaje" }, { key: "marca", label: "Marca" }],
  "Belleza y Cuidado Personal": [{ key: "volumen_ml", label: "Volumen (ML)" }, { key: "fragancia", label: "Fragancia / Tono" }]
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', sku: '', proveedor_id: '', category: 'Otros', precioCosto: '', precioVenta: '', description: '', stockMinimo: 10, imagen_url: '', attributes: {} 
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const toast = useToast();

  const [uploading, setUploading] = useState(false);

  const getImageUrl = (url) => {
    return getBackendUrl(url);
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 600;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 800, 600);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Image compression failed"));
            }
          }, 'image/webp', 0.7);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fData = new FormData();
      fData.append('file', compressed);
      
      const { data } = await api.post('/productos/upload', fData);
      
      setFormData(prev => ({ ...prev, imagen_url: data.url }));
      toast.success('Imagen comprimida (800x600 WebP 70%) y cargada con éxito');
    } catch (err) {
      toast.error('Error al procesar/subir la imagen');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const userRole = sessionStorage.getItem('user_role');
  const userPermissions = JSON.parse(sessionStorage.getItem('permissions') || '{}');

  const hasPermission = (key) => {
    if (userRole === 'OWNER') return true;
    return !!userPermissions[key];
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, provRes] = await Promise.all([
        api.get('/productos'),
        api.get('/proveedores')
      ]);
      setProducts(prodRes.data);
      setProviders(provRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({ 
      name: p.name, 
      sku: p.sku, 
      proveedor_id: p.proveedor_id || '', 
      category: p.category || 'Otros',
      precioCosto: p.precioCosto || '',
      precioVenta: p.precioVenta || '',
      description: p.description || '',
      stockMinimo: p.stockMinimo,
      imagen_url: p.imagen_url || '',
      attributes: p.attributes || {}
    });
    setShowForm(true);
  };

  const handleCloneVariant = (p) => {
    setEditingId(null);
    setFormData({ 
      name: p.name, 
      sku: '', 
      proveedor_id: p.proveedor_id || '', 
      category: p.category || 'Otros',
      precioCosto: p.precioCosto || '',
      precioVenta: p.precioVenta || '',
      description: '',
      stockMinimo: p.stockMinimo,
      imagen_url: p.imagen_url || '',
      attributes: p.attributes || {}
    });
    setShowForm(true);
    setTimeout(() => {
      const formEl = document.getElementById('prod-form-top');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const proceedDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/productos/${confirmDelete}`);
      toast.success('Producto eliminado del sistema');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        precioCosto: Number(formData.precioCosto) || 0,
        precioVenta: Number(formData.precioVenta) || 0,
        stockMinimo: Number(formData.stockMinimo) || 0
      };

      if (editingId) {
        await api.put(`/productos/${editingId}`, payload);
        toast.success('Producto actualizado correctamente');
      } else {
        await api.post('/productos', payload);
        toast.success('Producto ingresado al catálogo');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', proveedor_id: '', category: 'Otros', precioCosto: '', precioVenta: '', description: '', stockMinimo: 10, imagen_url: '', attributes: {} });
    setEditingId(null);
    setShowForm(false);
  };

  const calculateMargin = (cost, price) => {
    const c = parseFloat(cost) || 0;
    const p = parseFloat(price) || 0;
    if (p === 0) return 0;
    return (((p - c) / p) * 100).toFixed(0);
  };

  const currentMargin = calculateMargin(formData.precioCosto, formData.precioVenta);
  const isLoss = currentMargin < 0;

  return (
    <div className="full-width-container animate-fadein space-y-6">
      
      {/* Header and Actions */}
      <div className="page-header-bar">
        <div>
          <h1>Catálogo de Artículos</h1>
          <p>Administra tu lista de productos de catálogo, categorías y costos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`py-2 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
              showFilters ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <Search size={18} /> {showFilters ? 'Ocultar Filtros' : 'Buscar / Filtrar'}
          </button>
          {hasPermission('catalogo_crear') && (
            <button 
              onClick={showForm ? resetForm : () => setShowForm(true)} 
              className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                showForm ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white text-[#184e77] hover:bg-slate-50'
              }`}
            >
              {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Añadir al Catálogo</>}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Form Section */}
      {showForm && (
        <div id="prod-form-top" className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-fadeIn relative">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">
              {editingId 
                ? 'Editar Artículo de Catálogo' 
                : formData.name 
                  ? `Crear Variante de: ${formData.name}` 
                  : 'Añadir Nuevo Artículo'}
            </h3>
            <button 
              type="button" 
              onClick={resetForm} 
              className="text-slate-400 hover:text-slate-650 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
              title="Cerrar Formulario"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <div className="form-group">
                <label htmlFor="prod-name">Nombre del Producto *</label>
                <input 
                  id="prod-name"
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  placeholder="Ej. Coca-Cola 3L, Camisa Denim" 
                />
              </div>

              {CATEGORY_ATTRIBUTES[formData.category] ? CATEGORY_ATTRIBUTES[formData.category].map(attr => (
                <div className="form-group" key={attr.key}>
                  <label htmlFor={`attr-${attr.key}`}>{attr.label}</label>
                  <input
                    id={`attr-${attr.key}`}
                    type="text"
                    value={formData.attributes?.[attr.key] || ''}
                    onChange={e => setFormData({
                      ...formData, 
                      attributes: { ...(formData.attributes || {}), [attr.key]: e.target.value }
                    })}
                    placeholder={`Ej. ${attr.label}`}
                  />
                </div>
              )) : (
                <div className="form-group">
                  <label htmlFor="prod-desc">Especificaciones (Opcional)</label>
                  <input 
                    id="prod-desc"
                    type="text" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Ej. Detalles generales..." 
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="prod-sku">SKU (Código Único) *</label>
                <input 
                  id="prod-sku"
                  type="text" 
                  value={formData.sku} 
                  onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})} 
                  required 
                  placeholder="Ej. BEB-CC-3L" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-category">Categoría Global *</label>
                <select id="prod-category" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, attributes: {}})}>
                  <option value="Abarrotes y Alimentos">Abarrotes y Alimentos</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Ropa y Moda">Ropa y Moda</option>
                  <option value="Zapatos y Calzado">Zapatos y Calzado</option>
                  <option value="Belleza y Cuidado Personal">Belleza y Cuidado Personal</option>
                  <option value="Joyería y Relojes">Joyería y Relojes</option>
                  <option value="Juguetes y Niños">Juguetes y Niños</option>
                  <option value="Hogar y Decoración">Hogar y Decoración</option>
                  <option value="Electrónica y Tecnología">Electrónica y Tecnología</option>
                  <option value="Ferretería y Construcción">Ferretería y Construcción</option>
                  <option value="Deportes y Aire Libre">Deportes y Aire Libre</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

               <div className="form-group flex flex-col gap-1">
                <label>Imagen del Producto (Opcional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="file-upload" 
                  disabled={uploading}
                />
                <div className="flex gap-3 items-center mt-1">
                  {formData.imagen_url && (
                    <img 
                      src={getImageUrl(formData.imagen_url)} 
                      alt="Preview" 
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200" 
                    />
                  )}
                  <label 
                    htmlFor="file-upload" 
                    className={`cursor-pointer py-1.5 px-3 border border-slate-200 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors bg-slate-50 dark:bg-slate-800 ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {uploading ? 'Procesando...' : 'Subir desde Equipo'}
                  </label>
                  {formData.imagen_url && (
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, imagen_url: ''})} 
                      className="text-[10px] text-red-500 font-bold hover:underline"
                    >
                      Quitar Imagen
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="prod-cost">Precio Costo Adquisición (Bs)</label>
                <input 
                  id="prod-cost"
                  type="number" 
                  step="0.1" 
                  value={formData.precioCosto} 
                  onChange={e => setFormData({...formData, precioCosto: e.target.value})} 
                  placeholder="0.00" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-sale">Precio de Venta Sugerido (Bs)</label>
                <input 
                  id="prod-sale"
                  type="number" 
                  step="0.1" 
                  value={formData.precioVenta} 
                  onChange={e => setFormData({...formData, precioVenta: e.target.value})} 
                  placeholder="0.00" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-min">Stock Mínimo Alerta *</label>
                <input 
                  id="prod-min"
                  type="number" 
                  min="0" 
                  value={formData.stockMinimo} 
                  onChange={e => setFormData({...formData, stockMinimo: e.target.value})} 
                  required 
                  placeholder="10" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-prov">Proveedor Habitual *</label>
                <select id="prod-prov" required value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})}>
                  <option value="">-- Seleccione proveedor --</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Margen de Utilidad</label>
                <div className={`h-[38px] px-3.5 flex items-center gap-1.5 rounded-lg text-xs font-bold ${
                  isLoss ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {isLoss ? <AlertTriangle size={14} className="text-rose-500" /> : null}
                  <span>{currentMargin}% {isLoss ? '(Pérdida Declarada)' : 'de margen de ganancia'}</span>
                </div>
              </div>
            </div>
            
            <div className="form-actions pt-4 border-t border-slate-100 mt-6 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={resetForm} 
                className="btn-premium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isLoss} 
                className="btn-premium btn-premium-indigo"
              >
                {editingId ? 'Guardar Cambios' : 'Ingresar al Catálogo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Drawer */}
      {showFilters && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row flex-wrap items-end md:items-center gap-4 animate-fadeIn">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buscar Producto</label>
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filtrar por Categoría</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ALL">-- Todas las categorías --</option>
              <option value="Abarrotes y Alimentos">Abarrotes y Alimentos</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Ropa y Moda">Ropa y Moda</option>
              <option value="Zapatos y Calzado">Zapatos y Calzado</option>
              <option value="Belleza y Cuidado Personal">Belleza y Cuidado Personal</option>
              <option value="Joyería y Relojes">Joyería y Relojes</option>
              <option value="Juguetes y Niños">Juguetes y Niños</option>
              <option value="Hogar y Decoración">Hogar y Decoración</option>
              <option value="Electrónica y Tecnología">Electrónica y Tecnología</option>
              <option value="Ferretería y Construcción">Ferretería y Construcción</option>
              <option value="Deportes y Aire Libre">Deportes y Aire Libre</option>
              <option value="Entretenimiento y Ocio">Entretenimiento y Ocio</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div className="w-full md:w-auto flex justify-end mt-2 md:mt-0">
             <span role="button" onClick={() => { setSearchQuery(''); setFilterCategory('ALL'); }} className="text-slate-400 hover:text-rose-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer mb-2">
               Limpiar Filtros
             </span>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="table-premium-wrapper">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={28} />
            <p className="text-xs text-slate-500 font-semibold">Cargando catálogo...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Artículo</th>
                  <th style={{ width: '15%' }}>Categoría</th>
                  <th style={{ width: '20%' }}>Proveedor Habitual</th>
                  <th className="text-right" style={{ width: '12%' }}>Margen Utilidad</th>
                  <th className="text-right" style={{ width: '10%' }}>Precio Costo</th>
                  <th className="text-right" style={{ width: '10%' }}>Precio Venta</th>
                  <th className="text-center" style={{ width: '8%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = products.filter(p => {
                    if (filterCategory !== 'ALL' && p.category !== filterCategory) return false;
                    if (searchQuery) {
                      const lowerQ = searchQuery.toLowerCase();
                      const matchName = p.name?.toLowerCase().includes(lowerQ);
                      const matchSku = p.sku?.toLowerCase().includes(lowerQ);
                      if (!matchName && !matchSku) return false;
                    }
                    return true;
                  });
                  if (filtered.length === 0) return (
                    <tr>
                      <td colSpan="7" className="text-center py-16 text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <PackageSearch size={28} className="text-slate-300" />
                          <span>No hay productos que coincidan con la búsqueda.</span>
                        </div>
                      </td>
                    </tr>
                  );
                  return filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-sm text-slate-800">{p.name}</span>
                          {p.attributes && Object.keys(p.attributes).length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(p.attributes).map(([key, val]) => val ? (
                                <span key={key} className="text-[10px] text-slate-400 font-semibold border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-50">
                                  {key}: {val}
                                </span>
                              ) : null)}
                            </div>
                          ) : p.description ? (
                            <span className="text-xs text-slate-400 truncate max-w-[150px]">Var: {p.description}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="text-sm text-slate-800">
                        {p.category || 'Otros'}
                      </td>
                      <td className="text-sm text-slate-800">
                        {p.proveedor?.name || 'Huérfano'}
                      </td>
                      <td className="text-right text-sm text-slate-800">
                        {(() => {
                          const c = Number(p.precioCosto) || 0;
                          const v = Number(p.precioVenta) || 0;
                          const profit = v - c;
                          const pct = v > 0 ? (profit / v) * 100 : 0;
                          return `${pct.toFixed(0)}%`;
                        })()}
                      </td>
                      <td className="text-right text-sm text-slate-800">
                        Bs {Number(p.precioCosto).toFixed(2)}
                      </td>
                      <td className="text-right text-sm text-slate-800">
                        Bs {Number(p.precioVenta).toFixed(2)}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasPermission('catalogo_crear') && (
                            <button 
                              onClick={() => handleCloneVariant(p)} 
                              className="btn-premium-icon text-indigo-600 dark:text-indigo-400"
                              title="Agregar Variante"
                            >
                              <Copy size={15} />
                            </button>
                          )}
                          {hasPermission('catalogo_editar') && (
                            <button 
                              onClick={() => handleEdit(p)} 
                              className="btn-premium-icon"
                              title="Editar"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          {hasPermission('catalogo_eliminar') && (
                            <button 
                              onClick={() => handleDelete(p.id)} 
                              className="btn-premium-icon btn-premium-icon-danger"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Eliminar Producto"
        message="¿Estás seguro que deseas dar de baja permanentemente este producto del catálogo comercial? Esta acción no puede revertirse."
        onConfirm={proceedDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
