import React, { useState, useEffect, useRef } from 'react';
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
  const [filterExpiryStart, setFilterExpiryStart] = useState('');
  const [filterExpiryEnd, setFilterExpiryEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loteForm, setLoteForm] = useState({ producto_id: '', proveedor_id: '', sucursal_id: '', cantidad: 1, fechaElaboracion: '', fechaVencimiento: '' });
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterProducto, filterSucursal, filterDateStart, filterDateEnd, filterExpiryStart, filterExpiryEnd]);

  const userRole = sessionStorage.getItem('user_role');
  const userPermissions = JSON.parse(sessionStorage.getItem('permissions') || '{}');
  const tenantName = sessionStorage.getItem('tenant_name') || 'Sucursal';

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
    setProductSearchQuery('');
    setShowProductDropdown(false);
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
    const p = products.find(prod => prod.id === h.producto_id);
    if (p) {
      const label = `${p.name} ${p.attributes && Object.keys(p.attributes).length > 0 ? `- ${Object.values(p.attributes).join(' | ')}` : p.description ? `- ${p.description}` : ''}`;
      setProductSearchQuery(label);
    }
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

  // Compute filtered items for pagination calculation
  const filteredHistorial = historial.filter(h => {
    if (filterProducto !== 'ALL' && h.producto_id !== filterProducto) return false;
    if (filterSucursal !== 'ALL' && h.sucursal_id !== filterSucursal) return false;
    
    if (filterDateStart) {
      const rowDate = new Date(h.fechaIngreso).toISOString().split('T')[0];
      if (rowDate < filterDateStart) return false;
    }
    if (filterDateEnd) {
      const rowDate = new Date(h.fechaIngreso).toISOString().split('T')[0];
      if (rowDate > filterDateEnd) return false;
    }

    if (filterExpiryStart && h.fechaVencimiento && h.fechaVencimiento < filterExpiryStart) return false;
    if (filterExpiryEnd && h.fechaVencimiento && h.fechaVencimiento > filterExpiryEnd) return false;
    if ((filterExpiryStart || filterExpiryEnd) && !h.fechaVencimiento) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredHistorial.length / itemsPerPage);
  const paginatedHistorial = filteredHistorial.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="full-width-container animate-fadein space-y-8">

      <div className="page-header-bar">
        <div>
          <h1>Lotes (Entradas de Stock)</h1>
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

              <div className="form-group relative" ref={dropdownRef}>
                <label>Producto Entrante *</label>
                {editingId ? (
                  <input
                    type="text"
                    disabled
                    className="bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                    value={(() => {
                      const p = products.find(prod => prod.id === loteForm.producto_id);
                      if (!p) return '';
                      return `${p.name} ${p.attributes && Object.keys(p.attributes).length > 0 ? `- ${Object.values(p.attributes).join(' | ')}` : p.description ? `- ${p.description}` : ''}`;
                    })()}
                  />
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Buscar producto por nombre, talla, color o SKU..."
                        value={productSearchQuery}
                        onChange={e => {
                          setProductSearchQuery(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="w-full pr-10"
                      />
                      {productSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearchQuery('');
                            setLoteForm({ ...loteForm, producto_id: '', proveedor_id: '' });
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {showProductDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-[100] divide-y divide-slate-100 animate-fadeIn">
                        {(() => {
                          const query = productSearchQuery.toLowerCase().trim();
                          const filteredProducts = products.filter(p => {
                            const name = (p.name || '').toLowerCase();
                            const sku = (p.sku || '').toLowerCase();
                            const desc = (p.description || '').toLowerCase();
                            const attrs = p.attributes ? Object.values(p.attributes).map(v => String(v).toLowerCase()).join(' ') : '';
                            return name.includes(query) || sku.includes(query) || desc.includes(query) || attrs.includes(query);
                          });

                          if (filteredProducts.length === 0) {
                            return <div className="p-4 text-xs text-slate-400 text-center font-medium">No se encontraron productos</div>;
                          }

                          return filteredProducts.map(p => {
                            const label = `${p.name} ${p.attributes && Object.keys(p.attributes).length > 0 ? `- ${Object.values(p.attributes).join(' | ')}` : p.description ? `- ${p.description}` : ''}`;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setLoteForm({ ...loteForm, producto_id: p.id, proveedor_id: p.proveedor_id || '' });
                                  setProductSearchQuery(label);
                                  setShowProductDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors block border-none bg-white font-sans"
                              >
                                {label}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </>
                )}
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
              {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.attributes && Object.keys(p.attributes).length > 0 ? `- ${Object.values(p.attributes).join(' | ')}` : p.description ? `- ${p.description}` : ''} </option>)}
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ingreso desde</label>
            <input
              type="date"
              value={filterDateStart}
              onChange={e => setFilterDateStart(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ingreso hasta</label>
            <input
              type="date"
              value={filterDateEnd}
              onChange={e => setFilterDateEnd(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vence desde</label>
            <input
              type="date"
              value={filterExpiryStart}
              onChange={e => setFilterExpiryStart(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vence hasta</label>
            <input
              type="date"
              value={filterExpiryEnd}
              onChange={e => setFilterExpiryEnd(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div className="w-full md:w-auto flex justify-end mt-2 md:mt-0">
             <span role="button" onClick={() => { setFilterProducto('ALL'); setFilterSucursal('ALL'); setFilterDateStart(''); setFilterDateEnd(''); setFilterExpiryStart(''); setFilterExpiryEnd(''); }} className="text-slate-400 hover:text-rose-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer mb-2">
               Limpiar Filtros
             </span>
          </div>
        </div>
      )}

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
                  if (paginatedHistorial.length === 0) return (
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
                  return paginatedHistorial.map(h => {
                    const costoSnap = Number(h.costoUnitarioSnapshot || 0);
                    const inversionTotal = costoSnap * h.cantidad;
                    return (
                      <tr key={h.id}>
                        <td className="text-sm text-slate-800">
                          #{h.id.split('-')[0]}
                          {h.fechaVencimiento && (
                            <span className="block mt-1 text-[11px] text-rose-500">
                              Vence: {h.fechaVencimiento}
                            </span>
                          )}
                        </td>
                        <td className="text-sm text-slate-800 whitespace-nowrap">
                          {new Date(h.fechaIngreso).toLocaleDateString()} {new Date(h.fechaIngreso).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="text-sm text-slate-800">
                          <div>{h.producto?.name || '---'}</div>
                          {h.producto?.sku && (
                            <span className="text-xs text-slate-400 mt-0.5 block">SKU: {h.producto.sku}</span>
                          )}
                        </td>
                        <td className="text-sm text-slate-800">{h.proveedor?.name || '---'}</td>
                        <td className="text-right text-sm text-slate-800">
                          {h.cantidad}
                        </td>
                        <td className="text-right text-sm text-slate-800">Bs {costoSnap.toFixed(2)}</td>
                        <td className="text-right text-sm text-slate-800">Bs {inversionTotal.toFixed(2)}</td>
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Mostrando página {currentPage} de {totalPages} ({filteredHistorial.length} lotes en total)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                        currentPage === i + 1
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-650/15'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
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
