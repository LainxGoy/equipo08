import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, Plus, X, Loader2, Edit2, Trash2, Package } from 'lucide-react';
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
    <div className="space-y-6 animate-fadein">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Entradas Operativas (Sourcing Físico)</h2>
          <p className="text-sm text-slate-500 mt-0.5">Registra las entradas físicas de cajas o unidades al inventario principal.</p>
        </div>
        {hasPermission('sourcing_crear') && (
          <button
            onClick={showForm ? resetForm : () => setShowForm(true)}
            className={showForm ? 'btn-secondary btn-sm flex items-center gap-2' : 'btn-sm flex items-center gap-2'}
          >
            {showForm ? <><X size={18} strokeWidth={1.75} /> Cancelar</> : <><Plus size={18} strokeWidth={1.75} /> Registrar Nueva Entrada</>}
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card border-l-4 border-emerald-500">
          <h3 className="mt-0 mb-6 pb-3 border-b border-slate-200 flex items-center gap-2 text-base font-semibold text-slate-800">
            {editingId ? 'Editar Entrada Física' : 'Procesar Nueva Entrada Física'}
          </h3>
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

            <div className="form-actions mt-6">
              <button type="submit" className="btn-sm flex items-center gap-2">
                <ShoppingCart size={18} strokeWidth={1.75} /> {editingId ? 'Guardar Cambios' : 'Confirmar Ingreso en Inventario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 min-w-[180px] flex-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtrar Producto</span>
          <select
            value={filterProducto}
            onChange={e => setFilterProducto(e.target.value)}
            className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos los productos</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.description ? `- ${p.description}` : ''} ({p.sku})</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[180px] flex-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtrar Sucursal</span>
          <select
            value={filterSucursal}
            onChange={e => setFilterSucursal(e.target.value)}
            className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas las sucursales</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{tenantName} ({s.name})</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[180px] flex-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vence desde</span>
          <input
            type="date"
            value={filterDateStart}
            onChange={e => setFilterDateStart(e.target.value)}
            className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[180px] flex-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vence hasta</span>
          <input
            type="date"
            value={filterDateEnd}
            onChange={e => setFilterDateEnd(e.target.value)}
            className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <div className="data-table-wrapper mt-4">
            <table>
              <thead>
                <tr>
                  <th>Lote TRx</th>
                  <th>Fecha Ingreso</th>
                  <th>Producto (SKU)</th>
                  <th>Proveedor Origen</th>
                  <th className="text-center">Unidades</th>
                  <th className="text-center">Costo U. (Capturado)</th>
                  <th className="text-right">Inversión Total</th>
                  <th className="text-right w-20">Acciones</th>
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
                        <td className="text-sm text-slate-500 whitespace-nowrap">
                          {new Date(h.fechaIngreso).toLocaleDateString()} {new Date(h.fechaIngreso).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="font-medium text-slate-800">
                          {h.producto?.name || '---'}
                          {h.producto?.description && (
                            <span className="text-xs text-slate-400 mt-0.5 block">
                              Variante: {h.producto.description}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-mono mt-0.5 block">SKU: {h.producto?.sku}</span>
                        </td>
                        <td>{h.proveedor?.name || '---'}</td>
                        <td className="text-center">
                          <span className="badge success">+ {h.cantidad} U</span>
                        </td>
                        <td className="text-sm text-slate-500 text-center">Bs {costoSnap.toFixed(2)}</td>
                        <td className="text-sm font-semibold text-blue-700 text-right">Bs {inversionTotal.toFixed(2)}</td>
                        <td className="text-right">
                          {hasPermission('sourcing_editar') && (
                            <button onClick={() => handleEdit(h)} className="btn-icon" title="Editar">
                              <Edit2 size={16} />
                            </button>
                          )}
                          {hasPermission('sourcing_eliminar') && (
                            <button onClick={() => handleDelete(h.id)} className="btn-icon danger" title="Eliminar">
                              <Trash2 size={16} />
                            </button>
                          )}
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
