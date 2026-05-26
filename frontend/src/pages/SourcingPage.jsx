import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, Plus, X, Loader2, Edit2, Trash2, Package, Search } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function SourcingPage() {
  const [providers, setProviders] = useState([]);
  const [products, setProducts] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterProducto, setFilterProducto] = useState('ALL');
  const [filterSucursal, setFilterSucursal] = useState('ALL');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loteForm, setLoteForm] = useState({ producto_id: '', proveedor_id: '', sucursal_id: '', cantidad: 1, fechaElaboracion: '', fechaVencimiento: '' });
  const toast = useToast();

  const userRole = localStorage.getItem('user_role');
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '{}');
  const tenantName = localStorage.getItem('tenant_name') || 'Sucursal';

  const hasPermission = (key) => {
    if (userRole === 'OWNER') return true;
    return !!userPermissions[key];
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [provRes, prodRes, histRes, sucRes] = await Promise.all([
        api.get('/proveedores'),
        api.get('/productos'),
        api.get('/sourcing'),
        api.get('/sucursales')
      ]);
      setProviders(provRes.data);
      setProducts(prodRes.data);
      setHistorial(histRes.data);
      setSucursales(sucRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLoteForm({ producto_id: '', proveedor_id: '', sucursal_id: '', cantidad: 1, fechaElaboracion: '', fechaVencimiento: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (h) => {
    setEditingId(h.id);
    setLoteForm({
      producto_id: h.producto_id,
      proveedor_id: h.proveedor_id,
      sucursal_id: h.sucursal_id,
      cantidad: h.cantidad,
      fechaElaboracion: h.fechaElaboracion || '',
      fechaVencimiento: h.fechaVencimiento || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const proceedDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/sourcing/${confirmDelete}`);
      toast.success('Ingreso anulado y stock descontado');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCreateLote = async (e) => {
    e.preventDefault();

    // Validacion cruzada frontend
    const selectedProd = products.find(p => p.id === loteForm.producto_id);
    if (selectedProd && loteForm.proveedor_id !== selectedProd.proveedor_id) {
       return toast.error('El proveedor seleccionado no coincide con el proveedor oficial del producto en el catálogo.');
    }

    try {
      const payload = {
        ...loteForm,
        fechaElaboracion: loteForm.fechaElaboracion || null,
        fechaVencimiento: loteForm.fechaVencimiento || null,
        cantidad: parseInt(loteForm.cantidad)
      };

      if (editingId) {
        await api.put(`/sourcing/${editingId}`, payload);
        toast.success('Registro físico de mercancía actualizado exitosamente');
      } else {
        await api.post('/sourcing', payload);
        toast.success('Ingreso de mercancía registrado con éxito en el stock');
      }
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error registrando ingreso físico');
    }
  };

  const isProviderLocked = !!loteForm.producto_id;

  const selectedProductObj = products.find(p => p.id === loteForm.producto_id);
  const showExpirationDate = selectedProductObj && ['Abarrotes y Alimentos', 'Bebidas'].includes(selectedProductObj.category);

  return (
    <div className="full-width-container animate-fadein space-y-8">

      {/* Page Header */}
      <div className="page-header-bar">
        <div>
          <h1>Entradas Operativas (Sourcing)</h1>
          <p>Registra las entradas físicas de cajas o unidades al inventario principal.</p>
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
          {hasPermission('sourcing_crear') && (
            <button
              onClick={showForm ? resetForm : () => setShowForm(true)}
              className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                showForm ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white text-[#184e77] hover:bg-slate-50'
              }`}
            >
              {showForm ? <><X size={16} strokeWidth={1.75} /> Cancelar</> : <><Plus size={16} strokeWidth={1.75} /> Registrar Nueva Entrada</>}
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-fadeIn relative">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">
              {editingId ? 'Editar Entrada Física' : 'Procesar Nueva Entrada Física'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors hover:bg-slate-50"
              title="Cerrar Formulario"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreateLote}>
            <div className="form-grid">
              <div className="form-group">
                <label>Sucursal / Almacén de Destino *</label>
                <select required value={loteForm.sucursal_id} onChange={e => setLoteForm({...loteForm, sucursal_id: e.target.value})} disabled={editingId ? true : false}>
                  <option value="">Seleccione sucursal...</option>
                  {sucursales.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{tenantName} ({s.name})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Producto Entrante *</label>
                <select required value={loteForm.producto_id} onChange={e => {
                  const selectedProd = products.find(p => p.id === e.target.value);
                  setLoteForm({...loteForm, producto_id: e.target.value, proveedor_id: selectedProd ? selectedProd.proveedor_id : ''});
                }} disabled={editingId ? true : false}>
                  <option value="">Seleccione artículo...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.description ? `- ${p.description}` : ''} ({p.sku})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Proveedor (Remitente Físico) *</label>
                <select
                  required
                  value={loteForm.proveedor_id}
                  onChange={e => setLoteForm({...loteForm, proveedor_id: e.target.value})}
                  disabled={isProviderLocked}
                  className={isProviderLocked ? 'bg-slate-100' : 'bg-white'}
                >
                  <option value="">Seleccione proveedor...</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {isProviderLocked && (
                  <span className="block mt-1 text-xs text-slate-500">Auto-asignado por el artículo maestro</span>
                )}
              </div>

              <div className="form-group">
                <label>Unidades Físicas (Cajas/Pzas) *</label>
                <input type="number" min="1" required value={loteForm.cantidad} onChange={e => setLoteForm({...loteForm, cantidad: e.target.value})} />
              </div>

              {showExpirationDate && (
                <>
                  <div className="form-group">
                    <label>Fecha de Elaboración (Opcional)</label>
                    <input type="date" value={loteForm.fechaElaboracion || ''} onChange={e => setLoteForm({...loteForm, fechaElaboracion: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Vencimiento (Opcional)</label>
                    <input type="date" value={loteForm.fechaVencimiento || ''} onChange={e => setLoteForm({...loteForm, fechaVencimiento: e.target.value})} />
                  </div>
                </>
              )}
            </div>

            <div className="form-actions pt-4 border-t border-slate-100 mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-2">
                <ShoppingCart size={14} /> {editingId ? 'Guardar Cambios' : 'Confirmar Ingreso en Inventario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Drawer */}
      {showFilters && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row flex-wrap items-end md:items-center gap-4 animate-fadeIn">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filtrar Producto</label>
            <select
              value={filterProducto}
              onChange={e => setFilterProducto(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ALL">-- Todos los productos --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.description ? `- ${p.description}` : ''} ({p.sku})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filtrar Sucursal</label>
            <select
              value={filterSucursal}
              onChange={e => setFilterSucursal(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ALL">-- Todas las sucursales --</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{tenantName} ({s.name})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vence desde</label>
            <input
              type="date"
              value={filterDateStart}
              onChange={e => setFilterDateStart(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vence hasta</label>
            <input
              type="date"
              value={filterDateEnd}
              onChange={e => setFilterDateEnd(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div className="w-full md:w-auto flex justify-end mt-2 md:mt-0">
             <button onClick={() => { setFilterProducto('ALL'); setFilterSucursal('ALL'); setFilterDateStart(''); setFilterDateEnd(''); }} className="text-slate-400 hover:text-rose-600 text-xs font-bold uppercase tracking-wider transition-colors mb-2">
               Limpiar Filtros
             </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="table-premium-wrapper">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-650" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Lote TRx</th>
                  <th style={{ width: '15%' }}>Fecha Ingreso</th>
                  <th style={{ width: '25%' }}>Producto (SKU)</th>
                  <th style={{ width: '15%' }}>Proveedor Origen</th>
                  <th className="text-right" style={{ width: '10%' }}>Unidades</th>
                  <th className="text-right" style={{ width: '13%' }}>Costo U. (Capturado)</th>
                  <th className="text-right" style={{ width: '10%' }}>Inversión Total</th>
                  <th className="text-center" style={{ width: '10%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = historial.filter(h => {
                    if (filterProducto !== 'ALL' && h.producto_id !== filterProducto) return false;
                    if (filterSucursal !== 'ALL' && h.sucursal_id !== filterSucursal) return false;
                    if (filterDateStart && h.fechaVencimiento && h.fechaVencimiento < filterDateStart) return false;
                    if (filterDateEnd && h.fechaVencimiento && h.fechaVencimiento > filterDateEnd) return false;
                    if ((filterDateStart || filterDateEnd) && !h.fechaVencimiento) return false; // Filter out those without exp date if date filter is active
                    return true;
                  });
                  if (filtered.length === 0) return (
                    <tr>
                      <td colSpan="8">
                        <div className="empty-state">
                          <div className="empty-state-icon">
                            <Package size={32} strokeWidth={1.5} />
                          </div>
                          <p>No hay entradas que coincidan con los filtros seleccionados.</p>
                        </div>
                      </td>
                    </tr>
                  );
                  return filtered.map(h => {
                    const costoSnap = Number(h.costoUnitarioSnapshot || 0);
                    const inversionTotal = costoSnap * h.cantidad;
                    return (
                      <tr key={h.id}>
                        <td className="font-mono text-xs text-slate-400">
                          #{h.id.split('-')[0]}
                          {h.fechaElaboracion && (
                            <span className="block mt-1 text-xs font-bold text-emerald-600">
                              Elab: {h.fechaElaboracion}
                            </span>
                          )}
                          {h.fechaVencimiento && (
                            <span className="block mt-1 text-xs font-bold text-rose-500">
                              Vence: {h.fechaVencimiento}
                            </span>
                          )}
                        </td>
                        <td className="text-xs text-slate-500 whitespace-nowrap">
                          {new Date(h.fechaIngreso).toLocaleDateString()} {new Date(h.fechaIngreso).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="font-medium text-slate-800">
                          {h.producto?.name || '---'}
                          {h.producto?.description && (
                            <span className="text-xs text-slate-455 mt-0.5 block">
                              Variante: {h.producto.description}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-mono mt-0.5 block">SKU: {h.producto?.sku}</span>
                        </td>
                        <td className="text-xs text-slate-600 font-medium">{h.proveedor?.name || '---'}</td>
                        <td className="text-right">
                          <span className="inline-block bg-emerald-100 text-emerald-700 font-extrabold text-base px-3 py-1 rounded-lg border border-emerald-200 shadow-sm">+ {h.cantidad} U</span>
                        </td>
                        <td className="text-right text-sm text-slate-500 font-mono font-bold">Bs {costoSnap.toFixed(2)}</td>
                        <td className="text-right text-lg font-black text-indigo-700 font-mono">Bs {inversionTotal.toFixed(2)}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {hasPermission('sourcing_editar') && (
                              <button onClick={() => handleEdit(h)} className="btn-premium-icon" title="Editar">
                                <Edit2 size={12} />
                              </button>
                            )}
                            {hasPermission('sourcing_eliminar') && (
                              <button onClick={() => handleDelete(h.id)} className="btn-premium-icon btn-premium-icon-danger" title="Eliminar">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Anular Entrada de Mercancía"
        message="¿Seguro que deseas anular esta recepción? Se descontarán las unidades añadidas afectando tu Stock disponible en tiempo real."
        onConfirm={proceedDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
