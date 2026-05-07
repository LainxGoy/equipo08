import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, Plus, X, Loader2, Edit2, Trash2 } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Entradas Operativas (Sourcing Físico)</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registra las entradas físicas de cajas o unidades al inventario principal.</p>
        </div>
        {hasPermission('sourcing_crear') && (
          <button 
            onClick={showForm ? resetForm : () => setShowForm(true)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              backgroundColor: showForm ? 'var(--text-secondary)' : 'var(--accent-blue)' 
            }}
          >
            {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Registrar Nueva Entrada</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-container" style={{ animation: 'fadeIn 0.3s ease', borderLeft: '4px solid #16a34a' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                <select required value={loteForm.proveedor_id} onChange={e => setLoteForm({...loteForm, proveedor_id: e.target.value})} style={{ backgroundColor: isProviderLocked ? '#f1f5f9' : 'white' }} disabled={isProviderLocked}>
                  <option value="">Seleccione proveedor...</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {isProviderLocked && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>Auto-asignado por el artículo maestro</span>}
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

            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <button type="submit" style={{ backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={18} /> {editingId ? 'Guardar Cambios' : 'Confirmar Ingreso en Inventario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Filtrar Producto:</label>
          <select value={filterProducto} onChange={e => setFilterProducto(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
            <option value="ALL">Todos los productos</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.description ? `- ${p.description}` : ''} ({p.sku})</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Filtrar Sucursal:</label>
          <select value={filterSucursal} onChange={e => setFilterSucursal(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
            <option value="ALL">Todas las sucursales</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{tenantName} ({s.name})</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Vence desde:</label>
          <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Vence hasta:</label>
          <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }} />
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-container" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--accent-blue)" style={{ margin: '0 auto' }} /></div> : (
          <table>
            <thead>
              <tr>
                <th>Lote TRx</th>
                <th>Fecha Ingreso</th>
                <th>Producto (SKU)</th>
                <th>Proveedor Origen</th>
                <th style={{ textAlign: 'center' }}>Unidades</th>
                <th style={{ textAlign: 'center' }}>Costo U. (Capturado)</th>
                <th style={{ textAlign: 'right' }}>Inversión Total</th>
                <th style={{ textAlign: 'right', width: '80px' }}>Acciones</th>
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
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                     No hay entradas que coincidan con los filtros seleccionados.
                  </td>
                </tr>
                );
                return filtered.map(h => {
                 const costoSnap = Number(h.costoUnitarioSnapshot || 0);
                 const inversionTotal = costoSnap * h.cantidad;
                 return (
                 <tr key={h.id}>
                   <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      #{h.id.split('-')[0]}
                      {h.fechaElaboracion && (
                        <div style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold' }}>
                           Elab: {h.fechaElaboracion}
                        </div>
                      )}
                      {h.fechaVencimiento && (
                        <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold' }}>
                           Vence: {h.fechaVencimiento}
                        </div>
                      )}
                   </td>
                   <td>{new Date(h.fechaIngreso).toLocaleDateString()} {new Date(h.fechaIngreso).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                   <td style={{ fontWeight: '500' }}>
                     {h.producto?.name || '---'}
                     {h.producto?.description && (
                       <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                         Variante: {h.producto.description}
                       </span>
                     )}
                     <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>SKU: {h.producto?.sku}</span>
                   </td>
                   <td>{h.proveedor?.name || '---'}</td>
                   <td style={{ textAlign: 'center' }}>
                     <span className="badge success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>+ {h.cantidad} U</span>
                   </td>
                   <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Bs {costoSnap.toFixed(2)}</td>
                   <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--primary-color)' }}>Bs {inversionTotal.toFixed(2)}</td>
                   <td style={{ textAlign: 'right' }}>
                    {hasPermission('sourcing_editar') && (
                      <button onClick={() => handleEdit(h)} style={{ padding: '0.25rem', background: 'none', color: 'var(--accent-blue)' }} title="Editar">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {hasPermission('sourcing_eliminar') && (
                      <button onClick={() => handleDelete(h.id)} style={{ padding: '0.25rem', background: 'none', color: 'var(--danger-color)', marginLeft: '0.5rem' }} title="Eliminar">
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
