import React, { useState, useEffect } from 'react';
import api from '../api';
import { PackageSearch, Plus, X, Loader2, Edit2, Trash2, AlertTriangle, Tag } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', sku: '', proveedor_id: '', category: 'Otros', precioCosto: '', precioVenta: '', description: '', stockMinimo: 10 
  });
  const toast = useToast();

  const userRole = localStorage.getItem('user_role');
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '{}');

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
      stockMinimo: p.stockMinimo !== undefined ? p.stockMinimo : 10
    });
    setShowForm(true);
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
    setFormData({ name: '', sku: '', proveedor_id: '', category: 'Otros', precioCosto: '', precioVenta: '', description: '', stockMinimo: 10 });
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
    <div className="space-y-6">
      
      {/* Header and Actions */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tag size={22} className="text-indigo-600" />
            <span>Catálogo de Artículos</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Administra tu lista de productos de catálogo, categorías y costos.</p>
        </div>
        {hasPermission('catalogo_crear') && (
          <button 
            onClick={showForm ? resetForm : () => setShowForm(true)} 
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              showForm ? 'bg-slate-600 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Añadir al Catálogo</>}
          </button>
        )}
      </div>

      {/* Expandable Form Section */}
      {showForm && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-6">
            {editingId ? 'Editar Artículo de Catálogo' : 'Añadir Nuevo Artículo'}
          </h3>
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

              <div className="form-group">
                <label htmlFor="prod-desc">Variante / Especificación</label>
                <input 
                  id="prod-desc"
                  type="text" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Ej. Zero Calorías, Talla M, Color Negro" 
                />
              </div>

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
                <select id="prod-category" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
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
            
            <div className="form-actions pt-4 border-t border-slate-100 mt-6">
              <button 
                type="submit" 
                disabled={isLoss} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs py-2 px-4 font-bold"
              >
                {editingId ? 'Guardar Cambios' : 'Ingresar al Catálogo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={28} />
            <p className="text-xs text-slate-500 font-semibold">Cargando catálogo...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Categoría</th>
                  <th>Proveedor Habitual</th>
                  <th className="text-right">Stock Mínimo</th>
                  <th className="text-right">Precio Costo</th>
                  <th className="text-right">Precio Venta</th>
                  <th className="text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16 text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <PackageSearch size={28} className="text-slate-300" />
                        <span>Aún no hay productos en el catálogo comercial.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800">{p.name}</span>
                          {p.description ? (
                            <span className="text-[10px] text-slate-400 font-semibold">Var: {p.description}</span>
                          ) : null}
                          <span className="font-mono text-[9px] text-slate-400 font-semibold">SKU: {p.sku}</span>
                        </div>
                      </td>
                      <td className="text-slate-500 text-xs font-semibold">
                        {p.category || 'Otros'}
                      </td>
                      <td className="text-slate-500 text-xs">
                        {p.proveedor?.name || 'Huérfano'}
                      </td>
                      <td className="text-right text-xs font-bold text-rose-500">
                        {p.stockMinimo || 0} U.
                      </td>
                      <td className="text-right font-mono text-xs text-slate-600">
                        Bs {Number(p.precioCosto).toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-xs text-slate-800 font-semibold">
                        Bs {Number(p.precioVenta).toFixed(2)}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasPermission('catalogo_editar') && (
                            <button 
                              onClick={() => handleEdit(p)} 
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg hover:border-slate-350 border border-transparent transition-all"
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          {hasPermission('catalogo_eliminar') && (
                            <button 
                              onClick={() => handleDelete(p.id)} 
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
